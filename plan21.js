/* =====================================================================
   BARRA LIBRE · 1.9.2 · equivalencias entre nombres de ejercicio
   El Hevy de Luis guarda muchos ejercicios en español («Press de Piernas») y el plan usa los nombres en inglés
   («Leg Press (Machine)»). Sin esta tabla el historial viejo no alimenta las sugerencias de peso ni las marcas.
   Solo se unen ejercicios que son el mismo movimiento. El nombre original se conserva en la copia de seguridad.
   ===================================================================== */
const ALIAS_SRC = {
 'Incline Bench Press (Dumbbell)': ['Press de Banca Inclinado (Mancuerna)'],
 'Chest Fly (Machine)': ['Aperturas (Máquina)'],
 'Lateral Raise (Dumbbell)': ['Elevacion Laterales (Mancuerna)', 'Elevación Lateral (Mancuerna)'],
 'Lat Pulldown (Cable)': ['Jalón al Pecho (Cable)'],
 'Single Arm Lateral Raise (Cable)': ['Elevación Lateral a un Brazo (Cable)'],
 'Shoulder Press (Dumbbell)': ['Press de Hombros (Mancuerna)'],
 'T Bar Row': ['Remo en Punta', 'Remo en T'],
 'Leg Press (Machine)': ['Press de Piernas'],
 'Single Leg Press (Machine)': ['Press a Una Pierna'],
 'Leg Extension (Machine)': ['Extensión de Pierna'],
 'Bench Press (Barbell)': ['Press de Banca (Barra)'],
 'Bicep Curl (Cable)': ['Curl de Bíceps (Cable)'],
 'Chest Press (Machine)': ['Press de Pecho (Máquina)'],
 'Single Arm Lat Pulldown': ['Jalón al Pecho a Un Brazo'],
 'Face Pull': ['Tirón a la Cara'],
 'Hip Adduction (Machine)': ['Aducción de Caderas', 'Aducción de Cadera (Máquina)'],
 'Hip Abduction (Machine)': ['Abducción de Caderas', 'Abducción de Cadera (Máquina)'],
 'Cross Body Hammer Curl': ['Curl de Martillo Cruzado'],
 'Overhead Triceps Extension (Cable)': ['Extensión de tríceps por encima de la cabeza (cable)'],
 'Triceps Rope Pushdown': ['Jalón de tríceps con cuerda'],
 'Romanian Deadlift (Barbell)': ['Peso Muerto Rumano (Barra)'],
 'Single Leg Standing Calf Raise (Machine)': ['Elevación de Gemelos a Una Pierna (Máquina)'],
 'Chest Supported Reverse Fly (Dumbbell)': ['Vuelos Posteriores con Apoyo de Pecho (Mancuerna)'],
 'Seated Leg Curl (Machine)': ['Curl de Pierna Sentado'],
 'Cable Crunch': ['Abdominal Corto con Cable'],
 'Seated Row (Machine)': ['Remo Sentado (Máquina)'],
 'Incline Bench Press (Smith Machine)': ['Press de Banca Inclinado (Máquina Smith)'],
 'Incline Chest Press (Machine)': ['Press de Pecho Inclinado (Máquina)'],
 'Bench Press (Dumbbell)': ['Press de Banca (Mancuerna)'],
 'Pull Up': ['Dominada'],
 'Lateral Raise (Machine)': ['Elevacion Laterales (Máquina)', 'Elevación Lateral (Máquina)']
};
const aliasKey = n => String(n).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
const ALIAS = {};
for (const [en, list] of Object.entries(ALIAS_SRC)) for (const es of list) ALIAS[aliasKey(es)] = en;
/* Nombre canónico (el del plan) de un ejercicio de Hevy; si no hay equivalencia o el destino no existe, el mismo nombre */
const canonEx = n => { const c = ALIAS[aliasKey(n)]; return c && typeof EX !== 'undefined' && EX[c] ? c : n; };

/* =====================================================================
   MODO «VOY JUSTO DE TIEMPO» (1.9.2)
   Paso 1, superseries: unos 37 % menos de tiempo con hipertrofia parecida (Zhang 2025).
   Paso 2, recortes por este orden; lo principal de cada día nunca se recorta.
   Con todos los recortes de D3 el cuádriceps queda en 10 series semanales (el mínimo útil, Schoenfeld 2017).
   ===================================================================== */
const TIGHT = {
 d1: {ss:[['Lateral Raise (Dumbbell)', 'Triceps Rope Pushdown']],
      cuts:[{t:'Pushdown de tríceps', n:['Triceps Rope Pushdown']}, {t:'Aperturas en máquina', n:['Chest Fly (Machine)']}, {t:'1 serie de press en máquina', n:['Chest Press (Machine)'], minus:1}]},
 d2: {ss:[['Bicep Curl (Cable)', 'Face Pull']],
      cuts:[{t:'Bloque de tronco (Pallof y dead bug)', n:['Pallof Press', 'Dead Bug']}, {t:'Curl martillo', n:['Cross Body Hammer Curl']}, {t:'1 serie de jalón unilateral', n:['Single Arm Lat Pulldown'], minus:1}]},
 d3: {ss:[['Hip Abduction (Machine)', 'Standing Calf Raise (Machine)']],
      cuts:[{t:'Crunch en polea', n:['Cable Crunch']}, {t:'Gemelo de pie', n:['Standing Calf Raise (Machine)']}]},
 d4: {ss:[['Single Arm Lateral Raise (Cable)', 'Cable Crunch']],
      cuts:[{t:'Plancha lateral', n:['Side Plank']}, {t:'Crunch en polea', n:['Cable Crunch']}, {t:'1 serie de pájaros', n:['Chest Supported Reverse Fly (Dumbbell)'], minus:1}]},
 d5: {ss:[['Hip Abduction (Machine)', 'Hip Adduction (Machine)']],
      cuts:[{t:'Elevación de tibial anterior', n:['Tibialis Raise']}, {t:'Prensa a una pierna', n:['Single Leg Press (Machine)']}, {t:'1 serie de gemelo sentado', n:['Seated Calf Raise'], minus:1}]}
};
/* Ajuste del día según el nivel (0 normal, 1 superseries, 2 superseries + recortes) y los recortes que Luis desmarque */
function tightPlan(key, level, off = []){
  const T = TIGHT[key]; const out = {remove:[], minus:{}, ss:[], cuts:T ? T.cuts : []};
  if (!T || !level) return out;
  if (level >= 2) T.cuts.forEach((c, i) => { if (off.includes(i)) return; if (c.minus) c.n.forEach(n => { out.minus[n] = c.minus; }); else out.remove.push(...c.n); });
  out.ss = T.ss.filter(g => g.every(n => !out.remove.includes(n)));
  return out;
}
/* Aplica el ajuste a las entradas de una sesión que empieza (exEntry[]) */
function applyTight(ex, key, level, off){
  const P = tightPlan(key, level, off); if (!level) return ex;
  ex = ex.filter(e => !P.remove.includes(e.n) && !P.remove.includes(e.from));
  for (const e of ex) { const m = P.minus[e.n]; if (m) { const idx = e.sets.map((s, i) => s.t === 'w' ? -1 : i).filter(i => i >= 0); if (idx.length - m >= 2) idx.slice(-m).forEach(i => { e.sets[i] = null; }); e.sets = e.sets.filter(Boolean); } }
  P.ss.forEach((grp, gi) => { const id = 'ABCDEFGH'[gi], idx = grp.map(n => ex.findIndex(e => e.n === n || e.from === n)).filter(i => i >= 0); if (idx.length > 1) idx.forEach(i => { ex[i].ss = id; }); });
  return ex;
}
/* Minutos aproximados: 40 s por serie; en una superserie el descanso se comparte */
function estTight(names, key, level, off){
  const P = tightPlan(key, level, off); let sec = 7 * 60;
  const sets = n => Math.max(1, planSets(n, 3, key) - (P.minus[n] || 0)), used = new Set();
  for (const n of names) { if (P.remove.includes(n) || used.has(n)) continue;
    if (meta(n).mins) { sec += cardioMin(n, key) * 60; continue; }
    const g = P.ss.find(x => x.includes(n)), mates = g ? g.filter(x => names.includes(x)) : [n];
    if (mates.length > 1) { mates.forEach(x => used.add(x)); const rounds = Math.max(...mates.map(sets)); sec += mates.reduce((a, x) => a + sets(x) * 40 + 60, 0) + (rounds - 1) * Math.max(...mates.map(restOf)); }
    else { const s = sets(n); sec += s * 40 + (s - 1) * restOf(n) + 60; } }
  return Math.round(sec / 60);
}
function tightBox(key, names){
  if (!TIGHT[key]) return '';
  if (S.tightFor !== key) { S.tightFor = key; S.tcutOff = []; }
  const L = S.tight || 0, off = S.tcutOff || [], T = TIGHT[key], base = estTight(names, key, 0, off);
  const lab = [['Normal', base], ['Superseries', estTight(names, key, 1, off)], ['Más corto', estTight(names, key, 2, off)]];
  return `<div class="tight"><div class="eyebrow" style="margin:6px 0 4px">⏱ ¿Vas justo de tiempo?</div>
    <div class="chip-row">${lab.map(([t, m], i) => `<button class="chip small ${L === i ? 'on' : ''}" data-tight="${i}" aria-pressed="${L === i}">${t} · ~${m} min</button>`).join('')}</div>
    ${L === 1 ? `<p class="faint" style="font-size:12px;margin:6px 0 0">Superseries: ${T.ss.map(g => g.map(n => esc(meta(n).es)).join(' + ')).join(' · ')}. Mismas series, menos esperas (Zhang 2025: ~37 % menos de tiempo con una hipertrofia parecida).</p>` : ''}
    ${L === 2 ? `<p class="faint" style="font-size:12px;margin:6px 0 4px">Superseries y recortes por este orden (desmarca lo que no quieras quitar). No se recorta nunca lo principal del día.</p>
      ${T.cuts.map((c, i) => `<label class="row" style="gap:8px;font-size:13px;padding:2px 0"><input type="checkbox" data-tcut="${i}" ${off.includes(i) ? '' : 'checked'}> <span>Quitar: ${esc(c.t)}</span></label>`).join('')}
      ${key === 'd3' ? '<p class="faint" style="font-size:12px;margin:4px 0 0">Con estos recortes el cuádriceps sigue en 10 series semanales, el mínimo útil (Schoenfeld 2017).</p>' : ''}` : ''}
  </div>`;
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-tight]'); if (!b) return; S.tight = +b.dataset.tight; render(); });
document.addEventListener('change', e => { const c = e.target.matches && e.target.matches('[data-tcut]') ? e.target : null; if (!c) return;
  const i = +c.dataset.tcut, off = (S.tcutOff || []).filter(x => x !== i); if (!c.checked) off.push(i); S.tcutOff = off; render(); });
