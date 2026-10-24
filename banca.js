/* =====================================================================
   BARRA LIBRE · 1.9.3 · press banca de D4 (plan v2.2)
   Meta: 100 kg × 4 repeticiones. Una serie top (3-5 reps, RIR 1) + 3 series de descarga de carga al 90 % (6-8 reps).
   Ola de 6 semanas (5 → 4 → 3 y otra vez 5 → 4 → 3 con más peso) + semana 7 de descarga. Las reglas A.5 deciden cada semana.
   El estado se guarda en kv «banca» ({mc, wk, base, fails, reset, log}) y va dentro de la copia de seguridad.
   ===================================================================== */
const BANCA_EX = 'Bench Press (Barbell)';
const WAVE_OFF = [[0, 5], [2.5, 4], [5, 3], [2.5, 5], [5, 4], [7.5, 3]];      // [kg sobre la base, reps de la serie top] de las semanas 1-6
const WARM_BENCH = [[20, 10], [40, 6], [60, 4], [70, 2]];
const BANCA_START = 93, BANCA_GOAL = {kg: 100, reps: 4};
const BANCA_HITOS = [{lab: '85 × 5', est: 99}, {lab: '92,5 × 5', est: 108}, {lab: '100 × 4', est: 100 * (1 + 4 / 30)}];
const epley = (kg, reps) => kg * (1 + reps / 30);
const r25 = v => Math.floor(v / 2.5 + .5 + 1e-9) * 2.5;                        // al 2,5 más cercano; en empate, hacia arriba
const bkey = () => typeof pkey === 'function' ? pkey('banca') : 'banca';
const bancaOn = () => typeof curProf === 'function' && curProf().builtin;
const BANCA_NEW = () => ({mc: 1, wk: 1, base: 80, fails: 0, reset: false, log: []});
function bancaState(){ const s = kv(bkey(), null); return s && typeof s === 'object' && s.base ? JSON.parse(JSON.stringify(s)) : BANCA_NEW(); }
const bancaSave = st => setKv(bkey(), st);

/* La semana de la ola que toca: peso de la serie top, reps, peso de descarga de carga y si es descarga */
function waveFor(st){
  if (st.wk >= 7) return {wk: 7, deload: true, kg: st.base + 5, reps: 3, back: null};
  const [o, reps] = WAVE_OFF[st.wk - 1], kg = st.base + o;
  return {wk: st.wk, deload: false, kg, reps, back: r25(kg * .9)};
}
const weeksToDeload = st => Math.max(0, 7 - st.wk);

/* ---------- la sesión: calentamiento fijo + serie top + descarga de carga ---------- */
function applyBanca(ex){
  if (!bancaOn()) return ex;
  const i = ex.findIndex(e => e.n === BANCA_EX && !e.from); if (i < 0) return ex;
  const w = waveFor(bancaState()), mk = t => ({kg: '', reps: '', knee: '', done: false, t});
  const sets = [...WARM_BENCH.map(() => mk('w')), mk('n'), ...Array.from({length: w.deload ? 1 : 3}, () => mk('n'))];
  ex[i] = {...ex[i], wave: {wk: w.wk, deload: w.deload, kg: w.kg, reps: w.reps, back: w.back, mc: bancaState().mc}, sets};
  return ex;
}
function waveTarget(e, j){
  const w = e.wave, s = e.sets[j];
  if (s.t === 'w') { const p = WARM_BENCH[Math.min(3, e.sets.slice(0, j).filter(x => x.t === 'w').length)]; return {kg: fmtKg(p[0]), reps: String(p[1]), prev: '—'}; }
  const idx = e.sets.slice(0, j).filter(x => x.t !== 'w').length, top = idx === 0 || w.deload;
  return {kg: fmtKg(top ? w.kg : w.back), reps: top ? String(w.reps) : '6-8', prev: top ? '—' : fmtKg(w.kg) + ' top'};
}
function waveSugg(e, sg){
  const w = e.wave;
  if (w.deload) return {...sg, tone: 'down', tag: 'DESCARGA', kg: w.kg, reps: String(w.reps), text: `Semana 7: descarga. <b>2 × 3 con ${fmtKg(w.kg)} kg</b>, deja <b>3 en reserva</b>. Descansa 3 min. Después empieza la ola nueva.`};
  return {...sg, tone: 'hold', tag: `OLA ${w.wk}/7`, kg: w.kg, reps: String(w.reps), text: `<b>Serie top: ${fmtKg(w.kg)} kg × ${w.reps}</b> a RIR 1 (1 s de pausa en el pecho, sin rebote). Después <b>3 × 6-8 con ${fmtKg(w.back)} kg</b> (90 %), RIR 1-2. Descanso 3 min tras la top. <b>Marca el RIR de la top: decide si subes.</b>`};
}
/* Descanso tras cada serie de trabajo de la banca de la ola: 3 min tras la top, 2-3 min en las demás */
function waveRest(ex, j){
  if (!ex.wave || ex.sets[j].t === 'w') return 0;
  const top = ex.sets.slice(0, j).filter(x => x.t !== 'w').length === 0 || ex.wave.deload;
  return top ? Math.max(180, restOf(ex.n)) : Math.max(150, restOf(ex.n));
}
const waveIsTop = (ex, j) => !!ex.wave && ex.sets[j].t !== 'w' && ex.sets.slice(0, j).filter(x => x.t !== 'w').length === 0;

/* ---------- reglas A.5 al terminar la sesión ---------- */
async function bancaFinish(L){
  if (L.routine !== 'd4') return null;
  const e = L.ex.find(x => x.n === BANCA_EX && x.wave); if (!e) return null;
  const done = e.sets.filter(s => s.t !== 'w' && s.done && toNum(s.reps)); if (!done.length) return null;
  const top = done[0], pl = e.wave;
  let st = bancaState();
  const pi = st.log.findIndex(x => x.sid === L.id);                       // si reabres y terminas otra vez la misma sesión, se deshace la anterior evaluación
  if (pi >= 0) { if (pi !== st.log.length - 1) return {v: 'skip', text: 'Esta sesión ya se contó en la ola; no se vuelve a evaluar.'}; const b = st.log[pi].before; st = {...st, ...b, log: st.log.slice(0, pi)}; }
  const before = {mc: st.mc, wk: st.wk, base: st.base, fails: st.fails, reset: st.reset};
  const k = toNum(top.kg) || 0, r = toNum(top.reps) || 0, rir = top.rir === '' || top.rir == null ? null : +top.rir;
  let v, text;
  if (pl.deload) {
    v = 'deload'; const wk4 = st.base + 2.5;
    const mine = st.log.filter(x => x.mc === st.mc && !x.deload);
    const comfy = mine.length >= 4 && mine.every(x => x.v === 'ok' || x.v === 'up') && mine.every(x => x.rir != null && x.rir >= 1);
    const nb = st.reset ? st.base : wk4 + (st.mc <= 2 && comfy ? 5 : 2.5);   // st.reset: tras una descarga forzada se repite la misma base
    text = st.reset ? `Descarga hecha. Empiezas la ola otra vez con la misma base: <b>${fmtKg(nb)} × 5</b> en la semana 1.`
      : `Descarga hecha. Ola nueva: la serie de 5 de la semana 1 sube a <b>${fmtKg(nb)} kg</b> (+${fmtKg(nb - st.base)} sobre la anterior${st.mc <= 2 && comfy ? '; la ola fue cómoda, así que subes +5 sobre la semana 4' : ''}). Puedes ajustarla con ± en Progreso.`;
    st = {...st, mc: st.mc + 1, wk: 1, base: nb, fails: 0, reset: false};
  } else if (k < pl.kg - 1e-6) {
    v = 'lower'; text = `Hiciste ${fmtKg(k)} kg y tocaban ${fmtKg(pl.kg)}: <b>repite esta semana</b> con el peso previsto.`;
  } else if (top.t === 'x' || r < pl.reps) {
    st.fails += 1;
    if (st.fails >= 2) {
      v = 'fail2'; const nb = r25(st.base * .95);
      text = `Segunda semana seguida sin llegar a la serie top: <b>descarga ya</b> y la base baja un 5 % (${fmtKg(st.base)} → ${fmtKg(nb)} kg). Vuelves a la ola después.`;
      st = {...st, wk: 7, base: nb, fails: 0, reset: true};
    } else { v = 'repeat'; text = `Te faltó${pl.reps - r > 1 ? 'ron ' + (pl.reps - r) + ' repeticiones' : ' 1 repetición'} en la serie top: <b>repite ${fmtKg(pl.kg)} kg × ${pl.reps}</b> la semana que viene. Si vuelve a fallar, descarga.`; }
  } else if (rir != null && rir >= 3) {
    v = 'up'; text = `Te sobraron ${rir}+ repeticiones: <b>+2,5 kg</b> en las semanas que quedan de la ola.`;
    st = {...st, base: st.base + 2.5, fails: 0, wk: st.wk + 1};
  } else {
    v = 'ok'; st = {...st, fails: 0, wk: st.wk + 1};
    text = rir == null ? 'Serie top cumplida. <b>Marca el RIR la próxima vez</b>: es lo que decide si subes.' : rir === 0 ? 'Serie top cumplida, pero sin reservas (RIR 0). Sigues el calendario; la semana que viene vigila la técnica.' : 'Serie top cumplida con reservas y buena técnica: sigues el calendario.';
  }
  st.log = [...st.log, {sid: L.id, d: L.date, mc: pl.mc || before.mc, wk: pl.wk, deload: !!pl.deload, pk: pl.kg, pr: pl.reps, kg: k, reps: r, rir, v, before}].slice(-60);
  await bancaSave(st);
  const nx = waveFor(st);
  return {v, text, next: nx.deload ? 'Próxima D4: descarga (2 × 3).' : `Próxima D4: serie top ${fmtKg(nx.kg)} × ${nx.reps}, descarga de carga ${fmtKg(nx.back)}.`};
}

/* ---------- 1RM estimado (Epley sobre repeticiones + RIR, con tope de 2 reservas) ---------- */
function bancaEst(){
  const cut = Date.now() - 84 * 864e5; let best = null;
  for (const s of S.all) { if (+s.date < cut) continue;
    for (const e of s.ex) { if (e.n !== BANCA_EX) continue;
      for (const x of e.sets) { if (['w', 'x', 'd'].includes(x.type) || !x.kg || !x.reps || x.reps > 10) continue;
        const v = epley(x.kg, x.reps + (x.rir != null ? Math.min(2, x.rir) : 0));
        if (!best || v > best.v) best = {v, kg: x.kg, reps: x.reps, rir: x.rir, date: s.date}; } } }
  return best;
}

function bancaPreview(){ if (!bancaOn()) return null; const w = waveFor(bancaState()); return w.deload ? `descarga 2 × 3 · ${fmtKg(w.kg)} kg` : `top ${fmtKg(w.kg)} × ${w.reps} + 3 × ${fmtKg(w.back)}`; }

/* ---------- tarjeta de progreso (Progreso y selector de D4) ---------- */
function bancaCard(full){
  if (!bancaOn()) return '';
  const st = bancaState(), w = waveFor(st), est = bancaEst(), goal = epley(BANCA_GOAL.kg, BANCA_GOAL.reps);
  const hit = S.all.some(x => x.ex.some(e => e.n === BANCA_EX && e.sets.some(y => !['w', 'x', 'd'].includes(y.type) && y.kg >= BANCA_GOAL.kg && y.reps >= BANCA_GOAL.reps)));   // la barra solo llega al 100 % con un 100 × 4 de verdad
  const pct = hit ? 100 : est ? Math.max(0, Math.min(98, (est.v - BANCA_START) / (goal - BANCA_START) * 100)) : 0;
  const pos = h => Math.max(0, Math.min(100, (h.est - BANCA_START) / (goal - BANCA_START) * 100));
  const lastDone = st.log[st.log.length - 1];
  const chips = [...WAVE_OFF.map(([o, r], i) => ({kg: st.base + o, r, i: i + 1})), {kg: st.base + 5, r: 3, i: 7, d: true}]
    .map(c => `<span class="bq-w ${c.i === st.wk ? 'now' : c.i < st.wk ? 'past' : ''}"><small>${c.d ? 'Desc.' : 'S' + c.i}</small><b>${fmtKg(c.kg)}×${c.r}</b></span>`).join('');
  const dl = w.deload ? '<b>Esta semana toca la descarga.</b>' : st.wk === 6 ? 'La próxima D4 es la <b>descarga</b>.' : `Descarga en ${weeksToDeload(st)} semanas de D4 (la 7.ª).`;
  return `<section class="card pad bq" aria-label="Progreso del press banca">
    <div class="eyebrow">Meta · press banca ${BANCA_GOAL.kg} kg × ${BANCA_GOAL.reps}${hit ? ' · ¡conseguida!' : ''}</div>
    <div class="bq-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}" aria-label="Progreso estimado hacia ${BANCA_GOAL.kg} por ${BANCA_GOAL.reps}"><i style="width:${pct.toFixed(1)}%"></i>${BANCA_HITOS.map(h => `<em style="left:${pos(h).toFixed(1)}%"></em>`).join('')}</div>
    <div class="bq-lab">${BANCA_HITOS.map(h => `<span style="left:${pos(h).toFixed(1)}%">${h.lab}</span>`).join('')}</div>
    <div class="bq-est"><span>${est ? `1RM estimado <b>~${Math.round(est.v)} kg</b>` : 'Sin series de banca en las últimas 12 semanas'}</span><span class="faint">meta ~${Math.round(goal)} kg</span></div>
    <p class="faint" style="font-size:12px;margin:0">Es una <b>estimación</b> (fórmula de Epley con tu mejor serie reciente${est ? `: ${fmtKg(est.kg)} × ${est.reps}${est.rir != null ? ' con ' + est.rir + ' en reserva' : ''}` : ''}), no un 1RM medido. No hace falta testearlo.</p>
    <div class="bq-wk">
      <div class="eyebrow" style="margin:8px 0 4px">Ola ${st.mc} · semana ${w.wk} de 7</div>
      <div class="bq-waves">${chips}</div>
      <p style="margin:8px 0 0;font-size:14px">${w.deload ? `Hoy: <b>2 × 3 con ${fmtKg(w.kg)} kg</b>, RIR 3.` : `Hoy: serie top <b>${fmtKg(w.kg)} kg × ${w.reps}</b> (RIR 1) y 3 × 6-8 con <b>${fmtKg(w.back)} kg</b>.`} <span class="muted">${dl}</span></p>
      ${st.fails ? '<p class="faint" style="font-size:12px;margin:4px 0 0">Una semana sin llegar a la top: si la próxima también falla, descarga inmediata.</p>' : ''}
    </div>
    ${full ? `<div class="bq-ctl"><span class="faint">Ajuste manual</span>
      <button class="chip small" data-bq="base-" aria-label="Bajar 2,5 kg la base">Base −2,5</button><button class="chip small" data-bq="base+" aria-label="Subir 2,5 kg la base">Base +2,5</button>
      <button class="chip small" data-bq="wk-" aria-label="Semana anterior de la ola">← Semana</button><button class="chip small" data-bq="wk+" aria-label="Semana siguiente de la ola">Semana →</button></div>
    ${lastDone ? `<p class="faint" style="font-size:12px;margin:6px 0 0">Última D4: ${fmtKg(lastDone.kg)} × ${lastDone.reps}${lastDone.rir != null ? ' @' + lastDone.rir : ''} (ola ${lastDone.mc}, semana ${lastDone.wk}) · ${({ok: 'cumplida', up: 'sobró: subes', repeat: 'se repite', lower: 'peso menor: se repite', fail2: 'descarga', deload: 'descarga hecha'})[lastDone.v] || ''}.</p>` : ''}
    <details class="bq-rules"><summary>Reglas para ajustar</summary><ul>
      <li>Top cumplida con RIR ≥ 1 y buena técnica → sigues el calendario.</li>
      <li>Una repetición menos a RIR 0 → repites ese peso la semana siguiente.</li>
      <li>Dos semanas seguidas sin llegar → descarga inmediata y la base baja un 5 %.</li>
      <li>RIR 3 o más en la top → +2,5 kg la semana siguiente.</li>
      <li>Marca el RIR siempre. No testees 1RM: el intento de ${BANCA_GOAL.kg} × ${BANCA_GOAL.reps} llega tras 97,5 × 4 a RIR 1 limpio y una semana de descarga.</li>
      <li>Si faltas a D4, la semana de la ola se repite, no se salta.</li></ul></details>` : ''}
  </section>`;
}
document.addEventListener('click', async e => {
  const b = e.target.closest && e.target.closest('[data-bq]'); if (!b) return;
  const st = bancaState(), a = b.dataset.bq;
  if (a === 'base-') st.base = Math.max(20, st.base - 2.5); else if (a === 'base+') st.base += 2.5;
  else if (a === 'wk-') { if (st.wk > 1) st.wk -= 1; else if (st.mc > 1) { st.mc -= 1; st.wk = 7; } }
  else if (a === 'wk+') { if (st.wk < 7) st.wk += 1; else { st.mc += 1; st.wk = 1; } }
  st.fails = 0; await bancaSave(st); render();
});
