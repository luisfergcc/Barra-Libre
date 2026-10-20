/* =====================================================================
   BARRA LIBRE · 1.8.0
   1. Ver otros entrenos durante una sesión (rutinas e historial), sin tocar la sesión en curso.
   2. Editor de rutinas: cambiar nombre, añadir/quitar/reordenar ejercicios, series y superseries.
      Los cambios se guardan por perfil encima del plan original (que no se modifica) y se pueden restaurar.
   3. Aplicar con un toque las mejoras que propone el análisis (botón "Aplicar" en cada aviso que lo permite).
   ===================================================================== */

/* ---------- 1. Otros entrenos (solo lectura) ---------- */
const OV = {tab:'rut'};
function ovSetsLine(it, sets, time){ return `${sets} × ${it.mins ? 'min' : time ? `${it.lo}-${it.hi} s` : `${it.lo}-${it.hi}`}`; }
function sheetOthers(){
  const L = S.live;
  const rows = ORDER.map(k => { const r = ROUTINES[k], l = lastOfRoutine(k);
    return `<button class="sheet-item sess-row" data-ovr="${k}"><span><b>${esc(r.code)} · ${esc(r.title)}</b><small>${pl(r.ex.length, 'ejercicio')} · ${l ? 'última vez ' + ago(l.date) : 'sin registros'}${L && L.routine === k ? ' · la que estás haciendo' : ''}</small></span><span class="faint">›</span></button>`; }).join('');
  const sess = S.all.slice(0, 12).map(x => { const sets = x.ex.reduce((a, e) => a + e.sets.length, 0), name = x.routine && ROUTINES[x.routine] ? ROUTINES[x.routine].code + ' · ' + ROUTINES[x.routine].title : x.title || 'Entreno';
    return `<button class="sheet-item sess-row" data-ovs="${esc(x.id)}"><span><b>${esc(name)}</b><small>${fmtDate(x.date, {weekday:'short', day:'numeric', month:'short'})} · ${pl(x.ex.length, 'ejercicio')} · ${pl(sets, 'serie')}</small></span><span class="faint">›</span></button>`; }).join('');
  openSheet(`<div class="pk-head"><h3 class="sheet-t" style="margin:0">Otros entrenos</h3><button class="btn small primary" data-sheetclose>${L ? 'Volver a mi entreno' : 'Cerrar'}</button></div>
    <p class="faint" style="font-size:12px;margin:4px 0 8px">${L ? 'Solo para mirar: tu sesión sigue como estaba.' : 'Mira tus rutinas y entrenos anteriores.'}</p>
    <div class="chip-row" style="margin-bottom:8px"><button class="chip small ${OV.tab === 'rut' ? 'on' : ''}" data-ovtab="rut">Rutinas</button><button class="chip small ${OV.tab === 'his' ? 'on' : ''}" data-ovtab="his">Últimos entrenos</button></div>
    <div class="sheet-list">${OV.tab === 'rut' ? rows : (sess || '<p class="muted">Aún no hay entrenos.</p>')}</div>`);
}
function ovExRow(n, sets, extra){
  const m = meta(n), sg = suggest(n), h = exHistory(n)[0], inLive = S.live && S.live.ex.some(e => e.n === n);
  return `<div class="ov-ex"><div class="ov-h"><button class="ex-name" data-guide="${esc(n)}"><b>${esc(m.es)}</b></button>${S.live ? (inLive ? '<span class="faint" style="font-size:12px">ya está en tu sesión</span>' : `<button class="btn small" data-ovadd="${esc(n)}">+ A mi entreno</button>`) : ''}</div>
    <div class="faint" style="font-size:13px">${esc(extra || '')}${h ? `Última vez ${ago(h.date)}: ${esc(setsText(h.sets, m.time))}` : 'Sin registros'}${sg && sg.kg && !m.mins ? ` · sugerido ${fmtKg(sg.kg)} kg` : ''}</div></div>`;
}
function sheetOtherRoutine(k){
  const r = ROUTINES[k]; if (!r) return sheetOthers();
  openSheet(`<div class="pk-head"><h3 class="sheet-t" style="margin:0">${esc(r.code)} · ${esc(r.title)}</h3><button class="btn small primary" data-sheetclose>${S.live ? 'Volver a mi entreno' : 'Cerrar'}</button></div>
    <button class="btn small" data-ovback style="margin:6px 0">‹ Otros entrenos</button>
    <div class="stack" style="gap:8px">${r.ex.map(n => ovExRow(n, planSets(n), `${planSets(n)} series de ${meta(n).lo}-${meta(n).hi}${meta(n).time ? ' s' : ''} · `)).join('')}</div>`);
}
function sheetOtherSession(id){
  const x = S.all.find(s => s.id === id); if (!x) return sheetOthers();
  const name = x.routine && ROUTINES[x.routine] ? ROUTINES[x.routine].code + ' · ' + ROUTINES[x.routine].title : x.title || 'Entreno';
  openSheet(`<div class="pk-head"><h3 class="sheet-t" style="margin:0">${esc(name)}</h3><button class="btn small primary" data-sheetclose>${S.live ? 'Volver a mi entreno' : 'Cerrar'}</button></div>
    <button class="btn small" data-ovback style="margin:6px 0">‹ Otros entrenos</button>
    <p class="faint" style="font-size:12px;margin:0 0 6px">${fmtDate(x.date, {weekday:'long', day:'numeric', month:'long'})}</p>
    <div class="stack" style="gap:8px">${x.ex.map(e => { const m = meta(e.n), inLive = S.live && S.live.ex.some(y => y.n === e.n);
      return `<div class="ov-ex"><div class="ov-h"><button class="ex-name" data-guide="${esc(e.n)}"><b>${esc(m.es)}</b></button>${S.live ? (inLive ? '<span class="faint" style="font-size:12px">ya está en tu sesión</span>' : `<button class="btn small" data-ovadd="${esc(e.n)}">+ A mi entreno</button>`) : ''}</div><div class="faint" style="font-size:13px">${esc(setsText(e.sets, m.time))}</div></div>`; }).join('')}</div>`);
}
document.addEventListener('click', e => {
  const t = e.target; if (!t.closest) return;
  if (t.closest('#liveOthers') || t.closest('[data-others]')) { e.stopPropagation(); return sheetOthers(); }
  const tab = t.closest('[data-ovtab]'); if (tab) { OV.tab = tab.dataset.ovtab; return sheetOthers(); }
  const r = t.closest('[data-ovr]'); if (r) return sheetOtherRoutine(r.dataset.ovr);
  const s = t.closest('[data-ovs]'); if (s) return sheetOtherSession(s.dataset.ovs);
  if (t.closest('[data-ovback]')) return sheetOthers();
  const add = t.closest('[data-ovadd]');
  if (add && S.live) { const n = add.dataset.ovadd; if (!S.live.ex.some(x => x.n === n)) { S.live.ex.push(exEntry(n)); scheduleSave(); add.outerHTML = '<span class="faint" style="font-size:12px">añadido a tu sesión ✓</span>'; } }
});

/* ---------- 2. Editor de rutinas ---------- */
let RE = null;
const reAll = () => kv('routineEdits', {});
const reMine = () => reAll()[curProf().id] || {};
const reNoVol = n => !!meta(n).mins;
function reDraft(k){
  const r = ROUTINES[k], gid = {}; (r.ss || []).forEach((g, gi) => g.forEach(n => gid[n] = 'ABCDEFGH'[gi]));
  return {key:k, title:r.title, ex:r.ex.map(n => ({n, sets:Math.max(1, (r.sets && r.sets[n]) || planSets(n) || 3), ss:gid[n] || null})), dirty:false, view:'edit', gfrom:null};
}
function reNormSS(ex){   // una superserie solo vale si sus ejercicios están seguidos
  const by = {}; ex.forEach((e, i) => { if (e.ss) (by[e.ss] ||= []).push(i); });
  for (const id in by) { const ix = by[id]; if (ix.length < 2 || ix.some((v, j) => j && v !== ix[j - 1] + 1)) ix.forEach(i => ex[i].ss = null); }
}
function reItems(){ return RE.ex.map(e => ({n:e.n, sets:e.sets})); }
function reShow(){
  RE.view = 'edit'; const r = ROUTINES[RE.key], orig = (reMine()[RE.key]);
  const items = reItems();
  openSheet(`<div class="pk-head"><h3 class="sheet-t" style="margin:0">Editar ${esc(r.code)}</h3><button class="btn small ghost" data-recancel>Cancelar</button></div>
    <label class="form" style="grid-template-columns:1fr;margin:8px 0"><span class="eyebrow">Nombre de la rutina</span><input class="field" id="reTitle" value="${esc(RE.title)}" maxlength="40"></label>
    <div class="re-list">${RE.ex.map((e, i) => { const m = meta(e.n), nx = RE.ex[i + 1], linked = e.ss && nx && nx.ss === e.ss, inGrp = !!e.ss;
      return `<div class="re-row ${inGrp ? 'ss' : ''}"><div class="re-top"><button class="ex-name" data-guide="${esc(e.n)}"><b>${esc(m.es)}</b></button>${inGrp ? `<span class="swap">superserie ${esc(e.ss)}</span>` : ''}</div>
        <div class="re-act"><button class="btn small" data-reup="${i}" ${i ? '' : 'disabled'} aria-label="Subir">↑</button><button class="btn small" data-redn="${i}" ${nx ? '' : 'disabled'} aria-label="Bajar">↓</button>
        ${reNoVol(e.n) ? '<span class="faint" style="font-size:13px;margin:0 6px">minutos</span>' : `<span class="re-sets"><button class="btn small" data-rem="${i}" aria-label="Menos series">−</button><b class="num">${e.sets}</b><button class="btn small" data-rep="${i}" aria-label="Más series">+</button><span class="faint" style="font-size:12px">series</span></span>`}
        <button class="btn small ${linked ? 'primary' : ''}" data-ress="${i}" ${nx ? '' : 'disabled'} aria-label="Superserie con el siguiente" title="Superserie con el siguiente">⛓</button>
        <button class="btn small danger" data-redel="${i}" aria-label="Quitar">✕</button></div></div>`; }).join('') || '<p class="muted">Sin ejercicios. Añade al menos uno.</p>'}</div>
    <button class="btn wide" data-readd>+ Añadir ejercicio</button>
    <div id="reRA" style="margin-top:10px">${renderRA(items, RE.key, false, {draft:true})}</div>
    <div class="row" style="gap:8px;margin-top:12px"><button class="btn primary" style="flex:1" data-resave ${RE.ex.length ? '' : 'disabled'}>Guardar</button>${orig ? '<button class="btn ghost" data-rereset>Restaurar original</button>' : ''}</div>
    <p class="faint" style="font-size:12px;margin:8px 0 0">${curProf().builtin ? 'Es un ajuste personal: el plan oficial D1-D4 del Proyecto no cambia. Si quieres que el cambio pase al plan, dímelo y lo actualizamos.' : 'Los cambios se guardan solo en este perfil.'}</p>`);
}
function reOpen(k){ if (!ROUTINES[k]) return; RE = reDraft(k); reShow(); }
function reAdd(n){ RE.ex.push({n, sets:reNoVol(n) ? 1 : (meta(n).knee ? 3 : 3), ss:null}); RE.dirty = true; reShow(); }
async function reSave(){
  reNormSS(RE.ex);
  const groups = {}; RE.ex.forEach(e => { if (e.ss) (groups[e.ss] ||= []).push(e.n); });
  const sets = {}; RE.ex.forEach(e => { if (!reNoVol(e.n)) sets[e.n] = e.sets; });
  const all = {...reAll()}, mine = {...(all[curProf().id] || {})};
  mine[RE.key] = {title:(RE.title || '').trim() || ROUTINES[RE.key].title, ex:RE.ex.map(e => e.n), sets, ss:Object.values(groups)};
  all[curProf().id] = mine; await setKv('routineEdits', all);
  const key = RE.key; RE = null; closeSheet(); applyProfile(); rebuild(); S.pick = key; render(); toast('Rutina guardada');
}
async function reReset(){
  const all = {...reAll()}, mine = {...(all[curProf().id] || {})}; delete mine[RE.key]; all[curProf().id] = mine; await setKv('routineEdits', all);
  const key = RE.key; RE = null; closeSheet(); applyProfile(); rebuild(); S.pick = key; render(); toast('Rutina original restaurada');
}
/* Se aplica encima de las rutinas del perfil: lo llama applyProfile() */
function applyEdits(){
  const mine = reMine();
  for (const k in mine) { const r = ROUTINES[k], e = mine[k]; if (!r || !e || !e.ex || !e.ex.length) continue;
    r.ex = e.ex.slice(); r.sets = {...(e.sets || {})}; r.ss = (e.ss || []).map(g => g.slice()); if (e.title) r.title = e.title; r.edited = true; }
}
/* Capa que intercepta los cierres mientras el editor está abierto (se ejecuta antes que los manejadores de app.js) */
document.addEventListener('click', e => {
  if (!RE) return;
  const t = e.target; if (!t.closest) return;
  const stop = () => { e.stopPropagation(); e.preventDefault(); };
  const num = a => +t.closest(`[${a}]`).getAttribute(a);
  if (t.closest('[data-recancel]')) { stop(); RE = null; closeSheet(); return; }
  if (t.closest('.sheet-bg') && RE.view === 'edit') { stop(); if (!RE.dirty) { RE = null; closeSheet(); } else toast('Pulsa Guardar o Cancelar'); return; }
  if (t.closest('[data-sheetclose]') || t.closest('[data-guideback]')) {
    if (RE.view === 'guide' && RE.gfrom === 'pick') { stop(); RE.view = 'pick'; return pickerShell(); }
    if (RE.view !== 'edit') { stop(); return reShow(); }
    stop(); RE = null; closeSheet(); return; }
  if (RE.view === 'edit') {
    const g = t.closest('[data-guide]'); if (g) { RE.view = 'guide'; RE.gfrom = 'edit'; return; }   // app.js abre la ficha
    if (t.closest('[data-ev]')) { RE.view = 'ev'; return; }                                        // app.js abre el estudio
    if (t.closest('[data-readd]')) { stop(); RE.view = 'pick'; openPicker('routine'); return; }
    if (t.closest('[data-resave]')) { stop(); return reSave(); }
    if (t.closest('[data-rereset]')) { stop(); return reReset(); }
    if (t.closest('[data-reup]')) { stop(); const i = num('data-reup'); [RE.ex[i - 1], RE.ex[i]] = [RE.ex[i], RE.ex[i - 1]]; reNormSS(RE.ex); RE.dirty = true; return reShow(); }
    if (t.closest('[data-redn]')) { stop(); const i = num('data-redn'); [RE.ex[i + 1], RE.ex[i]] = [RE.ex[i], RE.ex[i + 1]]; reNormSS(RE.ex); RE.dirty = true; return reShow(); }
    if (t.closest('[data-rem]')) { stop(); const i = num('data-rem'); RE.ex[i].sets = Math.max(1, RE.ex[i].sets - 1); RE.dirty = true; return reShow(); }
    if (t.closest('[data-rep]')) { stop(); const i = num('data-rep'); RE.ex[i].sets = Math.min(8, RE.ex[i].sets + 1); RE.dirty = true; return reShow(); }
    if (t.closest('[data-redel]')) { stop(); RE.ex.splice(num('data-redel'), 1); reNormSS(RE.ex); RE.dirty = true; return reShow(); }
    if (t.closest('[data-ress]')) { stop(); const i = num('data-ress'), a = RE.ex[i], b = RE.ex[i + 1]; if (!b) return;
      if (a.ss && a.ss === b.ss) { b.ss = null; if (!RE.ex.some((x, k) => k !== i && x.ss === a.ss)) a.ss = null; }
      else { const used = new Set(RE.ex.map(x => x.ss).filter(Boolean)); const id = a.ss || b.ss || 'ABCDEFGH'.split('').find(x => !used.has(x)); a.ss = id; b.ss = id; }
      reNormSS(RE.ex); RE.dirty = true; return reShow(); }
    const ra = t.closest('[data-raop]'); if (ra) { stop(); return raApply(ra.dataset.raop); }
  }
  if (RE.view === 'pick' || RE.view === 'guide') {
    const g = t.closest('[data-guide]'); if (g && RE.view === 'pick') { RE.view = 'guide'; RE.gfrom = 'pick'; return; }
    const p = t.closest('[data-pkpick]'); if (p && PK.mode === 'routine') { stop(); return reAdd(p.dataset.pkpick); }
  }
}, true);
document.addEventListener('input', e => { if (RE && e.target.id === 'reTitle') { RE.title = e.target.value; RE.dirty = true; } });
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-reedit]'); if (b && !RE) reOpen(b.dataset.reedit); });

/* ---------- 3. Aplicar mejoras sugeridas con un toque ----------
   Cada aviso puede llevar una acción "op|clave|nombre|valor". Dentro del editor cambia el borrador; fuera, guarda la rutina directamente. */
function raOpDo(ex, op, n, v){
  const i = ex.findIndex(e => e.n === n);
  if (op === 'sets' && i >= 0) ex[i].sets = Math.max(1, Math.min(8, ex[i].sets + (+v)));
  else if (op === 'add' && i < 0) ex.push({n, sets:+v || 3, ss:null});
  else if (op === 'del' && i >= 0) ex.splice(i, 1);
  else if (op === 'swap' && i >= 0 && v) ex[i] = {...ex[i], n:v};
  else if (op === 'ss' && i >= 0) { const j = ex.findIndex(e => e.n === v); if (j >= 0 && j !== i) { const lo = Math.min(i, j), hi = Math.max(i, j);
      const [m] = ex.splice(hi, 1); ex.splice(lo + 1, 0, m);
      const used = new Set(ex.map(x => x.ss).filter(Boolean)), id = 'ABCDEFGH'.split('').find(x => !used.has(x)); ex[lo].ss = id; ex[lo + 1].ss = id; } }
  reNormSS(ex);
}
async function raApply(spec){
  const [key, op, n, v] = spec.split('|');
  if (op === 'rest') { await setKv('rest:' + n, +v); if (RE) return reShow(); render(); toast('Descanso cambiado a ' + fmtRest(+v)); return; }
  if (RE && RE.key === key) { raOpDo(RE.ex, op, n, v); RE.dirty = true; return reShow(); }
  const d = reDraft(key); raOpDo(d.ex, op, n, v); reNormSS(d.ex);
  const groups = {}; d.ex.forEach(e => { if (e.ss) (groups[e.ss] ||= []).push(e.n); });
  const sets = {}; d.ex.forEach(e => { if (!reNoVol(e.n)) sets[e.n] = e.sets; });
  const all = {...reAll()}, mine = {...(all[curProf().id] || {})};
  mine[key] = {title:d.title, ex:d.ex.map(e => e.n), sets, ss:Object.values(groups)}; all[curProf().id] = mine; await setKv('routineEdits', all);
  applyProfile(); rebuild(); S.pick = key; render(); toast('Mejora aplicada. Puedes deshacerla en Editar rutina → Restaurar original.');
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-raop]'); if (b && !RE) raApply(b.dataset.raop); });
