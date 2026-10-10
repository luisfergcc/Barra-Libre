/* =====================================================================
   BARRA LIBRE · lógica de la app
   Todo se guarda en este iPhone (IndexedDB). Copia de seguridad en Más.
   ===================================================================== */

/* ---------- utilidades ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2,'0');
const isoLocal = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const parseIso = s => { const m = /^(\d{4})-(\d\d)-(\d\d)(?:T(\d\d):(\d\d))?/.exec(s||''); return m ? new Date(+m[1], m[2]-1, +m[3], +(m[4]||0), +(m[5]||0)) : new Date(NaN); };
const dayKey = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const fmtKg = v => v == null || v === '' || isNaN(v) ? '' : (Math.round(v*100)/100).toLocaleString('es-ES',{maximumFractionDigits:2});
const fmt1 = v => (Math.round(v*10)/10).toLocaleString('es-ES',{maximumFractionDigits:1});
const toNum = v => { if (v == null || v === '') return null; const n = parseFloat(String(v).replace(',','.')); return isNaN(n) ? null : n; };
const fmtDate = (d, o={day:'numeric', month:'short'}) => d.toLocaleDateString('es-ES', o).replace('.','');
const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const daysAgo = d => Math.round((startOfDay(new Date()) - startOfDay(d)) / 864e5);
const weekStart = d => { const x = startOfDay(d); x.setDate(x.getDate() - (x.getDay()+6)%7); return x; };
const e1rm = (kg, reps) => (kg||0) * (1 + Math.min(reps,15)/30);
const ago = d => { const n = daysAgo(d); return n <= 0 ? 'hoy' : n === 1 ? 'ayer' : n < 14 ? `hace ${n} días` : n < 60 ? `hace ${Math.round(n/7)} semanas` : `hace ${Math.round(n/30)} meses`; };
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
function toast(msg){ document.querySelectorAll('.toast').forEach(x => x.remove()); const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role','status'); t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2800); }

function meta(n){
  const m = EX[n] || [n,'',8,12,0,90,'other',[]];
  return {es:m[0], mus:m[1] ? m[1].split(' ') : [], lo:m[2], hi:m[3], knee:!!m[4], rest:m[5], pat:m[6], eq:m[7], time:m[8] === 't'};
}

/* ---------- almacenamiento local (IndexedDB) ---------- */
const STORES = ['sessions','hevy','body','photos','gyms','kv'];
const IDB = {
  db: null,
  open(){ return new Promise((res, rej) => {
    const r = indexedDB.open('barralibre', 1);
    r.onupgradeneeded = () => { for (const s of STORES) if (!r.result.objectStoreNames.contains(s)) r.result.createObjectStore(s, {keyPath:'id'}); };
    r.onsuccess = () => { IDB.db = r.result; res(); };
    r.onerror = () => rej(r.error);
  }); },
  req(store, mode, fn){ return new Promise((res, rej) => {
    const tx = IDB.db.transaction(store, mode); const out = fn(tx.objectStore(store));
    tx.oncomplete = () => res(out && 'result' in out ? out.result : undefined);
    tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error);
  }); },
  all: s => IDB.req(s, 'readonly', st => st.getAll()),
  put: (s, o) => IDB.req(s, 'readwrite', st => { st.put(o); }),
  del: (s, id) => IDB.req(s, 'readwrite', st => { st.delete(id); }),
  clear: s => IDB.req(s, 'readwrite', st => { st.clear(); })
};

/* =====================================================================
   ESTADO
   ===================================================================== */
const S = {
  ready:false, tab:'train', all:[], app:{}, hevy:{}, body:[], photos:[], gyms:[], kv:{},
  live:null, pick:null, exSel:null, lastDone:null, gymEdit:null, cmp:{pose:'frente', a:null, b:null, pos:50}, recSel:null
};
const kv = (k, def) => (k in S.kv ? S.kv[k] : def);
async function setKv(k, v){ S.kv[k] = v; await IDB.put('kv', {id:k, v}); }

async function loadAll(){
  await IDB.open();
  const [sessions, hevy, body, photos, gyms, kvs] = await Promise.all(STORES.map(s => IDB.all(s)));
  S.app = {}; for (const s of sessions) S.app[s.id] = s;
  S.hevy = {}; S.hevyCardio = {}; for (const h of hevy) { S.hevy[h.id] = h.sessions || []; S.hevyCardio[h.id] = h.cardio || []; }
  S.body = body.sort((a,b) => a.id < b.id ? -1 : 1);
  S.photos = photos.sort((a,b) => a.date < b.date ? -1 : 1);
  S.kv = {}; for (const k of kvs) S.kv[k.id] = k.v;
  S.gyms = gyms;
  Object.assign(EX, kv('customEx', {}));
  if (!S.gyms.length) { const g = {id:'g-main', name:'Mi gimnasio', eq:GYM_PRESETS.full.slice()}; S.gyms = [g]; await IDB.put('gyms', g); }
  const live = Object.values(S.app).find(s => s.status === 'live');
  if (live) S.live = live;
  rebuild();
  S.ready = true;
  try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch(e) {}
}

/* Sesiones normalizadas: {id,date,title,routine,src,ex:[{n,sets:[{kg,reps,type,knee}]}]} */
function routineOf(title){
  const t = (title||'').toLowerCase();
  if (t.includes('hombro +') || t.startsWith('hombro')) return 'd4';
  if (t.includes('pecho')) return 'd1';
  if (t.includes('espalda')) return 'd2';
  if (t.includes('pierna')) return 'd3';
  return null;
}
function rebuild(){
  const app = Object.values(S.app).filter(s => s.status === 'done').map(s => ({
    id:s.id, date:parseIso(s.date), title:s.title, routine:s.routine, src:'app',
    ex:(s.ex||[]).map(e => ({n:e.n, sets:(e.sets||[]).filter(x => x.done && toNum(x.reps)).map(x => ({kg:toNum(x.kg), reps:+toNum(x.reps), type:x.t||'n', knee:x.knee === '' || x.knee == null ? null : +x.knee, rir:x.rir === '' || x.rir == null ? null : +x.rir}))})).filter(e => e.sets.length)
  }));
  const appDays = new Set(app.map(s => dayKey(s.date)));
  const hevy = [], hdel = new Set(kv('hevyDeleted', []));
  for (const k in S.hevy) for (const s of S.hevy[k]) {
    const d = parseIso(s.date); if (appDays.has(dayKey(d)) || hdel.has(s.id)) continue;
    hevy.push({id:s.id, date:d, title:s.title, routine:routineOf(s.title), src:'hevy',
      ex:s.ex.map(e => ({n:e.n, sets:e.s.map(x => ({kg:x[0], reps:x[1], type:x[2]||'n', knee:null, rir:x[3] ?? null}))}))});
  }
  S.all = app.concat(hevy).sort((a,b) => b.date - a.date);
  S.histCache = {};
  buildCardio();
}

/* Cardio: lo que apuntas en la app (dentro del día en Cuerpo) + caminatas/carreras importadas de Hevy */
const CARDIO = {walk:{lab:'Caminata inclinada', c:'var(--accent)'}, run:{lab:'Carrera', c:'var(--warn)'}, bike:{lab:'Bici', c:'var(--good)'}, ellip:{lab:'Elíptica', c:'var(--good)'}};
const CARDIO_HEVY = {'Walking':'walk','Treadmill':'walk','Running':'run','Cycling':'bike','Spinning':'bike','Elliptical Trainer':'ellip'};
function buildCardio(){
  const app = S.body.flatMap(b => (b.cardio || []).map(c => ({...c, day:b.id, date:parseIso(c.date || b.id), src:'app'})));
  const appDays = new Set(app.map(c => c.day + c.type));
  const hevy = Object.values(S.hevyCardio || {}).flat().map(c => ({...c, date:parseIso(c.date), src:'hevy'})).filter(c => !appDays.has(dayKey(c.date) + c.type));
  S.cardio = app.concat(hevy).filter(c => !isNaN(c.date)).sort((a,b) => b.date - a.date);
}
const runKm = c => c.km || (c.min ? c.min / 6 : 0);
function cardioWeek(from, to){ const w = {min:0, run:0, days:new Set(), n:0};
  for (const c of S.cardio) if (c.date >= from && c.date < to) { w.min += c.min || 0; if (c.type === 'run') w.run += runKm(c); if ((c.min || 0) >= 15) w.days.add(dayKey(c.date)); w.n++; }
  return w; }

/* Peso corporal en una fecha (el registro más cercano anterior; si no hay, el primero) */
function bwAt(d){ let w = null; for (const b of S.body) { if (!b.weight) continue; if (parseIso(b.id) <= d) w = b.weight; else { if (w == null) w = b.weight; break; } } return w; }
/* Valor de una serie para récords y gráficas: 1RM estimado; con tu peso corporal si el ejercicio lo usa; segundos si es por tiempo */
function setVal(name, kg, reps, date){
  const m = meta(name), f = BW_LOAD[name];
  if (m.time) return {v:reps, kg:null};
  if (f) { const bw = bwAt(date); if (bw) { const load = f < 0 ? bw - (kg||0) : bw*f + (kg||0); return {v:e1rm(load, reps), kg:Math.round(load*10)/10, bwl:true}; } }
  return {v: kg ? e1rm(kg, reps) : reps, kg};
}
function history(name){
  if (S.histCache[name]) return S.histCache[name];
  const out = [];
  for (const s of S.all) for (const e of s.ex) if (e.n === name) {
    const work = e.sets.filter(x => !['w','d','x'].includes(x.type) && x.reps > 0);
    if (!work.length) continue;
    let best = null;
    for (const x of work) { const sv = setVal(name, x.kg, x.reps, s.date); if (!best || sv.v > best.v) best = {v:sv.v, kg:sv.kg, reps:x.reps, bwl:!!sv.bwl}; }
    out.push({date:s.date, sets:work, best, src:s.src, id:s.id});
  }
  return (S.histCache[name] = out);
}
/* Ejercicios que se pueden hacer sin peso (dominadas, fondos, hiperextensiones, bandas): los kilos son opcionales */
const BW_EQ = ['pull','dip','hyper','band'];
const needsKg = n => { if (!EX[n]) return false; const eq = meta(n).eq; return eq.length > 0 && !eq.every(x => BW_EQ.includes(x)); };
/* Ejercicios que no quieres que la app te proponga (por defecto, trabajo específico de glúteo) */
const EXCL_DEFAULT = ['Hip Thrust (Barbell)','Hip Thrust (Machine)','Glute Bridge'];
const excluded = () => new Set(kv('excluded', EXCL_DEFAULT));
const putHevy = k => IDB.put('hevy', {id:k, sessions:S.hevy[k] || [], cardio:(S.hevyCardio && S.hevyCardio[k]) || []});
const setsText = (sets, time) => sets.map(x => (x.kg ? `${fmtKg(x.kg)}×${x.reps}` : `${x.reps}${time ? ' s' : ' reps'}`) + (x.rir != null ? ` @${x.rir}` : '')).join(' · ');

/* =====================================================================
   SOBRECARGA PROGRESIVA AUTOMÁTICA (doble progresión + semáforo de rodilla)
   ===================================================================== */
function stepOf(name, hist){
  const tops = []; for (const h of hist) { const w = Math.max(...h.sets.map(x => x.kg||0)); if (w) tops.push(w); }
  const c = {};
  for (let i=0;i<tops.length-1;i++){ const d = Math.round(Math.abs(tops[i]-tops[i+1])*100)/100; if (d > 0 && d <= 10) c[d] = (c[d]||0)+1; }
  const best = Object.entries(c).sort((a,b) => b[1]-a[1] || a[0]-b[0])[0];
  if (best) return +best[0];
  if (/Barbell/.test(name)) return 5;
  if (/Dumbbell/.test(name)) return 2;
  return 2.5;
}
const roundTo = (v, step) => Math.round(v/step)*step;

function suggest(name){
  const m = meta(name), hist = history(name);
  if (!hist.length) return {tone:'new', tag:'NUEVO', text:`Busca un peso con el que hagas <b>${m.lo}-${m.hi}</b> reps dejando 2 en reserva.`, kg:null, reps:`${m.lo}-${m.hi}`};
  const last = hist[0], step = stepOf(name, hist);
  const bw = !last.sets.some(x => x.kg);
  const w = Math.max(...last.sets.map(x => x.kg||0));
  const atW = last.sets.filter(x => (x.kg||0) === w);
  const minR = Math.min(...atW.map(x => x.reps));
  const knee = Math.max(-1, ...last.sets.map(x => x.knee ?? -1));
  const gap = daysAgo(last.date);
  const base = {last, step, bw};
  if (gap > 21 && !bw) { const kg = roundTo(w*0.9, step);
    return {...base, tone:'down', tag:'VUELTA', kg, reps:`${m.lo}-${m.hi}`, text:`Llevas ${Math.round(gap/7)} semanas sin hacerlo. Empieza con <b>${fmtKg(kg)} kg</b> (−10 %) y recupera en 2-3 sesiones.`}; }
  if (knee >= 5) { const kg = bw ? null : roundTo(w*0.85, step);
    return {...base, tone:'down', tag:'RODILLA', kg, reps:`${m.lo}-${m.hi}`, text:`La última vez la rodilla dio ${knee}/10. ${kg ? `Baja a <b>${fmtKg(kg)} kg</b> y acorta el recorrido` : 'Acorta el recorrido'}; si vuelve a doler, cambia de ejercicio.`}; }
  if (m.time) { const minS = Math.min(...last.sets.map(x => x.reps)), tgt = Math.min(m.hi, minS + 5);
    return minS >= m.hi ? {...base, tone:'up', tag:'SUBE', kg:null, reps:`${m.hi}`, text:`Aguantaste ${m.hi} s en todas: suma 10 s o algo de peso.`}
      : {...base, tone:'hold', tag:'MANTÉN', kg:null, reps:`${tgt}`, text:`Intenta aguantar <b>${tgt} s</b> en cada serie.`}; }
  if (bw) { const tgt = Math.min(m.hi, minR + 1);
    return {...base, tone: minR >= m.hi ? 'up':'hold', tag: minR >= m.hi ? 'SUBE':'MANTÉN', kg:null, reps:`${tgt}`, text: minR >= m.hi ? `Hiciste ${m.hi}+ en todas: añade lastre o haz una serie más.` : `Intenta <b>${tgt} reps</b> en cada serie.`}; }
  if (knee >= 3) return {...base, tone:'hold', tag:'ÁMBAR', kg:w, reps:`${m.lo}-${m.hi}`, text:`Rodilla en ${knee}/10 la última vez: mantén <b>${fmtKg(w)} kg</b>, controla la bajada y no subas esta semana.`};
  const rec = recoveryCached(), mainMus = m.mus[0], ready = mainMus ? rec[mainMus].pct : 100;
  const drop = atW.length >= 2 ? atW[0].reps - minR : 0;
  const rirs = atW.map(x => x.rir).filter(x => x != null);
  const rirMin = rirs.length ? Math.min(...rirs) : null, rirAvg = rirs.length ? rirs.reduce((a,b) => a+b, 0) / rirs.length : null;
  /* Doble progresión basada en estudios:
     - Subir peso o subir reps hace crecer igual (Plotkin 2022, Chaves 2024): no hace falta llegar al máximo en TODAS las series.
     - Cualquier rango exigente de ~6 a 30 reps hace crecer parecido (Lopez 2021), así que tras subir, las últimas series pueden bajar del rango.
     - Lo que más pesa es que las series estén cerca del fallo (Robinson 2024), sin necesidad de llegar a él (Refalo 2023). */
  const FLOOR = Math.max(6, m.lo - 3);
  const top = atW[0].reps, lastR = atW[atW.length - 1].reps, total = atW.reduce((a,x) => a + x.reps, 0);
  const prev = hist[1], prevAtW = prev ? prev.sets.filter(x => (x.kg||0) === w) : [];
  const prevTop = prevAtW.length ? prevAtW[0].reps : null, prevLast = prevAtW.length ? prevAtW[prevAtW.length - 1].reps : null;
  const repsTxt = atW.map(x => x.reps).join('+');
  const dropTxt = drop >= 4 ? ` Pierdes ${drop} reps de la primera a la última serie: descansa 2-3 min y las recuperarás (Schoenfeld 2016, Singer 2024).` : '';
  const up = (kg, why) => ready < 50
    ? {...base, tone:'hold', tag:'CARGADO', kg:w, reps:`${m.hi}`, text:`Te toca subir, pero tu ${MUSCLES[mainMus].toLowerCase()} sigue cargado (${ready} %). Hoy mantén <b>${fmtKg(w)} kg</b> y sube a ${fmtKg(kg)} kg la próxima vez.`}
    : {...base, tone:'up', tag:'SUBE', kg, reps:`${m.lo}-${m.hi}`, text:`${why} Hoy <b>${fmtKg(kg)} kg</b>: espera 1-2 reps menos en la primera serie; mientras ninguna baje de ${FLOOR}, el estímulo es el mismo.`};
  const kgUp = Math.round((w + step)*100)/100;
  // 1. Todas al máximo, pero al límite: consolidar una sesión
  if (atW.length >= 2 && minR >= m.hi && rirMin === 0) return {...base, tone:'hold', tag:'MANTÉN', kg:w, reps:`${m.hi}`, text:`Llegaste a ${m.hi} reps en todas, pero al límite (0 en reserva). Repite <b>${fmtKg(w)} kg</b> y sube cuando lo hagas dejando 1 en reserva.`};
  // 2. Todas al máximo
  if (atW.length >= 2 && minR >= m.hi) return up(Math.round((w + (rirAvg != null && rirAvg >= 3 && step <= 2.5 ? 2*step : step))*100)/100, `Hiciste ${m.hi}+ reps en todas las series${rirAvg != null ? ` (${fmt1(rirAvg)} en reserva)` : ''}.`);
  // 3. La primera serie llega al máximo dos sesiones seguidas y las demás no se hunden
  if (atW.length >= 2 && top >= m.hi && prevTop != null && prevTop >= m.hi && lastR >= FLOOR) return up(kgUp, `Tu primera serie llegó a ${m.hi} dos sesiones seguidas (${repsTxt}).`);
  // 4. Te sobraban reps
  if (atW.length >= 2 && rirAvg != null && rirAvg >= 3 && minR >= m.lo) return up(kgUp, `Te sobraban ${fmt1(rirAvg)} reps en reserva: el peso se te queda corto.`);
  // 5. Estancado
  const sp = hist.slice(0, 4);
  const steady = sp.length >= 4 && sp.every((h,i) => i === 0 || (sp[i-1].date - h.date) / 864e5 <= 21);
  if (steady && Math.max(sp[0].best.v, sp[1].best.v, sp[2].best.v) <= sp[3].best.v * 1.005) {
    const kg = roundTo(w*0.9, step), alt = altsFor(name, 1)[0];
    return {...base, tone:'down', tag:'ESTANCADO', kg:w, reps:`${m.lo}-${m.hi}`, text:`3 sesiones sin mejorar tu mejor serie. Elige una: descansa 2-3 min entre series, baja a <b>${fmtKg(kg)} kg</b> y vuelve a subir en 2-3 semanas${alt ? `, o cámbialo 4-6 semanas por <b>${esc(meta(alt).es)}</b>` : ''}.`}; }
  // 6. Demasiado pesado dos sesiones seguidas
  if ((top < m.lo && prevTop != null && prevTop < m.lo) || (lastR < FLOOR && prevLast != null && prevLast < FLOOR)) { const kg = roundTo(w - step, step);
    return {...base, tone:'down', tag:'BAJA', kg, reps:`${m.lo}-${m.hi}`, text:`Dos sesiones con ${fmtKg(w)} kg ${top < m.lo ? `sin llegar a ${m.lo} en la primera serie` : `con la última serie por debajo de ${FLOOR}`}. Baja a <b>${fmtKg(kg)} kg</b> y vuelve a construir.${dropTxt}`}; }
  // 7. Mantén el peso y suma repeticiones (progresar en reps hace crecer igual que en peso)
  const tgt = Math.min(m.hi, minR + 1);
  return {...base, tone:'hold', tag:'MANTÉN', kg:w, reps:`${tgt}-${m.hi}`, text:`Mismo peso, <b>${fmtKg(w)} kg</b>. La última vez ${repsTxt} = ${total} reps: hoy busca <b>${total + 1}-${total + 2}</b>. ${top >= m.hi ? `Si la primera serie vuelve a llegar a ${m.hi}, la próxima vez subes.` : `Cuando la primera llegue a ${m.hi} dos sesiones seguidas, subes.`}${dropTxt}`};
}

/* =====================================================================
   RECUPERACIÓN MUSCULAR (cálculo por reglas, sin IA)
   Cada serie de trabajo carga sus músculos principales; 8 series ≈ músculo agotado.
   La carga se va borrando de forma lineal en RECOV_H horas.
   ===================================================================== */
/* Carga del cardio en las piernas (orientativa): correr carga cuádriceps y gemelo; caminar en cuesta, algo de gemelo */
function cardioLoad(c){ const m = c.min || 0;
  if (c.type === 'run') { const km = runKm(c); return {cu:km*0.06, ge:km*0.08}; }
  if (c.type === 'walk') return {ge:m/30*0.06};
  if (c.type === 'bike') return {cu:m/30*0.12};
  if (c.type === 'ellip') return {cu:m/30*0.06};
  return {}; }
function recentLoads(now){
  const out = [], from = now - 100*36e5;
  for (const s of S.all) { if (+s.date < from) break; if (+s.date > now) continue;
    const cnt = {}; for (const e of s.ex) { const n = e.sets.filter(x => x.type !== 'w').length; for (const mu of meta(e.n).mus) cnt[mu] = (cnt[mu]||0) + n; }
    const load = {}; for (const mu in cnt) load[mu] = Math.min(1, cnt[mu]/8);
    out.push({t:+s.date, load}); }
  for (const c of S.cardio || []) { if (+c.date < from) break; if (+c.date <= now) out.push({t:+c.date, load:cardioLoad(c)}); }
  return out;
}
function fatigueAt(t, loads = recentLoads(t)){
  const fat = {}; for (const k in MUSCLES) fat[k] = 0;
  for (const x of loads) { const h = (t - x.t) / 36e5; if (h < 0) continue;
    for (const mu in x.load) if (mu in fat) fat[mu] += x.load[mu] * Math.max(0, 1 - h/RECOV_H[mu]); }
  return fat;
}
function recovery(){
  const now = Date.now(), loads = recentLoads(now), f = fatigueAt(now, loads), out = {};
  for (const k in MUSCLES) out[k] = {pct:Math.round(100 * (1 - Math.min(1, f[k]))), readyH:0};
  const pending = Object.keys(MUSCLES).filter(k => out[k].pct < 90);
  for (let h = 2; h <= 96 && pending.length; h += 2) {
    const f2 = fatigueAt(now + h*36e5, loads);
    for (let i = pending.length - 1; i >= 0; i--) { const k = pending[i]; if (1 - Math.min(1, f2[k]) >= .9) { out[k].readyH = h; pending.splice(i, 1); } }
  }
  for (const k of pending) out[k].readyH = 96;
  return out;
}
let REC_CACHE = null;
function recoveryCached(){ if (!REC_CACHE || Date.now() - REC_CACHE.t > 60000 || REC_CACHE.n !== S.all.length + (S.cardio||[]).length * 1e4) REC_CACHE = {t:Date.now(), n:S.all.length + (S.cardio||[]).length * 1e4, v:recovery()}; return REC_CACHE.v; }
/* Series fraccionales por músculo (principal = 1, apoyo = 0,5) — Pelland y col. */
function volumeBy(from, to){
  const v = {}; for (const k in MUSCLES) v[k] = 0;
  for (const s of S.all) { if (s.date < from || s.date > to) continue;
    for (const e of s.ex) { const n = e.sets.filter(x => x.type !== 'w').length; meta(e.n).mus.forEach((m,i) => { if (m in v) v[m] += n * (i === 0 ? 1 : .5); }); } }
  return v;
}
function sessionVolume(ex){ const v = {}; for (const e of ex) { const n = e.sets.filter(x => (x.type || x.t) !== 'w').length; meta(e.n).mus.forEach((m,i) => v[m] = (v[m]||0) + n * (i === 0 ? 1 : .5)); } return v; }
/* Alternativas: mismo patrón, material disponible, primero las que cuidan la rodilla y las que tienen respaldo en estudios */
function altsFor(name, k = 3){
  const m = meta(name), eq = currentGym().eq;
  const score = c => { const cm = meta(c); return (EX_TIPS[c] ? 4 : 0) + (cm.knee ? 0 : 2) + Math.min(3, history(c).length / 5) + (cm.mus[0] === m.mus[0] ? 3 : 0); };
  const ex = excluded();
  return Object.keys(EX).filter(c => c !== name && !ex.has(c) && meta(c).pat === m.pat && hasEq(c, eq)).sort((a,b) => score(b) - score(a)).slice(0, k);
}
function recommendFor(mu, k = 3, exclude = []){
  const eq = currentGym().eq;
  const score = c => { const cm = meta(c); return (EX_TIPS[c] ? 4 : 0) + (cm.knee ? -1 : 1) + Math.min(4, history(c).length / 4); };
  const ex = excluded();
  return Object.keys(EX).filter(c => meta(c).mus[0] === mu && hasEq(c, eq) && !exclude.includes(c) && !ex.has(c)).sort((a,b) => score(b) - score(a)).slice(0, k);
}
function planVolume(){ const v = {}; for (const k in MUSCLES) v[k] = 0; for (const key of ORDER) { const pv = sessionVolume(ROUTINES[key].ex.map(n => ({n, sets:Array.from({length:planSets(n)}, () => ({}))}))); for (const m in pv) if (m in v) v[m] += pv[m]; } return v; }
function estMinutes(names){ let sec = 7*60; for (const n of names) { const sets = planSets(n); sec += sets*40 + (sets-1)*restOf(n) + 60; } return Math.round(sec/60); }
function measuredRests(days = 28){
  const cut = Date.now() - days*864e5, out = [];
  for (const s of Object.values(S.app)) { if (s.status !== 'done' || s.start < cut) continue;
    for (const e of s.ex || []) { if (meta(e.n).rest < 120) continue;
      const ts = (e.sets||[]).filter(x => x.done && x.at && x.t !== 'w').map(x => x.at).sort((a,b) => a-b);
      for (let i = 1; i < ts.length; i++) { const d = (ts[i]-ts[i-1])/1000 - 40; if (d > 15 && d < 600) out.push(d); } } }
  out.sort((a,b) => a-b); return out.length >= 6 ? out[Math.floor(out.length/2)] : null;
}
const evChip = id => EV[id] ? `<button class="ev-chip" data-ev="${id}">📚 ${esc(EV[id].cita.split(' ')[0].replace(',',''))} ${EV[id].year}</button>` : '';

/* =====================================================================
   CONSEJOS (reglas sacadas de los estudios + tus datos)
   ===================================================================== */
function adviceList(){
  const out = [], now = new Date(), cut = new Date(now - 28*864e5);
  const vol = volumeBy(cut, now), avg = {}; for (const k in vol) avg[k] = vol[k]/4;
  const sess4 = S.all.filter(s => s.date >= cut).length, perWeek = sess4/4;
  const plan = planVolume();
  const exIn4 = new Set(S.all.filter(s => s.date >= cut).flatMap(s => s.ex.map(e => e.n)));
  // 1. Constancia
  if (perWeek < 3.5) out.push({prio:1, kind:'warn', title:`Constancia: ${fmt1(perWeek)} sesiones por semana`, ev:['pelland','schoenfeld17v'],
    body:`Tu plan son 4. Si completaras las 4 rutinas cada semana, ya harías <b>${fmt1(plan.cu)}</b> series de cuádriceps y <b>${fmt1(plan.fe)}</b> de femoral. ${Math.min(plan.cu, plan.fe) < 10 ? ' Y aun completándolas, la pierna se queda por debajo de 10: mira abajo cómo subirla en el D3.' : ' Lo que más músculo te dará ahora mismo no es cambiar ejercicios: es no saltarte el día de pierna.'}`});
  // 2. Volumen por músculo
  const order = Object.keys(MUSCLES).sort((a,b) => (BIG.includes(b) - BIG.includes(a)) || avg[a] - avg[b]);
  for (const mu of order) {
    const a = avg[mu], big = BIG.includes(mu);
    if (a < 10 && (big || ['ho','bi','tr'].includes(mu))) {
      const rec = recommendFor(mu, 3);
      const day = ORDER.find(k => ROUTINES[k].ex.some(n => meta(n).mus[0] === mu));
      const need = Math.ceil(10 - a);
      out.push({prio: big ? 1 : 2, kind: a < 5 ? 'bad' : 'warn', title:`${MUSCLES[mu]}: ${fmt1(a)} series/semana (meta 10-20)`, ev:['schoenfeld17v','pelland'],
        body:`${big ? 'Es un músculo grande, con mucho margen para crecer. ' : ''}${plan[mu] >= 10 ? `Tu rutina ya da ${fmt1(plan[mu])} series si la completas; el hueco viene de las sesiones que faltan.` : `Te faltan unas <b>${need}</b> series a la semana${day ? `: súmalas en ${ROUTINES[day].code}` : ''}, sin pasar de ~11 por sesión.`}
          ${rec.length ? `<div class="rec-ex">${rec.map(n => `<span class="chip small">${esc(meta(n).es)}${meta(n).knee ? ' · rodilla: semáforo' : ''}${EX_TIPS[n] ? ' · 📚' : ''}</span>`).join('')}</div>` : ''}`});
    } else if (a > 20) out.push({prio:3, kind:'info', title:`${MUSCLES[mu]}: ${fmt1(a)} series/semana`, ev:['pelland'],
        body:'Por encima de 20 cada serie extra aporta poco. Puedes quitar 2-4 series y acortar la sesión sin perder resultados.'});
  }
  // 3. Volumen por sesión
  const heavy = [];
  for (const s of S.all.filter(s => s.date >= cut)) { const sv = sessionVolume(s.ex); for (const m in sv) if (sv[m] > 11.5) heavy.push(`${MUSCLES[m]} (${fmt1(sv[m])}) el ${fmtDate(s.date)}`); }
  if (heavy.length) out.push({prio:2, kind:'info', title:'Demasiadas series de un músculo en un solo día', ev:['remmert25','schoenfeld18f'],
    body:`${heavy.slice(0,3).join(' · ')}. A partir de ~11 series por músculo en una sesión el beneficio extra deja de notarse. Pasa esas series a otro día o quítalas y la sesión será más corta.`});
  // 4. Duración
  const durs = Object.values(S.app).filter(s => s.status === 'done' && s.end).map(s => (s.end - s.start)/60000).sort((a,b) => a-b);
  const medDur = durs.length >= 3 ? durs[Math.floor(durs.length/2)] : null;
  const est = Object.fromEntries(ORDER.map(k => [k, estMinutes(ROUTINES[k].ex)]));
  const longest = ORDER.slice().sort((a,b) => est[b] - est[a])[0];
  if ((medDur && medDur > 80) || est[longest] > 75) out.push({prio:2, kind:'warn', title:`Sesiones largas: ${medDur ? `mediana de ${Math.round(medDur)} min` : `${ROUTINES[longest].code} ≈ ${est[longest]} min`}`, ev:['remmert25','refalo23'],
    body:`Para quedarte en 60-75 min: <b>1)</b> superseries en los ejercicios pequeños de tren superior (bíceps con tríceps, laterales con pájaros); <b>2)</b> 2 series en lugar de 3 en el último ejercicio de cada músculo; <b>3)</b> no vayas al fallo, solo cansa más. Estimado de tus rutinas: ${ORDER.map(k => `${ROUTINES[k].code} ${est[k]} min`).join(' · ')}.`});
  // 5. Descanso medido
  const mr = measuredRests();
  if (mr != null) out.push(mr < 90
    ? {prio:2, kind:'warn', title:`Descansas poco en los básicos: ~${Math.round(mr)} s`, ev:['singer24','schoenfeld16r'], body:'Por debajo de 60-90 s pierdes repeticiones y algo de crecimiento. En press, remos, prensa y rumano descansa 2-3 min; en los aislamientos, 60-90 s.'}
    : {prio:4, kind:'good', title:`Descansos bien medidos: ~${Math.round(mr)} s en los básicos`, ev:['singer24'], body:'Estás en el rango que mejor funciona.'});
  // 6. Rodilla
  const kneeBad = [];
  for (const n of exIn4) { const k = history(n).slice(0,3).flatMap(h => h.sets.map(x => x.knee)).filter(x => x != null); if (k.length && k.reduce((a,b)=>a+b,0)/k.length >= 3) kneeBad.push(n); }
  for (const n of kneeBad) { const alts = altsFor(n, 2).filter(a => !meta(a).knee || a === 'Leg Extension (Machine)');
    out.push({prio:0, kind:'bad', title:`Rodilla en ámbar con ${meta(n).es}`, ev:['powers14','willy19'],
      body:`Media de rodilla ≥ 3/10 en las últimas sesiones. Acorta el recorrido a la zona sin molestias${alts.length ? ` o cámbialo por ${alts.map(a => `<b>${esc(meta(a).es)}</b>`).join(' o ')}` : ''}. Si empeora al día siguiente o se hincha, que la vea un fisio.`}); }
  const hipSets = S.all.filter(s => s.date >= cut).flatMap(s => s.ex).filter(e => ['abd','hip'].includes(meta(e.n).pat)).reduce((a,e) => a + e.sets.filter(x => x.type !== 'w').length, 0) / 4;
  if (hipSets < 3) out.push({prio:0, kind:'warn', title:`Cadera para tus rodillas: ${fmt1(hipSets)} series/semana`, ev:['nascimento18','willy19'],
    body:`Fortalecer cadera + rodilla reduce el dolor de rodilla más que trabajar solo la rodilla. Mínimo: las 3 series de abducción del D3 cada semana, más los pasos laterales con banda del calentamiento. Son rápidas (60-75 s de descanso) y no cargan la rodilla: <b>no la saltes en el D3</b>.`});
  // 7. Fuerza
  const COMP = ['press_h','press_inc','press_v','row','pull_v','squat','hinge'];
  const heavySets = S.all.filter(s => s.date >= cut).flatMap(s => s.ex).filter(e => COMP.includes(meta(e.n).pat)).reduce((a,e) => a + e.sets.filter(x => x.type !== 'w' && x.kg && x.reps <= 8).length, 0) / 4;
  if (heavySets < 4) out.push({prio:3, kind:'info', title:'Para estar fuerte: un poco de trabajo pesado', ev:['lopez21','remmert25'],
    body:'Casi todas tus series son de 9-15 reps, que van muy bien para crecer. Para ganar fuerza, haz la <b>primera serie del primer básico de cada día a 6-8 reps</b> (RIR 2) y el resto como siempre. Con 1-2 series pesadas por sesión basta: la fuerza se estanca antes que la hipertrofia. En la pierna, solo si la rodilla está en verde.'});
  // 8. Movilidad
  out.push({prio:3, kind:'info', title:'Movilidad de cadera sin estirar más tiempo', ev:['afonso21','wolf23'],
    body:'La fuerza con recorrido largo mejora la movilidad igual que los estiramientos. Tus mejores aliados: <b>peso muerto rumano</b> bajando lo que permita la espalda recta, <b>sentadilla goblet a cajón</b> bajando el cajón cada 2-3 semanas, y la <b>prensa</b> con recorrido completo si la rodilla está en verde. Mantén el 90/90 del calentamiento.'});
  // 9. Correr
  out.push({prio:2, kind:'info', title:'Correr con tus rodillas', ev:['alentorn17','nielsen14','lenhart14','lauersen14','blagrove18'],
    body:'<b>1)</b> Correr de forma recreativa no daña las rodillas: los corredores recreativos tienen menos artrosis que los sedentarios. <b>2)</b> Sube los km poco a poco: los novatos que aumentaban más de un 30 % por semana se lesionaban más. <b>3)</b> Pasos más cortos y rápidos (+5-10 % de cadencia) reducen la carga sobre la rótula. <b>4)</b> La fuerza de pierna reduce lesiones y mejora tu economía de carrera: el D3 es tu seguro.'});
  // 9b. Cardio medido
  { const w0 = weekStart(now), last = cardioWeek(new Date(+w0 - 7*864e5), w0), cur = cardioWeek(w0, new Date(+w0 + 7*864e5)), d7 = cardioWeek(new Date(now - 7*864e5), new Date(+now + 1));
    if (last.run > 0 && cur.run > last.run * 1.3) out.push({prio:1, kind:'warn', title:`Carrera: +${Math.round((cur.run/last.run - 1)*100)} % de km esta semana`, ev:['nielsen14'],
      body:`Llevas ${fmt1(cur.run)} km frente a ${fmt1(last.run)} la semana pasada. Los novatos que subían más de un 30 % por semana se lesionaban más: no pases de <b>${fmt1(last.run*1.3)} km</b> esta semana y, si quieres más, camina.`});
    if (S.cardio.length && d7.days.size < 2) out.push({prio:3, kind:'info', title:`Cardio: ${d7.days.size} ${d7.days.size === 1 ? 'día' : 'días'} en los últimos 7`, ev:['alentorn17'],
      body:'Tu plan son 2-3 días de caminata inclinada o trote suave. Es lo que te deja comer sin contar calorías.'}); }
  // 9c. Descarga
  { const dl = deloadCheck();
    if (deloadActive()) out.push({prio:1, kind:'info', title:'Semana de descarga en marcha', ev:['bell23','coleman24'], body:`Hasta el ${fmtDate(new Date(kv('deloadUntil')),{weekday:'long', day:'numeric'})}: la mitad de series, el mismo peso y 3 en reserva. <button class="btn small" data-deload="end">Terminarla ya</button>`});
    else if (dl.propose) out.push({prio:1, kind:'warn', title: dl.stalled.length >= 3 ? `${dl.stalled.length} ejercicios estancados a la vez` : `${dl.streak} semanas seguidas entrenando`, ev:['bell23','coleman24'],
      body:`${dl.stalled.length >= 3 ? `Se han parado ${dl.stalled.slice(0,4).map(n => esc(meta(n).es)).join(', ')}. Cuando se estancan varios a la vez suele ser fatiga acumulada, no falta de esfuerzo.` : 'Llevas mucho tiempo sin bajar el ritmo.'} Te propongo <b>una semana de descarga</b>: mismas rutinas con la mitad de series y el mismo peso. No pares del todo: parar una semana no dio más músculo y frenó algo la fuerza. <button class="btn small primary" data-deload="start">Empezar la descarga</button>`}); }
  // 9d. RIR apuntado
  { const rr = S.all.filter(x => x.date >= cut).flatMap(x => x.ex.flatMap(e => e.sets)).map(x => x.rir).filter(x => x != null);
    if (rr.length >= 10) { const zero = rr.filter(x => x === 0).length / rr.length, avg = rr.reduce((a,b) => a+b, 0) / rr.length;
      if (zero >= .4) out.push({prio:2, kind:'warn', title:`Vas al fallo en el ${Math.round(zero*100)} % de las series`, ev:['refalo23'], body:'Ir al fallo no da más músculo que quedarse a 1-2 y cansa más: pierdes repeticiones en las series siguientes. Para 1-2 antes, salvo en la última serie de los aislamientos.'});
      else if (avg >= 3) out.push({prio:2, kind:'warn', title:`Dejas ${fmt1(avg)} reps en reserva de media`, ev:['refalo23','pelland'], body:'Lejos del fallo el estímulo baja. Apunta a 1-2 en reserva: sube el peso o haz más repeticiones.'}); } }
  // 10. Lo que va bien
  if (exIn4.has('Overhead Triceps Extension (Cable)') || exIn4.has('Overhead Triceps Extension (Dumbbell)')) out.push({prio:4, kind:'good', title:'Tríceps tras nuca: bien elegido', ev:['maeo23'], body:'Es la variante que más hizo crecer el tríceps en los estudios.'});
  if (exIn4.has('Seated Leg Curl (Machine)')) out.push({prio:4, kind:'good', title:'Femoral sentado: bien elegido', ev:['maeo21'], body:'Sentado hizo crecer más el femoral que tumbado.'});
  return out.sort((a,b) => a.prio - b.prio);
}
function weekStatus(){
  const now = new Date(), w0 = weekStart(now), v = volumeBy(w0, now);
  const done = S.all.filter(s => s.date >= w0).length, left = Math.max(0, 4 - done);
  const nx = nextRoutine(); const upcoming = []; let k = ORDER.indexOf(nx.key);
  for (let i = 0; i < left; i++) { upcoming.push(ORDER[(k + i) % 4]); }
  const pv = {}; for (const key of upcoming) { const sv = sessionVolume(ROUTINES[key].ex.map(n => ({n, sets:Array.from({length:planSets(n)}, () => ({}))}))); for (const m in sv) pv[m] = (pv[m]||0) + sv[m]; }
  return {v, done, left, upcoming, pv};
}
function renderAdvice(){
  const list = adviceList(), ws = weekStatus();
  const shown = S.showAllTips ? list : list.slice(0, 5);
  const rows = BIG.concat(['ho','bi','tr']).map(m => { const now = ws.v[m], proj = now + (ws.pv[m]||0);
    const cls = proj >= 10 ? 'good' : proj >= 6 ? 'warn' : 'bad';
    return `<div class="wk-row"><span>${MUSCLES[m]}</span><span class="num">${fmt1(now)} → <b>${fmt1(proj)}</b></span><span class="pill ${cls}">${proj >= 10 ? 'OK' : `faltan ${Math.ceil(10 - proj)}`}</span></div>`; }).join('');
  return `<section class="card pad stack" style="gap:12px">
    <header class="row" style="justify-content:space-between"><h2>Consejos para ti</h2><span class="faint" style="font-size:12px">${EVIDENCE.length} estudios</span></header>
    <div class="wk"><div class="eyebrow">Esta semana · ${ws.done} de 4 sesiones${ws.left ? ` · quedan ${ws.upcoming.map(k => ROUTINES[k].code).join(', ')}` : ''}</div>
      <p class="faint" style="font-size:12px;margin:2px 0 6px">Series hechas → series al terminar la semana si haces lo que queda</p>${rows}</div>
    ${shown.map(t => `<article class="tipc ${t.kind}"><div class="tipc-h"><span class="dotk"></span><b>${t.title}</b></div><div class="tipc-b">${t.body}</div><div class="row" style="gap:6px">${t.ev.map(evChip).join('')}</div></article>`).join('')}
    ${list.length > 5 ? `<button class="btn ghost wide" data-alltips>${S.showAllTips ? 'Ver menos' : `Ver todos (${list.length})`}</button>` : ''}
  </section>`;
}
function renderLibrary(){
  const f = S.evFilter || 'all';
  const items = EVIDENCE.filter(e => f === 'all' || e.tema === f);
  return `<section class="card pad stack" style="gap:10px">
    <h2>Estudios</h2>
    <div class="gymbar">${[['all','Todos']].concat(Object.entries(TEMAS)).map(([k,v]) => `<button class="chip small ${k===f?'on':''}" data-evf="${k}">${v}</button>`).join('')}</div>
    ${items.map(e => `<button class="ev-row" data-ev="${e.id}"><span><b>${esc(e.cita)} · ${e.year}</b><small>${esc(e.tipo)} · ${esc(e.rev)}</small></span><span class="faint">›</span></button>`).join('')}
    <p class="faint" style="font-size:12px;margin:0">Los estudios hablan de medias. Tu rodilla siempre tiene prioridad sobre cualquier consejo.</p>
  </section>`;
}
function sheetEvidence(id){
  const e = EV[id]; if (!e) return;
  openSheet(`<h3 class="sheet-t">${esc(e.cita)} · ${e.year}</h3>
    <p class="muted" style="margin:0;font-size:13px;text-align:center">${esc(e.tipo)} · ${esc(e.rev)} · ${TEMAS[e.tema]}</p>
    <div class="ev-box"><div class="eyebrow">Qué encontró</div><p>${esc(e.hallazgo)}</p></div>
    <div class="ev-box"><div class="eyebrow">Cómo lo aplica la app</div><p>${esc(e.regla)}</p></div>
    <button class="btn primary wide" data-sheetclose>Cerrar</button>`);
}
const recClass = p => p >= 80 ? 'good' : p >= 50 ? 'warn' : 'bad';
const recLabel = p => p >= 80 ? 'Listo' : p >= 50 ? 'Recuperando' : 'Cargado';
function routineReadiness(key, rec){
  const w = {}; for (const n of ROUTINES[key].ex) for (const mu of meta(n).mus) w[mu] = (w[mu]||0) + 1;
  let a = 0, b = 0; for (const mu in w) { a += rec[mu].pct * w[mu]; b += w[mu]; }
  return b ? Math.round(a/b) : 100;
}

/* =====================================================================
   GIMNASIOS: cambia ejercicios según el material disponible (sin IA)
   ===================================================================== */
const currentGym = () => S.gyms.find(g => g.id === kv('gym', 'g-main')) || S.gyms[0];
const hasEq = (n, eq) => meta(n).eq.every(x => eq.includes(x));
function planFor(list, eq){ const used = new Set(list.filter(n => !EX[n] || hasEq(n, eq))); return list.map(n => { const r = substitute(n, eq, used); if (r.n) used.add(r.n); return r; }); }
function substitute(n, eq, used = new Set()){
  if (!EX[n] || hasEq(n, eq)) return {n};
  const m = meta(n);
  const usage = nn => history(nn).length;
  const score = c => { const cm = meta(c); return (cm.mus.filter(x => m.mus.includes(x)).length * 10) + (cm.knee === m.knee ? 3 : 0) + Math.min(5, usage(c)); };
  const ex = excluded();
  let cands = Object.keys(EX).filter(c => c !== n && !used.has(c) && !ex.has(c) && meta(c).pat === m.pat && hasEq(c, eq));
  if (!cands.length) cands = Object.keys(EX).filter(c => c !== n && !used.has(c) && !ex.has(c) && hasEq(c, eq) && meta(c).mus.some(x => m.mus.includes(x)));
  if (!cands.length) return {n:null, from:n};
  cands.sort((a,b) => score(b) - score(a));
  return {n:cands[0], from:n};
}

/* =====================================================================
   ENTRENAR
   ===================================================================== */
function nextRoutine(){
  const last = S.all.find(s => s.routine);
  const rot = last ? ORDER[(ORDER.indexOf(last.routine)+1) % ORDER.length] : 'd1';
  const rec = recoveryCached();
  const ready = Object.fromEntries(ORDER.map(k => [k, routineReadiness(k, rec)]));
  let key = rot, why = last ? `Sigue a tu última sesión (${ROUTINES[last.routine].code}, ${ago(last.date)}).` : 'Empieza por el principio de la rotación.';
  if (ready[rot] < 60) {
    const alt = ORDER.filter(k => k !== rot).sort((a,b) => ready[b] - ready[a])[0];
    if (ready[alt] >= 80) { key = alt; why = `${ROUTINES[rot].code} tiene músculos aún cargados (${ready[rot]} %). ${ROUTINES[alt].code} está al ${ready[alt]} %.`; }
  }
  return {key, why, ready};
}
const lastOfRoutine = key => S.all.find(s => s.routine === key);

function gymBar(){
  return `<div class="gymbar" role="group" aria-label="Dónde entrenas">${S.gyms.map(g => `<button class="chip ${g.id === currentGym().id ? 'on':''}" data-gym="${g.id}" aria-pressed="${g.id === currentGym().id}">${esc(g.name)}</button>`).join('')}</div>`;
}

function renderPicker(){
  const nx = nextRoutine();
  const sel = S.pick || nx.key, r = ROUTINES[sel], gym = currentGym();
  const lastSame = lastOfRoutine(sel);
  const plan = planFor(r.ex, gym.eq);
  const preview = plan.map(p => {
    if (!p.n) return `<li><span class="faint">${esc(meta(p.from).es)}</span><span class="faint" style="white-space:nowrap">sin material</span></li>`;
    const sg = suggest(p.n);
    return `<li><span>${esc(meta(p.n).es)}${p.from ? ' <span class="swap">cambio</span>' : ''}</span><span class="num muted" style="white-space:nowrap">${sg.kg ? fmtKg(sg.kg)+' kg' : sg.reps+' reps'}</span></li>`;
  }).join('');
  const cards = ORDER.map(k => { const l = lastOfRoutine(k);
    return `<button class="rt ${k===sel?'sel':''}" data-pick="${k}" aria-pressed="${k===sel}"><b>${ROUTINES[k].code} · ${esc(ROUTINES[k].title)}</b><span>${l ? 'Última: '+ago(l.date) : 'Sin registros'} · ${nx.ready[k]} %</span></button>`; }).join('');
  const backup = kv('lastBackup', 0);
  const needBackup = S.all.length && (!backup || Date.now() - backup > 14*864e5);
  return `
  ${needBackup ? `<div class="banner"><span>${backup ? 'Hace más de 2 semanas de tu última copia de seguridad.' : 'Aún no has hecho ninguna copia de seguridad.'}</span><button class="btn small" data-tab="more">Hacer copia</button></div>` : ''}
  ${gymBar()}
  <section class="card next">
    <div class="eyebrow">${sel === nx.key ? 'Toca hoy' : 'Has elegido'}</div>
    <div class="big">${r.code} · ${esc(r.title)}</div>
    <div class="muted">${sel === nx.key ? esc(nx.why) : (lastSame ? `La última vez: ${fmtDate(lastSame.date,{weekday:'long',day:'numeric',month:'short'})} (${ago(lastSame.date)}).` : 'Primera vez con esta rutina.')} Músculos de hoy al ${nx.ready[sel]} %.</div>
    <ul style="list-style:none;margin:4px 0 0;padding:0;display:flex;flex-direction:column;gap:6px;font-size:14px">${preview.replace(/<li>/g,'<li style="display:flex;justify-content:space-between;gap:10px">')}</ul>
    <div class="faint" style="font-size:13px">Duración estimada: ~${estMinutes(plan.filter(p => p.n).map(p => p.n))} min</div>
    <button class="btn primary wide" id="start">Empezar ${r.code}</button>
  </section>
  <div class="eyebrow" style="margin-top:6px">Elegir otra rutina · % = músculos recuperados</div>
  <div class="routines">${cards}</div>
  <div class="row" style="gap:8px"><button class="btn ghost" style="flex:1" id="startFree">Sesión libre</button><button class="btn ghost" style="flex:1" id="cdNew">+ Apuntar cardio</button></div>
  ${cardioLine()}
  ${S.all.length ? '' : `<section class="card pad import"><div class="eyebrow">Empieza con tu historial</div><p style="margin:0">Importa el <b>workouts.csv</b> de Hevy en la pestaña Más y tendrás pesos sugeridos y gráficas desde el primer día.</p><button class="btn primary" data-tab="more">Ir a Más</button></section>`}`;
}

function newSet(t){ return {kg:'', reps:'', knee:'', done:false, t:t||'n'}; }
function exEntry(n, from){
  const sg = suggest(n);
  const inPlan = ORDER.some(r => ROUTINES[r].ex.includes(n));
  const k = planSets(n, null) || (inPlan ? 3 : sg.last ? Math.max(2, Math.min(4, sg.last.sets.length)) : 3);
  return {n, from: from || null, sets: Array.from({length:k}, () => newSet())};
}
const restOf = n => kv('rest:' + n, meta(n).rest);
const fmtRest = s => `${Math.floor(s/60)}:${pad(s%60)}`;
/* Objetivo en gris de cada serie: lo sugerido o lo que hiciste en esa misma serie la última vez */
function targets(e, j, sg){
  const m = meta(e.n), set = e.sets[j];
  if (set.t === 'w') { const base = sg.kg ?? (sg.last ? Math.max(...sg.last.sets.map(x => x.kg||0)) : null);
    const before = e.sets.slice(0, j).filter(x => x.t === 'w').length;
    const pct = before === 0 ? .5 : .7, step = sg.step || 2.5;
    return {kg: base ? fmtKg(Math.max(step, roundTo(base*pct, step))) : '', reps: before === 0 ? '10' : '5', prev:'—'}; }
  const idx = e.sets.slice(0, j).filter(x => x.t !== 'w').length;
  const prev = sg.last ? sg.last.sets[idx] : null;
  const kg = sg.kg != null ? fmtKg(sg.kg) : (prev && prev.kg ? fmtKg(prev.kg) : '');
  let reps = String(m.lo);
  if (prev) reps = m.time ? String(sg.reps || m.lo) : sg.tone === 'up' ? String(m.lo) : sg.tone === 'down' ? String(m.lo) : String(Math.min(m.hi, prev.reps + (prev.reps < m.hi ? 1 : 0)));
  else if (sg.reps && /^\d+$/.test(sg.reps)) reps = sg.reps;
  return {kg, reps, prev: prev ? (prev.kg ? `${fmtKg(prev.kg)}×${prev.reps}` : `${prev.reps}`) : '—'};
}
const TYPES = {w:{lab:'W', name:'Calentamiento', cls:'t-w'}, n:{lab:'', name:'Normal', cls:''}, f:{lab:'F', name:'Al fallo', cls:'t-f'}, d:{lab:'D', name:'Drop', cls:'t-d'}, x:{lab:'✕', name:'Fallida (no completaste las reps)', cls:'t-x'}};
async function startSession(key){
  const now = new Date(), r = key ? ROUTINES[key] : null, gym = currentGym();
  const ex = r ? planFor(r.ex, gym.eq).filter(p => p.n).map(p => exEntry(p.n, p.from)) : [];
  if (deloadActive()) for (const e of ex) e.sets = e.sets.slice(0, Math.max(1, Math.ceil(e.sets.length / 2)));
  S.live = {id:uid('a'), date:isoLocal(now), start:now.getTime(), routine:key||null, title:r ? r.title : 'Sesión libre', gym:gym.name, status:'live', ex};
  S.lastDone = null; S.pick = null;
  await saveLive(); keepAwake(true); render(); window.scrollTo({top:0});
}
let saveTimer = null;
function scheduleSave(){ clearTimeout(saveTimer); saveTimer = setTimeout(saveLive, 300); }
async function saveLive(){ if (!S.live) return; try { await IDB.put('sessions', JSON.parse(JSON.stringify(S.live))); S.app[S.live.id] = S.live; } catch(e) { toast('No se pudo guardar en el iPhone.'); } }

function renderLive(){
  const L = S.live, r = L.routine ? ROUTINES[L.routine] : null;
  const mins = Math.max(0, Math.round((Date.now() - L.start)/60000));
  const warm = r ? `
  <details class="warm">
    <summary><span>Calentamiento${r.knee ? ' + bloque de rodilla' : ''}</span><span class="muted" style="font-weight:500">${r.warm==='full'?'8-10':'5'} min ▾</span></summary>
    <ul>${WARM[r.warm].map((t,i) => `<li><label><input type="checkbox" id="w${i}"> <span>${esc(t)}</span></label></li>`).join('')}</ul>
    ${r.knee ? `<h4>Bloque de rodilla</h4><ul>${KNEE_BLOCK.map((t,i) => `<li><label><input type="checkbox" id="kb${i}"> <span>${esc(t)}</span></label></li>`).join('')}</ul>${L.ex.some(e => e.n === 'Wall Sit') ? '' : '<div style="padding:0 16px 12px"><button class="btn small" data-addwall>+ Registrar la isométrica con cuenta atrás</button></div>'}` : ''}
  </details>` : '';
  return `
  ${deloadActive() ? '<div class="banner" style="margin-bottom:12px"><span><b>Semana de descarga:</b> mitad de series, mismo peso, deja 3 en reserva.</span></div>' : ''}
  <div class="eyebrow" style="margin-bottom:12px">${r ? r.code : 'Libre'} · ${esc(L.gym || '')} · en curso · <span id="liveMins">${mins}</span> min</div>
  <div class="stack">
    ${warm}
    ${L.ex.map((e,i) => exCard(e,i)).join('')}
    <button class="btn wide" data-picker="add">+ Agregar ejercicio</button>
    <button class="btn primary wide" id="finish">Terminar entreno</button>
    <div id="discardZone"><button class="btn danger wide" id="discard">Descartar sesión</button></div>
  </div>`;
}

function exCard(e, i){
  const m = meta(e.n), sg = suggest(e.n), note = kv('note:' + e.n, '');
  const L = S.live, grp = e.ss ? L.ex.map((x,k) => x.ss === e.ss ? k : -1).filter(k => k >= 0) : [];
  let num = 0;
  const rows = e.sets.map((s,j) => {
    const tg = targets(e, j, sg), ty = TYPES[s.t||'n'];
    if (s.t !== 'w') num++;
    const kc = s.knee === '' || s.knee == null ? '' : +s.knee >= 5 ? 'knee-2' : +s.knee >= 3 ? 'knee-1' : '';
    return `<div class="set-wrap"><button class="set-del" data-delset="${i}-${j}">Eliminar</button>
    <div class="set ${s.done?'done':''} ${kc}" data-i="${i}" data-j="${j}">
      <button class="stype ${ty.cls}" data-stype="${i}-${j}" aria-label="Tipo de serie: ${ty.name}">${ty.lab || num}</button>
      ${m.time ? `<button class="prev num tbtn" data-timer="${i}-${j}" aria-label="Empezar cuenta atrás">▶ ${esc(s.reps || tg.reps)} s</button>` : `<span class="prev num">${esc(tg.prev)}</span>`}
      <input id="kg-${i}-${j}" inputmode="decimal" autocomplete="off" aria-label="Kilos serie ${j+1}" placeholder="${esc(tg.kg || (BW_LOAD[e.n] ? 'lastre' : m.time ? '—' : 'kg'))}" value="${esc(s.kg)}" data-f="kg">
      <input id="rp-${i}-${j}" inputmode="numeric" autocomplete="off" aria-label="Repeticiones serie ${j+1}" placeholder="${esc(tg.reps)}" value="${esc(s.reps)}" data-f="reps">
      ${m.knee ? `<button class="knee-btn" id="kn-${i}-${j}" data-knee="${i}-${j}" aria-label="Rodilla de 0 a 10: ${s.knee === '' || s.knee == null ? 'sin apuntar' : s.knee}">${s.knee === '' || s.knee == null ? '–' : esc(s.knee)}</button>` : ''}
      <button class="tick" data-tick aria-label="Serie hecha" aria-pressed="${s.done}"><svg width="18" height="18" viewBox="0 0 18 18"><path d="M3.5 9.5l3.5 3.5 7.5-8" fill="none" stroke="var(--muted)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    </div>${s.done && s.t !== 'w' && !m.time ? rirRow(i, j, s) : ''}</div>`; }).join('');
  return `<article class="card ex ${m.knee?'':'noknee'}" data-ex="${i}">
    <div class="ex-h">
      ${e.ss ? `<span class="ss-tag">Superserie ${esc(e.ss)} · ${grp.indexOf(i)+1}/${grp.length}</span>` : ''}
      <div class="ex-t"><h3>${esc(m.es)}<small>${esc(e.n)} · ${m.lo}-${m.hi} ${m.time ? 's' : 'reps'}${BW_LOAD[e.n] ? ' · tu peso + lastre' : ''}</small></h3>
        <button class="menu" data-exmenu="${i}" aria-label="Opciones de ${esc(m.es)}">⋮</button></div>
      <div class="row" style="gap:6px">
        <button class="chip small" data-restcfg="${i}">⏱ Descanso ${fmtRest(restOf(e.n))}</button>
        ${usesPlates(e.n) ? `<button class="chip small" data-plates="${i}">🏋 Discos</button>` : ''}
        <button class="chip small" data-note="${i}">${note ? '✎ ' + esc(note) : '+ Ajuste de máquina'}</button>
      </div>
      ${e.from ? `<div class="subnote"><span class="swap">Cambio</span><span>En este gimnasio no hay material para ${esc(meta(e.from).es)}.</span></div>` : ''}
      <div class="sugg ${sg.tone}"><span class="tag">${sg.tag}</span><p>${sg.text}</p></div>
      ${exContext(e.n)}
    </div>
    <div class="sets">
      <div class="set-h"><span>#</span><span>${m.time ? 'Contar' : 'Anterior'}</span><span>kg</span><span>${m.time ? 'Seg' : 'Reps'}</span>${m.knee?'<span>Rodilla</span>':''}<span>✓</span></div>
      ${rows}
    </div>
    <div class="ex-f"><button class="btn small" data-add="${i}">+ Serie</button><span class="faint" style="font-size:12px;align-self:center">Desliza una serie a la izquierda para borrarla</span></div>
  </article>`;
}

function exContext(n){
  const m = meta(n), mu = m.mus[0], tip = EX_TIPS[n];
  let wk = '';
  if (mu) { const now = new Date(), v = volumeBy(weekStart(now), now)[mu];
    const live = S.live ? sessionVolume(S.live.ex.map(e => ({n:e.n, sets:e.sets.filter(x => x.done)})))[mu] || 0 : 0;
    const tot = v + live; wk = `<span>Esta semana: <b>${fmt1(tot)}</b> series de ${MUSCLES[mu].toLowerCase()} (meta 10-20)</span>`; }
  return `<div class="ctx">${wk}${tip ? `<button class="ev-line" data-ev="${tip.ev}">📚 ${esc(tip.txt)} <span class="faint">· ${esc(EV[tip.ev].cita.split(' ')[0].replace(',',''))} ${EV[tip.ev].year}</span></button>` : ''}</div>`;
}

/* ---------- hojas inferiores (menús) ---------- */
function openSheet(html){
  let el = $('#sheet');
  if (!el) { el = document.createElement('div'); el.id = 'sheet'; document.body.appendChild(el); }
  el.innerHTML = `<div class="sheet-bg" data-sheetclose></div><div class="sheet-panel" role="dialog" aria-modal="true"><div class="sheet-grip"></div>${html}</div>`;
  el.hidden = false; document.body.style.overflow = 'hidden';
}
function closeSheet(rerender){ const el = $('#sheet'); if (el) { el.hidden = true; el.innerHTML = ''; } document.body.style.overflow = ''; if (rerender) render(); }

function sheetSetType(i, j){
  const s = S.live.ex[i].sets[j];
  openSheet(`<h3 class="sheet-t">Tipo de serie</h3><div class="sheet-list">
    ${['w','n','f','d','x'].map(t => `<button class="sheet-item ${s.t===t||(!s.t&&t==='n')?'on':''}" data-settype="${i}-${j}-${t}"><span class="stype ${TYPES[t].cls}">${TYPES[t].lab || '1'}</span>${TYPES[t].name}</button>`).join('')}
    <button class="sheet-item danger" data-delset="${i}-${j}"><span class="stype t-f">🗑</span>Eliminar serie</button></div>`);
}
function sheetExMenu(i){
  const e = S.live.ex[i], m = meta(e.n);
  openSheet(`<h3 class="sheet-t">${esc(m.es)}</h3><div class="sheet-list">
    <button class="sheet-item" data-act="warm" data-i="${i}">🔥 Añadir series de calentamiento</button>
    ${usesPlates(e.n) ? `<button class="sheet-item" data-plates="${i}">🏋 Calculadora de discos</button>` : ''}
    <button class="sheet-item" data-act="order" data-i="${i}">↕ Reordenar ejercicios</button>
    <button class="sheet-item" data-act="replace" data-i="${i}">⇄ Reemplazar ejercicio</button>
    ${e.ss ? `<button class="sheet-item" data-act="unss" data-i="${i}">⛓ Quitar de la superserie ${esc(e.ss)}</button>` : `<button class="sheet-item" data-act="ss" data-i="${i}">⛓ Agregar a superserie</button>`}
    <button class="sheet-item danger" data-act="del" data-i="${i}">✕ Eliminar ejercicio</button></div>`);
}
function sheetOrder(){
  const L = S.live;
  openSheet(`<h3 class="sheet-t">Reordenar ejercicios</h3><div class="sheet-list">
    ${L.ex.map((e,i) => `<div class="sheet-item ord"><span>${i+1}. ${esc(meta(e.n).es)}${e.ss ? ` <span class="ss-tag">${esc(e.ss)}</span>` : ''}</span>
      <span class="row" style="gap:6px;flex-wrap:nowrap"><button class="btn small" data-move="${i}:-1" ${i===0?'disabled':''} aria-label="Subir">↑</button><button class="btn small" data-move="${i}:1" ${i===L.ex.length-1?'disabled':''} aria-label="Bajar">↓</button></span></div>`).join('')}
    </div><button class="btn primary wide" data-sheetclose>Listo</button>`);
}
function sheetSuperset(i){
  const L = S.live;
  openSheet(`<h3 class="sheet-t">Superserie con…</h3><p class="muted" style="margin:0 0 10px;font-size:14px">Haces una serie de cada uno seguidas y el descanso empieza al terminar el último del grupo.</p><div class="sheet-list">
    ${L.ex.map((e,k) => k === i ? '' : `<button class="sheet-item" data-ssw="${i}:${k}">${esc(meta(e.n).es)}${e.ss ? ` <span class="ss-tag">${esc(e.ss)}</span>` : ''}</button>`).join('')}
    </div>`);
}
function sheetRest(i){
  const n = S.live.ex[i].n, cur = restOf(n);
  const opts = [45,60,75,90,120,150,180,210,240];
  openSheet(`<h3 class="sheet-t">Descanso · ${esc(meta(n).es)}</h3><div class="rest-grid">
    ${opts.map(o => `<button class="chip ${o===cur?'on':''}" data-setrest="${i}:${o}">${fmtRest(o)}</button>`).join('')}</div>
    <p class="faint" style="font-size:12px;margin:10px 0 0">Se recuerda para este ejercicio en todas las sesiones.</p>`);
}
function sheetNote(i){
  const n = S.live.ex[i].n;
  openSheet(`<h3 class="sheet-t">Ajuste de máquina · ${esc(meta(n).es)}</h3>
    <input class="field" id="noteIn" maxlength="80" placeholder="Asiento 4, respaldo 2, agarre neutro" value="${esc(kv('note:' + n, ''))}">
    <div class="row" style="margin-top:10px"><button class="btn primary" data-savenote="${i}">Guardar</button><button class="btn ghost" data-sheetclose>Cancelar</button></div>`);
  setTimeout(() => { const x = $('#noteIn'); if (x) x.focus(); }, 50);
}

function sheetKnee(i, j){
  const s = S.live.ex[i].sets[j], cur = s.knee === '' || s.knee == null ? null : +s.knee;
  const cls = v => v >= 5 ? 'k-red' : v >= 3 ? 'k-amb' : 'k-ok';
  openSheet(`<h3 class="sheet-t">Rodilla · ${esc(meta(S.live.ex[i].n).es)}</h3>
    <p class="muted" style="margin:0 0 10px;font-size:14px">0-2 verde: sigue · 3-4 ámbar: no subas peso · 5+ rojo: para o cambia.</p>
    <div class="knee-grid">${Array.from({length:11}, (_,v) => `<button class="knee-chip ${cls(v)} ${cur === v ? 'on' : ''}" data-kneeset="${i}-${j}-${v}">${v}</button>`).join('')}
      <button class="knee-chip" data-kneeset="${i}-${j}-">–</button></div>`);
}
let CD = {type:'walk', day:0};
function sheetCardio(){
  openSheet(`<h3 class="sheet-t">Apuntar cardio</h3>
    <div class="chip-row" style="margin-bottom:10px">${Object.entries(CARDIO).map(([k,v]) => `<button class="chip small ${CD.type === k ? 'on' : ''}" data-cdtype="${k}">${v.lab}</button>`).join('')}</div>
    <div class="form">
      <label>Minutos<input class="field" id="cdMin" inputmode="numeric" placeholder="30"></label>
      <label>Km (opcional)<input class="field" id="cdKm" inputmode="decimal" placeholder="${CD.type === 'run' ? '5' : '2,5'}"></label>
    </div>
    <div class="chip-row" style="margin:10px 0 12px">${['Hoy','Ayer'].map((l,i) => `<button class="chip small ${CD.day === i ? 'on' : ''}" data-cdday="${i}">${l}</button>`).join('')}</div>
    <div class="row"><button class="btn primary" id="cdSave">Guardar</button><button class="btn ghost" data-sheetclose>Cancelar</button></div>`);
}
async function saveCardio(){
  const min = toNum($('#cdMin').value), km = toNum($('#cdKm').value);
  if (!min || min < 1 || min > 600) { $('#cdMin').focus(); toast('Escribe los minutos.'); return; }
  if (km != null && (km < 0 || km > 100)) { toast('Km no válidos.'); return; }
  const d = new Date(); d.setDate(d.getDate() - CD.day);
  const id = dayKey(d), prev = S.body.find(b => b.id === id) || {id};
  const rec = {...prev, cardio:(prev.cardio || []).concat({id:uid('c'), date:CD.day ? id + 'T19:00' : isoLocal(d), type:CD.type, min:Math.round(min), km:km || 0})};
  await IDB.put('body', rec);
  S.body = S.body.filter(b => b.id !== id).concat(rec).sort((a,b) => a.id < b.id ? -1 : 1);
  buildCardio(); REC_CACHE = null; closeSheet(); render(); toast('Cardio guardado');
}
async function deleteCardio(day, id){
  const prev = S.body.find(b => b.id === day); if (!prev) return;
  const rec = {...prev, cardio:(prev.cardio || []).filter(c => c.id !== id)};
  await IDB.put('body', rec); S.body = S.body.map(b => b.id === day ? rec : b);
  buildCardio(); REC_CACHE = null; render(); toast('Cardio borrado');
}
function cardioLine(){
  const w0 = weekStart(new Date()), w = cardioWeek(w0, new Date(+w0 + 7*864e5));
  return `<div class="muted" style="font-size:14px">Cardio esta semana: <b>${w.days.size}</b> ${w.days.size === 1 ? 'día' : 'días'} · ${w.min} min${w.run ? ` · ${fmt1(w.run)} km corriendo` : ''} <span class="faint">(plan: 2-3 días)</span></div>`;
}
function renderCardio(){
  const w0 = weekStart(new Date()), rows = [];
  for (let i = 7; i >= 0; i--) { const a = new Date(+w0 - i*7*864e5), b = new Date(+a + 7*864e5); const by = {};
    for (const c of S.cardio) if (c.date >= a && c.date < b) by[c.type] = (by[c.type]||0) + (c.min||0);
    rows.push({a, by, w:cardioWeek(a, b)}); }
  const max = Math.max(60, ...rows.map(r => r.w.min));
  const recent = S.cardio.slice(0, 6);
  return `<section class="card pad stack" style="gap:10px">
    <header class="row" style="justify-content:space-between"><h2>Cardio</h2><button class="btn small" id="cdNew">+ Apuntar</button></header>
    <p class="faint" style="font-size:12px;margin:0">Minutos por semana · km de carrera a la derecha</p>
    ${rows.map(r => `<div class="cardio-row"><span class="muted">${fmtDate(r.a)}</span><div class="bar">${Object.keys(CARDIO).map(k => r.by[k] ? `<i style="width:${r.by[k]/max*100}%;background:${CARDIO[k].c}" title="${CARDIO[k].lab}"></i>` : '').join('')}</div><span class="num">${r.w.min} min${r.w.run ? ' · ' + fmt1(r.w.run) + ' km' : ''}</span></div>`).join('')}
    <div class="legend">${['walk','run','bike'].map(k => `<span><i style="background:${CARDIO[k].c}"></i>${k === 'bike' ? 'Bici / elíptica' : CARDIO[k].lab}</span>`).join('')}</div>
    ${recent.length ? `<div class="sheet-list">${recent.map(c => `<div class="sheet-item sess-row"><span><b>${CARDIO[c.type] ? CARDIO[c.type].lab : c.type}</b><small>${fmtDate(c.date,{weekday:'short', day:'numeric', month:'short'})} · ${c.min} min${c.km ? ' · ' + fmt1(c.km) + ' km' : ''}${c.src === 'hevy' ? ' · Hevy' : ''}</small></span>${c.src === 'app' ? `<button class="btn small ghost" data-cddel="${c.day}|${c.id}" aria-label="Borrar cardio">✕</button>` : ''}</div>`).join('')}</div>` : '<p class="muted" style="margin:0;font-size:14px">Aún no hay cardio apuntado.</p>'}
  </section>`;
}
function sheetFinish(){
  let done = 0, open = 0;
  for (const e of S.live.ex) for (const x of e.sets) { if (x.done) { if (x.t !== 'w') done++; } else open++; }
  openSheet(`<h3 class="sheet-t">¿Terminar entreno?</h3>
    <p class="muted" style="margin:0 0 12px;font-size:15px">${done} ${done === 1 ? 'serie hecha' : 'series hechas'}${open ? ` · ${open} sin marcar, que no se guardarán` : ''}.</p>
    <div class="row"><button class="btn primary" id="finishYes">Sí, terminar</button><button class="btn ghost" data-sheetclose>Seguir entrenando</button></div>`);
}

/* ---------- RIR: repeticiones en reserva, un toque por serie ---------- */
const rirRow = (i, j, s) => `<div class="rir" data-rirrow="${i}-${j}"><span>En reserva</span>${['0','1','2','3'].map(v => `<button class="rir-b ${String(s.rir) === v ? 'on' : ''}" data-rir="${i}-${j}-${v}" aria-pressed="${String(s.rir) === v}">${v === '3' ? '3+' : v}</button>`).join('')}</div>`;

/* ---------- series por tiempo: cuenta atrás ---------- */
let HOLD = null;
function startHold(i, j){
  const e = S.live.ex[i], s = e.sets[j], row = document.querySelector(`.set[data-i="${i}"][data-j="${j}"]`);
  const secs = toNum(s.reps) || (row && toNum(row.querySelector('[data-f=reps]').placeholder)) || meta(e.n).lo;
  stopRest(); beep(0,.001);
  if (HOLD) clearInterval(HOLD.iv);
  HOLD = {i, j, secs, start:Date.now()}; HOLD.iv = setInterval(drawHold, 200); drawHold();
}
function drawHold(){
  if (!HOLD) return;
  const el = $('#rest'); el.hidden = false; el.classList.remove('end');
  const done = (Date.now() - HOLD.start) / 1000, left = Math.ceil(HOLD.secs - done);
  if (left <= 0) return finishHold(HOLD.secs);
  if (left <= 3 && HOLD.lastBeep !== left) { HOLD.lastBeep = left; beep(660,.08); }
  el.innerHTML = `<div class="rbar" role="timer"><i style="width:${Math.min(100, done / HOLD.secs * 100)}%"></i><div class="rrow"><span class="rlabel">Aguanta · ${esc(meta(S.live.ex[HOLD.i].n).es)}</span><b>${Math.floor(left/60)}:${pad(left%60)}</b><button class="rbtn primary" data-hold="stop">Parar</button></div></div>`;
}
function finishHold(secs){
  const H = HOLD; if (!H) return; clearInterval(H.iv); HOLD = null; beep(988,.2); beep(1319,.35,.22);
  const e = S.live && S.live.ex[H.i]; if (!e || !e.sets[H.j]) { stopRest(); return; }
  const s = e.sets[H.j]; s.reps = String(Math.max(1, Math.round(secs))); s.done = true; s.at = Date.now();
  scheduleSave(); render(); startRest(restOf(e.n));
}

/* ---------- ejercicios propios ---------- */
function sheetCustom(){
  const mus = Object.entries(MUSCLES).map(([k,v]) => `<option value="${k}">${v}</option>`).join('');
  openSheet(`<h3 class="sheet-t">Crear ejercicio</h3>
    <div class="stack" style="gap:10px">
      <label class="lbl">Nombre<input class="field" id="cxName" maxlength="40" placeholder="Remo Hammer en máquina" autocomplete="off"></label>
      <div class="form"><label>Músculo principal<select class="field" id="cxMus">${mus}</select></label><label>Secundario<select class="field" id="cxMus2"><option value="">Ninguno</option>${mus}</select></label></div>
      <label class="lbl">Material<select class="field" id="cxEq"><option value="">Sin material (peso corporal)</option>${Object.entries(EQUIP).map(([k,v]) => `<option value="${k}">${esc(v)}</option>`).join('')}</select></label>
      <div class="form"><label>Se mide en<select class="field" id="cxKind"><option value="r">Repeticiones</option><option value="t">Segundos</option></select></label>
        <label>Rango<span class="row" style="gap:6px;flex-wrap:nowrap"><input class="field" id="cxLo" inputmode="numeric" value="10" aria-label="Mínimo"><input class="field" id="cxHi" inputmode="numeric" value="12" aria-label="Máximo"></span></label></div>
      <label class="row" style="gap:8px;font-size:15px"><input type="checkbox" id="cxKnee"> Carga la rodilla (pedirá el semáforo)</label>
      <div class="row"><button class="btn primary" id="cxSave">${S.live ? 'Crear y añadir' : 'Crear'}</button><button class="btn ghost" data-sheetclose>Cancelar</button></div>
    </div>`);
  setTimeout(() => { const x = $('#cxName'); if (x) x.focus(); }, 50);
}
async function saveCustom(){
  const es = $('#cxName').value.trim(), lo = toNum($('#cxLo').value), hi = toNum($('#cxHi').value);
  if (es.length < 3) { toast('Ponle un nombre de al menos 3 letras.'); return; }
  if (!lo || !hi || lo > hi || hi > 300) { toast('Revisa el rango (mínimo y máximo).'); return; }
  const custom = kv('customEx', {});
  let n = es; if (EX[n] && !custom[n]) n = es + ' (propio)';
  const m1 = $('#cxMus').value, m2 = $('#cxMus2').value, mus = [m1].concat(m2 && m2 !== m1 ? [m2] : []).join(' ');
  const pats = {}; for (const k in EX) if (meta(k).mus[0] === m1) pats[meta(k).pat] = (pats[meta(k).pat] || 0) + 1;
  const pat = Object.entries(pats).sort((a,b) => b[1] - a[1])[0];
  const time = $('#cxKind').value === 't';
  const def = [es, mus, Math.round(lo), Math.round(hi), $('#cxKnee').checked ? 1 : 0, time ? 60 : 90, pat ? pat[0] : 'other', $('#cxEq').value ? [$('#cxEq').value] : []].concat(time ? ['t'] : []);
  EX[n] = def; await setKv('customEx', {...custom, [n]:def});
  closeSheet();
  if (S.live) { S.live.ex.push(exEntry(n)); scheduleSave(); }
  render(); toast(`«${es}» creado`);
}

/* ---------- semana de descarga ---------- */
const deloadActive = () => kv('deloadUntil', 0) > Date.now();
function deloadCheck(){
  const lastD = kv('lastDeload', 0), w0 = weekStart(new Date());
  let streak = 0;
  for (let i = 1; i <= 16; i++) { const a = new Date(+w0 - i*7*864e5), b = new Date(+a + 7*864e5); if (+b <= lastD) break;
    if (S.all.filter(x => x.date >= a && x.date < b).length >= 2) streak++; else break; }
  const cut = new Date(Date.now() - 14*864e5);
  const names = [...new Set(S.all.filter(x => x.date >= cut).flatMap(x => x.ex.map(e => e.n)))].filter(n => !SKIP.has(n));
  const stalled = names.filter(n => ['ESTANCADO','BAJA'].includes(suggest(n).tag));
  return {streak, stalled, propose: !deloadActive() && (streak >= 6 || stalled.length >= 3)};
}

/* ---------- calculadora de discos ---------- */
const usesPlates = n => { const eq = meta(n).eq; return eq.includes('bb') || eq.includes('tbar') || eq.includes('smith'); };
let PC = {kg:null, n:null};
function plateCalc(total, bar, plates, sides){
  const per = (total - bar) / sides; if (!(per > 0)) return {per:[], left:0, got:bar};
  let left = Math.round(per*100)/100; const out = [];
  for (const p of plates.slice().sort((a,b) => b - a)) while (left >= p - 1e-9) { out.push(p); left = Math.round((left - p)*100)/100; }
  return {per:out, left, got: Math.round((bar + sides*(per - left))*100)/100};
}
function sheetPlates(i){
  const n = i != null && S.live && S.live.ex[i] ? S.live.ex[i].n : null;
  const cfg = kv('plateCfg', {}), tb = n === 'T Bar Row';
  PC = {n, bar: cfg[tb ? 'tbar' : 'bar'] ?? (tb ? 0 : 20), sides: tb ? 1 : 2, plates: kv('plates', PLATES)};
  let kg = null;
  if (n) { const sg = suggest(n); kg = sg.kg; const row = S.live.ex[i].sets.find(x => !x.done && toNum(x.kg)); if (row) kg = toNum(row.kg); }
  PC.kg = kg;
  openSheet(`<div class="pk-head"><h3 class="sheet-t" style="margin:0">Discos${n ? ' · ' + esc(meta(n).es) : ''}</h3><button class="btn small ghost" data-sheetclose>Cerrar</button></div>
    <div class="form"><label>Peso total (kg)<input class="field" id="pcKg" inputmode="decimal" value="${kg != null ? fmtKg(kg) : ''}" placeholder="85"></label>
      <label>Barra<select class="field" id="pcBar">${[20,15,10,0].map(b => `<option value="${b}" ${PC.bar === b ? 'selected' : ''}>${b ? b + ' kg' : 'No cuenta'}</option>`).join('')}</select></label></div>
    <div class="chip-row" style="margin:10px 0"><button class="chip small ${PC.sides === 2 ? 'on' : ''}" data-pcsides="2">Dos lados</button><button class="chip small ${PC.sides === 1 ? 'on' : ''}" data-pcsides="1">Un lado (remo en T)</button></div>
    <div id="pcOut"></div>
    <div class="eyebrow" style="margin:12px 0 6px">Discos que hay en tu gimnasio</div>
    <div class="chip-row">${PLATES.map(p => `<button class="chip small ${PC.plates.includes(p) ? 'on' : ''}" data-pcplate="${p}">${fmtKg(p)}</button>`).join('')}</div>`);
  drawPlates();
}
const PLATE_COL = {25:'#d64545', 20:'#2f6fd6', 15:'#e0b12f', 10:'#2e9c5a', 5:'#e8edef', 2.5:'#8a96a0', 1.25:'#8a96a0'};
function drawPlates(){
  const out = $('#pcOut'); if (!out) return;
  const kg = toNum($('#pcKg').value);
  if (!kg) { out.innerHTML = '<p class="muted" style="margin:0;font-size:14px">Escribe el peso total.</p>'; return; }
  const r = plateCalc(kg, PC.bar, PC.plates, PC.sides);
  if (!r.per.length) { out.innerHTML = `<p class="muted" style="margin:0">Con ${fmtKg(kg)} kg no hace falta poner discos.</p>`; return; }
  const viz = r.per.map(p => `<span class="plate" style="background:${PLATE_COL[p] || '#8a96a0'};height:${30 + p*2.2}px" title="${fmtKg(p)} kg">${fmtKg(p)}</span>`).join('');
  out.innerHTML = `<div class="plates-viz"><span class="sleeve"></span>${viz}</div>
    <p style="margin:8px 0 0;font-size:16px"><b>${PC.sides === 2 ? 'En cada lado' : 'En el lado cargado'}:</b> ${r.per.map(fmtKg).join(' + ')} kg</p>
    ${r.left > 0.001 ? `<p class="muted" style="margin:4px 0 0;font-size:14px">Con tus discos no sale exacto: lo más cercano es <b>${fmtKg(r.got)} kg</b>.</p>` : ''}`;
}

/* ---------- calendario del historial ---------- */
function renderCalendar(){
  const now = new Date(), m0 = S.calM || new Date(now.getFullYear(), now.getMonth(), 1);
  const y = m0.getFullYear(), mo = m0.getMonth(), nd = new Date(y, mo + 1, 0).getDate(), off = (m0.getDay() + 6) % 7;
  const inMonth = d => d.getFullYear() === y && d.getMonth() === mo;
  const byDay = {}; for (const x of S.all) if (inMonth(x.date)) (byDay[x.date.getDate()] ||= []).push(x);
  const cDays = new Set((S.cardio || []).filter(c => inMonth(c.date)).map(c => c.date.getDate()));
  const list = S.all.filter(x => inMonth(x.date));
  const cells = [];
  for (let i = 0; i < off; i++) cells.push('<span></span>');
  for (let d = 1; d <= nd; d++) { const ss = byDay[d] || [], today = inMonth(now) && now.getDate() === d;
    cells.push(`<button class="cal-d ${ss.length ? 'has' : ''} ${today ? 'today' : ''}" data-calday="${y}-${pad(mo+1)}-${pad(d)}" ${ss.length ? '' : 'disabled'} aria-label="${d}${ss.length ? ': ' + ss.map(x => x.title).join(', ') : ''}"><span>${d}</span><i>${ss.map(x => `<em class="r-${x.routine || 'x'}">${x.routine ? ROUTINES[x.routine].code : '•'}</em>`).join('')}${cDays.has(d) ? '<em class="r-c">C</em>' : ''}</i></button>`); }
  const canNext = new Date(y, mo + 1, 1) <= now;
  return `<section class="card pad stack" style="gap:10px">
    <header class="row" style="justify-content:space-between"><h2>Calendario</h2><span class="faint" style="font-size:12px">Toca un día para corregirlo</span></header>
    <div class="cal-nav"><button class="btn small ghost" data-calnav="-1" aria-label="Mes anterior">‹</button><b>${(t => t[0].toUpperCase() + t.slice(1))(m0.toLocaleDateString('es-ES',{month:'long', year:'numeric'}))}</b><button class="btn small ghost" data-calnav="1" aria-label="Mes siguiente" ${canNext ? '' : 'disabled'}>›</button></div>
    <div class="cal">${['L','M','X','J','V','S','D'].map(d => `<span class="cal-w">${d}</span>`).join('')}${cells.join('')}</div>
    <p class="faint" style="font-size:12px;margin:0">${list.length} sesiones este mes · C = cardio</p>
    ${list.length ? `<div class="sheet-list">${list.map(x => { const sets = x.ex.reduce((a,e) => a + e.sets.length, 0);
      return `<button class="sheet-item sess-row" data-sess="${esc(x.id)}"><span><b>${esc(x.routine ? ROUTINES[x.routine].code + ' · ' + ROUTINES[x.routine].title : x.title)}</b><small>${fmtDate(x.date,{weekday:'short', day:'numeric', month:'short'})} · ${sets} series${x.src === 'hevy' ? ' · Hevy' : ''}</small></span><span class="faint">Editar ›</span></button>`; }).join('')}</div>` : ''}
  </section>`;
}

/* ---------- editar o borrar sesiones terminadas ---------- */
let ED = null;
function findHevy(id){ for (const k in S.hevy) { const i = S.hevy[k].findIndex(x => x.id === id); if (i >= 0) return {k, s:S.hevy[k][i]}; } return null; }
function openEditor(id){
  const a = S.app[id];
  if (a && a.status === 'done') ED = {id, src:'app', title:a.title, date:a.date,
    ex:(a.ex||[]).map(e => ({n:e.n, orig:e, sets:(e.sets||[]).filter(x => x.done).map(x => ({kg:x.kg ?? '', reps:x.reps ?? '', t:x.t || 'n', orig:x}))})).filter(e => e.sets.length)};
  else { const h = findHevy(id); if (!h) { toast('No encuentro esa sesión.'); return; }
    ED = {id, src:'hevy', title:h.s.title, date:h.s.date, ex:h.s.ex.map(e => ({n:e.n, sets:e.s.map(x => ({kg:x[0] ?? '', reps:x[1] ?? '', t:x[2] || 'n', rir:x[3] ?? null}))}))}; }
  drawEditor();
}
function drawEditor(){
  const scroll = document.querySelector('.sheet-panel') ? document.querySelector('.sheet-panel').scrollTop : 0;
  openSheet(`<div class="pk-head"><h3 class="sheet-t" style="margin:0">Editar sesión</h3><button class="btn small ghost" data-sheetclose>Cerrar</button></div>
    <p class="muted" style="margin:0 0 10px;font-size:14px">${esc(ED.title)} · ${fmtDate(parseIso(ED.date),{weekday:'long', day:'numeric', month:'long'})}${ED.src === 'hevy' ? ' · importada de Hevy' : ''}</p>
    ${ED.ex.map((e,i) => `<div class="ed-ex"><div class="ed-h"><b>${esc(meta(e.n).es)}</b><button class="btn small ghost" data-edexdel="${i}">Quitar ejercicio</button></div>
      <div class="ed-set ed-lab"><span>#</span><span>kg</span><span>Reps</span><span></span></div>
      ${e.sets.map((x,j) => `<div class="ed-set"><span class="stype ${(TYPES[x.t] || TYPES.n).cls}">${(TYPES[x.t] || TYPES.n).lab || j+1}</span>
        <input class="field" inputmode="decimal" autocomplete="off" data-ed="${i}-${j}-kg" value="${esc(x.kg)}" placeholder="${needsKg(e.n) ? 'kg' : 'sin peso'}" aria-label="Kilos serie ${j+1}">
        <input class="field" inputmode="numeric" autocomplete="off" data-ed="${i}-${j}-reps" value="${esc(x.reps)}" placeholder="reps" aria-label="Repeticiones serie ${j+1}">
        <button class="btn small ghost" data-edsetdel="${i}-${j}" aria-label="Borrar serie ${j+1}">✕</button></div>`).join('')}</div>`).join('') || '<p class="muted">Esta sesión ya no tiene series. Bórrala o cierra sin guardar.</p>'}
    ${ED.src === 'hevy' ? '<p class="faint" style="font-size:12px;margin:8px 0 0">Tus cambios se mantienen aunque vuelvas a importar Hevy. Si puedes, corrígelo también en Hevy.</p>' : ''}
    <div class="row" style="margin-top:14px"><button class="btn primary" id="edSave">Guardar cambios</button><span id="edDelZone"><button class="btn danger" id="edDel">Borrar sesión</button></span></div>`);
  const pnl = document.querySelector('.sheet-panel'); if (pnl) pnl.scrollTop = scroll;
}
async function saveEditor(){
  for (const e of ED.ex) for (const x of e.sets) {
    const r = toNum(x.reps), k = toNum(x.kg), es = meta(e.n).es;
    if (!r || r < 1 || r > 100 || r !== Math.round(r)) { toast(`Repeticiones no válidas en ${es}.`); return; }
    if (String(x.kg).trim() !== '' && (k == null || k < 0 || k > 500)) { toast(`Kilos no válidos en ${es}.`); return; }
    if (needsKg(e.n) && !k) { toast(`Faltan los kilos en ${es}.`); return; }
  }
  const ex = ED.ex.filter(e => e.sets.length);
  if (!ex.length) { toast('No quedan series: usa «Borrar sesión».'); return; }
  if (ED.src === 'app') {
    const a = S.app[ED.id];
    a.ex = ex.map(e => ({...e.orig, n:e.n, sets:e.sets.map(x => ({...x.orig, kg:String(x.kg).trim(), reps:String(toNum(x.reps)), t:x.t, done:true}))}));
    await IDB.put('sessions', JSON.parse(JSON.stringify(a)));
  } else {
    const h = findHevy(ED.id);
    h.s.ex = ex.map(e => ({n:e.n, s:e.sets.map(x => { const k = toNum(x.kg), r = toNum(x.reps); return x.rir != null ? [k, r, x.t, x.rir] : x.t === 'n' ? [k, r] : [k, r, x.t]; })}));
    h.s.edited = true;
    await putHevy(h.k);
  }
  ED = null; rebuild(); REC_CACHE = null; closeSheet(); render(); toast('Sesión corregida');
}
async function deleteEdited(){
  if (ED.src === 'app') { delete S.app[ED.id]; await IDB.del('sessions', ED.id); }
  else await setKv('hevyDeleted', kv('hevyDeleted', []).concat(ED.id));
  ED = null; rebuild(); REC_CACHE = null; closeSheet(); render(); toast('Sesión borrada');
}
function renderSessions(){
  const n = S.showAllSess ? 60 : 8, list = S.all.slice(0, n);
  return `<section class="card pad stack" style="gap:8px">
    <header class="row" style="justify-content:space-between"><h2>Sesiones</h2><span class="faint" style="font-size:12px">Toca una para corregirla</span></header>
    <div class="sheet-list">${list.map(s => { const sets = s.ex.reduce((a,e) => a + e.sets.length, 0);
      return `<button class="sheet-item sess-row" data-sess="${esc(s.id)}"><span><b>${esc(s.routine ? ROUTINES[s.routine].code + ' · ' + ROUTINES[s.routine].title : s.title)}</b><small>${fmtDate(s.date,{weekday:'short', day:'numeric', month:'short'})} · ${sets} series${s.src === 'hevy' ? ' · Hevy' : ''}</small></span><span class="faint">Editar ›</span></button>`; }).join('')}</div>
    ${S.all.length > 8 ? `<button class="btn ghost wide" data-allsess>${S.showAllSess ? 'Ver menos' : 'Ver más'}</button>` : ''}
  </section>`;
}

/* ---------- selector de ejercicios con el muñeco ---------- */
const PK = {mode:'add', i:null, mus:null, q:'', all:false};
function openPicker(mode, i){
  Object.assign(PK, {mode, i, mus:null, q:'', all:false});
  openSheet(`<div class="pk-head"><h3 class="sheet-t" style="margin:0">${mode === 'add' ? 'Agregar ejercicio' : 'Reemplazar ejercicio'}</h3><div class="row" style="gap:6px"><button class="btn small" data-cxnew>+ Crear</button><button class="btn small ghost" data-sheetclose>Cerrar</button></div></div>
    <input class="field" id="pkQ" placeholder="Buscar ejercicio" autocomplete="off">
    <div class="row" style="gap:6px;margin-top:8px"><button class="chip small on" data-pkeq="gym">Material: ${esc(currentGym().name)}</button><button class="chip small" data-pkeq="all">Todo</button></div>
    <div id="pkMap" class="bodymap pk-map"></div>
    <p class="faint" id="pkHint" style="font-size:12px;margin:0 0 6px;text-align:center">Toca un músculo para filtrar</p>
    <div id="pkList" class="sheet-list"></div>`);
  drawPicker();
}
function drawPicker(){
  const cls = k => 'm ' + (PK.mus === k ? 'pk-on' : 'pk-off');
  $('#pkMap').innerHTML = `<figure>${bodySvg('front', cls, k => MUSCLES[k])}</figure><figure>${bodySvg('back', cls, k => MUSCLES[k])}</figure>`;
  $('#pkHint').textContent = PK.mus ? `${MUSCLES[PK.mus]} · toca otra vez para quitar el filtro` : 'Toca un músculo para filtrar';
  document.querySelectorAll('[data-pkeq]').forEach(b => b.classList.toggle('on', (b.dataset.pkeq === 'all') === PK.all));
  drawPickerList();
}
function drawPickerList(){
  const L = S.live, eq = currentGym().eq, q = PK.q.trim().toLowerCase();
  const inSession = new Set(L.ex.map(e => e.n));
  const custom = kv('customEx', {});
  const exc = excluded();
  const names = Object.keys(EX).filter(n => !inSession.has(n) && !exc.has(n)
    && (PK.all || hasEq(n, eq))
    && (!PK.mus || meta(n).mus.includes(PK.mus))
    && (!q || meta(n).es.toLowerCase().includes(q) || n.toLowerCase().includes(q)));
  names.sort((a,b) => history(b).length - history(a).length || meta(a).es.localeCompare(meta(b).es));
  $('#pkList').innerHTML = names.length ? names.map(n => { const h = history(n).length, m = meta(n);
    return `<button class="sheet-item pk-item" data-pkpick="${esc(n)}"><span><b>${esc(m.es)}</b><small>${m.mus.map(x => MUSCLES[x]).join(' · ')}${custom[n] ? ' · propio' : ''}</small></span><span class="faint" style="font-size:12px;white-space:nowrap">${h ? h + ' sesiones' : 'nuevo'}</span></button>`; }).join('')
    : `<p class="muted" style="text-align:center;margin:12px 0">No hay ejercicios con este filtro${PK.all ? '' : ' y el material de este gimnasio. Prueba con “Todo”'}.</p>`;
}
function pickExercise(n){
  const L = S.live;
  if (PK.mode === 'add') L.ex.push(exEntry(n));
  else { const old = L.ex[PK.i]; L.ex[PK.i] = {...exEntry(n), ss: old.ss || null}; }
  scheduleSave(); closeSheet(true);
  if (PK.mode === 'add') setTimeout(() => { const c = document.querySelectorAll('.ex'); if (c.length) c[c.length-1].scrollIntoView({block:'start', behavior:'smooth'}); }, 60);
}
function addWarmups(i){
  const e = S.live.ex[i];
  if (e.sets.some(s => s.t === 'w')) { toast('Este ejercicio ya tiene series de calentamiento.'); return; }
  e.sets.unshift(newSet('w'), newSet('w'));
  scheduleSave(); closeSheet(true);
}
function setSuperset(i, k){
  const L = S.live, a = L.ex[i], b = L.ex[k];
  const used = new Set(L.ex.map(e => e.ss).filter(Boolean));
  const id = a.ss || b.ss || 'ABCDEFGH'.split('').find(x => !used.has(x));
  a.ss = id; b.ss = id;
  // juntar los del grupo seguidos, en la posición del primero
  const members = L.ex.filter(e => e.ss === id), first = L.ex.findIndex(e => e.ss === id);
  const rest = L.ex.filter(e => e.ss !== id);
  rest.splice(first, 0, ...members);
  L.ex = rest;
  scheduleSave(); closeSheet(true);
}

async function finishSession(){
  const L = S.live;
  const done = L.ex.flatMap(e => e.sets.filter(s => s.done && toNum(s.reps) && s.t !== 'w').map(s => ({n:e.n, kg:toNum(s.kg), reps:toNum(s.reps)})));
  if (!done.length) { toast('Marca al menos una serie como hecha (✓) antes de terminar.'); return; }
  const prs = [];
  for (const e of L.ex) {
    const today = e.sets.filter(s => s.done && toNum(s.reps) && !['w','d','x'].includes(s.t)).map(s => setVal(e.n, toNum(s.kg), toNum(s.reps), new Date())).filter(v => v.kg).map(v => v.v);
    if (!today.length) continue;
    const prevBest = Math.max(0, ...history(e.n).map(h => h.best.kg ? h.best.v : 0));
    const best = Math.max(...today);
    if (prevBest && best > prevBest) prs.push({n:e.n, v:best, prev:prevBest});
  }
  L.status = 'done'; L.end = Date.now();
  L.ex = L.ex.filter(e => e.sets.some(s => s.done));
  clearTimeout(saveTimer);
  await IDB.put('sessions', JSON.parse(JSON.stringify(L)));
  S.app[L.id] = L;
  S.lastDone = {id:L.id, title:L.title, code:L.routine ? ROUTINES[L.routine].code : 'Libre', mins:Math.round((L.end-L.start)/60000), sets:done.length,
    tonnage:done.reduce((a,x) => a + (x.kg||0)*x.reps, 0), prs};
  S.live = null; rebuild(); keepAwake(false); stopRest();
  render(); window.scrollTo({top:0});
}
function renderSummary(){
  const s = S.lastDone;
  return `<section class="card pad stack summary">
    <div class="eyebrow">Entreno guardado</div>
    <div class="big">${esc(s.code)} · ${esc(s.title)}</div>
    <div class="kv"><div><b>${s.mins}</b><span>minutos</span></div><div><b>${s.sets}</b><span>series</span></div><div><b>${Math.round(s.tonnage).toLocaleString('es-ES')}</b><span>kg movidos</span></div></div>
    ${s.prs.length ? `<div><div class="eyebrow" style="margin-bottom:6px">Récords de hoy (1RM estimado)</div>${s.prs.map(p => `<div class="pr"><b>${esc(meta(p.n).es)}</b><span class="num">${fmt1(p.v)} kg · antes ${fmt1(p.prev)}</span></div>`).join('')}</div>` : '<p class="muted" style="margin:0">Hoy no hubo récords de 1RM estimado. Sigue sumando repeticiones.</p>'}
    <div class="row"><button class="btn primary" data-tab="prog">Ver progreso</button><button class="btn ghost" id="reopen">Reabrir</button><button class="btn ghost" id="closeSum">Cerrar</button></div>
  </section>`;
}

/* ---------- descanso + pantalla encendida ---------- */
let restT = null, audio = null, wake = null;
function beep(f=880, d=.2, w=0){ try{ audio = audio || new (window.AudioContext||window.webkitAudioContext)(); const o = audio.createOscillator(), g = audio.createGain(); o.frequency.value = f; o.connect(g); g.connect(audio.destination); const t = audio.currentTime + w; g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.35,t+.02); g.gain.exponentialRampToValueAtTime(.0001,t+d); o.start(t); o.stop(t+d+.02); }catch(e){} }
async function keepAwake(on){ try{ if (on && 'wakeLock' in navigator && !wake) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } if (!on && wake){ await wake.release(); wake = null; } }catch(e){} }
function startRest(secs){
  beep(0,.001);
  if (restT) clearInterval(restT.iv);
  restT = {end: Date.now() + secs*1000, total: secs};
  $('#rest').classList.remove('end');
  drawRest(); restT.iv = setInterval(drawRest, 250);
}
function stopRest(){ if (restT) clearInterval(restT.iv); restT = null; const el = $('#rest'); el.hidden = true; el.classList.remove('end'); }
function drawRest(){
  if (!restT) return;
  const left = Math.ceil((restT.end - Date.now())/1000), el = $('#rest');
  el.hidden = false;
  const pct = Math.max(0, Math.min(100, 100 * (1 - left / restT.total)));
  if (left <= 0) {
    if (!restT.rang) { restT.rang = true; beep(988,.2); beep(1319,.35,.22); el.classList.add('end'); setTimeout(() => { if (restT && restT.rang) stopRest(); }, 4000); }
    el.innerHTML = `<div class="rbar" role="timer"><i style="width:100%"></i><div class="rrow"><span class="rlabel">Descanso terminado</span><b>¡A por la serie!</b><button class="rbtn primary" data-r="x">Cerrar</button></div></div>`; return;
  }
  if (left <= 3 && restT.lastBeep !== left) { restT.lastBeep = left; beep(660,.08); }
  el.innerHTML = `<div class="rbar" role="timer"><i style="width:${pct}%"></i><div class="rrow"><button class="rbtn" data-r="-15">−15</button><b>${Math.floor(left/60)}:${pad(left%60)}</b><button class="rbtn" data-r="15">+15</button><button class="rbtn primary" data-r="x">Omitir</button></div></div>`;
}
$('#rest').addEventListener('click', e => {
  if (e.target.closest('[data-hold]') && HOLD) return finishHold((Date.now() - HOLD.start) / 1000);
  const b = e.target.closest('[data-r]'); if (!b || !restT) return;
  if (b.dataset.r === 'x') return stopRest();
  restT.end += (+b.dataset.r)*1000; restT.total = Math.max(restT.total + (+b.dataset.r), 1); drawRest();
});
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.live) keepAwake(true); });

/* =====================================================================
   PROGRESO
   ===================================================================== */
function renderProgress(){
  if (!S.all.length) return `<div class="card empty"><h2>Aún no hay datos</h2><p>Importa tu historial de Hevy en Más, o termina tu primer entreno.</p><button class="btn primary" data-tab="more">Importar historial</button></div>`;
  const now = new Date(), w0 = weekStart(now);
  const weeks = []; for (let i=25;i>=0;i--){ const d = new Date(w0); d.setDate(d.getDate()-7*i); weeks.push({d, n:0}); }
  const musc = {}; for (const k in MUSCLES) musc[k] = 0;
  const cut4 = new Date(w0); cut4.setDate(cut4.getDate()-21);
  const d7 = new Date(now - 7*864e5), d14 = new Date(now - 14*864e5);
  let tonW = 0, tonPrev = 0;
  for (const s of S.all) {
    const wk = weeks.find(w => +w.d === +weekStart(s.date)); if (wk) wk.n++;
    for (const e of s.ex) {
      const work = e.sets.filter(x => x.type !== 'w');
      if (s.date >= cut4) meta(e.n).mus.forEach((mu,i) => { if (mu in musc) musc[mu] += work.length * (i === 0 ? 1 : .5); });
      const ton = work.reduce((a,x) => a + (x.kg||0)*x.reps, 0);
      if (s.date >= d7) tonW += ton; else if (s.date >= d14) tonPrev += ton;
    }
  }
  const last4 = weeks.slice(-4).reduce((a,w) => a+w.n, 0);
  const avg26 = weeks.reduce((a,w) => a+w.n, 0)/26;
  const prs = recentPRs(60);
  const freq = Object.entries(S.all.reduce((c,s) => { for (const e of s.ex) c[e.n] = (c[e.n]||0)+1; return c; }, {})).filter(([n]) => !SKIP.has(n)).sort((a,b) => b[1]-a[1]);
  if (!S.exSel || !freq.some(([n]) => n === S.exSel)) S.exSel = freq[0] && freq[0][0];
  const delta = tonPrev ? Math.round((tonW/tonPrev - 1)*100) : null;
  S.weeks = weeks;
  return `<div class="stack">
    <div class="tiles">
      <div class="card tile"><span class="l">Últimas 4 semanas</span><span class="v">${last4}</span><span class="d" style="color:${last4>=12?'var(--good)':'var(--muted)'}">${fmt1(last4/4)} por semana · meta 4</span></div>
      <div class="card tile"><span class="l">kg movidos en 7 días</span><span class="v">${fmt1(tonW/1000)}<small style="font-size:14px;font-weight:600"> t</small></span><span class="d muted">${delta==null?'sin datos previos':(delta>=0?'+':'')+delta+' % vs 7 días previos'}</span></div>
      <div class="card tile"><span class="l">Récords (60 días)</span><span class="v">${prs.length}</span><span class="d muted">1RM estimado</span></div>
    </div>
    ${renderAdvice()}
    <section class="card chart-card">
      <header><h2>Constancia</h2><p>Sesiones por semana · media ${fmt1(avg26)} en 6 meses</p></header>
      <div class="chart" id="chWeeks"></div>
    </section>
    <section class="card chart-card">
      <header><h2>Series por músculo</h2><p>Media semanal, 4 semanas · apoyo = 0,5</p></header>
      <div class="legend"><span><i style="background:var(--accent)"></i>Tus series</span><span><i style="background:var(--good-soft);border:1px solid var(--good)"></i>Zona útil 10-20</span></div>
      <div class="mus">${Object.entries(musc).sort((a,b) => b[1]-a[1]).map(([k,v]) => { const avg = v/4, max = 24;
        return `<div class="mus-row"><span>${MUSCLES[k]}</span><div class="bar"><div class="zone" style="left:${10/max*100}%;width:${10/max*100}%"></div><div class="fill" style="width:${Math.min(100,avg/max*100)}%"></div></div><span class="v">${fmt1(avg)}</span></div>`; }).join('')}</div>
    </section>
    <section class="card chart-card">
      <header><h2>Por ejercicio</h2></header>
      <label class="eyebrow" for="exPick" style="margin-bottom:-4px">Ejercicio</label>
      <select class="big" id="exPick">${freq.map(([n,c]) => `<option value="${esc(n)}" ${n===S.exSel?'selected':''}>${esc(meta(n).es)} · ${c} sesiones</option>`).join('')}</select>
      <div id="exDetail"></div>
    </section>
    <section class="card chart-card">
      <header><h2>Récords recientes</h2><p>Último récord de 1RM estimado por ejercicio, 60 días</p></header>
      <div class="prs">${prs.length ? prs.slice(0,8).map(p => `<div class="pr"><div><b>${esc(meta(p.n).es)}</b><br><span>${fmtDate(p.date,{day:'numeric',month:'long'})} · ${fmtKg(p.kg)} kg${p.bwl ? ' (tu peso + lastre)' : ''} × ${p.reps}</span></div><b class="num">${fmt1(p.v)} kg</b></div>`).join('') : '<p class="muted" style="margin:0">Sin récords en los últimos 60 días.</p>'}</div>
    </section>
    ${renderCardio()}
    ${renderCalendar()}
    ${renderLibrary()}
  </div>`;
}
function recentPRs(days){
  const cut = new Date(); cut.setDate(cut.getDate()-days);
  const names = new Set(); for (const s of S.all) for (const e of s.ex) names.add(e.n);
  const latest = new Map();
  for (const n of names) {
    const h = history(n).filter(x => x.best.kg).slice().reverse(); let best = 0;
    for (const x of h) { if (x.best.v > best) { if (best && x.date >= cut) latest.set(n, {n, date:x.date, v:x.best.v, kg:x.best.kg, reps:x.best.reps, bwl:x.best.bwl}); best = x.best.v; } }
  }
  return [...latest.values()].sort((a,b) => b.date - a.date);
}
function drawExDetail(){
  const box = $('#exDetail'); if (!box || !S.exSel) return;
  const n = S.exSel, m = meta(n), h = history(n);
  if (!h.length) { box.innerHTML = ''; return; }
  const bw = !h.some(x => x.best.kg), u = m.time ? 's' : 'reps', bwl = h.some(x => x.best.bwl);
  const pts = h.slice(0, 40).reverse().map(x => ({x:x.date, y: bw ? x.best.reps : Math.round(x.best.v*10)/10, label: bw ? `${x.best.reps} ${u}` : `${fmtKg(x.best.kg)} kg${x.best.bwl ? ' (peso + lastre)' : ''} × ${x.best.reps}`}));
  const best = h.reduce((a,x) => !a || x.best.v > a.best.v ? x : a, null);
  const heavy = bw ? null : Math.max(...h.flatMap(x => x.sets.map(s => s.kg||0)));
  const cut = new Date(); cut.setDate(cut.getDate()-56);
  const recent = h.filter(x => x.date >= cut);
  const trend = recent.length >= 2 ? Math.round((recent[0].best.v / recent[recent.length-1].best.v - 1)*100) : null;
  const knees = h.slice(0,3).flatMap(x => x.sets.map(s => s.knee)).filter(k => k != null);
  const sg = suggest(n);
  box.innerHTML = `
    <div class="chart" id="chEx"></div>
    <div class="stats">
      <div><b>${bw ? best.best.reps+' '+u : fmt1(best.best.v)+' kg'}</b><span>${bw?'Mejor serie':'Mejor 1RM estimado'} · ${fmtDate(best.date,{month:'short',year:'2-digit'})}</span></div>
      <div><b>${bw ? '—' : fmtKg(heavy)+' kg'}</b><span>${bwl ? 'Lastre más alto' : 'Peso más alto usado'}</span></div>
      <div><b style="color:${trend==null?'inherit':trend>0?'var(--good)':trend<0?'var(--warn)':'inherit'}">${trend==null?'—':(trend>0?'+':'')+trend+' %'}</b><span>Tendencia 8 semanas</span></div>
      <div><b>${knees.length ? fmt1(knees.reduce((a,b)=>a+b,0)/knees.length)+'/10' : '—'}</b><span>Rodilla (últimas 3)${m.knee?'':' · no aplica'}</span></div>
    </div>
    <div class="sugg ${sg.tone}"><span class="tag">${sg.tag}</span><p>${sg.text}</p></div>
    <div style="overflow-x:auto"><table class="hist"><thead><tr><th>Fecha</th><th>Series</th><th>${bw?'Mejor':'1RM est.'}</th></tr></thead><tbody>
      ${h.slice(0,8).map(x => `<tr data-sess="${esc(x.id)}"><td>${fmtDate(x.date)}${x.src==='app'?'':' <span class="faint">· Hevy</span>'}</td><td>${esc(setsText(x.sets, m.time))}</td><td>${bw ? x.best.reps : fmt1(x.best.v)}</td></tr>`).join('')}
    </tbody></table></div>`;
  lineChart($('#chEx'), [{pts, color:'var(--accent)', line:true, area:true}], bw ? u : 'kg',
    p => `<b>${fmtKg(p.y)} ${bw?u:'kg'}</b><br>${fmtDate(p.x,{day:'numeric',month:'short',year:'2-digit'})} · ${esc(p.label)}`);
}

/* ---------- gráficas SVG ---------- */
function niceTicks(min, max, count=4){
  if (min === max) { min -= 1; max += 1; }
  const span = max - min, raw = span / count, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1,2,2.5,5,10].map(s => s*mag).find(s => span/s <= count) || 10*mag;
  const lo = Math.floor(min/step)*step, hi = Math.ceil(max/step)*step, t = [];
  for (let v = lo; v <= hi + step/2; v += step) t.push(Math.round(v*100)/100);
  return t;
}
function attachTip(wrap, svg, items, W, fmt){
  const tip = document.createElement('div'); tip.className = 'tip'; tip.hidden = true; wrap.appendChild(tip);
  const marker = svg.querySelector('[data-hover]');
  const move = ev => {
    const r = svg.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * W;
    let best = items[0]; for (const it of items) if (Math.abs(it.px - x) < Math.abs(best.px - x)) best = it;
    tip.hidden = false; tip.innerHTML = fmt(best);
    const sx = best.px / W * r.width, sy = best.py / svg.viewBox.baseVal.height * r.height;
    tip.style.left = Math.max(70, Math.min(r.width - 70, sx)) + 'px'; tip.style.top = (sy - 10) + 'px';
    if (marker) { marker.setAttribute('cx', best.px); marker.setAttribute('cy', best.py); marker.style.display = ''; }
    if (best.bar) svg.querySelectorAll('[data-i]').forEach(b => b.style.opacity = b.dataset.i == best.i ? 1 : .55);
  };
  const leave = () => { tip.hidden = true; if (marker) marker.style.display = 'none'; svg.querySelectorAll('[data-i]').forEach(b => b.style.opacity = 1); };
  svg.addEventListener('pointermove', move); svg.addEventListener('pointerdown', move); svg.addEventListener('pointerleave', leave);
}
/* series: [{pts:[{x:Date,y,label}], color, line, area, dots}] — la última serie es la que recibe el tooltip */
function lineChart(wrap, series, unit, fmtTip){
  if (!wrap) return;
  const all = series.flatMap(s => s.pts);
  if (all.length < 2) { wrap.innerHTML = '<p class="muted" style="margin:0;font-size:14px">Hacen falta al menos 2 registros para dibujar la gráfica.</p>'; return; }
  const W = 340, H = 170, L = 34, R = 12, T = 12, B = 22;
  const ys = all.map(p => p.y), ticks = niceTicks(Math.min(...ys), Math.max(...ys));
  const y0 = ticks[0], y1 = ticks[ticks.length-1];
  const xs = all.map(p => +p.x), x0 = Math.min(...xs), x1 = Math.max(...xs);
  const X = d => L + ((+d - x0) / (x1 - x0 || 1)) * (W - L - R);
  const Y = v => T + (1 - (v - y0) / (y1 - y0)) * (H - T - B);
  const months = []; const d = new Date(new Date(x0).getFullYear(), new Date(x0).getMonth()+1, 1);
  while (+d <= x1) { months.push(new Date(d)); d.setMonth(d.getMonth()+1); }
  const every = Math.max(1, Math.ceil(months.length / 5));
  let body = '';
  for (const s of series) {
    const it = s.pts.map(p => ({...p, px:X(p.x), py:Y(p.y)})); s.items = it;
    if (s.line && it.length > 1) {
      const path = it.map((p,i) => `${i?'L':'M'}${p.px.toFixed(1)},${p.py.toFixed(1)}`).join('');
      if (s.area) body += `<path d="${path}L${it[it.length-1].px.toFixed(1)},${H-B}L${it[0].px.toFixed(1)},${H-B}Z" fill="${s.color}" fill-opacity=".10"/>`;
      body += `<path d="${path}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
      const lp = it[it.length-1]; body += `<circle cx="${lp.px}" cy="${lp.py}" r="4.5" fill="${s.color}" stroke="var(--surface)" stroke-width="2"/>`;
    }
    if (s.dots) body += it.map(p => `<circle cx="${p.px}" cy="${p.py}" r="3" fill="${s.color}"/>`).join('');
  }
  wrap.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfica de evolución en ${unit}">
    ${ticks.map(t => `<line x1="${L}" x2="${W-R}" y1="${Y(t)}" y2="${Y(t)}" stroke="var(--line)" stroke-width="1"/><text x="${L-6}" y="${Y(t)+3}" text-anchor="end">${fmtKg(t)}</text>`).join('')}
    ${months.length >= 2 ? months.filter((_,i) => i % every === 0).map(mo => `<text x="${X(mo)}" y="${H-6}" text-anchor="middle">${fmtDate(mo,{month:'short'})}</text>`).join('')
      : `<text x="${L}" y="${H-6}" text-anchor="start">${fmtDate(new Date(x0))}</text><text x="${W-R}" y="${H-6}" text-anchor="end">${fmtDate(new Date(x1))}</text>`}
    ${body}
    <circle data-hover r="5" fill="${series[series.length-1].color}" stroke="var(--surface)" stroke-width="2" style="display:none"/>
    <rect x="${L}" y="0" width="${W-L-R}" height="${H}" fill="transparent"/>
  </svg>`;
  attachTip(wrap, wrap.querySelector('svg'), series[series.length-1].items, W, fmtTip);
}
function weeksChart(wrap){
  if (!wrap || !S.weeks) return;
  const weeks = S.weeks, W = 340, H = 150, L = 22, R = 6, T = 10, B = 22;
  const maxY = Math.max(5, ...weeks.map(w => w.n));
  const Y = v => T + (1 - v/maxY) * (H - T - B);
  const slot = (W - L - R) / weeks.length, bw = Math.min(10, slot - 2);
  const items = weeks.map((w,i) => ({...w, i, bar:true, px: L + slot*i + slot/2, py: Y(w.n)}));
  const ticks = [0, 2, 4].concat(maxY > 5 ? [maxY] : []);
  const bar = it => { const h = Y(0) - it.py, r = Math.min(4, h/2, bw/2), x = it.px - bw/2;
    return `<path data-i="${it.i}" d="M${x.toFixed(1)},${Y(0)}V${(it.py+r).toFixed(1)}q0,${-r} ${r},${-r}H${(x+bw-r).toFixed(1)}q${r},0 ${r},${r}V${Y(0)}Z" fill="var(--accent)"/>`; };
  wrap.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Sesiones por semana, últimas 26 semanas">
    ${ticks.map(t => `<line x1="${L}" x2="${W-R}" y1="${Y(t)}" y2="${Y(t)}" stroke="var(--line)" stroke-width="1"/><text x="${L-6}" y="${Y(t)+3}" text-anchor="end">${t}</text>`).join('')}
    <line x1="${L}" x2="${W-R}" y1="${Y(4)}" y2="${Y(4)}" stroke="var(--good)" stroke-width="1.5"/>
    <text x="${W-R}" y="${Y(4)-4}" text-anchor="end" style="fill:var(--good)">meta 4</text>
    ${items.filter(it => it.n).map(bar).join('')}
    ${items.filter((_,i) => i % 5 === 0).map(it => `<text x="${it.px}" y="${H-6}" text-anchor="middle">${fmtDate(it.d)}</text>`).join('')}
    <rect x="${L}" y="0" width="${W-L-R}" height="${H}" fill="transparent"/>
  </svg>`;
  attachTip(wrap, wrap.querySelector('svg'), items, W, it => `<b>${it.n} ${it.n===1?'sesión':'sesiones'}</b><br>semana del ${fmtDate(it.d)}`);
}

/* =====================================================================
   RECUPERACIÓN (mapa del cuerpo)
   ===================================================================== */
function bodySvg(side, cls, tip){
  const c = cls, m = (k, shape) => shape.replace('<', `<g data-mus="${k}" class="${c(k)}"><title>${esc(tip(k))}</title><`) + '</g>';
  const base = `<circle class="base" cx="50" cy="16" r="10"/><rect class="base" x="45" y="25" width="10" height="7" rx="3"/>
    <ellipse class="base" cx="20" cy="88" rx="5" ry="12"/><ellipse class="base" cx="80" cy="88" rx="5" ry="12"/>
    <ellipse class="base" cx="41" cy="173" rx="6" ry="18"/><ellipse class="base" cx="59" cy="173" rx="6" ry="18"/>`;
  if (side === 'front') return `<svg viewBox="0 0 100 200" aria-label="Vista frontal">${base}
    ${m('ho','<ellipse cx="28" cy="40" rx="8" ry="7"/>')}${m('ho','<ellipse cx="72" cy="40" rx="8" ry="7"/>')}
    ${m('pe','<path d="M36 34h13v20c-6 2-10 1-13-2z"/>')}${m('pe','<path d="M64 34H51v20c6 2 10 1 13-2z"/>')}
    ${m('bi','<ellipse cx="23" cy="63" rx="5.5" ry="11"/>')}${m('bi','<ellipse cx="77" cy="63" rx="5.5" ry="11"/>')}
    ${m('co','<rect x="39" y="57" width="22" height="36" rx="6"/>')}
    ${m('cu','<ellipse cx="41" cy="125" rx="8.5" ry="24"/>')}${m('cu','<ellipse cx="59" cy="125" rx="8.5" ry="24"/>')}
    ${m('ad','<ellipse cx="50" cy="112" rx="2.6" ry="11"/>')}
  </svg>`;
  return `<svg viewBox="0 0 100 200" aria-label="Vista trasera">${base}
    ${m('ho','<ellipse cx="28" cy="40" rx="8" ry="7"/>')}${m('ho','<ellipse cx="72" cy="40" rx="8" ry="7"/>')}
    ${m('es','<path d="M36 33h28l-3 40c-3 6-19 6-22 0z"/>')}
    ${m('tr','<ellipse cx="23" cy="63" rx="5.5" ry="11"/>')}${m('tr','<ellipse cx="77" cy="63" rx="5.5" ry="11"/>')}
    ${m('co','<rect x="41" y="76" width="18" height="16" rx="5"/>')}
    ${m('gl','<ellipse cx="43" cy="103" rx="8" ry="9"/>')}${m('gl','<ellipse cx="57" cy="103" rx="8" ry="9"/>')}
    ${m('fe','<ellipse cx="41" cy="132" rx="8" ry="19"/>')}${m('fe','<ellipse cx="59" cy="132" rx="8" ry="19"/>')}
    ${m('ge','<ellipse cx="41" cy="168" rx="6.5" ry="13"/>')}${m('ge','<ellipse cx="59" cy="168" rx="6.5" ry="13"/>')}
  </svg>`;
}
function renderRecovery(){
  if (!S.all.length) return `<div class="card empty"><h2>Sin entrenos todavía</h2><p>El mapa se calcula con tus series de los últimos 4 días.</p></div>`;
  const rec = recoveryCached(), nx = nextRoutine();
  const rows = Object.keys(MUSCLES).sort((a,b) => rec[a].pct - rec[b].pct).map(k => {
    const r = rec[k];
    return `<div class="rec" data-mus="${k}"><div><b style="text-align:left">${MUSCLES[k]}</b><small>${r.pct >= 90 ? 'Listo para entrenar' : `Listo en ~${r.readyH < 24 ? r.readyH+' h' : fmt1(r.readyH/24)+' días'}`}</small></div><span class="pill ${recClass(r.pct)}">${recLabel(r.pct)}</span><b>${r.pct} %</b></div>`;
  }).join('');
  const last = S.all[0];
  return `<div class="stack">
    <section class="card pad stack">
      <div class="bodymap"><figure>${bodySvg('front', k => `m c-${recClass(rec[k].pct)}`, k => `${MUSCLES[k]} ${rec[k].pct} %`)}<figcaption>Frente</figcaption></figure><figure>${bodySvg('back', k => `m c-${recClass(rec[k].pct)}`, k => `${MUSCLES[k]} ${rec[k].pct} %`)}<figcaption>Espalda</figcaption></figure></div>
      <div class="legend"><span><i style="background:var(--good)"></i>Listo · 80-100 %</span><span><i style="background:var(--warn)"></i>Recuperando · 50-79 %</span><span><i style="background:var(--bad)"></i>Cargado · menos de 50 %</span></div>
      <p class="muted" id="recSel" style="margin:0;font-size:13px">Toca un músculo para ver su estado. Última sesión: ${esc(last.title)}, ${ago(last.date)}.</p>
    </section>
    <section class="card pad">
      <div class="eyebrow" style="margin-bottom:6px">Lo que toca</div>
      <p style="margin:0 0 4px"><b>${ROUTINES[nx.key].code} · ${esc(ROUTINES[nx.key].title)}</b></p>
      <p class="muted" style="margin:0;font-size:14px">${esc(nx.why)}</p>
      <div class="row" style="margin-top:10px">${ORDER.map(k => `<span class="pill ${recClass(nx.ready[k])}">${ROUTINES[k].code} ${nx.ready[k]} %</span>`).join('')}</div>
    </section>
    <section class="card pad"><div class="rec-list">${rows}</div></section>
    <p class="faint" style="font-size:12px;margin:0">Cálculo orientativo: cada serie de trabajo carga sus músculos principales y la carga se recupera en 2-3 días según el músculo. Si notas agujetas fuertes o la rodilla cargada, manda lo que sientes.</p>
  </div>`;
}

/* =====================================================================
   CUERPO: peso, medidas y fotos
   ===================================================================== */
const GOALS = {
  recomp:{lab:'Recomposición', txt:'Peso estable o bajando muy poco; lo que manda es la cintura', lo:-0.35, hi:0.1},
  cut:{lab:'Perder grasa', txt:'Bajar 0,25-0,5 kg por semana', lo:-0.6, hi:-0.25},
  keep:{lab:'Mantener', txt:'Peso estable (±0,15 kg por semana)', lo:-0.15, hi:0.15},
  gain:{lab:'Ganar músculo', txt:'Subir 0,1-0,3 kg por semana', lo:0.1, hi:0.35}
};
function movingAvg(list, days=7){
  return list.map(p => { const from = +p.x - (days-1)*864e5; const win = list.filter(q => +q.x >= from && +q.x <= +p.x); return {x:p.x, y:Math.round(win.reduce((a,q) => a+q.y, 0)/win.length*10)/10, label:`media de ${win.length} días`}; });
}
function renderBody(){
  const today = dayKey(new Date()), t = S.body.find(b => b.id === today) || {};
  const W = S.body.filter(b => b.weight).map(b => ({x:parseIso(b.id), y:b.weight, label:'peso del día'}));
  const avg = movingAvg(W);
  let stats = '';
  if (W.length) {
    const last = avg[avg.length-1].y;
    const a28 = avg.filter(p => +p.x <= Date.now() - 28*864e5); const ref = a28.length ? a28[a28.length-1].y : avg[0].y;
    const weeksSpan = a28.length ? 4 : Math.max(1, (Date.now() - +avg[0].x) / (7*864e5));
    const rate = (last - ref) / weeksSpan;
    const G = GOALS[kv('goal','recomp')] || GOALS.recomp, gk = kv('goal','recomp');
    const rateTxt = rate >= G.lo && rate <= G.hi ? 'en tu objetivo' : rate < G.lo ? (gk === 'gain' ? 'bajando' : 'demasiado rápido') : (gk === 'cut' ? 'sin bajar' : gk === 'recomp' ? 'subiendo: mira la cintura' : gk === 'gain' ? 'demasiado rápido' : 'subiendo');
    stats = `<div class="stats"><div><b>${fmt1(last)} kg</b><span>Media 7 días</span></div><div><b>${(rate>0?'+':'')+fmt1(rate)} kg/sem</b><span>Ritmo · ${rateTxt}</span></div></div>`;
  }
  const waist = S.body.filter(b => b.waist).map(b => ({x:parseIso(b.id), y:b.waist, label:'cintura'}));
  const gk = kv('goal','recomp'), G = GOALS[gk] || GOALS.recomp;
  let waistStats = '';
  if (waist.length >= 2) { const last = waist[waist.length-1], old = waist.filter(p => +p.x <= +last.x - 28*864e5); const ref = old.length ? old[old.length-1] : waist[0];
    const d = last.y - ref.y, wk = Math.max(1, Math.round((+last.x - +ref.x) / (7*864e5)));
    waistStats = `<div class="stats"><div><b>${fmt1(last.y)} cm</b><span>Última medida</span></div><div><b style="color:${d < 0 ? 'var(--good)' : d > 0.5 ? 'var(--warn)' : 'inherit'}">${(d > 0 ? '+' : '') + fmt1(d)} cm</b><span>En ${wk} ${wk === 1 ? 'semana' : 'semanas'}</span></div></div>`; }
  const waistCard = `<section class="card chart-card"><header><h2>Cintura${gk === 'recomp' ? ' · tu indicador principal' : ''}</h2><p>Si baja aunque el peso no se mueva, es recomposición</p></header>${waist.length ? '<div class="chart" id="chWaist"></div>' + waistStats : '<p class="muted" style="margin:0;font-size:14px">Mide la cintura a la altura del ombligo una vez por semana y aparecerá aquí.</p>'}</section>`;
  const poses = ['frente','perfil','espalda'];
  const cmpList = S.photos.filter(p => p.pose === S.cmp.pose);
  const a = cmpList.find(p => p.id === S.cmp.a) || cmpList[0], b = cmpList.find(p => p.id === S.cmp.b) || cmpList[cmpList.length-1];
  return `<div class="stack">
    <section class="card pad stack" style="gap:12px">
      <h2>Hoy</h2>
      <form class="form" id="bodyForm">
        <label>Peso (kg)<input class="field" id="bWeight" inputmode="decimal" placeholder="88,0" value="${t.weight ? fmtKg(t.weight) : ''}"></label>
        <label>Cintura (cm)<input class="field" id="bWaist" inputmode="decimal" placeholder="Ombligo" value="${t.waist ? fmtKg(t.waist) : ''}"></label>
        <details class="full"><summary class="muted" style="font-size:13px;cursor:pointer;padding-block:4px">Más medidas</summary>
          <div class="form" style="margin-top:8px">
            <label>Pecho (cm)<input class="field" id="bChest" inputmode="decimal" value="${t.chest ? fmtKg(t.chest) : ''}"></label>
            <label>Brazo (cm)<input class="field" id="bArm" inputmode="decimal" value="${t.arm ? fmtKg(t.arm) : ''}"></label>
            <label>Muslo (cm)<input class="field" id="bThigh" inputmode="decimal" value="${t.thigh ? fmtKg(t.thigh) : ''}"></label>
          </div></details>
        <button class="btn primary full" type="submit">Guardar</button>
      </form>
      <p class="faint" style="font-size:12px;margin:0">Pésate en ayunas, después de ir al baño. La cintura, a la altura del ombligo una vez por semana.</p>
    </section>
    ${gk === 'recomp' ? waistCard : ''}
    <section class="card chart-card">
      <header><h2>Peso corporal</h2><p>${esc(G.txt)}</p></header>
      <label class="row" style="gap:8px;font-size:14px"><span class="muted">Objetivo</span><select class="field" id="goalSel" style="flex:1;height:38px;font-size:14px">${Object.entries(GOALS).map(([k,v]) => `<option value="${k}" ${k === gk ? 'selected' : ''}>${v.lab}</option>`).join('')}</select></label>
      ${W.length ? `<div class="legend"><span><i style="background:var(--faint);border-radius:50%"></i>Peso del día</span><span><i style="background:var(--accent)"></i>Media 7 días</span></div>` : ''}
      <div class="chart" id="chWeight">${W.length ? '' : '<p class="muted" style="margin:0;font-size:14px">Apunta tu peso unos días y aparecerá la tendencia.</p>'}</div>
      ${stats}
    </section>
    ${gk === 'recomp' ? '' : waistCard}
    <section class="card pad stack" style="gap:12px">
      <header class="row" style="justify-content:space-between"><h2>Fotos</h2><span class="muted" style="font-size:13px">${S.photos.length} guardadas</span></header>
      <div class="form">
        <label>Postura<select class="field" id="phPose">${poses.map(p => `<option ${p===S.cmp.pose?'selected':''}>${p}</option>`).join('')}</select></label>
        <label>&nbsp;<span class="btn primary file-btn">Añadir foto<input type="file" id="phIn" accept="image/*" aria-label="Añadir foto de progreso"></span></label>
      </div>
      <p class="faint" style="font-size:12px;margin:0">Misma luz, misma distancia y misma hora. Una tanda cada 2-4 semanas basta. Las fotos solo se guardan en este iPhone.</p>
      ${cmpList.length >= 2 ? `
        <div class="eyebrow">Comparar · ${esc(S.cmp.pose)}</div>
        <div class="form">
          <label>Antes<select class="field" id="cmpA">${cmpList.map(p => `<option value="${p.id}" ${p.id===a.id?'selected':''}>${fmtDate(parseIso(p.date),{day:'numeric',month:'short',year:'2-digit'})}</option>`).join('')}</select></label>
          <label>Después<select class="field" id="cmpB">${cmpList.map(p => `<option value="${p.id}" ${p.id===b.id?'selected':''}>${fmtDate(parseIso(p.date),{day:'numeric',month:'short',year:'2-digit'})}</option>`).join('')}</select></label>
        </div>
        <div class="compare" id="cmpBox"><img alt="Antes" src="${photoUrl(a)}"><img class="after" alt="Después" src="${photoUrl(b)}" style="clip-path:inset(0 0 0 ${S.cmp.pos}%)"><div class="divider" style="left:${S.cmp.pos}%"></div><span class="lab" style="left:8px">Antes</span><span class="lab" style="right:8px">Después</span></div>
        <input type="range" id="cmpRange" min="0" max="100" value="${S.cmp.pos}" aria-label="Deslizar comparación">` : ''}
      ${S.photos.length ? `<div class="photos">${S.photos.slice().reverse().map(p => `<button class="ph" data-ph="${p.id}" aria-label="Foto ${esc(p.pose)} del ${esc(p.date)}"><img alt="" loading="lazy" src="${photoUrl(p)}"><span>${fmtDate(parseIso(p.date))} · ${esc(p.pose)}</span></button>`).join('')}</div>
        <div id="phAction"></div>` : ''}
    </section>
  </div>`;
}
const urlCache = new Map();
function photoUrl(p){ if (!p) return ''; if (!urlCache.has(p.id)) urlCache.set(p.id, URL.createObjectURL(p.blob)); return urlCache.get(p.id); }
async function compressImage(file){
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const max = 1400, k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth*k); c.height = Math.round(img.naturalHeight*k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return await new Promise(res => c.toBlob(b => res(b || file), 'image/jpeg', .82));
  } finally { URL.revokeObjectURL(url); }
}
function drawBodyCharts(){
  const W = S.body.filter(b => b.weight).map(b => ({x:parseIso(b.id), y:b.weight, label:'peso del día'}));
  if (W.length) lineChart($('#chWeight'), [{pts:W, color:'var(--faint)', dots:true}, {pts:movingAvg(W), color:'var(--accent)', line:true}], 'kg',
    p => `<b>${fmt1(p.y)} kg</b> media 7 días<br>${fmtDate(p.x,{day:'numeric',month:'short'})}`);
  const waist = S.body.filter(b => b.waist).map(b => ({x:parseIso(b.id), y:b.waist, label:'cintura'}));
  if (waist.length) lineChart($('#chWaist'), [{pts:waist, color:'var(--accent)', line:true, area:true}], 'cm', p => `<b>${fmt1(p.y)} cm</b><br>${fmtDate(p.x,{day:'numeric',month:'short'})}`);
}

/* =====================================================================
   MÁS: gimnasios, historial de Hevy, copia de seguridad
   ===================================================================== */
function renderMore(){
  const g = S.gymEdit;
  const backup = kv('lastBackup', 0), hevyImp = kv('lastHevy', 0);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  return `<div class="stack">
    ${standalone ? '' : `<div class="install"><b>Instálala en el iPhone:</b> en Safari pulsa Compartir → Añadir a pantalla de inicio. Así se abre a pantalla completa y funciona sin conexión.</div>`}
    <section class="card pad">
      <header class="row" style="justify-content:space-between;margin-bottom:6px"><h2>Gimnasios</h2><button class="btn small" id="gymNew">+ Nuevo</button></header>
      <p class="muted" style="margin:0 0 6px;font-size:14px">Marca el material que hay en cada sitio. Al entrenar, la app cambia los ejercicios que no se puedan hacer por otros del mismo tipo.</p>
      ${S.gyms.map(x => `<div class="gym"><div><b>${esc(x.name)}</b><br><span class="muted" style="font-size:13px">${x.eq.length} de ${Object.keys(EQUIP).length} tipos de material${x.id === currentGym().id ? ' · actual' : ''}</span></div><button class="btn small" data-gymedit="${x.id}">Editar</button></div>`).join('')}
    </section>
    ${g ? `<section class="card pad stack" id="gymForm" style="gap:12px">
      <h2>${S.gyms.some(x => x.id === g.id) ? 'Editar' : 'Nuevo'} gimnasio</h2>
      <label class="form" style="grid-template-columns:1fr"><span class="eyebrow">Nombre</span><input class="field" id="gName" value="${esc(g.name)}" placeholder="Hotel de Madrid"></label>
      <div class="row"><span class="eyebrow">Plantilla:</span><button class="btn small" data-preset="full">Gimnasio completo</button><button class="btn small" data-preset="hotel">Hotel</button><button class="btn small" data-preset="casa">Casa</button></div>
      <div class="eq">${Object.entries(EQUIP).map(([k,v]) => `<label><input type="checkbox" data-eq="${k}" ${g.eq.includes(k)?'checked':''}> ${esc(v)}</label>`).join('')}</div>
      <div class="row"><button class="btn primary" id="gymSave">Guardar</button><button class="btn ghost" id="gymCancel">Cancelar</button>${S.gyms.length > 1 && S.gyms.some(x => x.id === g.id) ? '<button class="btn danger" id="gymDel">Borrar</button>' : ''}</div>
    </section>` : ''}
    <section class="card pad stack" style="gap:10px">
      <header class="row" style="justify-content:space-between"><h2>Tus ejercicios</h2><button class="btn small" data-cxnew>+ Crear</button></header>
      <p class="muted" style="margin:0;font-size:14px">Para máquinas que no están en la lista. Aparecen en el buscador al añadir un ejercicio.</p>
      ${Object.keys(kv('customEx', {})).length ? `<div class="sheet-list">${Object.entries(kv('customEx', {})).map(([n,d]) => `<div class="sheet-item sess-row"><span><b>${esc(d[0])}</b><small>${d[1].split(' ').map(x => MUSCLES[x]).join(' · ')} · ${d[2]}-${d[3]} ${d[8] === 't' ? 's' : 'reps'}</small></span><button class="btn small ghost" data-cxdel="${esc(n)}" aria-label="Quitar">✕</button></div>`).join('')}</div>` : ''}
      <button class="btn ghost" data-plates="">🏋 Calculadora de discos</button>
    </section>
    <section class="card pad stack" style="gap:10px">
      <h2>Ejercicios que no quieres</h2>
      <p class="muted" style="margin:0;font-size:14px">La app no te los propondrá al cambiar ejercicios, en las recomendaciones ni en el buscador.</p>
      <div class="chip-row">${[...excluded()].map(n => `<button class="chip small on" data-unexcl="${esc(n)}">${esc(meta(n).es)} ✕</button>`).join('') || '<span class="faint" style="font-size:14px">Ninguno</span>'}</div>
      <select class="field" id="exclAdd"><option value="">+ Añadir ejercicio…</option>${Object.keys(EX).filter(n => !excluded().has(n)).sort((a,b) => meta(a).es.localeCompare(meta(b).es)).map(n => `<option value="${esc(n)}">${esc(meta(n).es)}</option>`).join('')}</select>
    </section>
    <section class="card pad import">
      <h2>Historial de Hevy</h2>
      <p class="muted" style="margin:0;font-size:14px">En Hevy: Perfil → Ajustes → Exportar e importar datos → Exportar entrenamientos. Guarda el archivo en Archivos y súbelo aquí. Hazlo cada dos semanas: los días que ya apuntaste en esta app no se duplican.</p>
      <span class="btn primary file-btn">Importar workouts.csv<input type="file" id="csvIn" accept=".csv,text/csv,text/comma-separated-values" aria-label="Importar workouts.csv de Hevy"></span>
      <div id="impMsg" class="muted" style="font-size:13px">${hevyImp ? 'Última importación: ' + ago(new Date(hevyImp)) + '.' : 'Aún no has importado nada.'}</div>
    </section>
    <section class="card pad import">
      <h2>Copia de seguridad</h2>
      <p class="muted" style="margin:0;font-size:14px">Tus datos viven solo en este iPhone. Si borras la app o cambias de móvil, se pierden sin copia. Guárdala en iCloud Drive (Archivos) cada dos semanas, a la vez que importas Hevy.</p>
      <div class="row"><button class="btn primary" id="bkOut">Exportar copia</button><button class="btn" id="bkOutLite">Sin fotos</button><span class="btn file-btn">Restaurar copia<input type="file" id="bkIn" accept=".json,application/json" aria-label="Restaurar copia de seguridad"></span></div>
      <div id="bkMsg" class="muted" style="font-size:13px">${backup ? 'Última copia: ' + ago(new Date(backup)) + '.' : 'Aún no has hecho ninguna copia.'}</div>
    </section>
    <p class="faint" style="font-size:12px;margin:0;text-align:center">Barra Libre · plan ${PLAN_VERSION} · ${S.all.length} sesiones · ${S.body.length} registros de cuerpo · ${S.photos.length} fotos</p>
  </div>`;
}

/* ---------- importar CSV de Hevy ---------- */
function parseCSV(text){
  const rows = []; let row = [], f = '', q = false;
  for (let i=0;i<text.length;i++){
    const c = text[i];
    if (q) { if (c === '"') { if (text[i+1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i+1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows.filter(r => r.length > 1);
}
const MONTHS = {ene:1,jan:1,feb:2,mar:3,abr:4,apr:4,may:5,jun:6,jul:7,ago:8,aug:8,sep:9,sept:9,oct:10,nov:11,dic:12,dec:12};
function hevyDate(s){
  const m = /^(\d{1,2}) ([a-zA-Zé]+)\.? (\d{4}),? (\d{1,2}):(\d{2})/.exec(s.trim());
  if (m) { const k = m[2].toLowerCase(); const mo = MONTHS[k.slice(0,4)] || MONTHS[k.slice(0,3)]; if (mo) return `${m[3]}-${pad(mo)}-${pad(m[1])}T${pad(m[4])}:${m[5]}`; }
  const d = new Date(s); return isNaN(d) ? null : isoLocal(d);
}
async function importCsv(file){
  const msg = $('#impMsg'); msg.textContent = 'Leyendo…';
  try {
    const rows = parseCSV((await file.text()).replace(/^﻿/, '')); const head = rows.shift().map(h => h.trim());
    const ix = k => head.indexOf(k);
    if (['title','start_time','exercise_title','set_type','weight_kg','reps'].some(k => ix(k) < 0)) throw new Error('Este archivo no parece el workouts.csv de Hevy.');
    const sessions = new Map(), cardioRows = new Map();
    for (const r of rows) {
      const name = r[ix('exercise_title')];
      if (CARDIO_HEVY[name]) { const d = hevyDate(r[ix('start_time')]); const min = (toNum(r[ix('duration_seconds')]) || 0) / 60, km = toNum(r[ix('distance_km')]) || 0;
        if (d && (min || km)) { const id = 'hc' + d.replace(/\D/g,'') + CARDIO_HEVY[name]; const c = cardioRows.get(id) || {id, date:d, type:CARDIO_HEVY[name], min:0, km:0}; c.min += min; c.km += km; cardioRows.set(id, c); }
        continue; }
      if (SKIP.has(name)) continue;
      let reps = toNum(r[ix('reps')]); if (!reps && meta(name).time && ix('duration_seconds') >= 0) reps = toNum(r[ix('duration_seconds')]); if (!reps) continue;
      const type = ({warmup:'w', dropset:'d', failure:'f'})[r[ix('set_type')]] || 'n'; if (type === 'w') continue;
      const date = hevyDate(r[ix('start_time')]); if (!date) continue;
      const id = 'h' + date.replace(/\D/g,'');
      if (!sessions.has(id)) sessions.set(id, {id, date, title:r[ix('title')], ex:[]});
      const s = sessions.get(id);
      let e = s.ex.find(x => x.n === name); if (!e) { e = {n:name, s:[]}; s.ex.push(e); }
      const kg = toNum(r[ix('weight_kg')]);
      const rpe = ix('rpe') >= 0 ? toNum(r[ix('rpe')]) : null, rir = rpe ? Math.max(0, Math.min(5, Math.round(10 - rpe))) : null;
      e.s.push(rir != null ? [kg, reps, type, rir] : type === 'n' ? [kg, reps] : [kg, reps, type]);
    }
    const byMonth = {}; for (const s of sessions.values()) (byMonth[s.date.slice(0,7)] ||= []).push(s);
    const cardioByMonth = {}; for (const c of cardioRows.values()) { c.min = Math.round(c.min); c.km = Math.round(c.km*100)/100; (cardioByMonth[c.date.slice(0,7)] ||= []).push(c); }
    S.hevyCardio = S.hevyCardio || {};
    for (const k of Object.keys(cardioByMonth)) { S.hevyCardio[k] = cardioByMonth[k]; if (!byMonth[k]) { S.hevy[k] = S.hevy[k] || []; await putHevy(k); } }
    for (const k of Object.keys(byMonth)) {
      const merged = new Map((S.hevy[k]||[]).map(s => [s.id, s])); for (const s of byMonth[k]) { const old = merged.get(s.id); if (old && old.edited) continue; merged.set(s.id, s); }
      const list = [...merged.values()].sort((a,b) => a.date < b.date ? -1 : 1);
      S.hevy[k] = list; await putHevy(k);
    }
    await setKv('lastHevy', Date.now());
    rebuild();
    msg.textContent = `Listo: ${sessions.size} sesiones de Hevy y ${cardioRows.size} de cardio importadas.`;
    toast(`${sessions.size} sesiones importadas`); updateStatus();
  } catch(e) { msg.textContent = (e && e.message) || 'No se pudo importar el archivo.'; }
}

/* ---------- copia de seguridad ---------- */
const blobToDataUrl = b => new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b); });
async function exportBackup(withPhotos = true){
  const msg = $('#bkMsg'); msg.textContent = 'Preparando copia…';
  const data = {app:'barralibre', v:2, photosIncluded:withPhotos, exported:isoLocal(new Date()),
    sessions:Object.values(S.app), hevy:Object.entries(S.hevy).map(([id,sessions]) => ({id,sessions})), body:S.body, gyms:S.gyms,
    kv:Object.entries(S.kv).map(([id,v]) => ({id,v})), photos:[]};
  if (withPhotos) for (const p of S.photos) data.photos.push({id:p.id, date:p.date, pose:p.pose, data: await blobToDataUrl(p.blob)});
  const name = `barralibre-${dayKey(new Date())}${withPhotos ? '' : '-sin-fotos'}.json`;
  const file = new File([JSON.stringify(data)], name, {type:'application/json'});
  try {
    if (navigator.canShare && navigator.canShare({files:[file]})) await navigator.share({files:[file], title:'Copia de Barra Libre'});
    else { const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
    await setKv('lastBackup', Date.now());
    msg.textContent = `Copia creada (${(file.size/1048576).toLocaleString('es-ES',{maximumFractionDigits:1})} MB). Guárdala en Archivos → iCloud Drive.`;
  } catch(e) { msg.textContent = e && e.name === 'AbortError' ? 'Copia cancelada.' : 'No se pudo compartir la copia.'; }
}
/* Restaurar: primero se comprueba TODO el archivo; solo si está bien y confirmas, se sustituye en una única operación */
let PENDING_RESTORE = null;
async function prepareRestore(file){
  const msg = $('#bkMsg'); msg.textContent = 'Comprobando la copia…';
  try {
    let d; try { d = JSON.parse(await file.text()); } catch(e) { throw new Error('El archivo está dañado o incompleto. No se ha tocado nada.'); }
    if (!d || d.app !== 'barralibre') throw new Error('Este archivo no es una copia de Barra Libre. No se ha tocado nada.');
    const arr = k => { if (d[k] == null) return []; if (!Array.isArray(d[k])) throw new Error(`La copia está dañada (${k}). No se ha tocado nada.`); return d[k]; };
    const sessions = arr('sessions'), hevy = arr('hevy'), body = arr('body'), gyms = arr('gyms'), kvs = arr('kv'), photos = arr('photos');
    const okId = x => x && typeof x.id === 'string' && x.id.length > 0;
    if (![sessions, hevy, body, gyms, kvs, photos].every(a => a.every(okId))) throw new Error('La copia tiene registros dañados. No se ha tocado nada.');
    if (!sessions.every(x => Array.isArray(x.ex) && typeof x.date === 'string') || !hevy.every(h => Array.isArray(h.sessions))) throw new Error('La copia tiene sesiones dañadas. No se ha tocado nada.');
    const withPhotos = d.photosIncluded !== false, blobs = [];
    if (withPhotos) for (const p of photos) {
      if (typeof p.data !== 'string' || !p.data.startsWith('data:image')) throw new Error('Una foto de la copia está dañada. No se ha tocado nada.');
      blobs.push({id:p.id, date:p.date, pose:p.pose, blob: await (await fetch(p.data)).blob()});
    }
    PENDING_RESTORE = {sessions, hevy, body, gyms, kvs, photos:blobs, withPhotos};
    const hevyN = hevy.reduce((a,h) => a + h.sessions.length, 0), appN = sessions.filter(x => x.status === 'done').length;
    msg.textContent = 'Copia comprobada. Confirma para restaurar.';
    openSheet(`<h3 class="sheet-t">¿Restaurar esta copia?</h3>
      <p style="margin:0 0 8px">Copia del ${d.exported ? fmtDate(parseIso(d.exported),{day:'numeric', month:'long', year:'numeric'}) : '(fecha desconocida)'}: <b>${appN}</b> sesiones de la app, <b>${hevyN}</b> de Hevy, <b>${body.length}</b> días de cuerpo y ${withPhotos ? `<b>${blobs.length}</b> fotos` : '<b>sin fotos</b> (se conservan las que tienes)'}.</p>
      <p class="muted" style="margin:0 0 12px;font-size:14px">Sustituye lo que hay ahora en este iPhone (${Object.values(S.app).filter(x => x.status === 'done').length} sesiones de la app${withPhotos ? `, ${S.photos.length} fotos` : ''}). Si dudas, cancela y exporta antes una copia de lo actual.</p>
      <div class="row"><button class="btn danger" id="restoreYes">Sí, restaurar</button><button class="btn ghost" data-sheetclose>Cancelar</button></div>`);
  } catch(e) { PENDING_RESTORE = null; msg.textContent = (e && e.message) || 'No se pudo leer la copia. No se ha tocado nada.'; }
}
async function applyRestore(){
  const R = PENDING_RESTORE; if (!R) return; PENDING_RESTORE = null; closeSheet();
  const msg = $('#bkMsg'); if (msg) msg.textContent = 'Restaurando…';
  const stores = R.withPhotos ? STORES : STORES.filter(x => x !== 'photos');
  try {
    await new Promise((res, rej) => {
      const tx = IDB.db.transaction(stores, 'readwrite');
      tx.oncomplete = res; tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error || new Error('Restauración cancelada'));
      try {
        for (const st of stores) tx.objectStore(st).clear();
        const put = (st, list) => { for (const x of list) tx.objectStore(st).put(x); };
        put('sessions', R.sessions); put('hevy', R.hevy); put('body', R.body); put('gyms', R.gyms); put('kv', R.kvs);
        if (R.withPhotos) put('photos', R.photos);
      } catch(err) { try { tx.abort(); } catch(_) {} rej(err); }
    });
    urlCache.clear(); S.live = null; REC_CACHE = null;
    await loadAll(); render(); toast('Copia restaurada');
  } catch(e) { if (msg) msg.textContent = 'No se pudo restaurar. Tus datos siguen como estaban.'; }
}

/* =====================================================================
   RENDER + EVENTOS
   ===================================================================== */
const TITLES = {train:'Entrenar', prog:'Progreso', rec:'Recuperación', body:'Cuerpo', more:'Más'};
function updateStatus(){ $('#sync').innerHTML = `<b>${S.all.length} sesiones</b><br>en este iPhone`; }
function render(){
  $('#today').textContent = fmtDate(new Date(), {weekday:'long', day:'numeric', month:'long'});
  document.querySelectorAll('nav.tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === S.tab));
  $('#viewTitle').textContent = S.tab === 'train' && S.live ? (S.live.routine ? ROUTINES[S.live.routine].title : 'Sesión libre') : TITLES[S.tab];
  updateStatus();
  const v = $('#view');
  if (!S.ready) { v.innerHTML = '<div class="card empty"><p>Abriendo tus datos…</p></div>'; return; }
  if (S.tab === 'train') v.innerHTML = `<div class="stack">${S.lastDone && !S.live ? renderSummary() : ''}${S.live ? renderLive() : renderPicker()}</div>`;
  if (S.tab === 'prog') { v.innerHTML = renderProgress(); weeksChart($('#chWeeks')); drawExDetail(); }
  if (S.tab === 'rec') v.innerHTML = renderRecovery();
  if (S.tab === 'body') { v.innerHTML = renderBody(); drawBodyCharts(); }
  if (S.tab === 'more') v.innerHTML = renderMore();
}
function go(tab){ S.tab = tab; S.lastDone = tab === 'train' ? S.lastDone : null; render(); window.scrollTo({top:0}); }

document.addEventListener('click', async e => {
  const t = e.target;
  const tab = t.closest('[data-tab]'); if (tab) return go(tab.dataset.tab);
  const pick = t.closest('[data-pick]'); if (pick) { S.pick = pick.dataset.pick; render(); return; }
  const gymChip = t.closest('[data-gym]'); if (gymChip) { await setKv('gym', gymChip.dataset.gym); render(); return; }
  if (t.closest('#start')) return startSession(S.pick || nextRoutine().key);
  if (t.closest('#startFree')) return startSession(null);
  if (t.closest('#closeSum')) { S.lastDone = null; render(); return; }
  /* Recuperación */
  const mus = t.closest('[data-mus]');
  if (mus && S.tab === 'rec') { const k = mus.dataset.mus, r = recoveryCached()[k]; $('#recSel').innerHTML = `<b>${MUSCLES[k]}</b>: ${r.pct} % · ${r.pct >= 90 ? 'listo para entrenar' : 'listo en ~' + (r.readyH < 24 ? r.readyH + ' h' : fmt1(r.readyH/24) + ' días')}.`; return; }
  /* Fotos */
  const ph = t.closest('[data-ph]');
  if (ph) { const p = S.photos.find(x => x.id === ph.dataset.ph);
    $('#phAction').innerHTML = `<div class="confirm" style="background:var(--raised)"><span>${fmtDate(parseIso(p.date),{day:'numeric',month:'long',year:'numeric'})} · ${esc(p.pose)}</span><button class="btn small danger" data-phdel="${p.id}">Borrar foto</button><button class="btn small ghost" data-phclose>Cerrar</button></div>`; return; }
  const phDel = t.closest('[data-phdel]');
  if (phDel) { await IDB.del('photos', phDel.dataset.phdel); S.photos = S.photos.filter(x => x.id !== phDel.dataset.phdel); render(); toast('Foto borrada'); return; }
  if (t.closest('[data-phclose]')) { $('#phAction').innerHTML = ''; return; }
  /* Gimnasios */
  const ge = t.closest('[data-gymedit]'); if (ge) { const g = S.gyms.find(x => x.id === ge.dataset.gymedit); S.gymEdit = {...g, eq:g.eq.slice()}; render(); $('#gymForm').scrollIntoView({block:'start'}); return; }
  if (t.closest('#gymNew')) { S.gymEdit = {id:uid('g'), name:'', eq:GYM_PRESETS.hotel.slice()}; render(); $('#gymForm').scrollIntoView({block:'start'}); return; }
  const pre = t.closest('[data-preset]'); if (pre && S.gymEdit) { S.gymEdit.eq = GYM_PRESETS[pre.dataset.preset].slice(); S.gymEdit.name = $('#gName').value; render(); return; }
  if (t.closest('#gymCancel')) { S.gymEdit = null; render(); return; }
  if (t.closest('#gymSave')) { const g = S.gymEdit; g.name = $('#gName').value.trim() || 'Gimnasio'; await IDB.put('gyms', g); S.gyms = S.gyms.filter(x => x.id !== g.id).concat(g); S.gymEdit = null; render(); toast('Gimnasio guardado'); return; }
  if (t.closest('#gymDel')) { const id = S.gymEdit.id; await IDB.del('gyms', id); S.gyms = S.gyms.filter(x => x.id !== id); if (kv('gym') === id) await setKv('gym', S.gyms[0].id); S.gymEdit = null; render(); return; }
  if (t.closest('#bkOut')) return exportBackup(true);
  if (t.closest('#bkOutLite')) return exportBackup(false);
  if (t.closest('#restoreYes')) return applyRestore();
  if (t.closest('#updGo')) { location.reload(); return; }
  /* Descarga, discos y ejercicios propios */
  const dlb = t.closest('[data-deload]');
  if (dlb) { if (dlb.dataset.deload === 'start') { await setKv('deloadUntil', Date.now() + 7*864e5); await setKv('lastDeload', Date.now()); toast('Descarga activada 7 días'); }
    else { await setKv('deloadUntil', 0); toast('Descarga terminada'); } render(); return; }
  const plb = t.closest('[data-plates]'); if (plb) return sheetPlates(plb.dataset.plates === '' ? null : +plb.dataset.plates);
  const pcs = t.closest('[data-pcsides]'); if (pcs) { PC.sides = +pcs.dataset.pcsides; document.querySelectorAll('[data-pcsides]').forEach(b => b.classList.toggle('on', b === pcs)); drawPlates(); return; }
  const pcp = t.closest('[data-pcplate]'); if (pcp) { const v = +pcp.dataset.pcplate; PC.plates = PC.plates.includes(v) ? PC.plates.filter(x => x !== v) : PC.plates.concat(v); await setKv('plates', PC.plates); pcp.classList.toggle('on'); drawPlates(); return; }
  if (t.closest('[data-cxnew]')) return sheetCustom();
  if (t.closest('#cxSave')) return saveCustom();
  const cxd = t.closest('[data-cxdel]'); if (cxd) { const c = {...kv('customEx', {})}; delete c[cxd.dataset.cxdel]; await setKv('customEx', c); render(); toast('Ejercicio quitado de la lista'); return; }
  /* Calendario */
  const cn = t.closest('[data-calnav]'); if (cn) { const now = new Date(), m0 = S.calM || new Date(now.getFullYear(), now.getMonth(), 1); S.calM = new Date(m0.getFullYear(), m0.getMonth() + +cn.dataset.calnav, 1); render(); return; }
  const cd = t.closest('[data-calday]');
  if (cd && !S.live) { const list = S.all.filter(x => dayKey(x.date) === cd.dataset.calday);
    if (list.length === 1) return openEditor(list[0].id);
    if (list.length > 1) { openSheet(`<h3 class="sheet-t">${fmtDate(list[0].date,{weekday:'long', day:'numeric', month:'long'})}</h3><div class="sheet-list">${list.map(x => `<button class="sheet-item sess-row" data-sess="${esc(x.id)}"><span><b>${esc(x.title)}</b><small>${x.ex.length} ejercicios${x.src === 'hevy' ? ' · Hevy' : ''}</small></span><span class="faint">Editar ›</span></button>`).join('')}</div>`); return; } }
  /* Cardio */
  if (t.closest('#cdNew')) { CD = {type:CD.type, day:0}; return sheetCardio(); }
  const cdt = t.closest('[data-cdtype]'); if (cdt) { const mn = $('#cdMin').value, km = $('#cdKm').value; CD.type = cdt.dataset.cdtype; sheetCardio(); $('#cdMin').value = mn; $('#cdKm').value = km; return; }
  const cdd = t.closest('[data-cdday]'); if (cdd) { const mn = $('#cdMin').value, km = $('#cdKm').value; CD.day = +cdd.dataset.cdday; sheetCardio(); $('#cdMin').value = mn; $('#cdKm').value = km; return; }
  if (t.closest('#cdSave')) return saveCardio();
  const cdx = t.closest('[data-cddel]'); if (cdx) { const [day, id] = cdx.dataset.cddel.split('|'); return deleteCardio(day, id); }
  /* Excluidos */
  const unx = t.closest('[data-unexcl]'); if (unx) { await setKv('excluded', [...excluded()].filter(n => n !== unx.dataset.unexcl)); render(); return; }
  /* Corregir sesiones terminadas */
  const sess = t.closest('[data-sess]'); if (sess && !S.live) return openEditor(sess.dataset.sess);
  if (t.closest('[data-allsess]')) { S.showAllSess = !S.showAllSess; render(); return; }
  if (ED) {
    const xd = t.closest('[data-edsetdel]'); if (xd) { const [i,j] = xd.dataset.edsetdel.split('-').map(Number); ED.ex[i].sets.splice(j, 1); if (!ED.ex[i].sets.length) ED.ex.splice(i, 1); drawEditor(); return; }
    const xe = t.closest('[data-edexdel]'); if (xe) { ED.ex.splice(+xe.dataset.edexdel, 1); drawEditor(); return; }
    if (t.closest('#edSave')) return saveEditor();
    if (t.closest('#edDel')) { $('#edDelZone').innerHTML = `<span class="confirm"><span>¿Borrar la sesión entera?</span><button class="btn small danger" id="edDelYes">Sí, borrar</button></span>`; return; }
    if (t.closest('#edDelYes')) return deleteEdited();
  }
  if (t.closest('#reopen')) { const s = S.lastDone && S.app[S.lastDone.id];
    if (s) { s.status = 'live'; delete s.end; S.live = s; S.lastDone = null; await IDB.put('sessions', JSON.parse(JSON.stringify(s))); rebuild(); REC_CACHE = null; keepAwake(true); render(); toast('Entreno reabierto'); }
    return; }
  const evb = t.closest('[data-ev]'); if (evb) return sheetEvidence(evb.dataset.ev);
  const evf = t.closest('[data-evf]'); if (evf) { S.evFilter = evf.dataset.evf; render(); return; }
  if (t.closest('[data-alltips]')) { S.showAllTips = !S.showAllTips; render(); return; }
  if (t.closest('[data-sheetclose]')) { ED = null; PENDING_RESTORE = null; closeSheet(!!S.live); return; }
  /* Entreno en curso */
  if (!S.live) return;
  const pkMus = t.closest('#pkMap [data-mus]'); if (pkMus) { PK.mus = PK.mus === pkMus.dataset.mus ? null : pkMus.dataset.mus; drawPicker(); return; }
  const pkEq = t.closest('[data-pkeq]'); if (pkEq) { PK.all = pkEq.dataset.pkeq === 'all'; drawPicker(); return; }
  const pkPick = t.closest('[data-pkpick]'); if (pkPick) return pickExercise(pkPick.dataset.pkpick);
  const picker = t.closest('[data-picker]'); if (picker) return openPicker('add');
  const st = t.closest('[data-stype]'); if (st) { const [i,j] = st.dataset.stype.split('-').map(Number); return sheetSetType(i, j); }
  const sty = t.closest('[data-settype]'); if (sty) { const [i,j,ty] = sty.dataset.settype.split('-'); S.live.ex[+i].sets[+j].t = ty; scheduleSave(); closeSheet(true); return; }
  const dels = t.closest('[data-delset]'); if (dels) { const [i,j] = dels.dataset.delset.split('-').map(Number); const ex = S.live.ex[i]; ex.sets.splice(j, 1); if (!ex.sets.length) ex.sets.push(newSet()); scheduleSave(); closeSheet(true); return; }
  const em = t.closest('[data-exmenu]'); if (em) return sheetExMenu(+em.dataset.exmenu);
  const act = t.closest('[data-act]');
  if (act) { const i = +act.dataset.i, a = act.dataset.act;
    if (a === 'warm') return addWarmups(i);
    if (a === 'order') return sheetOrder();
    if (a === 'replace') return openPicker('replace', i);
    if (a === 'ss') return sheetSuperset(i);
    if (a === 'unss') { const id = S.live.ex[i].ss; S.live.ex[i].ss = null; const left = S.live.ex.filter(e => e.ss === id); if (left.length === 1) left[0].ss = null; scheduleSave(); closeSheet(true); return; }
    if (a === 'del') { act.outerHTML = `<div class="confirm"><span>¿Eliminar ${esc(meta(S.live.ex[i].n).es)} de esta sesión?</span><button class="btn small danger" data-act="delyes" data-i="${i}">Sí, eliminar</button></div>`; return; }
    if (a === 'delyes') { const id = S.live.ex[i].ss; S.live.ex.splice(i, 1); if (id) { const left = S.live.ex.filter(e => e.ss === id); if (left.length === 1) left[0].ss = null; } scheduleSave(); closeSheet(true); return; }
  }
  const mv = t.closest('[data-move]'); if (mv) { const [i,d] = mv.dataset.move.split(':').map(Number); const L = S.live.ex; const k = i + d; if (k < 0 || k >= L.length) return; [L[i], L[k]] = [L[k], L[i]]; scheduleSave(); sheetOrder(); return; }
  const ssw = t.closest('[data-ssw]'); if (ssw) { const [i,k] = ssw.dataset.ssw.split(':').map(Number); return setSuperset(i, k); }
  const rc = t.closest('[data-restcfg]'); if (rc) return sheetRest(+rc.dataset.restcfg);
  const sr = t.closest('[data-setrest]'); if (sr) { const [i,sec] = sr.dataset.setrest.split(':').map(Number); await setKv('rest:' + S.live.ex[i].n, sec); closeSheet(true); toast(`Descanso de ${fmtRest(sec)} guardado`); return; }
  const nt = t.closest('[data-note]'); if (nt) return sheetNote(+nt.dataset.note);
  const sn = t.closest('[data-savenote]'); if (sn) { const n = S.live.ex[+sn.dataset.savenote].n; await setKv('note:' + n, $('#noteIn').value.trim()); closeSheet(true); return; }
  const tick = t.closest('[data-tick]');
  if (tick) {
    const row = tick.closest('.set'), i = +row.dataset.i, j = +row.dataset.j, s = S.live.ex[i].sets[j];
    if (!s.done) {
      const kgEl = row.querySelector('[data-f=kg]'), rpEl = row.querySelector('[data-f=reps]');
      if (!s.kg && toNum(kgEl.placeholder) != null) s.kg = kgEl.placeholder;
      if (!toNum(s.reps) && /^\d+$/.test(rpEl.placeholder)) s.reps = rpEl.placeholder;
      if (!toNum(s.reps)) { rpEl.focus(); toast('Escribe las repeticiones de la serie.'); return; }
      if (needsKg(S.live.ex[i].n) && !(toNum(s.kg) > 0)) { s.kg = ''; kgEl.focus(); toast('Escribe los kilos: este ejercicio usa peso.'); return; }
      s.done = true; s.at = Date.now();
      const ex = S.live.ex[i];
      const grp = ex.ss ? S.live.ex.map((x,k) => x.ss === ex.ss ? k : -1).filter(k => k >= 0) : [];
      if (grp.length > 1 && i !== grp[grp.length-1]) { stopRest(); toast(`Superserie: ahora ${meta(S.live.ex[grp[grp.indexOf(i)+1]].n).es}`); }
      else if (s.t !== 'w') startRest(Math.max(...(grp.length ? grp : [i]).map(k => restOf(S.live.ex[k].n))));
      else startRest(60);
      if (s.knee !== '' && +s.knee >= 5) toast('Rodilla en rojo: para este ejercicio o cámbialo.');
    } else s.done = false;
    row.classList.toggle('done', s.done); tick.setAttribute('aria-pressed', s.done);
    const rr = row.parentElement.querySelector('.rir'); if (rr) rr.remove();
    if (s.done && s.t !== 'w' && !meta(S.live.ex[i].n).time) row.insertAdjacentHTML('afterend', rirRow(i, j, s));
    row.querySelector('[data-f=kg]').value = s.kg; row.querySelector('[data-f=reps]').value = s.reps;
    scheduleSave(); return;
  }
  const add = t.closest('[data-add]');
  if (add) { const ex = S.live.ex[+add.dataset.add], prev = ex.sets[ex.sets.length-1]; ex.sets.push(newSet(prev && prev.t === 'w' ? 'n' : (prev ? prev.t : 'n'))); scheduleSave(); render(); return; }
  const rb = t.closest('[data-rir]');
  if (rb) { const [i,j,v] = rb.dataset.rir.split('-'); const st = S.live.ex[+i].sets[+j]; st.rir = String(st.rir) === v ? '' : v; scheduleSave();
    rb.parentElement.querySelectorAll('.rir-b').forEach(b => { const on = b.dataset.rir === rb.dataset.rir && st.rir !== ''; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); return; }
  const tmr = t.closest('[data-timer]'); if (tmr) { const [i,j] = tmr.dataset.timer.split('-').map(Number); return startHold(i, j); }
  if (t.closest('[data-addwall]')) { const e = exEntry('Wall Sit'); e.sets = e.sets.slice(0, 2); S.live.ex.unshift(e); scheduleSave(); render(); return; }
  const kn = t.closest('[data-knee]'); if (kn) { const [i,j] = kn.dataset.knee.split('-').map(Number); return sheetKnee(i, j); }
  const kset = t.closest('[data-kneeset]'); if (kset) { const [i,j,v] = kset.dataset.kneeset.split('-'); S.live.ex[+i].sets[+j].knee = v; scheduleSave(); closeSheet(true); if (v !== '' && +v >= 5) toast('Rodilla en rojo: para este ejercicio o cámbialo.'); return; }
  if (t.closest('#finish')) return sheetFinish();
  if (t.closest('#finishYes')) { closeSheet(); return finishSession(); }
  if (t.closest('#discard')) { $('#discardZone').innerHTML = `<div class="confirm"><span>¿Borrar esta sesión sin guardarla?</span><button class="btn small danger" id="discardYes">Sí, borrar</button><button class="btn small ghost" id="discardNo">Cancelar</button></div>`; return; }
  if (t.closest('#discardNo')) { $('#discardZone').innerHTML = `<button class="btn danger wide" id="discard">Descartar sesión</button>`; return; }
  if (t.closest('#discardYes')) { const id = S.live.id; S.live = null; delete S.app[id]; await IDB.del('sessions', id); stopRest(); keepAwake(false); render(); return; }
});

document.addEventListener('input', e => {
  const el = e.target;
  if (el.id === 'cmpRange') { S.cmp.pos = +el.value; const box = $('#cmpBox'); box.querySelector('.after').style.clipPath = `inset(0 0 0 ${el.value}%)`; box.querySelector('.divider').style.left = el.value + '%'; return; }
  if (el.dataset && el.dataset.eq && S.gymEdit) { const k = el.dataset.eq; S.gymEdit.eq = el.checked ? [...new Set(S.gymEdit.eq.concat(k))] : S.gymEdit.eq.filter(x => x !== k); return; }
  if (el.id === 'pkQ') { PK.q = el.value; drawPickerList(); return; }
  if (el.id === 'pcKg') { drawPlates(); return; }
  if (el.dataset && el.dataset.ed && ED) { const [i,j,f] = el.dataset.ed.split('-'); ED.ex[+i].sets[+j][f] = el.value; return; }
  const f = el.dataset && el.dataset.f; if (!f || !S.live) return;
  const row = el.closest('.set'); const s = S.live.ex[+row.dataset.i].sets[+row.dataset.j];
  s[f] = el.value;
  scheduleSave();
});

document.addEventListener('change', async e => {
  const el = e.target;
  if (el.id === 'exPick') { S.exSel = el.value; drawExDetail(); }
  if (el.id === 'csvIn' && el.files[0]) importCsv(el.files[0]);
  if (el.id === 'bkIn' && el.files[0]) { prepareRestore(el.files[0]); el.value = ''; }
  if (el.id === 'phPose') { S.cmp.pose = el.value; S.cmp.a = S.cmp.b = null; render(); }
  if (el.id === 'goalSel') { await setKv('goal', el.value); render(); }
  if (el.id === 'pcBar') { PC.bar = +el.value; const cfg = {...kv('plateCfg', {})}; cfg[PC.n === 'T Bar Row' ? 'tbar' : 'bar'] = PC.bar; await setKv('plateCfg', cfg); drawPlates(); }
  if (el.id === 'exclAdd' && el.value) { await setKv('excluded', [...excluded(), el.value]); render(); toast('No te lo propondré más'); }
  if (el.id === 'cmpA') { S.cmp.a = el.value; render(); }
  if (el.id === 'cmpB') { S.cmp.b = el.value; render(); }
  if (el.id === 'phIn' && el.files[0]) {
    const blob = await compressImage(el.files[0]);
    const p = {id:uid('p'), date:isoLocal(new Date()), pose:$('#phPose').value, blob};
    await IDB.put('photos', p); S.photos.push(p); render(); toast('Foto guardada');
  }
});

document.addEventListener('submit', async e => {
  if (e.target.id !== 'bodyForm') return;
  e.preventDefault();
  const id = dayKey(new Date()), prev = S.body.find(b => b.id === id) || {id};
  const rec = {...prev, weight:toNum($('#bWeight').value), waist:toNum($('#bWaist').value), chest:toNum($('#bChest').value), arm:toNum($('#bArm').value), thigh:toNum($('#bThigh').value)};
  if (!rec.weight && !rec.waist && !rec.chest && !rec.arm && !rec.thigh) { toast('Escribe al menos el peso o una medida.'); return; }
  await IDB.put('body', rec);
  S.body = S.body.filter(b => b.id !== id).concat(rec).sort((a,b) => a.id < b.id ? -1 : 1);
  S.histCache = {}; render(); toast('Guardado');
});

/* ---------- arranque ---------- */
render();
loadAll().then(() => { render(); if (S.live) keepAwake(true); }).catch(err => {
  $('#view').innerHTML = `<div class="card empty"><h2>No se pudo abrir el almacenamiento</h2><p>${esc(err && err.message || err)}. Si estás en navegación privada, ábrela en una pestaña normal o desde la pantalla de inicio.</p></div>`;
});
if ('serviceWorker' in navigator) {
  const hadSW = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadSW || document.querySelector('.upd')) return;
    const b = document.createElement('div'); b.className = 'upd'; b.setAttribute('role','status');
    b.innerHTML = '<span>Nueva versión lista</span><button class="btn small primary" id="updGo">Actualizar</button>';
    document.body.appendChild(b);
  });
}
setInterval(() => { const el = $('#liveMins'); if (el && S.live) el.textContent = Math.max(0, Math.round((Date.now() - S.live.start)/60000)); }, 15000);

/* ---------- deslizar una serie a la izquierda para mostrar "Eliminar" ---------- */
let SW = null;
document.addEventListener('touchstart', e => {
  const row = e.target.closest('.set'); if (!row || e.target.closest('input,select')) { SW = null; return; }
  document.querySelectorAll('.set.open').forEach(r => { if (r !== row) { r.classList.remove('open'); r.style.transform = ''; } });
  SW = {row, x:e.touches[0].clientX, y:e.touches[0].clientY, base: row.classList.contains('open') ? -96 : 0, dx:0, lock:null};
}, {passive:true});
document.addEventListener('touchmove', e => {
  if (!SW) return;
  const dx = e.touches[0].clientX - SW.x, dy = e.touches[0].clientY - SW.y;
  if (SW.lock === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) SW.lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
  if (SW.lock !== 'x') return;
  SW.dx = dx; SW.row.style.transition = 'none';
  SW.row.style.transform = `translateX(${Math.max(-120, Math.min(0, SW.base + dx))}px)`;
}, {passive:true});
document.addEventListener('touchend', () => {
  if (!SW || SW.lock !== 'x') { SW = null; return; }
  const pos = SW.base + SW.dx; SW.row.style.transition = '';
  if (pos < -48) { SW.row.classList.add('open'); SW.row.style.transform = 'translateX(-96px)'; }
  else { SW.row.classList.remove('open'); SW.row.style.transform = ''; }
  SW = null;
});
