/* =====================================================================
   BARRA LIBRE · perfiles, "¿Qué entrenamos?", cuestionario y consejos por objetivo
   Cada perfil es una persona + un objetivo con su programa. El plan D1-D4 de Luis
   es el perfil fijo 'me' y no se toca: los programas nuevos se generan aparte.
   ===================================================================== */
const BASE_PLAN = {R: JSON.parse(JSON.stringify(ROUTINES)), O: ORDER.slice()};
const DEF_PROFILE = {id:'me', name:'Luis', person:'me', builtin:true, q:{main:'hip', sec:'rehab', zone2:'rodilla', days:4, issues:['rodilla']}};
const STRENGTH_GOALS = ['hip','fuerza','grasa'];
/* Objetivos para otras personas: ocultos salvo que se activen en Más */
const EXTRA_GOALS = ['mayores','rehab','opos'];
const goalShown = (k, keep) => kv('extraGoals', false) || !EXTRA_GOALS.includes(k) || k === keep;

/* Los perfiles 'lv' (programa por niveles, quitado en 1.7.0) se ignoran: sus sesiones siguen en la copia, pero no se muestran */
/* En el móvil de otra persona (detectado al importar su Hevy) el plan D1-D4 de Luis se oculta */
function profiles(){ const own = (kv('profiles', []) || []).filter(p => p && p.id !== 'me' && p.kind !== 'lv' && p.prog);
  return (kv('hideBuiltin', false) && own.length ? [] : [DEF_PROFILE]).concat(own); }
const curProf = () => profiles().find(p => p.id === kv('profile', 'me')) || profiles()[0];
const personOf = pid => { const p = profiles().find(x => x.id === pid); return p ? p.person : pid; };
/* Claves que van por persona (excluidos, gimnasio elegido, descarga). Las de Luis siguen igual que antes. */
const profKey = k => curProf().person === 'me' ? k : `${k}:${curProf().person}`;
const profStrength = () => { const p = curProf(); return !!p.builtin || STRENGTH_GOALS.includes(p.q.main) || p.q.sec === 'musculo'; };
function profKneeOn(){ const p = curProf(), q = p.q || {};
  return !!p.builtin || (q.issues || []).includes('rodilla') || (q.main === 'rehab' && q.zone === 'rodilla') || (q.sec === 'rehab' && q.zone2 === 'rodilla'); }
function profPainLab(){ const p = curProf(), q = p.q || {};
  if (p.builtin) return 'Rodilla';
  const z = [q.main === 'rehab' && q.zone, q.sec === 'rehab' && q.zone2].filter(Boolean);
  return z.length && z.every(x => x === 'rodilla') ? 'Rodilla' : z.length ? 'Dolor' : (q.issues || []).includes('rodilla') ? 'Rodilla' : 'Dolor'; }
const goalLab = q => { const g = GOALS[q.main]; return g ? `${g.ic} ${g.lab}` : ''; };
const secLab = q => !q.sec || q.sec === 'none' ? '' : q.sec === 'rehab' && q.zone2 ? `cuidar ${ZONES[q.zone2].lab.toLowerCase()}` : q.sec === 'musculo' && q.muscle ? `más ${MUSCLES[q.muscle].toLowerCase()}` : SECS[q.sec].toLowerCase();

/* Carga las rutinas del perfil activo en ROUTINES/ORDER (se vacían y rellenan para que el resto de la app no cambie) */
function applyProfile(){
  const p = curProf();
  for (const k in ROUTINES) delete ROUTINES[k];
  ORDER.length = 0;
  if (p.builtin || !p.prog) { Object.assign(ROUTINES, JSON.parse(JSON.stringify(BASE_PLAN.R))); ORDER.push(...BASE_PLAN.O); PRR = {}; }
  else { Object.assign(ROUTINES, JSON.parse(JSON.stringify(p.prog.routines))); ORDER.push(...p.prog.order); PRR = p.prog.rr || {}; }
  if (typeof applyEdits === 'function') applyEdits();
  REC_CACHE = null;
}
async function switchProfile(id){
  if (S.live) { toast('Termina o descarta el entreno en curso antes de cambiar de perfil.'); return; }
  await setKv('profile', id); applyProfile(); S.pick = null; S.exSel = null; S.lastDone = null; rebuild(); S.home = false; S.wiz = null; render(); window.scrollTo({top:0});
}

/* ---------- barra de perfil en Entrenar ---------- */
function profBar(){
  const p = curProf();
  return `<div class="profbar"><button class="chip" data-home aria-label="Cambiar de perfil u objetivo">👤 <b>${esc(p.name)}</b> · ${p.builtin ? `Plan ${PLAN_VERSION} (D1-D4)` : p.kind === 'hevy' ? '📥 Rutinas de Hevy' : esc(goalLab(p.q))} <span class="faint">▾</span></button></div>`;
}

/* ---------- pantalla de inicio: ¿Qué entrenamos? ---------- */
function renderHome(){
  const list = profiles(), cur = curProf();
  return `<div class="stack">
    ${backupBanner()}
    <section class="card pad stack" style="gap:10px">
      <h2>Seguir con</h2>
      <div class="sheet-list">${list.map(p => { const n = p.builtin ? 4 : p.prog.order.length;
        return `<button class="prof-card ${p.id === cur.id ? 'on' : ''}" data-prof="${esc(p.id)}"><span class="pc-ic">${p.builtin ? '🏋️' : p.kind === 'hevy' ? '📥' : (GOALS[p.q.main] || {}).ic || '•'}</span><span class="pc-t"><b>${esc(p.name)}${p.builtin ? ' · tu plan' : ''}</b><small>${p.builtin ? `Hipertrofia + cuidar la rodilla · D1-D4 · plan ${PLAN_VERSION}` : p.kind === 'hevy' ? `Rehechas desde tus entrenos de Hevy · ${n} rutinas: ${esc(p.prog.order.map(k => p.prog.routines[k].title).join(', '))}` : `${esc(goalLab(p.q).replace(/^\S+ /, ''))}${secLab(p.q) ? ' + ' + esc(secLab(p.q)) : ''} · ${p.q.days} días · ${n} rutinas · ~${p.q.minutes} min`}</small></span><span class="faint">›</span></button>`; }).join('')}</div>
    </section>
    <section class="card pad stack" style="gap:10px">
      <h2>Nuevo objetivo</h2>
      <p class="muted" style="margin:0;font-size:14px">Elige qué quieres entrenar. Te haré unas preguntas cortas y la app armará la rutina con los estudios de ese objetivo.</p>
      <div class="goal-grid">${Object.entries(GOALS).filter(([k]) => goalShown(k)).map(([k,g]) => `<button class="goal-b" data-wiznew="${k}"><span class="gb-ic">${g.ic}</span><b>${esc(g.lab)}</b><small>${esc(g.sub)}</small></button>`).join('')}</div>
    </section>
    <label class="row muted" style="gap:8px;font-size:14px;justify-content:center"><input type="checkbox" data-askstart ${kv('askStart', false) ? 'checked' : ''}> Preguntar al abrir la app</label>
  </div>`;
}

/* ---------- cuestionario ---------- */
const LEVELS = {pri:'Empiezo o vuelvo', int:'Intermedio', ava:'Avanzado'};
const MAT = {bw:{lab:'Casa sin material', eq:[]}, band:{lab:'Casa con bandas', eq:['band']}, casa:{lab:'Casa con mancuernas', eq:GYM_PRESETS.casa}};
function newWizard(main, base){
  const me = !base && curProf().person === 'me';
  const q = base ? JSON.parse(JSON.stringify(base.q)) : {name:'', person: me ? 'me' : 'new', age:'', main: main || 'hip', sec:'none', zone:'rodilla', zone2:'rodilla', muscle:'fe', opos:'pn', sex:'h',
    days:3, minutes:60, gym: kv(pkey('gym'), kv('gym', 'g-main')), level:'int', issues: me && !kv('hideBuiltin', false) ? ['rodilla'] : []};
  if (main && base) q.main = main;
  S.wiz = {step:'form', q, editId: base ? base.id : null, person: base ? base.person : null}; S.home = false; render(); window.scrollTo({top:0});
}
const chipRow = (key, opts, val, multi) => `<div class="chip-row">${Object.entries(opts).map(([k,v]) => { const on = multi ? (val || []).includes(k) : String(val) === String(k);
  return `<button class="chip small ${on ? 'on' : ''}" ${multi ? 'data-wzt' : 'data-wz'}="${key}:${k}" aria-pressed="${on}">${esc(v)}</button>`; }).join('')}</div>`;
function wizEq(q){ if (MAT[q.gym]) return MAT[q.gym].eq.slice(); const g = S.gyms.find(x => x.id === q.gym) || S.gyms[0]; return g.eq.slice(); }
function renderWizard(){
  const W = S.wiz, q = W.q;
  if (W.step === 'preview') return renderWizPreview();
  const goalOpts = Object.fromEntries(Object.entries(GOALS).filter(([k]) => goalShown(k, q.main)).map(([k,g]) => [k, `${g.ic} ${g.lab}`]));
  const zoneOpts = Object.fromEntries(Object.entries(ZONES).map(([k,z]) => [k, z.lab]));
  const musOpts = Object.fromEntries(['pe','es','ho','bi','tr','cu','fe','gl','ge','co'].filter(k => MUSCLES[k]).map(k => [k, MUSCLES[k]]));
  const gymOpts = Object.fromEntries(S.gyms.map(g => [g.id, g.name]).concat(Object.entries(MAT).map(([k,m]) => [k, m.lab])));
  const secOpts = Object.fromEntries(Object.entries(SECS).filter(([k]) => !(k === 'rehab' && q.main === 'rehab') && !(k === 'cardio' && q.main === 'cardio') && !(k === 'potencia' && q.main === 'potencia') && !(k === 'flex' && q.main === 'flex') && !(k === 'fuerza' && q.main === 'fuerza')));
  return `<div class="stack">
    <section class="card pad stack wiz" style="gap:14px">
      <div class="wz-f"><span class="eyebrow">1 · ¿Para quién?</span>
        ${W.editId ? `<p class="muted" style="margin:0;font-size:14px">${W.person === 'me' ? 'Para ti (Luis): usa tu historial.' : 'Otra persona: historial propio.'}</p>` : chipRow('person', {me:'Para mí (Luis)', new:'Otra persona'}, q.person)}
        <div class="row" style="gap:8px"><input class="field" id="wzName" style="flex:2" placeholder="${q.person === 'me' ? 'Nombre del objetivo (p. ej. Luis · Movilidad)' : 'Nombre (p. ej. Ana)'}" value="${esc(q.name)}" autocomplete="off"><input class="field" id="wzAge" style="flex:1" inputmode="numeric" placeholder="Edad" value="${esc(q.age)}" autocomplete="off" aria-label="Edad (opcional)"></div></div>
      <div class="wz-f"><span class="eyebrow">2 · Objetivo principal (≈ 80 % del trabajo)</span>${chipRow('main', goalOpts, q.main)}
        ${q.main === 'rehab' ? `<span class="faint" style="font-size:13px">Zona</span>${chipRow('zone', zoneOpts, q.zone)}` : ''}
        ${q.main === 'opos' ? `<span class="faint" style="font-size:13px">Oposición</span>${chipRow('opos', {pn:'Policía Nacional', gen:'Genérica'}, q.opos)}<span class="faint" style="font-size:13px">Baremo</span>${chipRow('sex', {h:'Hombre', m:'Mujer'}, q.sex)}` : ''}
        <p class="faint" style="font-size:12px;margin:0">${esc(GOALS[q.main].sub)} · ${GOALS[q.main].ev.map(evChip).join(' ')}</p></div>
      <div class="wz-f"><span class="eyebrow">3 · Objetivo secundario (≈ 20 %)</span>${chipRow('sec', secOpts, q.sec)}
        ${q.sec === 'rehab' ? `<span class="faint" style="font-size:13px">Zona</span>${chipRow('zone2', zoneOpts, q.zone2)}` : ''}
        ${q.sec === 'musculo' ? `<span class="faint" style="font-size:13px">Músculo</span>${chipRow('muscle', musOpts, q.muscle)}` : ''}</div>
      <div class="wz-f"><span class="eyebrow">4 · Días por semana</span>${chipRow('days', {2:'2',3:'3',4:'4',5:'5',6:'6'}, q.days)}
        <span class="eyebrow" style="margin-top:4px">Minutos por sesión</span>${chipRow('minutes', {30:'30',45:'45',60:'60',75:'75',90:'90'}, q.minutes)}</div>
      <div class="wz-f"><span class="eyebrow">5 · Material</span>${chipRow('gym', gymOpts, q.gym)}</div>
      <div class="wz-f"><span class="eyebrow">6 · Nivel</span>${chipRow('level', LEVELS, q.level)}
        <span class="eyebrow" style="margin-top:4px">Molestias (quita los ejercicios que las cargan)</span>${chipRow('issues', zoneOpts, q.issues, true)}</div>
      <button class="btn primary wide" id="wzGo">Ver la rutina</button>
      <button class="btn ghost wide" data-home>Cancelar</button>
    </section>
  </div>`;
}
function wizProgram(){
  const q = S.wiz.q, person = S.wiz.editId ? S.wiz.person : q.person === 'me' ? 'me' : null;
  const exKey = person === 'me' ? 'excluded' : person ? `excluded:${person}` : null;
  const excl = exKey ? kv(exKey, exKey === 'excluded' ? EXCL_DEFAULT : []) : [];
  const hist = person && person === curProf().person ? n => exHistory(n).length : () => 0;
  return genProgram({...q, eq:wizEq(q), excl, hist, days:+q.days, minutes:+q.minutes});
}
function renderWizPreview(){
  const W = S.wiz, q = W.q, P = W.prog;
  const unitTxt = (n, r) => { const m = gm(n), o = (r.rr && r.rr[n]) || P.rr[n], lo = o ? o[0] : m.lo, hi = o ? o[1] : m.hi;
    return m.unit === 'm' ? `${hi} min` : `${r.sets[n]} × ${lo}-${hi}${m.unit === 't' ? ' s' : ''}`; };
  return `<div class="stack">
    <section class="card pad stack" style="gap:10px">
      <div class="eyebrow">${esc(q.name || 'Nuevo perfil')}${q.age ? ` · ${esc(q.age)} años` : ''}</div>
      <div class="big">${esc(goalLab(q))}${secLab(q) ? ` <span class="muted" style="font-size:16px">+ ${esc(secLab(q))}</span>` : ''}</div>
      <div class="muted" style="font-size:14px">${q.days} días · ~${q.minutes} min · ${esc(LEVELS[q.level])} · ${esc((MAT[q.gym] || S.gyms.find(g => g.id === q.gym) || {name:'—'}).lab || (S.gyms.find(g => g.id === q.gym) || {}).name || '')}</div>
      <div class="eyebrow" style="margin-top:6px">Por qué esta rutina</div>
      ${P.notes.map(n => `<article class="tipc info"><div class="tipc-b">${esc(n.t)}</div>${n.ev.length ? `<div class="row" style="gap:6px">${n.ev.map(evChip).join('')}</div>` : ''}</article>`).join('')}
    </section>
    ${P.order.map(k => { const r = P.routines[k];
      return `<section class="card pad stack" style="gap:8px"><header class="row" style="justify-content:space-between"><h2>${esc(r.code)} · ${esc(r.title)}</h2><span class="faint">~${r.mins} min</span></header>
        <ul class="wz-list">${r.ex.map(n => `<li><button class="ex-name" data-guide="${esc(n)}">${esc(gm(n) && EX[n] ? EX[n][0] : n)} <span class="ex-how">▶︎</span></button><span class="num muted">${unitTxt(n, r)}</span></li>`).join('')}</ul></section>`; }).join('')}
    <p class="faint" style="font-size:12px;margin:0;text-align:center">Toca un ejercicio para ver cómo se hace. Luego puedes cambiar ejercicios durante el entreno, como siempre.</p>
    <button class="btn primary wide" id="wzSave">${W.editId ? 'Guardar cambios' : 'Guardar y empezar'}</button>
    <button class="btn ghost wide" id="wzBack">Cambiar respuestas</button>
  </div>`;
}
async function saveWizard(){
  const W = S.wiz, q = W.q;
  const id = W.editId || uid('pf');
  const person = W.editId ? W.person : q.person === 'me' ? 'me' : id;
  const name = (q.name || '').trim() || (person === 'me' ? `Luis · ${GOALS[q.main].lab}` : GOALS[q.main].lab);
  const qq = {...q, name, days:+q.days, minutes:+q.minutes};
  const prof = {id, name, person, q:qq, prog:W.prog, created: W.editId ? (profiles().find(p => p.id === id) || {}).created : dayKey(new Date())};
  const list = (kv('profiles', []) || []).filter(p => p.id !== id).concat(prof);
  await setKv('profiles', list);
  if (person !== 'me' && !MAT[q.gym]) await setKv(`gym:${person}`, q.gym);
  if (person !== 'me' && MAT[q.gym]) { /* material de casa: se crea como gimnasio para poder cambiar ejercicios al entrenar */
    let g = S.gyms.find(x => x.name === MAT[q.gym].lab);
    if (!g) { g = {id:uid('g'), name:MAT[q.gym].lab, eq:MAT[q.gym].eq.slice()}; await IDB.put('gyms', g); S.gyms.push(g); }
    await setKv(`gym:${person}`, g.id); }
  S.wiz = null; await switchProfile(id); toast(W.editId ? 'Rutina actualizada' : `Perfil "${name}" creado`);
}

/* ---------- Más: gestionar perfiles ---------- */
function renderProfilesMore(){
  const list = profiles(), cur = curProf();
  return `<div class="stack" style="margin-bottom:var(--gap, 14px)"><section class="card pad stack" style="gap:10px">
    <header class="row" style="justify-content:space-between"><h2>Perfiles y objetivos</h2><button class="btn small" data-home>+ Nuevo</button></header>
    <p class="muted" style="margin:0;font-size:14px">Cada perfil tiene su rutina y su historial. Los objetivos que crees "para mí" comparten tu historial con el plan D1-D4.</p>
    <div class="sheet-list">${list.map(p => `<div class="sheet-item sess-row"><span><b>${esc(p.name)}${p.id === cur.id ? ' · activo' : ''}</b><small>${p.builtin ? `Plan ${PLAN_VERSION} · D1-D4` : p.kind === 'hevy' ? `Rutinas de Hevy · ${p.prog.order.length} rutinas · actualizadas ${esc(p.prog.created || '')}` : `${esc(goalLab(p.q))} · ${p.q.days} días · creado ${esc(p.created || '')}`}</small></span>
      <span class="row" style="gap:6px">${p.id === cur.id ? '' : `<button class="btn small" data-prof="${esc(p.id)}">Usar</button>`}${p.builtin ? '' : `<button class="btn small ghost" ${p.kind === 'hevy' ? 'data-hevyredo' : `data-profredo="${esc(p.id)}"`}>Rehacer</button><button class="btn small ghost" data-profdel="${esc(p.id)}" aria-label="Borrar ${esc(p.name)}">✕</button>`}</span></div>`).join('')}</div>
    <div id="profDelZone"></div>
    ${kv('hideBuiltin', false) ? `<label class="row muted" style="gap:8px;font-size:14px"><input type="checkbox" data-showbuiltin> Mostrar el plan D1-D4 de ejemplo</label>` : ''}
    <label class="row muted" style="gap:8px;font-size:14px"><input type="checkbox" data-extragoals ${kv('extraGoals', false) ? 'checked' : ''}> Mostrar objetivos para otras personas (mayores, rehabilitación y oposiciones)</label>
    <label class="row muted" style="gap:8px;font-size:14px"><input type="checkbox" data-askstart ${kv('askStart', false) ? 'checked' : ''}> Preguntar qué entrenamos al abrir la app</label>
  </section></div>`;
}

/* =====================================================================
   CONSEJOS POR OBJETIVO (reglas de los estudios de cada tema)
   ===================================================================== */
function weekSessions(from, to){ return S.all.filter(s => s.date >= from && s.date < to); }
const hasPat = (s, pats) => s.ex.some(e => pats.includes(meta(e.n).pat));
const isStrengthEx = n => { const m = meta(n); return !m.mins && !['balance','mob','cardio','agility','jump'].includes(m.pat); };
/* Métricas de la semana según el objetivo: [{lab, val, goal, ok, ev}] */
function goalMetrics(){
  const p = curProf(), q = p.q || {}, now = new Date(), w0 = weekStart(now), w1 = new Date(+w0 + 7*864e5);
  const ws = weekSessions(w0, w1), cw = cardioWeek(w0, w1), out = [];
  const days = pred => new Set(ws.filter(pred).map(s => dayKey(s.date))).size;
  const main = q.main, sec = q.sec;
  const strengthDays = days(s => s.ex.some(e => isStrengthEx(e.n)));
  if (main === 'mayores' || sec === 'equilibrio') {
    out.push({lab:'Días con equilibrio', val:days(s => hasPat(s, ['balance'])), goal:3, unit:'', ev:'who20'});
  }
  if (main === 'mayores') {
    out.push({lab:'Días de fuerza', val:strengthDays, goal:2, unit:'', ev:'who20'});
    out.push({lab:'Caminar o cardio', val:cw.min, goal:150, unit:' min', ev:'who20'});
  }
  if (main === 'cardio' || main === 'grasa' || sec === 'cardio') {
    out.push({lab:'Cardio', val:cw.min, goal:150, unit:' min', ev:'who20'});
    if (main === 'cardio') { const hard = S.cardio.filter(c => c.date >= w0 && c.date < w1 && c.hard).length; out.push({lab:'Sesiones intensas', val:hard, goal:1, max:2, unit:'', ev:'milanovic15'}); }
  }
  if (main === 'flex' || sec === 'flex') {
    const z = flexByZone(w0, w1);
    for (const [k, v] of Object.entries(z)) out.push({lab:`Estirar ${MUSCLES[k] ? MUSCLES[k].toLowerCase() : k}`, val:Math.round(v/60*10)/10, goal:5, unit:' min', ev:'thomas18'});
    if (!Object.keys(z).length) out.push({lab:'Estiramientos', val:0, goal:5, unit:' min por zona', ev:'thomas18'});
    out.push({lab:'Días con movilidad', val:days(s => hasPat(s, ['mob'])), goal:5, unit:'', ev:'thomas18'});
  }
  if (main === 'potencia' || sec === 'potencia') {
    const last = S.all.find(s => hasPat(s, ['jump']));
    out.push({lab:'Saltos última sesión', val:last ? jumpContacts(last) : 0, goal:main === 'potencia' ? 40 : 15, max:main === 'potencia' ? 80 : 40, unit:'', ev:'villarreal09'});
  }
  if (main === 'rehab' || sec === 'rehab') {
    const pain = recentPain(3);
    out.push({lab:`${profPainLab()} (máx. última sesión)`, val:pain.length ? pain[0] : '—', goal:4, lowerBetter:true, unit:'/10', ev:'silb07'});
  }
  if (STRENGTH_GOALS.includes(main) || main === 'opos' || main === 'potencia' || main === 'rehab') out.push({lab:'Sesiones', val:ws.length, goal:q.days || ORDER.length, unit:'', ev:'pelland'});
  return out.map(x => ({...x, ok: x.val === '—' ? null : x.lowerBetter ? x.val <= x.goal : x.max ? x.val >= x.goal && x.val <= x.max : x.val >= x.goal}));
}
function flexByZone(from, to){
  const z = {};
  for (const s of S.all) { if (s.date < from || s.date >= to) continue;
    for (const e of s.ex) { const m = meta(e.n); if (m.pat !== 'mob') continue; const mu = m.mus[0] || 'co';
      const secs = e.sets.reduce((a,x) => a + (m.time ? (x.reps || 0) : 30), 0); z[mu] = (z[mu]||0) + secs; } }
  return z;
}
const jumpContacts = s => s.ex.filter(e => meta(e.n).pat === 'jump').reduce((a,e) => a + e.sets.reduce((b,x) => b + (x.reps||0), 0), 0);
/* Dolor máximo apuntado en las últimas sesiones (de la más reciente a la más antigua) */
function recentPain(n){ const out = [];
  for (const s of S.all) { const v = s.ex.flatMap(e => e.sets.map(x => x.knee)).filter(x => x != null); if (v.length) out.push(Math.max(...v)); if (out.length >= n) break; }
  return out; }
function profWeekRows(){
  const rows = goalMetrics();
  if (!rows.length) return '';
  return `<p class="faint" style="font-size:12px;margin:2px 0 6px">Lo que piden los estudios de tu objetivo, esta semana</p>${rows.map(r => `<div class="wk-row"><span>${esc(r.lab)}</span><span class="num"><b>${r.val}</b>${r.unit} / ${r.lowerBetter ? '≤' : ''}${r.goal}${r.max ? '-' + r.max : ''}${r.unit}</span><span class="pill ${r.ok == null ? '' : r.ok ? 'good' : 'warn'}">${r.ok == null ? '—' : r.ok ? 'OK' : r.lowerBetter ? 'alto' : 'falta'}</span></div>`).join('')}`;
}
function profNotesCard(){
  const p = curProf(); if (p.builtin || !p.prog) return '';
  return `<details class="ra"><summary>Por qué tu rutina es así (${p.prog.notes.length})</summary><div class="stack" style="gap:8px;padding:8px 0">${p.prog.notes.map(n => `<article class="tipc info"><div class="tipc-b">${esc(n.t)}</div>${n.ev.length ? `<div class="row" style="gap:6px">${n.ev.map(evChip).join('')}</div>` : ''}</article>`).join('')}</div></details>`;
}
function profAdvice(){
  const p = curProf(), q = p.q, out = [], now = new Date(), cut = new Date(now - 28*864e5);
  const recent = S.all.filter(s => s.date >= cut), perWeek = recent.length / 4;
  if (S.all.length && perWeek < (q.days || 3) - .5) out.push({prio:1, kind:'warn', title:`Constancia: ${fmt1(perWeek)} sesiones por semana (plan: ${q.days})`, ev: q.main === 'mayores' ? ['who20','sher19'] : ['pelland'],
    body: q.main === 'mayores' ? 'Para reducir caídas, lo que cuenta es la constancia: unas 3 horas a la semana en total a lo largo de los meses. Si un día no da, haz solo el bloque de equilibrio (5 min).' : 'Lo que más resultado da ahora es completar las sesiones del plan, antes que cambiar ejercicios.'});
  for (const m of goalMetrics()) if (m.ok === false) {
    const t = {
      'Días con equilibrio':'Los programas que más reducen las caídas combinan equilibrio, ejercicio funcional y fuerza. El bloque de equilibrio (tándem, una pierna, marcha) se puede hacer en casa, 5 min, cualquier día.',
      'Días de fuerza':'La OMS pide fuerza de todos los grupos musculares 2 o más días a la semana.',
      'Caminar o cardio':'La OMS pide 150 min de actividad moderada a la semana. Caminar a buen ritmo cuenta.',
      'Cardio':'La OMS pide 150-300 min de actividad moderada a la semana (o 75-150 de intensa). Para perder grasa, el cardio que más te guste es el que más vas a hacer.',
      'Sesiones intensas':m.val > (m.max || 9) ? 'Más de 2 sesiones intensas por semana suma fatiga sin dar más VO2max: el resto, suave.' : 'Una sesión de intervalos largos (4 × 4 min) a la semana mejora el VO2max algo más que solo rodar suave.',
      'Días con movilidad':'Para la flexibilidad cuenta más el tiempo total a la semana que lo largo de cada sesión: sesiones cortas casi a diario.',
      'Sesiones':'Completa las sesiones del plan: el volumen semanal es lo que más pesa en el resultado.'
    }[m.lab] || (m.lab.startsWith('Estirar') ? 'Llega a 5 min por semana en cada zona; sesiones cortas casi a diario funcionan mejor que una larga.'
      : m.lab.startsWith('Saltos') ? (m.val > (m.max || 999) ? 'Demasiados saltos en una sesión: la calidad cae y la rodilla y el tobillo cargan más. Quédate en 50-80.' : 'Sube poco a poco hacia 50-80 saltos por sesión (más de 50 fue lo que mejor funcionó), siempre frescos y sin lastre.')
      : m.lab.includes('máx.') ? 'Por encima de 4/10 durante el ejercicio, baja un nivel (menos peso, menos recorrido o un ejercicio más fácil). Si al día siguiente sigue peor que lo normal, también.' : '');
    out.push({prio:1, kind: m.lowerBetter ? 'bad' : 'warn', title:`${m.lab}: ${m.val}${m.unit} (${m.lowerBetter ? 'máx.' : 'meta'} ${m.goal}${m.max ? '-' + m.max : ''}${m.unit})`, ev:[m.ev], body:t});
  }
  /* Regla del dolor: tendencia */
  if (q.main === 'rehab' || q.sec === 'rehab') { const pain = recentPain(3);
    if (pain.length >= 2 && pain[0] <= 4 && pain[0] <= pain[1]) out.push({prio:2, kind:'good', title:`${profPainLab()} estable (${pain.slice().reverse().join(' → ')}/10)`, ev:['silb07'],
      body:'Dolor dentro de lo permitido y sin empeorar. Si al día siguiente estás como siempre, sube un nivel: +1-2 repeticiones o algo de peso.'});
    if (!pain.length && S.all.length) out.push({prio:2, kind:'info', title:`Apunta el ${profPainLab().toLowerCase()} de 0 a 10`, ev:['silb07'], body:'Con el botón de cada serie. La app usa ese número para decirte si subir o bajar: hasta 4/10 durante el ejercicio está permitido.'}); }
  /* Potencia: cardio el mismo día que los saltos */
  if (q.main === 'potencia') { const sameDay = S.all.filter(s => s.date >= cut && hasPat(s, ['jump'])).filter(s => S.cardio.some(c => dayKey(c.date) === dayKey(s.date)));
    if (sameDay.length) out.push({prio:2, kind:'info', title:`Cardio el mismo día que los saltos (${sameDay.length} en 4 semanas)`, ev:['schumann22'], body:'El cardio no resta músculo ni fuerza máxima, pero sí explosividad, sobre todo en la misma sesión. Si puedes, hazlo otro día o 3 h después.'}); }
  /* Cardio: km de carrera +30 % */
  { const w0 = weekStart(now), last = cardioWeek(new Date(+w0 - 7*864e5), w0), cur = cardioWeek(w0, new Date(+w0 + 7*864e5));
    if (last.run > 0 && cur.run > last.run * 1.3) out.push({prio:1, kind:'warn', title:`Carrera: +${Math.round((cur.run/last.run - 1)*100)} % de km esta semana`, ev:['nielsen14'], body:`Los corredores novatos que subían más de un 30 % por semana se lesionaban más: no pases de <b>${fmt1(last.run*1.3)} km</b>.`}); }
  /* Hipertrofia y fuerza: volumen semanal por músculo */
  if (profStrength()) {
    const vol = volumeBy(cut, now), focus = q.sec === 'musculo' && q.muscle ? [q.muscle] : [];
    for (const mu of focus.concat(BIG.filter(x => !focus.includes(x)))) { const a = vol[mu] / 4;
      if (S.all.length >= 4 && a < 10) out.push({prio: focus.includes(mu) ? 1 : 2, kind:'warn', title:`${MUSCLES[mu]}: ${fmt1(a)} series/semana (meta 10-20)`, ev:['schoenfeld17v','pelland'], body:'Por debajo de 10 series semanales ese músculo tiene margen claro para crecer. Completa las sesiones del plan o añade 2-3 series en el día que más lo trabaja, sin pasar de ~11 por sesión.'}); }
    const dl = deloadCheck();
    if (deloadActive()) out.push({prio:1, kind:'info', title:'Semana de descarga en marcha', ev:['bell23','coleman24'], body:'La mitad de series, el mismo peso y 3 en reserva. <button class="btn small" data-deload="end">Terminarla ya</button>'});
    else if (dl.propose) out.push({prio:1, kind:'warn', title:'Toca una semana de descarga', ev:['bell23','coleman24'], body:'Mismas rutinas con la mitad de series y el mismo peso. <button class="btn small primary" data-deload="start">Empezar la descarga</button>'});
  }
  /* RIR */
  { const rr = recent.flatMap(x => x.ex.flatMap(e => e.sets)).map(x => x.rir).filter(x => x != null);
    if (rr.length >= 10) { const zero = rr.filter(x => x === 0).length / rr.length, avg = rr.reduce((a,b) => a+b, 0) / rr.length;
      if (zero >= .4) out.push({prio:2, kind:'warn', title:`Al fallo en el ${Math.round(zero*100)} % de las series`, ev:['refalo23'], body:'Ir al fallo no da más músculo y cansa más. Para 1-2 repeticiones antes.'});
      else if (avg >= 3 && profStrength()) out.push({prio:2, kind:'warn', title:`Dejas ${fmt1(avg)} reps en reserva de media`, ev:['refalo23','robinson24'], body:'Lejos del fallo el estímulo baja. Apunta a 1-2 en reserva.'}); } }
  /* Oposiciones: prueba más floja */
  if (q.main === 'opos') { const t = lastTest(p);
    if (!t) out.push({prio:1, kind:'info', title:'Haz una prueba de marcas', ev:['sanchez20'], body:'Apunta tus marcas en Progreso → Pruebas físicas. Con ellas la app te dice qué prueba te baja la media.'});
    else { const sc = testScores(p, t), worst = Object.entries(sc).filter(([,v]) => v != null).sort((a,b) => a[1] - b[1])[0];
      if (worst && worst[1] < 5) out.push({prio:1, kind: worst[1] === 0 ? 'bad' : 'warn', title:`${PN[worst[0]].lab}: ${worst[1]} puntos`, ev: worst[0] === 'run' ? ['helgerud07','milanovic15'] : worst[0] === 'ag' ? ['markovic07'] : ['sanchez20'],
        body: worst[1] === 0 ? 'Un 0 en cualquier prueba elimina. Es la prioridad de las próximas semanas.' : 'Es la prueba que más te baja la media. Dale una sesión extra a la semana.'}); } }
  if (!out.some(x => x.kind === 'warn' || x.kind === 'bad') && S.all.length) out.push({prio:4, kind:'good', title:'Vas en línea con tu objetivo', ev: (GOALS[q.main] || {ev:[]}).ev.slice(0, 2), body:'Esta semana cumples lo que piden los estudios para tu objetivo. Sigue con el plan.'});
  if (typeof weeklyBoosts === 'function') out.push(...weeklyBoosts());
  return out.sort((a,b) => a.prio - b.prio);
}
/* Consejos dentro de la rutina, según el objetivo del perfil */
function profRoutineTips(items, key){
  const p = curProf(); if (p.builtin) return [];
  const q = p.q, out = [], pats = items.map(x => meta(x.n).pat);
  if ((q.main === 'mayores' || q.sec === 'equilibrio') && !pats.includes('balance')) out.push({prio:1, kind:'warn', ev:['sher19'], title:'Esta sesión no tiene equilibrio',
    body:'Combinar equilibrio con fuerza es lo que más reduce las caídas (−34 %). Añade 2-3 ejercicios de equilibrio (tándem, a una pierna) al final.'});
  if (q.main === 'potencia' || q.sec === 'potencia') { const firstJ = pats.indexOf('jump'), firstHeavy = items.findIndex(x => isStrengthEx(x.n));
    if (firstJ > firstHeavy && firstHeavy >= 0) out.push({prio:1, kind:'warn', ev:['villarreal10','markovic07'], title:'Los saltos van primero', body:'Saltar cansado baja la calidad del salto y es lo que menos mejora la explosividad. Ponlos al principio, frescos.'});
    const contacts = items.filter(x => meta(x.n).pat === 'jump').reduce((a,x) => a + x.sets * meta(x.n).hi, 0);
    if (contacts > 100) out.push({prio:2, kind:'info', ev:['villarreal09'], title:`Hasta ${contacts} saltos en esta sesión`, body:'Por encima de 80-100 contactos la calidad baja. Quita una serie de salto.'}); }
  if (items.some(x => meta(x.n).pain)) out.push({prio:2, kind:'info', ev:['silb07'], title:'Regla del dolor', body:`Hasta 4/10 durante el ejercicio está permitido. Apunta el ${profPainLab().toLowerCase()} en cada serie: si pasa de 4 o al día siguiente estás peor, la app te baja el nivel.`});
  return out;
}

/* =====================================================================
   OPOSICIONES: registro de pruebas físicas (baremo de Policía Nacional)
   ===================================================================== */
const testKey = p => `tests:${p.id}`;
const lastTest = p => (kv(testKey(p), []) || [])[0] || null;
const PN_TESTS = sex => ['ag', sex === 'm' ? 'sus' : 'dom', 'run'];
function testScores(p, t){ const sex = p.q.sex === 'm' ? 'm' : 'h', o = {}; for (const k of PN_TESTS(sex)) o[k] = t[k] == null ? null : pnScore(k, sex, t[k]); return o; }
const fmtRun = s => s == null ? '—' : `${Math.floor(s/60)}:${pad(Math.round(s%60))}`;
const parseRun = v => { if (!v) return null; const m = /^(\d+)[:.,'](\d{1,2})$/.exec(String(v).trim()); if (m) return +m[1]*60 + +m[2]; const n = toNum(v); return n == null ? null : n < 15 ? Math.round(n*60) : n; };
function profTests(){
  const p = curProf(); if (p.builtin || p.q.main !== 'opos') return '';
  const sex = p.q.sex === 'm' ? 'm' : 'h', list = kv(testKey(p), []) || [], keys = PN_TESTS(sex);
  const fmtV = (k, v) => v == null ? '—' : k === 'run' ? fmtRun(v) : k === 'ag' ? fmt1(v) + ' s' : k === 'sus' ? Math.round(v) + ' s' : String(v);
  const row = t => { const sc = testScores(p, t), vals = keys.map(k => sc[k]).filter(v => v != null), avg = vals.length ? vals.reduce((a,b) => a+b, 0) / vals.length : null, zero = vals.includes(0);
    const pass = vals.length === keys.length && avg >= 5 && !zero;
    return `<div class="sheet-item sess-row"><span><b>${fmtDate(parseIso(t.d),{day:'numeric', month:'short', year:'numeric'})} · ${avg == null ? '—' : fmt1(avg)} de media</b><small>${keys.map(k => `${PN[k].lab.replace(' (s)','')}: ${fmtV(k, t[k])} (${sc[k] == null ? '—' : sc[k]})`).join(' · ')}</small></span><span class="pill ${vals.length < keys.length ? '' : pass ? 'good' : 'bad'}">${vals.length < keys.length ? 'incompleta' : pass ? 'apta' : zero ? 'un 0' : '< 5'}</span><button class="btn small ghost" data-testdel="${esc(t.id)}" aria-label="Borrar prueba">✕</button></div>`; };
  return `<section class="card pad stack" style="gap:10px">
    <header><h2>Pruebas físicas${p.q.opos === 'pn' ? ' · Policía Nacional' : ''}</h2></header>
    <p class="muted" style="margin:0;font-size:13px">${p.q.opos === 'pn' ? 'Se aprueba con un 5 de media y ningún 0.' : 'Puntuado con el baremo de Policía Nacional como referencia.'} Baremos de academias que coinciden con los mínimos del BOE-A-2026-15055; comprueba el Anexo II de tu convocatoria.</p>
    <div class="test-form">
      <label><span class="eyebrow">Agilidad (s)</span><input class="field" id="tsAg" inputmode="decimal" placeholder="${sex === 'm' ? '11,2' : '10,1'}"></label>
      <label><span class="eyebrow">${sex === 'm' ? 'Suspensión (s)' : 'Dominadas'}</span><input class="field" id="tsPull" inputmode="decimal" placeholder="${sex === 'm' ? '57' : '10'}"></label>
      <label><span class="eyebrow">1.000 m (m:ss)</span><input class="field" id="tsRun" inputmode="text" placeholder="${sex === 'm' ? '4:09' : '3:24'}"></label>
    </div>
    <button class="btn primary" id="tsSave">Guardar marcas de hoy</button>
    ${list.length ? `<div class="sheet-list">${list.slice(0, 6).map(row).join('')}</div>` : ''}
  </section>`;
}
async function saveTest(){
  const p = curProf(), sex = p.q.sex === 'm' ? 'm' : 'h';
  const t = {id:uid('t'), d:dayKey(new Date()), ag:toNum($('#tsAg').value), run:parseRun($('#tsRun').value)};
  t[sex === 'm' ? 'sus' : 'dom'] = toNum($('#tsPull').value);
  if (t.ag == null && t.run == null && t[sex === 'm' ? 'sus' : 'dom'] == null) { toast('Escribe al menos una marca.'); return; }
  await setKv(testKey(p), [t].concat(kv(testKey(p), []) || []));
  const sc = testScores(p, t), vals = Object.values(sc).filter(v => v != null);
  render(); toast(vals.length ? `Puntos: ${Object.entries(sc).filter(([,v]) => v != null).map(([k,v]) => `${PN[k].lab.split(' ')[0]} ${v}`).join(' · ')}` : 'Guardado');
}

/* ---------- eventos ---------- */
document.addEventListener('click', async e => {
  const t = e.target;
  if (t.closest('[data-home]')) { if (S.live) { toast('Termina o descarta el entreno en curso antes de cambiar de perfil.'); return; } S.home = true; S.wiz = null; S.lastDone = null; S.tab = 'train'; render(); window.scrollTo({top:0}); return; }
  const pf = t.closest('[data-prof]'); if (pf) return switchProfile(pf.dataset.prof);
  const wn = t.closest('[data-wiznew]'); if (wn) return newWizard(wn.dataset.wiznew);
  const redo = t.closest('[data-profredo]'); if (redo) { const p = profiles().find(x => x.id === redo.dataset.profredo); if (p) { S.tab = 'train'; newWizard(null, p); } return; }
  const pdel = t.closest('[data-profdel]');
  if (pdel) { const p = profiles().find(x => x.id === pdel.dataset.profdel);
    $('#profDelZone').innerHTML = `<div class="confirm"><span>¿Borrar el perfil "${esc(p.name)}"? Sus entrenos quedan guardados en la copia, pero dejarás de verlos.</span><button class="btn small danger" data-profdelyes="${esc(p.id)}">Sí, borrar</button></div>`; return; }
  const pdy = t.closest('[data-profdelyes]');
  if (pdy) { const id = pdy.dataset.profdelyes; await setKv('profiles', (kv('profiles', []) || []).filter(p => p.id !== id)); if (kv('profile', 'me') === id) { await setKv('profile', 'me'); applyProfile(); rebuild(); } render(); toast('Perfil borrado'); return; }
  const wz = t.closest('[data-wz]'); if (wz && S.wiz) { const [k, v] = wz.dataset.wz.split(':'); S.wiz.q[k] = /^\d+$/.test(v) && ['days','minutes'].includes(k) ? +v : v;
    if (k === 'main' && S.wiz.q.sec === v) S.wiz.q.sec = 'none';
    if (k === 'person') { const is = S.wiz.q.issues || []; S.wiz.q.issues = v === 'me' && !kv('hideBuiltin', false) ? [...new Set(is.concat('rodilla'))] : is.filter(x => x !== 'rodilla'); } /* las rodillas de Luis van marcadas por defecto */
    render(); return; }
  const wzt = t.closest('[data-wzt]'); if (wzt && S.wiz) { const [k, v] = wzt.dataset.wzt.split(':'); const a = S.wiz.q[k] || []; S.wiz.q[k] = a.includes(v) ? a.filter(x => x !== v) : a.concat(v); render(); return; }
  if (t.closest('#wzGo')) { S.wiz.prog = wizProgram(); S.wiz.step = 'preview'; render(); window.scrollTo({top:0}); return; }
  if (t.closest('#wzBack')) { S.wiz.step = 'form'; render(); window.scrollTo({top:0}); return; }
  if (t.closest('#wzSave')) return saveWizard();
  if (t.closest('#tsSave')) return saveTest();
  const td = t.closest('[data-testdel]'); if (td) { const p = curProf(); await setKv(testKey(p), (kv(testKey(p), []) || []).filter(x => x.id !== td.dataset.testdel)); render(); return; }
});
document.addEventListener('input', e => {
  const el = e.target; if (!S.wiz) return;
  if (el.id === 'wzName') S.wiz.q.name = el.value;
  if (el.id === 'wzAge') S.wiz.q.age = el.value.replace(/\D/g, '').slice(0, 3);
});
document.addEventListener('change', async e => {
  const el = e.target;
  if (el.matches && el.matches('[data-extragoals]')) { await setKv('extraGoals', el.checked); toast(el.checked ? 'Objetivos para otras personas visibles' : 'Objetivos para otras personas ocultos'); }
  if (el.matches && el.matches('[data-askstart]')) { await setKv('askStart', el.checked); toast(el.checked ? 'Te preguntaré al abrir' : 'Se abrirá directo en tu rutina'); }
});

/* =====================================================================
   RUTINAS DESDE HEVY: rehace las rutinas de una persona a partir de sus entrenos importados
   1. Agrupa las sesiones recientes por parecido de ejercicios (y por título de Hevy).
   2. Cada grupo con 2 o más sesiones es una rutina: ejercicios que aparecen en al menos la mitad
      de sus últimas 4 sesiones, en su orden habitual, con la mediana de series.
   3. El orden de la rotación es el de la última vuelta; las superseries salen de la última sesión.
   4. Si sus repeticiones habituales se alejan del rango de la app, se respeta su rango.
   ===================================================================== */
const median = a => { const b = a.slice().sort((x, y) => x - y), n = b.length; return n ? (n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2) : null; };
const quant = (a, q) => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[Math.min(b.length - 1, Math.max(0, Math.round(q * (b.length - 1))))] : null; };
function hevySessionsAll(){ return Object.values(S.hevy || {}).flat().filter(s => s && s.ex && s.ex.length).map(s => ({...s, d:parseIso(s.date)})).filter(s => !isNaN(s.d)).sort((a, b) => b.d - a.d); }
function deriveFromHevy(list){
  list = list || hevySessionsAll(); if (list.length < 2) return null;
  const cut = new Date(+list[0].d - 120 * 864e5);
  let recent = list.filter(s => s.d >= cut); if (recent.length < 6) recent = list.slice(0, 30);
  const setOf = s => new Set(s.ex.map(e => e.n));
  const jac = (a, b) => { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i || 1); };
  /* agrupar: mismo título de Hevy y ejercicios parecidos, o ejercicios muy parecidos aunque cambie el título */
  const groups = [];
  for (const s of recent) { const st = setOf(s), t = hvKey(s.title);
    let best = null, bv = 0;
    for (const g of groups) { const v = jac(st, g.core) + (g.titles[t] ? .25 : 0); if (v > bv) { bv = v; best = g; } }
    if (best && bv >= .5) { best.items.push(s); best.titles[t] = (best.titles[t] || 0) + 1; }
    else groups.push({items:[s], core:st, titles:{[t]:1}}); }
  let keep = groups.filter(g => g.items.length >= 2);
  if (!keep.length) keep = groups.slice(0, 4);
  keep = keep.sort((a, b) => b.items.length - a.items.length).slice(0, 7);
  const routines = {}, order = [], rr = {}, titleMap = {}, sessMap = {}, titleGroups = {};
  /* orden de la rotación: el de la última vez que se hizo cada rutina */
  keep.sort((a, b) => a.items[0].d - b.items[0].d);
  keep.forEach((g, gi) => {
    const last = g.items.slice(0, 4), k = 'h' + (gi + 1);
    const cnt = {}, pos = {}, sets = {};
    for (const s of last) s.ex.forEach((e, i) => { cnt[e.n] = (cnt[e.n] || 0) + 1; (pos[e.n] ||= []).push(i / Math.max(1, s.ex.length - 1)); (sets[e.n] ||= []).push(e.s.length); });
    const ex = Object.keys(cnt).filter(n => cnt[n] >= Math.max(1, Math.ceil(last.length / 2))).sort((a, b) => median(pos[a]) - median(pos[b]));
    const title = Object.entries(g.titles).sort((a, b) => b[1] - a[1])[0][0];
    const orig = g.items.find(s => hvKey(s.title) === title).title || `Rutina ${gi + 1}`;
    const st = {}; for (const n of ex) st[n] = Math.max(1, Math.min(8, Math.round(median(sets[n]))));
    /* superseries de la sesión más reciente */
    const byId = {}; for (const e of g.items[0].ex) if (e.ss != null && ex.includes(e.n)) (byId[e.ss] ||= []).push(e.n);
    const ss = Object.values(byId).filter(x => x.length > 1);
    routines[k] = {code:String.fromCharCode(65 + gi), title:orig, warm:'short', ex, sets:st, ...(ss.length ? {ss} : {})};
    order.push(k); for (const s of g.items) sessMap[s.id] = k; for (const t in g.titles) (titleGroups[t] ||= new Set()).add(k);
  });
  /* un título solo identifica la rutina si no se repite en otras (p. ej. "Morning Workout" no sirve) */
  for (const t in titleGroups) if (titleGroups[t].size === 1) titleMap[t] = [...titleGroups[t]][0];
  /* rangos de repeticiones: los suyos si se alejan mucho de los de la app; ejercicios desconocidos → ejercicio propio */
  const reps = {}; for (const s of recent.slice(0, 20)) for (const e of s.ex) for (const x of e.s) if (x[1] > 0) (reps[e.n] ||= []).push(x[1]);
  const custom = {...kv('customEx', {})}; let newCustom = 0;
  for (const k of order) for (const n of routines[k].ex) {
    const r = reps[n] || []; if (r.length < 3) continue;
    let lo = quant(r, .25), hi = quant(r, .75); if (hi - lo < 2) { const m = median(r); lo = Math.max(1, Math.round(m - 2)); hi = Math.round(m + 2); }
    if (!EX[n] || EX[n][9] === 'auto') { const d = (EX[n] || inferEx(n)).slice(); if (d[8] !== 't' && d[8] !== 'm') { d[2] = lo; d[3] = hi; } custom[n] = d; EX[n] = d; newCustom++; continue; }
    const m = EX[n]; if (m[8] === 't' || m[8] === 'm') continue;
    if (Math.abs(lo - m[2]) > 2 || Math.abs(hi - m[3]) > 3) rr[n] = [lo, hi, 0];
  }
  const weeks = Math.max(1, (recent[0].d - recent[recent.length - 1].d) / (7 * 864e5));
  const days = Math.max(2, Math.min(6, Math.round(recent.length / weeks)));
  const mins = median(recent.map(s => s.dur).filter(x => x > 10 && x < 240)) || 60;
  return {prog:{routines, order, rr, notes:[{t:`Rutinas rehechas a partir de ${pl(recent.length, 'entreno')} de Hevy: los ejercicios que repites, en tu orden y con tus series habituales. Puedes rehacerlas cuando importes de nuevo.`, ev:[]}], titleMap, sessMap, created:dayKey(new Date())},
    days, mins:Math.round(mins / 5) * 5, custom, newCustom, n:recent.length};
}
/* ¿Son las rutinas de Luis? Parecido de ejercicios con el plan D1-D4 */
function looksLikeLuis(prog){
  const base = BASE_PLAN.O.map(k => new Set(BASE_PLAN.R[k].ex));
  const sc = prog.order.map(k => { const s = new Set(prog.routines[k].ex); return Math.max(...base.map(b => { let i = 0; for (const x of s) if (b.has(x)) i++; return i / (s.size + b.size - i || 1); })); });
  return sc.length && median(sc) >= .4;
}
async function saveHevyProfile(d, opts = {}){
  const id = 'hevy', old = (kv('profiles', []) || []).find(p => p.id === id);
  const prof = {id, name: old ? old.name : 'Mis rutinas', person:'me', kind:'hevy', q:{...(old ? old.q : {main:'hip', sec:'none', level:'int', issues:[]}), days:d.days, minutes:d.mins}, prog:d.prog, created: old ? old.created : dayKey(new Date())};
  await setKv('profiles', (kv('profiles', []) || []).filter(p => p.id !== id).concat(prof));
  if (d.newCustom) await setKv('customEx', d.custom);
  if (opts.hide) await setKv('hideBuiltin', true);
  if (opts.use) { await setKv('profile', id); applyProfile(); S.pick = null; }
  else if (curProf().id === id) applyProfile();
  return prof;
}
/* Tras importar: si las rutinas no son las de Luis, se crean y se usan; si ya existían, se actualizan */
async function hevyAfterImport(){
  const d = deriveFromHevy(); if (!d || !d.prog.order.length) return '';
  const exists = (kv('profiles', []) || []).some(p => p.id === 'hevy');
  if (exists) { await saveHevyProfile(d); return `Tus ${pl(d.prog.order.length, 'rutina')} de Hevy se han actualizado.`; }
  if (looksLikeLuis(d.prog)) return '';
  await saveHevyProfile(d, {use:true, hide:true});
  return `He rehecho tus ${pl(d.prog.order.length, 'rutina')} a partir de tus entrenos: ${d.prog.order.map(k => d.prog.routines[k].title).join(', ')}. Las tienes en Entrenar.`;
}
document.addEventListener('click', async e => {
  if (!e.target.closest('[data-hevyredo]')) return;
  const d = deriveFromHevy(); if (!d || !d.prog.order.length) { toast('Importa primero tu workouts.csv de Hevy (con al menos 2 entrenos).'); return; }
  await saveHevyProfile(d, {use:true}); rebuild(); S.tab = 'train'; S.home = false; render(); window.scrollTo({top:0});
  toast(`${pl(d.prog.order.length, 'rutina')} rehechas desde Hevy`);
});
document.addEventListener('change', async e => {
  if (!e.target.matches || !e.target.matches('[data-showbuiltin]')) return;
  await setKv('hideBuiltin', !e.target.checked); if (!profiles().some(p => p.id === kv('profile', 'me'))) await setKv('profile', profiles()[0].id);
  applyProfile(); rebuild(); render();
});
