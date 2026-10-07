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
  return {es:m[0], mus:m[1] ? m[1].split(' ') : [], lo:m[2], hi:m[3], knee:!!m[4], rest:m[5], pat:m[6], eq:m[7]};
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
  S.hevy = {}; for (const h of hevy) S.hevy[h.id] = h.sessions || [];
  S.body = body.sort((a,b) => a.id < b.id ? -1 : 1);
  S.photos = photos.sort((a,b) => a.date < b.date ? -1 : 1);
  S.kv = {}; for (const k of kvs) S.kv[k.id] = k.v;
  S.gyms = gyms;
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
    ex:(s.ex||[]).map(e => ({n:e.n, sets:(e.sets||[]).filter(x => x.done && toNum(x.reps)).map(x => ({kg:toNum(x.kg), reps:+toNum(x.reps), type:'n', knee:x.knee === '' || x.knee == null ? null : +x.knee}))})).filter(e => e.sets.length)
  }));
  const appDays = new Set(app.map(s => dayKey(s.date)));
  const hevy = [];
  for (const k in S.hevy) for (const s of S.hevy[k]) {
    const d = parseIso(s.date); if (appDays.has(dayKey(d))) continue;
    hevy.push({id:s.id, date:d, title:s.title, routine:routineOf(s.title), src:'hevy',
      ex:s.ex.map(e => ({n:e.n, sets:e.s.map(x => ({kg:x[0], reps:x[1], type:x[2]||'n', knee:null}))}))});
  }
  S.all = app.concat(hevy).sort((a,b) => b.date - a.date);
  S.histCache = {};
}

function history(name){
  if (S.histCache[name]) return S.histCache[name];
  const out = [];
  for (const s of S.all) for (const e of s.ex) if (e.n === name) {
    const work = e.sets.filter(x => x.type !== 'w' && x.type !== 'd' && x.reps > 0);
    if (!work.length) continue;
    let best = null;
    for (const x of work) { const v = x.kg ? e1rm(x.kg, x.reps) : x.reps; if (!best || v > best.v) best = {v, kg:x.kg, reps:x.reps}; }
    out.push({date:s.date, sets:work, best, src:s.src});
  }
  return (S.histCache[name] = out);
}
const setsText = sets => sets.map(x => x.kg ? `${fmtKg(x.kg)}×${x.reps}` : `${x.reps} reps`).join(' · ');

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
  if (bw) { const tgt = Math.min(m.hi, minR + 1);
    return {...base, tone: minR >= m.hi ? 'up':'hold', tag: minR >= m.hi ? 'SUBE':'MANTÉN', kg:null, reps:`${tgt}`, text: minR >= m.hi ? `Hiciste ${m.hi}+ en todas: añade lastre o haz una serie más.` : `Intenta <b>${tgt} reps</b> en cada serie.`}; }
  if (knee >= 3) return {...base, tone:'hold', tag:'ÁMBAR', kg:w, reps:`${m.lo}-${m.hi}`, text:`Rodilla en ${knee}/10 la última vez: mantén <b>${fmtKg(w)} kg</b>, controla la bajada y no subas esta semana.`};
  if (atW.length >= 2 && minR >= m.hi) { const kg = Math.round((w + step)*100)/100;
    return {...base, tone:'up', tag:'SUBE', kg, reps:`${m.lo}-${m.lo+2}`, text:`Hiciste ${m.hi}+ reps en todas las series. Hoy <b>${fmtKg(kg)} kg</b> × ${m.lo}-${m.lo+2}.`}; }
  if (minR >= m.lo) { const tgt = Math.min(m.hi, minR + 1);
    return {...base, tone:'hold', tag:'MANTÉN', kg:w, reps:`${tgt}-${m.hi}`, text:`Mismo peso, <b>${fmtKg(w)} kg</b>. Busca al menos <b>${tgt} reps</b> en cada serie; al llegar a ${m.hi} en todas, sube.`}; }
  const prev = hist[1];
  const prevLow = prev && Math.min(99, ...prev.sets.filter(x => (x.kg||0) === w).map(x => x.reps)) < m.lo;
  if (prevLow) { const kg = roundTo(w - step, step);
    return {...base, tone:'down', tag:'BAJA', kg, reps:`${m.lo}-${m.hi}`, text:`Dos sesiones por debajo de ${m.lo} reps con ${fmtKg(w)} kg. Baja a <b>${fmtKg(kg)} kg</b> y vuelve a construir. Descansa 2-3 min entre series.`}; }
  return {...base, tone:'hold', tag:'MANTÉN', kg:w, reps:`${m.lo}-${m.hi}`, text:`La última serie bajó de ${m.lo}. Repite <b>${fmtKg(w)} kg</b> y descansa más entre series (2-3 min).`};
}

/* =====================================================================
   RECUPERACIÓN MUSCULAR (cálculo por reglas, sin IA)
   Cada serie de trabajo carga sus músculos principales; 8 series ≈ músculo agotado.
   La carga se va borrando de forma lineal en RECOV_H horas.
   ===================================================================== */
function fatigueAt(t){
  const fat = {}; for (const k in MUSCLES) fat[k] = 0;
  for (const s of S.all) {
    const h = (t - s.date) / 36e5; if (h < 0 || h > 100) continue;
    const cnt = {};
    for (const e of s.ex) { const n = e.sets.filter(x => x.type !== 'w').length; for (const mu of meta(e.n).mus) cnt[mu] = (cnt[mu]||0) + n; }
    for (const mu in cnt) if (mu in fat) fat[mu] += Math.min(1, cnt[mu]/8) * Math.max(0, 1 - h/RECOV_H[mu]);
  }
  return fat;
}
function recovery(){
  const now = Date.now(), f = fatigueAt(now), out = {};
  for (const k in MUSCLES) {
    const pct = Math.round(100 * (1 - Math.min(1, f[k])));
    let readyH = 0;
    if (pct < 90) { for (let h = 2; h <= 96; h += 2) { const f2 = fatigueAt(now + h*36e5); if (1 - Math.min(1, f2[k]) >= .9) { readyH = h; break; } } if (!readyH) readyH = 96; }
    out[k] = {pct, readyH};
  }
  return out;
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
  let cands = Object.keys(EX).filter(c => c !== n && !used.has(c) && meta(c).pat === m.pat && hasEq(c, eq));
  if (!cands.length) cands = Object.keys(EX).filter(c => c !== n && !used.has(c) && hasEq(c, eq) && meta(c).mus.some(x => m.mus.includes(x)));
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
  const rec = recovery();
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
    <button class="btn primary wide" id="start">Empezar ${r.code}</button>
  </section>
  <div class="eyebrow" style="margin-top:6px">Elegir otra rutina · % = músculos recuperados</div>
  <div class="routines">${cards}</div>
  <button class="btn ghost wide" id="startFree">Sesión libre (sin rutina)</button>
  ${S.all.length ? '' : `<section class="card pad import"><div class="eyebrow">Empieza con tu historial</div><p style="margin:0">Importa el <b>workouts.csv</b> de Hevy en la pestaña Más y tendrás pesos sugeridos y gráficas desde el primer día.</p><button class="btn primary" data-tab="more">Ir a Más</button></section>`}`;
}

function newSet(sg){ return {kg: sg && sg.kg != null ? fmtKg(sg.kg) : '', reps:'', knee:'', done:false}; }
function exEntry(n, from){
  const sg = suggest(n);
  const k = sg.last ? Math.max(2, Math.min(4, sg.last.sets.length)) : 3;
  return {n, from: from || null, sets: Array.from({length:k}, () => newSet(sg))};
}
async function startSession(key){
  const now = new Date(), r = key ? ROUTINES[key] : null, gym = currentGym();
  const ex = r ? planFor(r.ex, gym.eq).filter(p => p.n).map(p => exEntry(p.n, p.from)) : [];
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
    ${r.knee ? `<h4>Bloque de rodilla</h4><ul>${KNEE_BLOCK.map((t,i) => `<li><label><input type="checkbox" id="kb${i}"> <span>${esc(t)}</span></label></li>`).join('')}</ul>` : ''}
  </details>` : '';
  const gymEq = currentGym().eq;
  const known = Object.keys(EX).filter(n => !L.ex.some(e => e.n === n) && hasEq(n, gymEq)).sort((a,b) => meta(a).es.localeCompare(meta(b).es));
  return `
  <div class="eyebrow" style="margin-bottom:12px">${r ? r.code : 'Libre'} · ${esc(L.gym || '')} · en curso · ${mins} min</div>
  <div class="stack">
    ${warm}
    ${L.ex.map((e,i) => exCard(e,i)).join('')}
    <div class="card pad stack" style="gap:10px">
      <label class="eyebrow" for="addSel">Añadir ejercicio (según tu material)</label>
      <div class="addex"><select class="big" id="addSel"><option value="">Elige…</option>${known.map(n => `<option value="${esc(n)}">${esc(meta(n).es)}</option>`).join('')}</select>
      <button class="btn" id="addBtn">Añadir</button></div>
    </div>
    <button class="btn primary wide" id="finish">Terminar entreno</button>
    <div id="discardZone"><button class="btn danger wide" id="discard">Descartar sesión</button></div>
  </div>`;
}

function exCard(e, i){
  const m = meta(e.n), sg = suggest(e.n);
  const lastTxt = sg.last ? `Última (${fmtDate(sg.last.date)}): ${setsText(sg.last.sets)}` : 'Sin historial';
  const rows = e.sets.map((s,j) => {
    const kc = s.knee === '' || s.knee == null ? '' : +s.knee >= 5 ? 'knee-2' : +s.knee >= 3 ? 'knee-1' : '';
    return `<div class="set ${s.done?'done':''} ${kc}" data-i="${i}" data-j="${j}">
      <span class="n">${j+1}</span>
      <input id="kg-${i}-${j}" inputmode="decimal" autocomplete="off" aria-label="Kilos serie ${j+1}" placeholder="${sg.kg!=null?fmtKg(sg.kg):'kg'}" value="${esc(s.kg)}" data-f="kg">
      <input id="rp-${i}-${j}" inputmode="numeric" autocomplete="off" aria-label="Repeticiones serie ${j+1}" placeholder="${esc(sg.reps)}" value="${esc(s.reps)}" data-f="reps">
      ${m.knee ? `<select id="kn-${i}-${j}" aria-label="Rodilla de 0 a 10" data-f="knee"><option value="">–</option>${Array.from({length:11},(_,v)=>`<option ${String(s.knee)===String(v)?'selected':''}>${v}</option>`).join('')}</select>` : ''}
      <button class="tick" data-tick aria-label="Serie hecha" aria-pressed="${s.done}"><svg width="18" height="18" viewBox="0 0 18 18"><path d="M3.5 9.5l3.5 3.5 7.5-8" fill="none" stroke="var(--muted)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    </div>`; }).join('');
  return `<article class="card ex ${m.knee?'':'noknee'}" data-ex="${i}">
    <div class="ex-h">
      <div class="ex-t"><h3>${esc(m.es)}<small>${esc(e.n)} · ${m.lo}-${m.hi} reps · descanso ${fmt1(m.rest/60)} min</small></h3>
        <button class="menu" data-rm="${i}" aria-label="Quitar ${esc(m.es)}">×</button></div>
      ${e.from ? `<div class="subnote"><span class="swap">Cambio</span><span>En este gimnasio no hay material para ${esc(meta(e.from).es)}.</span></div>` : ''}
      <div class="sugg ${sg.tone}"><span class="tag">${sg.tag}</span><p>${sg.text}</p></div>
      <div class="last num">${esc(lastTxt)}</div>
    </div>
    <div class="sets">
      <div class="set-h"><span style="text-align:center">#</span><span style="text-align:center">kg</span><span style="text-align:center">reps</span>${m.knee?'<span style="text-align:center">rodilla</span>':''}<span></span></div>
      ${rows}
    </div>
    <div class="ex-f"><button class="btn small" data-add="${i}">+ Serie</button></div>
  </article>`;
}

async function finishSession(){
  const L = S.live;
  const done = L.ex.flatMap(e => e.sets.filter(s => s.done && toNum(s.reps)).map(s => ({n:e.n, kg:toNum(s.kg), reps:toNum(s.reps)})));
  if (!done.length) { toast('Marca al menos una serie como hecha (✓) antes de terminar.'); return; }
  const prs = [];
  for (const e of L.ex) {
    const today = e.sets.filter(s => s.done && toNum(s.reps) && toNum(s.kg)).map(s => e1rm(toNum(s.kg), toNum(s.reps)));
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
  S.lastDone = {title:L.title, code:L.routine ? ROUTINES[L.routine].code : 'Libre', mins:Math.round((L.end-L.start)/60000), sets:done.length,
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
    <div class="row"><button class="btn primary" data-tab="prog">Ver progreso</button><button class="btn ghost" id="closeSum">Cerrar</button></div>
  </section>`;
}

/* ---------- descanso + pantalla encendida ---------- */
let restT = null, audio = null, wake = null;
function beep(f=880, d=.2, w=0){ try{ audio = audio || new (window.AudioContext||window.webkitAudioContext)(); const o = audio.createOscillator(), g = audio.createGain(); o.frequency.value = f; o.connect(g); g.connect(audio.destination); const t = audio.currentTime + w; g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.35,t+.02); g.gain.exponentialRampToValueAtTime(.0001,t+d); o.start(t); o.stop(t+d+.02); }catch(e){} }
async function keepAwake(on){ try{ if (on && 'wakeLock' in navigator && !wake) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } if (!on && wake){ await wake.release(); wake = null; } }catch(e){} }
function startRest(secs){
  beep(0,.001);
  if (restT) clearInterval(restT.iv);
  restT = {end: Date.now() + secs*1000};
  $('#rest').classList.remove('end');
  drawRest(); restT.iv = setInterval(drawRest, 250);
}
function stopRest(){ if (restT) clearInterval(restT.iv); restT = null; const el = $('#rest'); el.hidden = true; el.classList.remove('end'); }
function drawRest(){
  if (!restT) return;
  const left = Math.ceil((restT.end - Date.now())/1000), el = $('#rest');
  el.hidden = false;
  if (left <= 0) {
    if (!restT.rang) { restT.rang = true; beep(988,.2); beep(1319,.35,.22); el.classList.add('end'); setTimeout(() => { if (restT && restT.rang) stopRest(); }, 4000); }
    el.innerHTML = `<div class="pill" role="timer"><span>Descanso</span><b>¡Ya!</b><button data-r="x" aria-label="Cerrar">✕</button></div>`; return;
  }
  if (left <= 3 && restT.lastBeep !== left) { restT.lastBeep = left; beep(660,.08); }
  el.innerHTML = `<div class="pill" role="timer"><span>Descanso</span><b>${Math.floor(left/60)}:${pad(left%60)}</b><button data-r="-15">−15</button><button data-r="15">+15</button><button data-r="x" aria-label="Cerrar descanso">✕</button></div>`;
}
$('#rest').addEventListener('click', e => {
  const b = e.target.closest('[data-r]'); if (!b || !restT) return;
  if (b.dataset.r === 'x') return stopRest();
  restT.end += (+b.dataset.r)*1000; drawRest();
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
      if (s.date >= cut4) for (const mu of meta(e.n).mus) musc[mu] += work.length;
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
    <section class="card chart-card">
      <header><h2>Constancia</h2><p>Sesiones por semana · media ${fmt1(avg26)} en 6 meses</p></header>
      <div class="chart" id="chWeeks"></div>
    </section>
    <section class="card chart-card">
      <header><h2>Series por músculo</h2><p>Media semanal, últimas 4 semanas</p></header>
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
      <div class="prs">${prs.length ? prs.slice(0,8).map(p => `<div class="pr"><div><b>${esc(meta(p.n).es)}</b><br><span>${fmtDate(p.date,{day:'numeric',month:'long'})} · ${fmtKg(p.kg)} kg × ${p.reps}</span></div><b class="num">${fmt1(p.v)} kg</b></div>`).join('') : '<p class="muted" style="margin:0">Sin récords en los últimos 60 días.</p>'}</div>
    </section>
  </div>`;
}
function recentPRs(days){
  const cut = new Date(); cut.setDate(cut.getDate()-days);
  const names = new Set(); for (const s of S.all) for (const e of s.ex) names.add(e.n);
  const latest = new Map();
  for (const n of names) {
    const h = history(n).filter(x => x.best.kg).slice().reverse(); let best = 0;
    for (const x of h) { if (x.best.v > best) { if (best && x.date >= cut) latest.set(n, {n, date:x.date, v:x.best.v, kg:x.best.kg, reps:x.best.reps}); best = x.best.v; } }
  }
  return [...latest.values()].sort((a,b) => b.date - a.date);
}
function drawExDetail(){
  const box = $('#exDetail'); if (!box || !S.exSel) return;
  const n = S.exSel, m = meta(n), h = history(n);
  if (!h.length) { box.innerHTML = ''; return; }
  const bw = !h.some(x => x.best.kg);
  const pts = h.slice(0, 40).reverse().map(x => ({x:x.date, y: bw ? x.best.reps : Math.round(x.best.v*10)/10, label: bw ? `${x.best.reps} reps` : `${fmtKg(x.best.kg)} kg × ${x.best.reps}`}));
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
      <div><b>${bw ? best.best.reps+' reps' : fmt1(best.best.v)+' kg'}</b><span>${bw?'Mejor serie':'Mejor 1RM estimado'} · ${fmtDate(best.date,{month:'short',year:'2-digit'})}</span></div>
      <div><b>${bw ? '—' : fmtKg(heavy)+' kg'}</b><span>Peso más alto usado</span></div>
      <div><b style="color:${trend==null?'inherit':trend>0?'var(--good)':trend<0?'var(--warn)':'inherit'}">${trend==null?'—':(trend>0?'+':'')+trend+' %'}</b><span>Tendencia 8 semanas</span></div>
      <div><b>${knees.length ? fmt1(knees.reduce((a,b)=>a+b,0)/knees.length)+'/10' : '—'}</b><span>Rodilla (últimas 3)${m.knee?'':' · no aplica'}</span></div>
    </div>
    <div class="sugg ${sg.tone}"><span class="tag">${sg.tag}</span><p>${sg.text}</p></div>
    <div style="overflow-x:auto"><table class="hist"><thead><tr><th>Fecha</th><th>Series</th><th>${bw?'Mejor':'1RM est.'}</th></tr></thead><tbody>
      ${h.slice(0,8).map(x => `<tr><td>${fmtDate(x.date)}${x.src==='app'?'':' <span class="faint">· Hevy</span>'}</td><td>${esc(setsText(x.sets))}</td><td>${bw ? x.best.reps : fmt1(x.best.v)}</td></tr>`).join('')}
    </tbody></table></div>`;
  lineChart($('#chEx'), [{pts, color:'var(--accent)', line:true, area:true}], bw ? 'reps' : 'kg',
    p => `<b>${fmtKg(p.y)} ${bw?'reps':'kg'}</b><br>${fmtDate(p.x,{day:'numeric',month:'short',year:'2-digit'})} · ${esc(p.label)}`);
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
function bodySvg(side, rec){
  const c = k => `m c-${recClass(rec[k].pct)}`;
  const m = (k, shape) => shape.replace('<', `<g data-mus="${k}" class="${c(k)}"><title>${MUSCLES[k]} ${rec[k].pct} %</title><`) + '</g>';
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
  const rec = recovery(), nx = nextRoutine();
  const rows = Object.keys(MUSCLES).sort((a,b) => rec[a].pct - rec[b].pct).map(k => {
    const r = rec[k];
    return `<div class="rec" data-mus="${k}"><div><b style="text-align:left">${MUSCLES[k]}</b><small>${r.pct >= 90 ? 'Listo para entrenar' : `Listo en ~${r.readyH < 24 ? r.readyH+' h' : fmt1(r.readyH/24)+' días'}`}</small></div><span class="pill ${recClass(r.pct)}">${recLabel(r.pct)}</span><b>${r.pct} %</b></div>`;
  }).join('');
  const last = S.all[0];
  return `<div class="stack">
    <section class="card pad stack">
      <div class="bodymap"><figure>${bodySvg('front', rec)}<figcaption>Frente</figcaption></figure><figure>${bodySvg('back', rec)}<figcaption>Espalda</figcaption></figure></div>
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
    const rateTxt = rate <= -0.25 && rate >= -0.6 ? 'buen ritmo' : rate < -0.6 ? 'demasiado rápido' : rate < 0 ? 'lento, pero bajando' : 'sin bajar';
    stats = `<div class="stats"><div><b>${fmt1(last)} kg</b><span>Media 7 días</span></div><div><b>${(rate>0?'+':'')+fmt1(rate)} kg/sem</b><span>Ritmo · ${rateTxt}</span></div></div>`;
  }
  const waist = S.body.filter(b => b.waist).map(b => ({x:parseIso(b.id), y:b.waist, label:'cintura'}));
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
    <section class="card chart-card">
      <header><h2>Peso corporal</h2><p>Objetivo: bajar 0,25-0,5 kg por semana</p></header>
      ${W.length ? `<div class="legend"><span><i style="background:var(--faint);border-radius:50%"></i>Peso del día</span><span><i style="background:var(--accent)"></i>Media 7 días</span></div>` : ''}
      <div class="chart" id="chWeight">${W.length ? '' : '<p class="muted" style="margin:0;font-size:14px">Apunta tu peso unos días y aparecerá la tendencia.</p>'}</div>
      ${stats}
    </section>
    ${waist.length ? `<section class="card chart-card"><header><h2>Cintura</h2><p>Si baja aunque el peso no se mueva, es recomposición</p></header><div class="chart" id="chWaist"></div></section>` : ''}
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
    <section class="card pad import">
      <h2>Historial de Hevy</h2>
      <p class="muted" style="margin:0;font-size:14px">En Hevy: Perfil → Ajustes → Exportar e importar datos → Exportar entrenamientos. Guarda el archivo en Archivos y súbelo aquí. Hazlo cada dos semanas: los días que ya apuntaste en esta app no se duplican.</p>
      <span class="btn primary file-btn">Importar workouts.csv<input type="file" id="csvIn" accept=".csv,text/csv,text/comma-separated-values" aria-label="Importar workouts.csv de Hevy"></span>
      <div id="impMsg" class="muted" style="font-size:13px">${hevyImp ? 'Última importación: ' + ago(new Date(hevyImp)) + '.' : 'Aún no has importado nada.'}</div>
    </section>
    <section class="card pad import">
      <h2>Copia de seguridad</h2>
      <p class="muted" style="margin:0;font-size:14px">Tus datos viven solo en este iPhone. Si borras la app o cambias de móvil, se pierden sin copia. Guárdala en iCloud Drive (Archivos) cada dos semanas, a la vez que importas Hevy.</p>
      <div class="row"><button class="btn primary" id="bkOut">Exportar copia</button><span class="btn file-btn">Restaurar copia<input type="file" id="bkIn" accept=".json,application/json" aria-label="Restaurar copia de seguridad"></span></div>
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
    const sessions = new Map();
    for (const r of rows) {
      const name = r[ix('exercise_title')]; if (SKIP.has(name)) continue;
      const reps = toNum(r[ix('reps')]); if (!reps) continue;
      const type = ({warmup:'w', dropset:'d', failure:'f'})[r[ix('set_type')]] || 'n'; if (type === 'w') continue;
      const date = hevyDate(r[ix('start_time')]); if (!date) continue;
      const id = 'h' + date.replace(/\D/g,'');
      if (!sessions.has(id)) sessions.set(id, {id, date, title:r[ix('title')], ex:[]});
      const s = sessions.get(id);
      let e = s.ex.find(x => x.n === name); if (!e) { e = {n:name, s:[]}; s.ex.push(e); }
      const kg = toNum(r[ix('weight_kg')]);
      e.s.push(type === 'n' ? [kg, reps] : [kg, reps, type]);
    }
    const byMonth = {}; for (const s of sessions.values()) (byMonth[s.date.slice(0,7)] ||= []).push(s);
    for (const k of Object.keys(byMonth)) {
      const merged = new Map((S.hevy[k]||[]).map(s => [s.id, s])); for (const s of byMonth[k]) merged.set(s.id, s);
      const list = [...merged.values()].sort((a,b) => a.date < b.date ? -1 : 1);
      await IDB.put('hevy', {id:k, sessions:list}); S.hevy[k] = list;
    }
    await setKv('lastHevy', Date.now());
    rebuild();
    msg.textContent = `Listo: ${sessions.size} sesiones de Hevy importadas.`;
    toast(`${sessions.size} sesiones importadas`); updateStatus();
  } catch(e) { msg.textContent = (e && e.message) || 'No se pudo importar el archivo.'; }
}

/* ---------- copia de seguridad ---------- */
const blobToDataUrl = b => new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b); });
async function exportBackup(){
  const msg = $('#bkMsg'); msg.textContent = 'Preparando copia…';
  const data = {app:'barralibre', v:1, exported:isoLocal(new Date()),
    sessions:Object.values(S.app), hevy:Object.entries(S.hevy).map(([id,sessions]) => ({id,sessions})), body:S.body, gyms:S.gyms,
    kv:Object.entries(S.kv).map(([id,v]) => ({id,v})), photos:[]};
  for (const p of S.photos) data.photos.push({id:p.id, date:p.date, pose:p.pose, data: await blobToDataUrl(p.blob)});
  const name = `barralibre-${dayKey(new Date())}.json`;
  const file = new File([JSON.stringify(data)], name, {type:'application/json'});
  try {
    if (navigator.canShare && navigator.canShare({files:[file]})) await navigator.share({files:[file], title:'Copia de Barra Libre'});
    else { const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
    await setKv('lastBackup', Date.now());
    msg.textContent = `Copia creada (${(file.size/1048576).toLocaleString('es-ES',{maximumFractionDigits:1})} MB). Guárdala en Archivos → iCloud Drive.`;
  } catch(e) { msg.textContent = e && e.name === 'AbortError' ? 'Copia cancelada.' : 'No se pudo compartir la copia.'; }
}
async function restoreBackup(file){
  const msg = $('#bkMsg'); msg.textContent = 'Restaurando…';
  try {
    const d = JSON.parse(await file.text());
    if (d.app !== 'barralibre') throw new Error('Este archivo no es una copia de Barra Libre.');
    for (const s of STORES) await IDB.clear(s);
    for (const x of d.sessions||[]) await IDB.put('sessions', x);
    for (const x of d.hevy||[]) await IDB.put('hevy', x);
    for (const x of d.body||[]) await IDB.put('body', x);
    for (const x of d.gyms||[]) await IDB.put('gyms', x);
    for (const x of d.kv||[]) await IDB.put('kv', x);
    for (const p of d.photos||[]) { const blob = await (await fetch(p.data)).blob(); await IDB.put('photos', {id:p.id, date:p.date, pose:p.pose, blob}); }
    urlCache.clear(); S.live = null;
    await loadAll(); render(); toast('Copia restaurada');
  } catch(e) { msg.textContent = (e && e.message) || 'No se pudo leer la copia.'; }
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
  if (mus && S.tab === 'rec') { const k = mus.dataset.mus, r = recovery()[k]; $('#recSel').innerHTML = `<b>${MUSCLES[k]}</b>: ${r.pct} % · ${r.pct >= 90 ? 'listo para entrenar' : 'listo en ~' + (r.readyH < 24 ? r.readyH + ' h' : fmt1(r.readyH/24) + ' días')}.`; return; }
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
  if (t.closest('#bkOut')) return exportBackup();
  /* Entreno en curso */
  if (!S.live) return;
  const tick = t.closest('[data-tick]');
  if (tick) {
    const row = tick.closest('.set'), i = +row.dataset.i, j = +row.dataset.j, s = S.live.ex[i].sets[j];
    if (!s.done) {
      const ph = row.querySelector('[data-f=kg]').placeholder;
      if (!s.kg && toNum(ph) != null) s.kg = ph;
      if (!toNum(s.reps)) { row.querySelector('[data-f=reps]').focus(); toast('Escribe las repeticiones de la serie.'); return; }
      s.done = true; startRest(meta(S.live.ex[i].n).rest);
      if (s.knee !== '' && +s.knee >= 5) toast('Rodilla en rojo: para este ejercicio o cámbialo.');
    } else s.done = false;
    row.classList.toggle('done', s.done); tick.setAttribute('aria-pressed', s.done);
    row.querySelector('[data-f=kg]').value = s.kg;
    scheduleSave(); return;
  }
  const add = t.closest('[data-add]');
  if (add) { const ex = S.live.ex[+add.dataset.add], prev = ex.sets[ex.sets.length-1]; ex.sets.push({kg:prev ? prev.kg : '', reps:'', knee:'', done:false}); scheduleSave(); render(); return; }
  const rm = t.closest('[data-rm]'); if (rm) { S.live.ex.splice(+rm.dataset.rm, 1); scheduleSave(); render(); return; }
  if (t.closest('#addBtn')) { const n = $('#addSel').value; if (!n) return; S.live.ex.push(exEntry(n)); scheduleSave(); render(); return; }
  if (t.closest('#finish')) return finishSession();
  if (t.closest('#discard')) { $('#discardZone').innerHTML = `<div class="confirm"><span>¿Borrar esta sesión sin guardarla?</span><button class="btn small danger" id="discardYes">Sí, borrar</button><button class="btn small ghost" id="discardNo">Cancelar</button></div>`; return; }
  if (t.closest('#discardNo')) { $('#discardZone').innerHTML = `<button class="btn danger wide" id="discard">Descartar sesión</button>`; return; }
  if (t.closest('#discardYes')) { const id = S.live.id; S.live = null; delete S.app[id]; await IDB.del('sessions', id); stopRest(); keepAwake(false); render(); return; }
});

document.addEventListener('input', e => {
  const el = e.target;
  if (el.id === 'cmpRange') { S.cmp.pos = +el.value; const box = $('#cmpBox'); box.querySelector('.after').style.clipPath = `inset(0 0 0 ${el.value}%)`; box.querySelector('.divider').style.left = el.value + '%'; return; }
  if (el.dataset && el.dataset.eq && S.gymEdit) { const k = el.dataset.eq; S.gymEdit.eq = el.checked ? [...new Set(S.gymEdit.eq.concat(k))] : S.gymEdit.eq.filter(x => x !== k); return; }
  const f = el.dataset && el.dataset.f; if (!f || !S.live) return;
  const row = el.closest('.set'); const s = S.live.ex[+row.dataset.i].sets[+row.dataset.j];
  s[f] = el.value;
  if (f === 'knee') { row.classList.remove('knee-1','knee-2'); if (el.value !== '') { const k = +el.value; if (k >= 3) row.classList.add(k >= 5 ? 'knee-2' : 'knee-1'); } }
  scheduleSave();
});

document.addEventListener('change', async e => {
  const el = e.target;
  if (el.id === 'exPick') { S.exSel = el.value; drawExDetail(); }
  if (el.id === 'csvIn' && el.files[0]) importCsv(el.files[0]);
  if (el.id === 'bkIn' && el.files[0]) restoreBackup(el.files[0]);
  if (el.id === 'phPose') { S.cmp.pose = el.value; S.cmp.a = S.cmp.b = null; render(); }
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
  render(); toast('Guardado');
});

/* ---------- arranque ---------- */
render();
loadAll().then(() => { render(); if (S.live) keepAwake(true); }).catch(err => {
  $('#view').innerHTML = `<div class="card empty"><h2>No se pudo abrir el almacenamiento</h2><p>${esc(err && err.message || err)}. Si estás en navegación privada, ábrela en una pestaña normal o desde la pantalla de inicio.</p></div>`;
});
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
