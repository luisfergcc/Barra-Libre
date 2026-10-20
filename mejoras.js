/* =====================================================================
   BARRA LIBRE · mejoras automáticas basadas en estudios (1.8.0)
   Cada línea sale de TUS datos (rutinas, series, descansos, peso, días sin entrenar) y lleva el estudio que la respalda.
   Las que cambian la rutina traen un botón "Aplicar" (se deshace en Editar rutina → Restaurar original).
   Regla del módulo: si un consejo no tiene un estudio detrás que diga lo que afirma, no se escribe.
   ===================================================================== */

/* Ejercicios que la evidencia sitúa por encima de otro para el mismo músculo (músculo más estirado) */
const LENGTH_SWAPS = [
  ['Triceps Pushdown', 'Overhead Triceps Extension (Cable)', 'maeo23', 'el tríceps creció ~40 % más con el brazo por encima de la cabeza'],
  ['Triceps Rope Pushdown', 'Overhead Triceps Extension (Cable)', 'maeo23', 'el tríceps creció ~40 % más con el brazo por encima de la cabeza'],
  ['Lying Leg Curl (Machine)', 'Seated Leg Curl (Machine)', 'maeo21', 'el femoral creció más sentado (+14 % frente a +9 % en el total de isquios, 12 semanas)']
];

/* ---------- por rutina ---------- */
function routineBoosts(items, key, ctx){
  const out = [], names = items.map(x => x.n), exc = excluded(), eq = currentGym().eq;
  const strength = typeof profStrength !== 'function' || profStrength();
  const kneeOn = typeof profKneeOn === 'function' && profKneeOn();
  const ok = n => EX[n] && !exc.has(n) && hasEq(n, eq) && !names.includes(n);
  if (!strength) return out;

  // 1. Músculo entrenado una sola vez a la semana (frecuencia 2 > 1, Schoenfeld 2016; Currier 2023)
  if (key && ROUTINES[key] && ORDER.length >= 3) for (const mu of ['es','cu','fe','pe','ho']) {
    const tot = ctx.pv[mu] || 0; if (tot < 6) continue;
    const days = ORDER.filter(k => (ctx.per[k][mu] || 0) >= 2);
    if (days.length !== 1 || days[0] !== key) continue;
    const room = k => 11 - (ctx.per[k][mu] || 0), dest = ORDER.filter(k => k !== key && room(k) >= 2)
      .sort((a, b) => Object.values(ctx.per[a]).reduce((s, v) => s + v, 0) - Object.values(ctx.per[b]).reduce((s, v) => s + v, 0))[0];
    const destNames = dest ? ROUTINES[dest].ex : [];
    const cand = dest ? Object.keys(EX).filter(n => meta(n).mus[0] === mu && !NOVOL.has(meta(n).pat) && hasEq(n, eq) && !exc.has(n) && !destNames.includes(n) && !(kneeOn && meta(n).knee))
      .sort((a, b) => exHistory(b).length - exHistory(a).length)[0] : null;
    out.push({prio:2, kind:'info', ev:['schoenfeld16freq','currier23','zaroni19'], title:`${MUSCLES[mu]}: una sola sesión a la semana (${fmt1(tot)} series)`,
      body:`Repartir las series de un músculo en 2 sesiones dio algo más de hipertrofia que concentrarlas en 1 (tamaño del efecto 0,49 frente a 0,30), aunque parte de esa ventaja puede ser simplemente más volumen. ${dest && cand ? `Si quieres probarlo, pasa 2 series al ${ROUTINES[dest].code} con <b>${esc(meta(cand).es)}</b>${kneeOn && mu === 'cu' ? '' : ''}.` : dest ? `Podrías sumar 2 series en el ${ROUTINES[dest].code}.` : 'No encuentro una rutina con hueco: solo merece la pena si te sobra tiempo.'}${kneeOn && ['cu'].includes(mu) ? ' En piernas, solo si la rodilla está en verde.' : ''}`,
      act: dest && cand ? `add|${cand}|2` : null, actKey: dest, actLab: dest && cand ? `Añadir 2 series en ${ROUTINES[dest].code}` : null});
  }

  // 2. Variante con el músculo más estirado (Maeo 2021 y 2023)
  for (const [a, b, ev, why] of LENGTH_SWAPS) if (names.includes(a) && ok(b))
    out.push({prio:2, kind:'info', ev:[ev], title:`${meta(a).es} → ${meta(b).es}`, body:`En el estudio ${why}. Cambia <b>${esc(meta(a).es)}</b> por <b>${esc(meta(b).es)}</b>; si prefieres mantener los dos, no hace falta.`, act:`swap|${a}|${b}`, actLab:'Cambiar'});

  // 3. Una sola serie, o demasiadas, en un ejercicio de músculo grande
  for (const it of items) { const m = meta(it.n); if (NOVOL.has(m.pat) || m.mins || m.time) continue;
    if (it.sets === 1 && !m.time) out.push({prio:3, kind:'info', ev:['krieger10','schoenfeld19vol'], title:`${m.es}: una sola serie`, body:'Varias series dieron más hipertrofia que una sola (tamaño del efecto 0,24 con 1 serie, 0,34 con 2-3 y 0,44 con 4-6 en el metaanálisis de Krieger). Con 2-3 series ganas casi todo el beneficio.', act:`sets|${it.n}|1`, actLab:'Añadir 1 serie'});
    if (it.sets >= 6) out.push({prio:3, kind:'info', ev:['krieger10','remmert25'], title:`${m.es}: ${it.sets} series seguidas`, body:'Entre 2-3 y 4-6 series por ejercicio no hubo diferencia significativa. Mejor reparte esas series en otro ejercicio del mismo músculo, con otro ángulo.', act:`sets|${it.n}|-1`, actLab:'Quitar 1 serie'}); }

  // 4. Descansos cortos en los básicos (Singer 2024, Schoenfeld 2016, Grgic 2017)
  for (const n of names) if (COMPOUND.has(meta(n).pat) && restOf(n) < 90)
    out.push({prio:2, kind:'info', ev:['singer24','schoenfeld16r','grgic17descanso'], title:`${meta(n).es}: descanso de ${restOf(n)} s`, body:'En los básicos, descansar poco te quita repeticiones en las series siguientes. Con 2 min o más se mantiene el volumen; en los aislamientos basta con 60-90 s.', act:`rest|${n}|120`, actLab:'Poner 2:00'});

  // 5. Esfuerzo: acércate al fallo en los aislamientos, con margen en los básicos
  const isoN = items.filter(x => ISOL.has(meta(x.n).pat)).length;
  if (isoN >= 2) out.push({prio:4, kind:'info', ev:['robinson24','grgic22','vieira21','hackett17'], title:'Esfuerzo: cuánto te acercas al fallo',
    body:'Llegar al fallo no es obligatorio para crecer (sin diferencia significativa en el metaanálisis de Grgic; en entrenados, ventaja pequeña). Una pauta razonable: básicos con 1-3 repeticiones en reserva y la última serie de cada aislamiento a 0-1. Tu estimación de las repeticiones que te quedan es fiable cerca del fallo (error de ~1) y mucho menos cuando te sobra margen.'});

  // 6. Gemelos: tramo estirado
  if (items.some(x => meta(x.n).pat === 'calf')) out.push({prio:4, kind:'info', ev:['kassiano23'], title:'Gemelos: aprovecha el tramo estirado',
    body:'En gemelos, trabajar solo en la parte estirada (talón abajo) hizo crecer el gastrocnemio más que el recorrido completo. Baja hasta el máximo, haz una pausa de 1-2 s abajo y sube sin rebotar.'});

  return out;
}

/* ---------- semanales (Progreso → Consejos) ---------- */
function weeklyBoosts(){
  const out = [], now = new Date();
  if (typeof profStrength === 'function' && !profStrength()) return out;
  const bw = bwAt(now), kneeOn = typeof profKneeOn === 'function' && profKneeOn();
  // Proteína
  out.push({prio:3, kind:'info', ev:['morton18','schoenfeld18','snijders15'], title: bw ? `Proteína: unos ${Math.round(bw * 1.6)} g al día` : 'Proteína: unos 1,6 g por kilo al día',
    body:`En el metaanálisis de 49 ensayos, por encima de ~1,6 g/kg/día no hubo más ganancia de masa magra${bw ? ` (con ${fmt1(bw)} kg son ~${Math.round(bw * 1.6)} g)` : ''}. Repartida en 3-4 comidas de ~0,4 g/kg${bw ? ` (~${Math.round(bw * .4)} g)` : ''} es lo más práctico. Una toma antes de dormir sumó en un ensayo, pero no está demostrado que la hora importe.`});
  // Peso corporal y ritmo
  const ws = S.body.filter(b => b.weight && (now - parseIso(b.id)) <= 42 * 864e5).sort((a, b) => a.id < b.id ? -1 : 1);
  if (ws.length >= 3) { const a = ws[0], b = ws[ws.length - 1], wk = (parseIso(b.id) - parseIso(a.id)) / (7 * 864e5);
    if (wk >= 2) { const r = (b.weight - a.weight) / wk;
      if (r < -.3) out.push({prio:2, kind:'warn', ev:['slater19','benito20'], title:`Peso: ${fmt1(r)} kg por semana`, body:'Si tu objetivo es ganar músculo, perder peso rápido lo frena. El superávit ideal no se conoce bien, pero se suele empezar con uno pequeño (unos 300-500 kcal al día) y ajustar según cómo respondan el peso y las cargas. Si estás en definición, ignóralo.'});
      else if (Math.abs(r) <= .1) out.push({prio:4, kind:'info', ev:['slater19','benito20'], title:`Peso estable (${fmt1(r)} kg por semana)`, body:'Con el peso estable puedes ganar algo de músculo y perder grasa a la vez, pero lentamente. Si en 6-8 semanas las cargas no suben, prueba un superávit pequeño (unos 300-500 kcal al día). Ritmo realista: en el metaanálisis, los entrenados ganaron del orden de 1 kg de masa magra en unas 10 semanas.'}); } }
  // Sueño
  out.push({prio:3, kind:'info', ev:['lamon21','knowles18'], title:'Dormir también es entrenar', body:'Una noche sin dormir bajó la síntesis de proteína muscular un 18 % al día siguiente (13 personas). Varias noches durmiendo poco restan fuerza en los básicos. Si has dormido mal: mismo peso, 1 serie menos por ejercicio y sin ir al fallo, en vez de forzar.'});
  // Cardio y pesas
  out.push({prio:3, kind:'info', ev:['schumann22','sabag18','murlasits18'], title:'Cardio y pesas en la misma semana', body:'El cardio no frena la hipertrofia (metaanálisis de Schumann); añadir HIIT a las pesas tampoco la redujo, solo algo la fuerza de piernas. Si van el mismo día, haz las pesas primero.'});
  // Pausas
  if (S.all.length) { const gap = daysAgo(S.all[0].date);
    if (gap >= 10 && gap < 28) out.push({prio:2, kind:'info', ev:['bosquet13','ogasawara13'], title:`${gap} días sin entrenar: no pasa nada`, body:'La fuerza apenas cambia hasta ~4 semanas de parada, y en un ensayo, parar 3 semanas y volver dio la misma hipertrofia final que no parar. Vuelve con tus pesos de siempre y fíate del semáforo.'});
    if (gap >= 28) out.push({prio:2, kind:'info', ev:['bosquet13'], title:`${gap} días sin entrenar`, body:'A partir de ~4 semanas las pérdidas de fuerza se aceleran. Retoma poco a poco las dos primeras semanas.'}); }
  // Periodizar o no
  out.push({prio:4, kind:'info', ev:['moesgaard22','currier23'], title:'No necesitas complicar la progresión', body:'Con el volumen igualado, periodizar o no, lineal u ondulante, no cambió la hipertrofia (sí ayudó algo a la fuerza máxima). Casi cualquier programa funciona si lo repites con constancia, varias series por ejercicio y 2 sesiones por músculo: lo que cuenta es subir pesos o repeticiones con el tiempo.'});
  // Rodilla
  if (kneeOn) out.push({prio:2, kind:'info', ev:['vanderheijden15','kongsgaard09','rio17'], title:'Rodilla: qué dice la evidencia del ejercicio', body:'En el dolor anterior de rodilla, el ejercicio regular redujo el dolor (~1,5 puntos sobre 10 a corto plazo), aunque la calidad de la evidencia es muy baja y no se sabe si es mejor cadena abierta o cerrada: adapta a lo que toleras. Si duele el tendón rotuliano: carga pesada y lenta, progresiva (Kongsgaard) o isométricos para calmar el dolor antes de entrenar (Rio, 20 deportistas).'});
  return out;
}
