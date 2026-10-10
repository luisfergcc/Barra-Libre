/* =====================================================================
   BARRA LIBRE · objetivos, estudios por objetivo y generador de rutinas
   Todo con reglas fijas (sin IA). Cada regla lleva el estudio en el que se apoya.
   ===================================================================== */

/* ---------- ejercicios nuevos: equilibrio, salto, agilidad, cardio ---------- */
Object.assign(EX, {
 'Tandem Stance':['Equilibrio en tándem (talón-punta)','co',10,30,0,30,'balance',[],'t'],
 'Single Leg Stand':['Equilibrio a una pierna','co',10,30,0,30,'balance',[],'t'],
 'Single Leg Stand (Eyes Closed)':['Equilibrio a una pierna con ojos cerrados','co',10,30,0,30,'balance',[],'t'],
 'Tandem Walk':['Marcha en tándem (pasos)','co',10,20,0,30,'balance',[]],
 'Broad Jump':['Salto horizontal','cu gl',3,6,1,120,'jump',[]],
 'Lateral Bound':['Saltos laterales a una pierna','gl cu',4,8,1,90,'jump',[]],
 'Pogo Jumps':['Saltos de tobillo (pogo)','ge',10,20,0,60,'jump',[]],
 'Agility Shuttle Run':['Agilidad: circuito o ida y vuelta','cu ge',4,8,0,120,'agility',[]],
 'Negative Pull Up':['Dominadas negativas (bajada lenta)','es bi',3,6,0,120,'pull_v',['pull']],
 'Pike Push Up':['Flexiones en pica (hombro)','ho tr',6,12,0,90,'press_v',[]],
 'Band Row':['Remo con banda elástica','es bi',12,20,0,60,'row',['band']],
 'Band Lat Pulldown':['Jalón con banda elástica','es bi',12,20,0,60,'pull_v',['band']],
 'Band Curl':['Curl de bíceps con banda','bi',12,20,0,45,'curl',['band']],
 'Band Triceps Extension':['Extensión de tríceps con banda','tr',12,20,0,45,'tri',['band']],
 'Flexed Arm Hang':['Suspensión con brazos flexionados','es bi',10,60,0,120,'iso',['pull'],'t'],
 /* Cardio: el 9.º dato 'm' = se apunta en minutos (y km opcionales en la columna de kg) */
 'Easy Run':['Rodaje suave','cu ge',20,45,1,0,'cardio',[],'m'],
 'Interval Run 4x4':['Intervalos 4×4 min','cu ge',25,35,1,0,'cardio',[],'m'],
 'Short Run Intervals':['Series cortas (200-400 m)','cu ge',20,30,1,0,'cardio',[],'m'],
 'Brisk Walk':['Caminar rápido','ge',20,60,0,0,'cardio',[],'m'],
 'Treadmill Incline Walk':['Caminata inclinada en cinta','ge cu',20,45,0,0,'cardio',[],'m'],
 'Stationary Bike':['Bici estática','cu',20,45,0,0,'cardio',[],'m'],
 'Bike Intervals':['Intervalos en bici','cu',20,30,0,0,'cardio',[],'m'],
 'Elliptical':['Elíptica','cu',20,45,0,0,'cardio',[],'m']
});
const CARDIO_EX = {'Easy Run':'run','Interval Run 4x4':'run','Short Run Intervals':'run','Brisk Walk':'walk','Treadmill Incline Walk':'walk','Stationary Bike':'bike','Bike Intervals':'bike','Elliptical':'ellip'};
Object.assign(GMAP, {'Pike Push Up':'pushup','Band Row':'row_cable','Band Lat Pulldown':'pulldown','Band Curl':'curl_cable','Band Triceps Extension':'pushdown','Tandem Stance':'tandem','Single Leg Stand':'singleleg','Single Leg Stand (Eyes Closed)':'singleleg','Tandem Walk':'walk','Broad Jump':'broad','Lateral Bound':'bound',
 'Pogo Jumps':'pogo','Agility Shuttle Run':'run','Negative Pull Up':'pullup','Flexed Arm Hang':'hang','Easy Run':'run','Interval Run 4x4':'run','Short Run Intervals':'run',
 'Brisk Walk':'walk','Treadmill Incline Walk':'walk','Stationary Bike':'bike','Bike Intervals':'bike','Elliptical':'walk'});
Object.assign(GT, {
  tandem:{view:'front', hold:true, hl:[], props:[{k:'floor'}], A:{cx:80, hy:62, ua:40, fa:40, thL:0, thR:0}, B:{cx:81, hy:62, ua:44, fa:44, thL:0, thR:0}},
  singleleg:{view:'front', hold:true, hl:['th'], props:[{k:'floor'}], A:{cx:80, hy:62, ua:50, fa:50, thL:2, shL:2, thR:-20, shR:30}, B:{cx:81, hy:62, ua:56, fa:56, thL:2, shL:2, thR:-22, shR:32}},
  broad:{hl:['th'], props:[{k:'floor'}], A:{hip:[44,84], t:140, F:[62,107], kn:'f', ua:-40, fa:-40, ft:90}, B:{hip:[104,60], t:160, F:[118,104], kn:'f', ua:120, fa:120, ft:90}},
  bound:{view:'front', hl:['th'], props:[{k:'floor'}], A:{cx:56, hy:70, thL:20, shL:-6, thR:-10, shR:30, ua:40, fa:60}, B:{cx:104, hy:70, thL:-10, shL:30, thR:20, shR:-6, ua:40, fa:60}},
  pogo:{hl:['sh'], props:[{k:'floor'}], A:{hip:[80,62], t:180, th:0, sh:0, ft:90, ua:20, fa:30, anchor:['toe',[88,107]]}, B:{hip:[80,62], t:180, th:0, sh:0, ft:50, ua:20, fa:30, anchor:['toe',[88,99]]}},
  hang:{hold:true, hl:['ua'], props:[{k:'line', p:[56,5,108,5], w:4}], A:{hip:[80,52], S:[80,20], H:[82,6], el:'fd', th:6, sh:-24, ft:30}, B:{hip:[80,53], S:[80,21], H:[82,6], el:'fd', th:6, sh:-24, ft:30}},
  run:{hl:['th'], props:[{k:'floor'}], A:{hip:[78,60], t:170, F:[100,104], F2:[56,96], kn:'f', kn2:'d', ua:-40, fa:40, ua2:40, fa2:110, ft:90, ft2:30}, B:{hip:[78,58], t:170, F:[58,96], F2:[100,104], kn:'d', kn2:'f', ua:40, fa:110, ua2:-40, fa2:40, ft:30, ft2:90}},
  bike:{hl:['th'], props:[{k:'floor'}, {k:'rect', x:50, y:62, w:18, h:4}, {k:'line', p:[60,66,74,104], w:3}, {k:'line', p:[92,40,96,104], w:3}],
    A:{hip:[60,60], t:160, H:[92,42], el:'d', F:[84,96], kn:'u', F2:[70,104], kn2:'u', ft:90, ft2:90}, B:{hip:[60,60], t:160, H:[92,42], el:'d', F:[70,104], kn:'u', F2:[84,96], kn2:'u', ft:90, ft2:90}}
});
Object.assign(GTXT, {
  tandem:{how:['De pie junto a una pared o una silla por si necesitas apoyo.','Pon un pie justo delante del otro, talón tocando la punta.','Aguanta el tiempo marcado mirando al frente. Progresión: con apoyo → un dedo → sin apoyo.'], err:['Mirar al suelo.','Quitar el apoyo antes de aguantar 10 s estable.']},
  singleleg:{how:['De pie junto a un apoyo.','Levanta un pie unos centímetros.','Aguanta el tiempo marcado. Progresión: ojos cerrados, superficie blanda y después con tareas.'], err:['Inclinar el tronco hacia un lado.','Bloquear la rodilla de apoyo.']},
  broad:{how:['Pies a la anchura de la cadera.','Baja rápido llevando los brazos atrás y salta hacia delante lo más lejos que puedas.','Cae suave con las rodillas flexionadas y alineadas.'], err:['Caer con las piernas rectas.','Rodillas hacia dentro al aterrizar.']},
  bound:{how:['Sobre una pierna, salta hacia el lado contrario.','Cae sobre la otra pierna y estabiliza 1 segundo.','Vuelve saltando al otro lado.'], err:['Rodilla hacia dentro al caer.','Encadenar sin estabilizar.']},
  pogo:{how:['De pie, rodillas casi estiradas.','Rebota sobre las puntas con saltos cortos y rápidos.','El contacto con el suelo debe ser muy breve.'], err:['Doblar mucho las rodillas.','Caer sobre los talones.']},
  hang:{how:['Agarre supino, sube (con ayuda o desde un banco) hasta la barbilla por encima de la barra.','Aguanta con los brazos flexionados y el cuerpo quieto.','Termina cuando la barbilla baja a la barra.'], err:['Balancearse.','Apoyar la barbilla en la barra.']},
  run:{how:['Calienta 5-10 min suave.','Haz el bloque marcado: rodaje suave (puedes hablar) o intervalos (4 × 4 min fuertes con 3 min suaves).','Enfría 5 min. Apunta los minutos y, si los sabes, los km.'], err:['Ir fuerte todos los días.','Subir los km más de un 30 % de una semana a otra.']},
  bike:{how:['Sillín a la altura de la cadera: rodilla casi estirada abajo.','Pedalea a ritmo cómodo o haz los intervalos marcados.','Apunta los minutos.'], err:['Sillín bajo (carga la rodilla).','Ir siempre a tope.']}
});

/* ---------- estudios por objetivo (verificados en sus resúmenes) ---------- */
EVIDENCE.push(
 {id:'who20', tema:'cardio', cita:'Bull y col. (OMS)', rev:'British Journal of Sports Medicine', year:2020, tipo:'Guía de la OMS',
  hallazgo:'Adultos: 150-300 min/semana de actividad moderada o 75-150 de vigorosa, y fuerza de todos los grupos musculares 2 o más días. Mayores: además, trabajo multicomponente con equilibrio 3 o más días.', regla:'La app avisa si tu semana no llega a 150 min de cardio moderado y 2 días de fuerza.'},
 {id:'milanovic15', tema:'cardio', cita:'Milanović y col.', rev:'Sports Medicine', year:2015, tipo:'Metaanálisis (28 estudios)',
  hallazgo:'El entrenamiento por intervalos subió el VO2max 5,5 ml/kg/min y el continuo 4,9; los intervalos ganaron por poco (+1,2), más con intervalos largos.', regla:'1-2 sesiones de intervalos largos a la semana; el resto, continuo suave.'},
 {id:'helgerud07', tema:'cardio', cita:'Helgerud y col.', rev:'Medicine & Science in Sports & Exercise', year:2007, tipo:'Ensayo aleatorizado',
  hallazgo:'Con el mismo trabajo total, 4 × 4 min al 90-95 % de la frecuencia cardiaca máxima subió el VO2max un 7,2 %, más que correr suave o a umbral.', regla:'Intervalos 4 × 4 min fuertes con 3 min suaves entre medias.'},
 {id:'rosenblat25', tema:'cardio', cita:'Rosenblat y col.', rev:'Sports Medicine', year:2025, tipo:'Metaanálisis en red (datos individuales)',
  hallazgo:'Ningún reparto de intensidades (polarizado, piramidal, umbral) fue claramente mejor para el VO2max.', regla:'La mayor parte del cardio suave y 1-2 sesiones intensas; sin dogmas.'},
 {id:'steele21', tema:'cardio', cita:'Steele y col.', rev:'Sports', year:2021, tipo:'Metaanálisis (54 ensayos)',
  hallazgo:'Intervalos y continuo moderado reducen la grasa igual (diferencia trivial, certeza alta); el efecto de cada uno es pequeño.', regla:'Para perder grasa, elige el cardio que prefieras; la comida es el factor principal.'},
 {id:'wewege22', tema:'cardio', cita:'Wewege y col.', rev:'Sports Medicine', year:2022, tipo:'Metaanálisis',
  hallazgo:'El entrenamiento de fuerza, sin dieta, redujo el porcentaje de grasa 1,46 puntos y la grasa visceral.', regla:'Para perder grasa, fuerza de cuerpo completo además del cardio.'},
 {id:'schumann22', tema:'cardio', cita:'Schumann y col.', rev:'Sports Medicine', year:2022, tipo:'Metaanálisis (43 estudios)',
  hallazgo:'Añadir cardio a la fuerza no redujo la hipertrofia ni la fuerza máxima, pero sí la fuerza explosiva, sobre todo en la misma sesión.', regla:'Si buscas potencia, cardio en otro día o 3 h después.'},
 {id:'thomas18', tema:'flex', cita:'Thomas y col.', rev:'International Journal of Sports Medicine', year:2018, tipo:'Metaanálisis (23 estudios)',
  hallazgo:'Todos los estiramientos mejoran el rango de movimiento; cuenta el tiempo semanal y la frecuencia más que la duración de cada sesión. Proponen 5 o más días y 5 o más min a la semana.', regla:'Sesiones cortas casi a diario, 5 o más min semanales por zona.'},
 {id:'konrad24', tema:'flex', cita:'Konrad y col.', rev:'Journal of Sport and Health Science', year:2024, tipo:'Metaanálisis (77 estudios)',
  hallazgo:'Estático y FNP mejoran el rango más que el balístico o dinámico; estirar más fuerte no añadió beneficio.', regla:'Estático o FNP a intensidad cómoda; el dinámico, para calentar.'},
 {id:'arntz23', tema:'flex', cita:'Arntz y col.', rev:'Sports Medicine', year:2023, tipo:'Metaanálisis (41 ensayos)',
  hallazgo:'El estiramiento crónico mejora mucho la flexibilidad; más tiempo total bajo estiramiento se asocia a más rango. En entrenados apenas cambia la fuerza.', regla:'Suma tiempo total bajo estiramiento; no esperes fuerza de estirar.'},
 {id:'warneke24', tema:'flex', cita:'Warneke y col.', rev:'Sports Medicine – Open', year:2024, tipo:'Metaanálisis (42 estudios)',
  hallazgo:'Estirar da efectos pequeños en fuerza e hipertrofia, solo con sesiones largas (15 min o más) y frecuentes; las pesas son más eficientes.', regla:'Estirar no sustituye a las pesas para ganar músculo.'},
 {id:'markovic07', tema:'potencia', cita:'Markovic', rev:'British Journal of Sports Medicine', year:2007, tipo:'Metaanálisis',
  hallazgo:'La pliometría mejoró el salto con contramovimiento un 8,7 % de media.', regla:'Incluye saltos en todo programa de explosividad.'},
 {id:'stojanovic17', tema:'potencia', cita:'Stojanović y col.', rev:'Sports Medicine', year:2017, tipo:'Metaanálisis',
  hallazgo:'Menos de 10 semanas de pliometría dio un efecto pequeño en el salto; más de 10, uno grande.', regla:'Bloques de pliometría de 10 semanas o más.'},
 {id:'villarreal09', tema:'potencia', cita:'Sáez de Villarreal y col.', rev:'Journal of Strength and Conditioning Research', year:2009, tipo:'Metaanálisis (56 estudios)',
  hallazgo:'Las mejoras de salto fueron más probables con más de 10 semanas, más de 20 sesiones y más de 50 saltos por sesión, mezclando tipos de salto; el lastre no añadió nada.', regla:'Progresa hacia 50 o más contactos por sesión, sin lastre.'},
 {id:'villarreal10', tema:'potencia', cita:'Sáez de Villarreal y col.', rev:'Journal of Science and Medicine in Sport', year:2010, tipo:'Metaanálisis',
  hallazgo:'Combinar pliometría con pesas mejoró más que una sola forma.', regla:'Combina siempre saltos con fuerza pesada.'},
 {id:'soriano15', tema:'potencia', cita:'Soriano y col.', rev:'Sports Medicine', year:2015, tipo:'Metaanálisis',
  hallazgo:'La carga que más potencia da depende del ejercicio: saltos con 0-30 % del 1RM, sentadilla con 30-70 %.', regla:'En potencia, cargas ligeras-medias a máxima velocidad.'},
 {id:'sher19', tema:'mayores', cita:'Sherrington y col.', rev:'Cochrane Database of Systematic Reviews', year:2019, tipo:'Revisión Cochrane (59 ensayos)',
  hallazgo:'El ejercicio redujo las caídas un 23 %; el de equilibrio y funcional, un 24 %, y el que combina equilibrio, funcional y fuerza, un 34 %. Solo fuerza o solo caminar: efecto incierto.', regla:'Cada sesión de mayores incluye equilibrio y ejercicio funcional.'},
 {id:'nsca19', tema:'mayores', cita:'Fragala y col. (NSCA)', rev:'Journal of Strength and Conditioning Research', year:2019, tipo:'Posicionamiento',
  hallazgo:'Fuerza 2-3 días/semana; empezar con 1 serie de 10-15 y subir a 2-3 series de 6-12; incluir potencia (subir rápido) con cargas del 40-60 %; ir al fallo no aporta.', regla:'Semanas 1-4: 1 serie de 10-15. Después, 2-3 series y una de potencia.'},
 {id:'morr23', tema:'mayores', cita:'Morrison y col.', rev:'Journal of Physiotherapy', year:2023, tipo:'Metaanálisis (19 ensayos)',
  hallazgo:'Entrenar potencia (subir rápido) mejoró algo más la función física que la fuerza clásica (evidencia de baja calidad).', regla:'Subir rápido y bajar en 2-3 s en ejercicios como levantarse de la silla.'},
 {id:'law24', tema:'rehab', cita:'Lawford y col.', rev:'Cochrane Database of Systematic Reviews', year:2024, tipo:'Revisión Cochrane (139 ensayos)',
  hallazgo:'En artrosis de rodilla, el ejercicio redujo el dolor 13 puntos de 100 y mejoró la función; ningún tipo de ejercicio fue mejor que otro.', regla:'8-12 semanas de fuerza y cardio; el tipo, el que mantengas.'},
 {id:'silb07', tema:'rehab', cita:'Silbernagel y col.', rev:'American Journal of Sports Medicine', year:2007, tipo:'Ensayo aleatorizado',
  hallazgo:'Seguir entrenando con un control del dolor (no pasar de 5/10 y que ceda a la mañana siguiente) no empeoró la recuperación del tendón.', regla:'Dolor de 4/10 o menos durante el ejercicio; si al día siguiente no vuelve a tu nivel normal, baja un nivel.'},
 {id:'hay21', tema:'rehab', cita:'Hayden y col.', rev:'Cochrane Database of Systematic Reviews', year:2021, tipo:'Revisión Cochrane (249 ensayos)',
  hallazgo:'En lumbalgia crónica, el ejercicio redujo el dolor 15 puntos de 100; ningún tipo concreto destacó.', regla:'Ejercicio regular del tipo que mantengas.'},
 {id:'owen20', tema:'rehab', cita:'Owen y col.', rev:'British Journal of Sports Medicine', year:2020, tipo:'Metaanálisis en red (89 estudios)',
  hallazgo:'En lumbalgia, Pilates y control motor destacaron para el dolor y la fuerza para la función; estirar no superó al control.', regla:'Lumbar: control motor + fuerza + cardio; estirar no es el centro.'},
 {id:'lit15', tema:'rehab', cita:'Littlewood y col.', rev:'International Journal of Rehabilitation Research', year:2015, tipo:'Revisión sistemática',
  hallazgo:'En dolor de hombro (manguito rotador), 3 series parecen mejores que 1-2, con resistencia; un dolor leve no empeora el resultado; las mejoras llegan hacia las 12 semanas.', regla:'Hombro: 3 × 10-15 con banda o polea, 12 semanas.'},
 {id:'mel18', tema:'rehab', cita:'Mellor y col. (LEAP)', rev:'BMJ', year:2018, tipo:'Ensayo aleatorizado',
  hallazgo:'En tendinopatía glútea, educación + ejercicio logró éxito en el 77 % a las 8 semanas, frente al 59 % con infiltración y el 29 % esperando.', regla:'Cadera: 8 semanas de fuerza progresiva de abductores.'},
 {id:'doh17', tema:'rehab', cita:'Doherty y col.', rev:'British Journal of Sports Medicine', year:2017, tipo:'Revisión de revisiones',
  hallazgo:'Tras un esguince de tobillo, el ejercicio redujo las recaídas (OR 0,59).', regla:'Tobillo: equilibrio obligatorio tras un esguince.'},
 {id:'hup09', tema:'rehab', cita:'Hupperets y col.', rev:'BMJ', year:2009, tipo:'Ensayo aleatorizado',
  hallazgo:'8 semanas de equilibrio en casa, 3 veces por semana, bajaron las recaídas de esguince del 33 % al 22 %.', regla:'Tobillo: 8 semanas, 3 días, progresando de suelo firme a ojos cerrados y superficie blanda.'},
 {id:'sanchez20', tema:'opos', cita:'Sánchez-Moreno y col.', rev:'Journal of Strength and Conditioning Research', year:2020, tipo:'Ensayo aleatorizado',
  hallazgo:'En dominadas, cortar cada serie al perder un 25 % de velocidad (lejos del fallo) mejoró todas las marcas; llegar mucho más cerca del fallo (50 %) no mejoró.', regla:'Dominadas: muchas series sin llegar al fallo.'}
);
for (const e of EVIDENCE) EV[e.id] = e;
Object.assign(TEMAS, {flex:'Flexibilidad', potencia:'Explosividad', cardio:'Cardio y grasa', mayores:'Mayores', rehab:'Rehabilitación', opos:'Oposiciones'});

/* ---------- objetivos ---------- */
const GOALS = {
 hip:{lab:'Hipertrofia', sub:'Ganar músculo', ic:'💪', ev:['pelland','schoenfeld17v','refalo23','remmert25']},
 fuerza:{lab:'Fuerza', sub:'Levantar más', ic:'🏋️', ev:['lopez21','pelland','remmert25']},
 grasa:{lab:'Perder grasa', sub:'Fuerza + cardio', ic:'🔥', ev:['wewege22','steele21','who20']},
 cardio:{lab:'Cardio', sub:'Correr, bici, resistencia', ic:'🏃', ev:['who20','milanovic15','helgerud07','rosenblat25','nielsen14']},
 flex:{lab:'Flexibilidad', sub:'Movilidad y estiramientos', ic:'🧘', ev:['thomas18','konrad24','arntz23','afonso21']},
 potencia:{lab:'Explosividad', sub:'Saltar y acelerar', ic:'⚡', ev:['markovic07','villarreal09','villarreal10','soriano15','schumann22']},
 rehab:{lab:'Rehabilitación', sub:'Rodilla, espalda, hombro…', ic:'🩹', ev:['silb07']},
 mayores:{lab:'Mayores', sub:'Fuerza, equilibrio y caídas', ic:'🧓', ev:['sher19','nsca19','who20','morr23']},
 opos:{lab:'Oposiciones', sub:'Policía Nacional y otras', ic:'🎯', ev:['sanchez20','helgerud07','milanovic15']}
};
const ZONES = {rodilla:{lab:'Rodilla', ev:['law24','nascimento18','willy19','silb07']}, lumbar:{lab:'Zona lumbar', ev:['hay21','owen20','silb07']},
  hombro:{lab:'Hombro', ev:['lit15','silb07']}, cadera:{lab:'Cadera', ev:['mel18','silb07']}, tobillo:{lab:'Tobillo', ev:['doh17','hup09']}};
const SECS = {none:'Ninguno', rehab:'Cuidar una zona', musculo:'Mejorar un músculo', flex:'Flexibilidad', cardio:'Cardio', equilibrio:'Equilibrio', potencia:'Explosividad', fuerza:'Fuerza'};

/* ---------- huecos de ejercicio (por orden de preferencia) ---------- */
const SLOT = {
 squat:['Leg Press (Machine)','Goblet Squat','Squat (Smith Machine)','Hack Squat (Machine)','Squat (Barbell)','Goblet Box Squat','Bodyweight Squat','Sit to Stand'],
 hinge:['Romanian Deadlift (Barbell)','Romanian Deadlift (Dumbbell)','Trap Bar Deadlift','Cable Pull Through','Back Extension (Hyperextension)','Single Leg Romanian Deadlift (Dumbbell)','Single Leg Glute Bridge','Glute Bridge'],
 lunge:['Bulgarian Split Squat','Reverse Lunge (Dumbbell)','Split Squat (Dumbbell)','Step Up (Dumbbell)','Lateral Lunge'],
 quad:['Leg Extension (Machine)','Spanish Squat','Wall Sit','Terminal Knee Extension (Band)','Bodyweight Squat'],
 ham:['Seated Leg Curl (Machine)','Lying Leg Curl (Machine)','Nordic Hamstring Curl','Single Leg Romanian Deadlift (Dumbbell)','Single Leg Glute Bridge'],
 calf:['Single Leg Standing Calf Raise (Machine)','Seated Calf Raise','Calf Raise (Dumbbell)','Calf Raise (Bodyweight)'],
 hpush:['Bench Press (Dumbbell)','Chest Press (Machine)','Bench Press (Barbell)','Push Up','Incline Push Up','Knee Push Up','Decline Push Up'],
 ipush:['Incline Bench Press (Dumbbell)','Incline Chest Press (Machine)','Incline Bench Press (Smith Machine)','Incline Bench Press (Barbell)','Decline Push Up','Incline Push Up'],
 vpush:['Shoulder Press (Dumbbell)','Shoulder Press (Machine)','Landmine Press','Overhead Press (Barbell)','Arnold Press (Dumbbell)','Pike Push Up'],
 vpull:['Lat Pulldown (Cable)','Pull Up','Assisted Pull Up','Chin Up','Single Arm Lat Pulldown','Straight Arm Lat Pulldown (Cable)','Band Lat Pulldown'],
 hpull:['Seated Row (Machine)','Seated Cable Row - V Grip (Cable)','Chest Supported Incline Row (Dumbbell)','Dumbbell Row','Inverted Row','T Bar Row','Band Row'],
 fly:['Chest Fly (Machine)','Cable Fly Crossovers','Chest Fly (Dumbbell)','Push Up'],
 lat:['Lateral Raise (Dumbbell)','Lateral Raise (Machine)','Single Arm Lateral Raise (Cable)','Lateral Raise (Band)'],
 rear:['Face Pull','Rear Delt Reverse Fly (Machine)','Chest Supported Reverse Fly (Dumbbell)','Band Pull Apart','Reverse Fly (Dumbbell)'],
 bi:['Bicep Curl (Cable)','Incline Curl (Dumbbell)','Bicep Curl (Dumbbell)','Hammer Curl (Dumbbell)','EZ Bar Curl','Band Curl'],
 tri:['Overhead Triceps Extension (Cable)','Overhead Triceps Extension (Dumbbell)','Triceps Pushdown','Skullcrusher (Dumbbell)','Band Triceps Extension','Diamond Push Up'],
 abd:['Hip Abduction (Machine)','Hip Abduction (Cable)','Band Lateral Walk','Side Lying Leg Raise','Clamshell'],
 add:['Hip Adduction (Machine)','Copenhagen Plank'],
 core:['Cable Crunch','Crunch (Machine)','Dead Bug','Pallof Press','Plank','Crunch'],
 balance:['Tandem Stance','Single Leg Stand','Tandem Walk','Single Leg Stand (Eyes Closed)'],
 jump:['Squat Jump','Box Jump','Broad Jump','Pogo Jumps','Lateral Bound'],
 power:['Kettlebell Swing','Squat Jump','Broad Jump'],
 heavy:['Trap Bar Deadlift','Squat (Barbell)','Leg Press (Machine)','Goblet Squat'],
 run_easy:['Easy Run','Treadmill Incline Walk','Stationary Bike','Elliptical','Brisk Walk'],
 run_int:['Interval Run 4x4','Bike Intervals','Short Run Intervals'],
 stretch_low:['Hip Flexor Stretch','90/90 Hip Stretch','Hamstring Stretch','Couch Stretch','Calf Stretch','Deep Squat Hold'],
 stretch_up:['Cat Cow','Thoracic Rotation','Doorway Pec Stretch',"Child's Pose",'Dead Hang']
};
/* Si no hay material para un hueco, se usa el siguiente más parecido */
const FALLBACK = {vpull:'hpull', hpull:'rear', ipush:'hpush', fly:'hpush', vpush:'ipush', lat:'rear', bi:'hpull', tri:'hpush', quad:'squat', squat:'lunge', lunge:'squat', ham:'hinge', hinge:'ham', abd:'core', add:'core', calf:'core', heavy:'squat', power:'jump'};
const MUS_SLOT = {pe:['fly','ipush'], es:['hpull','vpull'], ho:['lat','rear'], bi:['bi'], tr:['tri'], cu:['quad','squat'], fe:['ham','hinge'], gl:['abd','hinge'], ge:['calf'], co:['core'], ad:['add']};
const AVOID = {
 rodilla:['Squat (Barbell)','Front Squat (Barbell)','Hack Squat (Machine)','Pendulum Squat (Machine)','Bulgarian Split Squat','Walking Lunge (Dumbbell)','Box Jump','Squat Jump','Burpee','Lateral Bound','Broad Jump','Deep Squat Hold','Pogo Jumps','Short Run Intervals'],
 hombro:['Overhead Press (Barbell)','Chest Dip','Bench Dip','Upright Row (Cable)','Skullcrusher (Barbell)','Bench Press (Barbell)','Dead Hang','Arnold Press (Dumbbell)'],
 lumbar:['Deadlift (Barbell)','Good Morning (Barbell)','Bent Over Row (Barbell)','Pendlay Row (Barbell)','Squat (Barbell)','T Bar Row','Romanian Deadlift (Barbell)','Hanging Leg Raise','Kettlebell Swing'],
 cadera:['Bulgarian Split Squat','Deep Squat Hold','Lateral Lunge','90/90 Hip Stretch']
};
/* Protocolos por zona (fase inicial; la app propone avanzar con la regla del dolor) */
const REHAB = {
 rodilla:{a:['Wall Sit','Terminal Knee Extension (Band)','Hip Abduction (Machine)','Leg Extension (Machine)','Glute Bridge','Calf Raise (Bodyweight)'],
          b:['Spanish Squat','Lateral Step Down','Side Lying Leg Raise','Goblet Box Squat','Seated Leg Curl (Machine)','Clamshell'], warm:'short'},
 lumbar:{a:['Cat Cow','Bird Dog','Dead Bug','Glute Bridge','Goblet Box Squat','Brisk Walk'],
         b:['Cat Cow','Pallof Press','Back Extension (Hyperextension)','Romanian Deadlift (Dumbbell)','Side Plank','Brisk Walk'], warm:'short'},
 hombro:{a:['External Rotation (Cable)','Face Pull','Seated Row (Machine)','Lateral Raise (Band)','Incline Push Up'],
         b:['External Rotation (Cable)','Band Pull Apart','Chest Supported Incline Row (Dumbbell)','Landmine Press','Doorway Pec Stretch'], warm:'short'},
 cadera:{a:['Hip Abduction (Machine)','Side Lying Leg Raise','Glute Bridge','Sit to Stand','Hip Flexor Stretch'],
         b:['Clamshell','Band Lateral Walk','Step Up (Dumbbell)','Single Leg Glute Bridge','Calf Raise (Bodyweight)'], warm:'short'},
 tobillo:{a:['Single Leg Stand','Calf Raise (Bodyweight)','Tandem Stance','Tandem Walk','Calf Stretch'],
          b:['Single Leg Stand (Eyes Closed)','Single Leg Standing Calf Raise (Machine)','Pogo Jumps','Lateral Step Down','Calf Stretch'], warm:'short'}
};

/* ---------- sesiones tipo por objetivo y días ---------- */
const S3 = (k, n) => [k, n];
const SPLIT = {
 FB_A:['Cuerpo completo A', [S3('squat',3), S3('hpush',3), S3('hpull',3), S3('hinge',2), S3('lat',2), S3('bi',2), S3('core',2)]],
 FB_B:['Cuerpo completo B', [S3('hinge',3), S3('vpull',3), S3('ipush',3), S3('lunge',2), S3('rear',2), S3('tri',2), S3('calf',2)]],
 FB_C:['Cuerpo completo C', [S3('quad',3), S3('vpush',3), S3('hpull',3), S3('ham',3), S3('fly',2), S3('bi',2), S3('tri',2)]],
 U1:['Torso A', [S3('hpush',3), S3('hpull',3), S3('vpush',3), S3('vpull',3), S3('lat',3), S3('bi',2), S3('tri',2)]],
 L1:['Pierna A', [S3('squat',3), S3('hinge',3), S3('quad',3), S3('ham',3), S3('calf',3), S3('core',2)]],
 U2:['Torso B', [S3('ipush',3), S3('vpull',3), S3('hpull',3), S3('fly',2), S3('rear',3), S3('tri',3), S3('bi',3)]],
 L2:['Pierna B', [S3('hinge',3), S3('lunge',3), S3('ham',3), S3('quad',3), S3('abd',2), S3('core',2)]],
 PUSH:['Empuje', [S3('hpush',3), S3('ipush',3), S3('vpush',3), S3('lat',3), S3('tri',3)]],
 PULL:['Tirón', [S3('vpull',3), S3('hpull',3), S3('rear',3), S3('bi',3), S3('core',2)]],
 LEGS:['Pierna', [S3('squat',3), S3('hinge',3), S3('lunge',3), S3('quad',2), S3('ham',3), S3('calf',3)]]
};
const SPLITS = {2:['FB_A','FB_B'], 3:['FB_A','FB_B','FB_C'], 4:['U1','L1','U2','L2'], 5:['U1','L1','PUSH','PULL','LEGS'], 6:['PUSH','PULL','LEGS','PUSH','PULL','LEGS']};

/* ---------- generador ---------- */
const gm = n => { const m = EX[n] || [n,'',8,12,0,90,'other',[]]; return {mus:m[1] ? m[1].split(' ') : [], lo:m[2], hi:m[3], knee:!!m[4], rest:m[5], pat:m[6], eq:m[7], unit:m[8] || 'r'}; };
function genProgram(q){
  const eq = q.eq || [], issues = new Set(q.issues || []), excl = new Set(q.excl || []), used = new Set(), hist = q.hist || (() => 0);
  const avoid = new Set([].concat(...[...issues].map(z => AVOID[z] || [])));
  const ok = n => EX[n] && !excl.has(n) && !avoid.has(n) && gm(n).eq.every(x => eq.includes(x));
  const pick = (slot, allowUsed, depth = 0) => {
    const list = Array.isArray(slot) ? slot : (SLOT[slot] || []);
    const valid = list.filter(n => ok(n) && (allowUsed || !used.has(n)));
    if (!valid.length) {
      if (!allowUsed && list.some(ok)) return pick(slot, true);            // ya usado en esta sesión de otro hueco: repetir antes que dejarlo vacío
      const fb = !Array.isArray(slot) && FALLBACK[slot]; return fb && depth < 4 ? pick(fb, allowUsed, depth + 1) : null;
    }
    const fam = valid.slice(0, 3).find(n => hist(n) >= 3);
    const n = fam || valid[0]; used.add(n); return n;
  };
  const lvl = q.level || 'int', main = q.main, rr = {}, notes = [], routines = {}, order = [];
  const addR = (title, items, warm = ['hip','fuerza','grasa','potencia','opos'].includes(main) ? 'short' : 'none') => {
    const k = 'r' + (order.length + 1), code = String.fromCharCode(65 + order.length);
    const ex = [], sets = {};
    for (const [n, s] of items) if (n && !ex.includes(n)) { ex.push(n); sets[n] = Math.max(1, s); }
    routines[k] = {code, title, warm, ex, sets}; order.push(k);
  };
  const lvlSets = s => lvl === 'pri' ? Math.max(2, s - 1) : lvl === 'ava' ? s + (s >= 3 ? 1 : 0) : s;
  const days = Math.max(2, Math.min(6, q.days || 3));

  if (main === 'hip' || main === 'fuerza' || main === 'grasa') {
    const strDays = main === 'grasa' ? Math.min(days, 3) : days;
    const plan = SPLITS[Math.max(2, Math.min(6, strDays))];
    plan.forEach((key, idx) => {
      if (idx >= 3 && plan[idx - 3] === key) used.clear(); // segunda vuelta de un split repetido: puede repetir ejercicios
      const [title, slots] = SPLIT[key];
      const items = slots.map(([sl, s]) => [pick(sl), lvlSets(s)]);
      addR(title + (plan.indexOf(key) !== idx ? ' (2)' : ''), items, idx === 0 ? 'full' : 'short');
    });
    if (main === 'fuerza') for (const k of order) routines[k].ex.slice(0, 2).forEach(n => { if (gm(n).unit === 'r' && ['squat','hinge','press_h','press_inc','press_v','row','pull_v'].includes(gm(n).pat)) rr[n] = [lvl === 'pri' ? 5 : 3, lvl === 'pri' ? 8 : 6, 180]; });
    if (main === 'grasa') {
      for (let i = order.length; i < days; i++) addR(i % 2 ? 'Cardio a intervalos' : 'Cardio suave', [[pick(i % 2 ? 'run_int' : 'run_easy', true), 1]]);
      notes.push({t:'La comida es el factor principal para perder grasa; el ejercicio ayuda y conserva el músculo. Fuerza y cardio queman grasa de forma parecida: elige el cardio que más te guste.', ev:['steele21','wewege22']});
    }
    balanceVolume(routines, order, main === 'grasa' ? [6, 12] : main === 'fuerza' ? [8, 14] : [10, 16]);
    notes.push(main === 'fuerza'
      ? {t:'Los dos primeros básicos de cada día van a 3-6 repeticiones con 3 min de descanso: la fuerza responde mejor a cargas altas y a entrenar cada movimiento 2 o más veces por semana.', ev:['lopez21','pelland','nunes21']}
      : {t:'Cada músculo grande recibe unas 10-16 series a la semana, sin pasar de ~11 en una sesión, con series a 1-2 repeticiones del fallo.', ev:['pelland','remmert25','refalo23']});
  }
  else if (main === 'cardio') {
    const hiit = days >= 4 ? 2 : 1, strength = days >= 4 ? 2 : days >= 3 ? 1 : 0;
    for (let i = 0; i < days; i++) {
      const isH = i % 2 === 1 && i <= hiit * 2 - 1, withStr = i < strength * 2 && i % 2 === 0;
      const items = [[pick(isH ? 'run_int' : 'run_easy', true), 1]];
      if (withStr) items.push([pick('squat', true), 2], [pick('hpush', true), 2], [pick('hpull', true), 2], [pick('core', true), 2]);
      addR(isH ? 'Intervalos' : withStr ? 'Cardio suave + fuerza' : 'Cardio suave', items);
    }
    notes.push({t:'La mayor parte suave (puedes hablar) y 1-2 sesiones de intervalos 4 × 4 min. Sube los minutos poco a poco: no más de un 30 % de una semana a otra si corres.', ev:['milanovic15','helgerud07','rosenblat25','nielsen14']});
    notes.push({t:'Meta mínima de la OMS: 150 min de cardio moderado y 2 días de fuerza a la semana.', ev:['who20']});
  }
  else if (main === 'flex') {
    const A = ['stretch_low','stretch_low','stretch_low','stretch_low'], B = ['stretch_up','stretch_up','stretch_up','stretch_up'];
    for (let i = 0; i < days; i++) {
      used.clear(); const low = i % 2 === 0;
      const items = (low ? A : B).map(sl => [pick(sl), 3]);
      items.push([pick(low ? ['Romanian Deadlift (Dumbbell)','Goblet Squat','Goblet Box Squat','Bodyweight Squat'] : ['Lat Pulldown (Cable)','Pullover (Dumbbell)','Face Pull','Band Pull Apart']), 2]);
      addR(low ? 'Movilidad · cadera y piernas' : 'Movilidad · espalda y hombros', items);
    }
    notes.push({t:'Estiramiento estático o FNP, a intensidad cómoda, casi a diario: lo que cuenta es el tiempo total a la semana (5 o más min por zona). Un ejercicio de fuerza con recorrido completo por sesión, que mejora el rango igual que estirar.', ev:['thomas18','konrad24','arntz23','afonso21']});
  }
  else if (main === 'potencia') {
    const n = Math.min(days, 4);
    for (let i = 0; i < n; i++) {
      used.clear(); const a = i % 2 === 0;
      const items = a ? [[pick(['Box Jump','Squat Jump','Pogo Jumps']), 4], [pick(['Broad Jump','Squat Jump','Pogo Jumps']), 3], [pick('power'), 3], [pick('heavy'), 4], [pick('ham'), 3], [pick('core'), 2]]
                      : [[pick(['Squat Jump','Box Jump','Pogo Jumps']), 4], [pick(['Lateral Bound','Pogo Jumps','Broad Jump']), 3], [pick(['Trap Bar Deadlift','Romanian Deadlift (Barbell)','Romanian Deadlift (Dumbbell)']), 4], [pick('lunge'), 3], [pick('hpush'), 3], [pick('hpull'), 3]];
      addR(a ? 'Potencia A' : 'Potencia B', items, 'full');
      for (const [n] of items) if (n && gm(n).pat === 'jump') rr[n] = [3, 6, 120];
      if (items[3] && items[3][0]) rr[items[3][0]] = [3, 5, 180];
    }
    notes.push({t:'Saltos primero, frescos y a máxima intención, sin llegar a cansarte; después fuerza pesada (3-5 repeticiones). Sube de ~40 a 50-80 saltos por sesión en 10 semanas o más. El cardio, en otro día o 3 h después.', ev:['villarreal09','villarreal10','stojanovic17','soriano15','schumann22']});
    if (issues.has('rodilla')) notes.push({t:'Con molestias de rodilla se quitan los saltos con más impacto. Usa la escala de dolor: hasta 4/10 durante el ejercicio y que al día siguiente esté como siempre.', ev:['silb07']});
  }
  else if (main === 'rehab') {
    const z = REHAB[q.zone] || REHAB.rodilla, n = Math.min(Math.max(days, 2), 4);
    for (let i = 0; i < n; i++) { used.clear(); const list = i % 2 ? z.b : z.a;
      addR(`${ZONES[q.zone] ? ZONES[q.zone].lab : 'Rodilla'} ${i % 2 ? 'B' : 'A'}`, list.map(x => [ok(x) ? x : pick(MUS_SLOT[gm(x).mus[0]] ? MUS_SLOT[gm(x).mus[0]][0] : 'core'), gm(x).unit === 'm' ? 1 : 3])); }
    for (const k of order) for (const n of routines[k].ex) if (gm(n).unit === 'r') rr[n] = [12, 15, 60, 1];
    notes.push({t:'Regla del dolor: hasta 4/10 durante el ejercicio está permitido. Si al día siguiente el dolor no ha vuelto a tu nivel normal, o empeora de una semana a otra, baja un nivel; si no, sube. Cuenta con 8-12 semanas.', ev:['silb07'].concat((ZONES[q.zone] || ZONES.rodilla).ev)});
    notes.push({t:'Esto no sustituye al diagnóstico: si hay hinchazón, bloqueo, dolor nocturno o la zona falla, que la vea un fisioterapeuta o un médico.', ev:[]});
  }
  else if (main === 'mayores') {
    const n = Math.min(Math.max(days, 2), 3);
    const sets = lvl === 'pri' ? 1 : 2;
    const A = [['Sit to Stand', sets], [pick(['Incline Push Up','Knee Push Up','Chest Press (Machine)']), sets], [pick(['Seated Row (Machine)','Seated Cable Row - V Grip (Cable)','Dumbbell Row']), sets], [pick(['Step Up (Dumbbell)','Lateral Step Down']), sets], [pick(['Glute Bridge','Hip Abduction (Machine)']), sets], ['Tandem Stance', 3], ['Single Leg Stand', 3], ['Tandem Walk', 2]];
    const B = [[pick(['Goblet Box Squat','Leg Press (Machine)','Sit to Stand'], true), sets], [pick(['Shoulder Press (Machine)','Landmine Press','Wall Sit']), sets], [pick(['Lat Pulldown (Cable)','Band Pull Apart','Face Pull']), sets], [pick(["Farmer's Walk",'Calf Raise (Bodyweight)']), sets], [pick(['Pallof Press','Dead Bug','Bird Dog']), sets], ['Single Leg Stand', 3], ['Tandem Stance', 3], ['Tandem Walk', 2]];
    for (let i = 0; i < n; i++) addR(`Fuerza y equilibrio ${i % 2 ? 'B' : 'A'}`, i % 2 ? B : A);
    for (const k of order) for (const x of routines[k].ex) if (gm(x).unit === 'r' && gm(x).pat !== 'balance') rr[x] = [10, 15, 90];
    notes.push({t:`Cada sesión mezcla fuerza, ejercicios funcionales y equilibrio: es la combinación que más reduce las caídas (−34 %). ${lvl === 'pri' ? 'Semanas 1-4: 1 serie de 10-15; después, 2-3 series.' : '2-3 series de 10-15.'} En levantarse de la silla, sube rápido y baja en 2-3 s.`, ev:['sher19','nsca19','morr23']});
    notes.push({t:`La OMS pide además 150 min de caminar a la semana y equilibrio 3 días${n < 3 ? ': el bloque de equilibrio (5 min) se puede hacer en casa otro día' : ''}.`, ev:['who20']});
  }
  else if (main === 'opos') {
    const woman = q.sex === 'm', pn = q.opos !== 'gen';
    const pullEx = woman ? 'Flexed Arm Hang' : (lvl === 'pri' ? pick(['Assisted Pull Up','Negative Pull Up'], true) : 'Pull Up');
    const S = {
      fuerza:['Fuerza + dominadas', [[ok(pullEx) ? pullEx : pick('vpull', true), 5], [pick(['Negative Pull Up','Lat Pulldown (Cable)','Assisted Pull Up'], true), 3], [pick('squat', true), 3], [pick(['Push Up','Bench Press (Dumbbell)'], true), 3], [pick('core', true), 2]]],
      inter:['Carrera: intervalos', [[pick('run_int', true), 1], [pick('core', true), 2]]],
      agil:['Agilidad y velocidad', [['Agility Shuttle Run', 6], [pick(['Broad Jump','Squat Jump'], true), 3], [pick('run_easy', true), 1]]],
      cont:['Carrera continua', [[pick('run_easy', true), 1]]],
      fuerza2:['Fuerza B', [[ok(pullEx) ? pullEx : pick('vpull', true), 4], [pick('hpull', true), 3], [pick('hinge', true), 3], [pick('lunge', true), 2], [pick(['Push Up','Diamond Push Up'], true), 3]]]
    };
    const seq = {3:['fuerza','inter','agil'], 4:['fuerza','inter','agil','cont'], 5:['fuerza','inter','agil','cont','fuerza2'], 6:['fuerza','inter','agil','cont','fuerza2','cont']}[Math.max(3, Math.min(6, days))];
    for (const k of seq) addR(...S[k]);
    rr[pullEx] = woman ? [20, 60, 150] : [3, 8, 150];
    notes.push({t:`${pn ? 'Policía Nacional: circuito de agilidad, ' + (woman ? 'suspensión en barra' : 'dominadas') + ' y 1.000 m. Se aprueba con un 5 de media y ningún 0.' : 'Base común de oposiciones: carrera, dominadas o flexiones, salto y agilidad.'} En dominadas, muchas series lejos del fallo progresan mejor que llegar al fallo.`, ev:['sanchez20']});
    notes.push({t:'Para los 1.000 m: 1 sesión de intervalos 4 × 4 min o series de 200-400 m y 1 de carrera continua suave.', ev:['helgerud07','milanovic15']});
  }

  if (['hip','fuerza','grasa'].includes(main) && !order.some(k => routines[k].ex.some(n => ['row','pull_v'].includes(gm(n).pat))))
    notes.push({t:'Con tu material no hay ningún ejercicio de tirón para la espalda. Una banda elástica o una barra de dominadas en la puerta lo resuelve por poco dinero.', ev:[]});

  /* ---------- objetivo secundario ---------- */
  const sec = q.sec || 'none', strK = order.filter(k => routines[k].ex.some(n => gm(n).unit === 'r'));
  if (sec === 'rehab' && q.zone2) { const z = REHAB[q.zone2]; strK.forEach((k, i) => { const list = (i % 2 ? z.b : z.a).filter(n => ok(n) && gm(n).unit !== 'm').slice(0, 2); routines[k].ex.unshift(...list.filter(n => !routines[k].ex.includes(n))); list.forEach(n => routines[k].sets[n] = 2); });
    notes.push({t:`Secundario: 2 ejercicios para ${ZONES[q.zone2].lab.toLowerCase()} al principio de cada sesión, con la regla del dolor.`, ev:(ZONES[q.zone2].ev)}); }
  if (sec === 'musculo' && q.muscle) { const slots = MUS_SLOT[q.muscle] || ['core']; strK.slice(0, 2).forEach((k, i) => { const n = pick(slots[i % slots.length], false) || pick(slots[0], true); if (n && !routines[k].ex.includes(n)) { routines[k].ex.push(n); routines[k].sets[n] = 3; } });
    notes.push({t:`Secundario: ${MUSCLES[q.muscle].toLowerCase()} recibe unas 6 series directas más a la semana, repartidas en 2 días.`, ev:['pelland','schoenfeld17v']}); }
  if (sec === 'flex') { strK.forEach((k, i) => { used.clear(); const a = pick(i % 2 ? 'stretch_up' : 'stretch_low'), b = pick(i % 2 ? 'stretch_up' : 'stretch_low'); [a, b].forEach(n => { if (n) { routines[k].ex.push(n); routines[k].sets[n] = 2; } }); });
    notes.push({t:'Secundario: 2 estiramientos al final de cada sesión (5-10 min).', ev:['thomas18','konrad24']}); }
  if (sec === 'cardio') { strK.slice(0, 2).forEach(k => { const n = pick('run_easy', true); if (n && !routines[k].ex.includes(n)) { routines[k].ex.push(n); routines[k].sets[n] = 1; rr[n] = [15, 25, 0]; } });
    notes.push({t:'Secundario: 15-25 min de cardio suave al final de 2 sesiones. No resta músculo ni fuerza máxima.', ev:['schumann22','who20']}); }
  if (sec === 'equilibrio') { strK.forEach(k => ['Tandem Stance','Single Leg Stand'].forEach(n => { if (!routines[k].ex.includes(n)) { routines[k].ex.push(n); routines[k].sets[n] = 2; } }));
    notes.push({t:'Secundario: 2 ejercicios de equilibrio en cada sesión.', ev:['sher19']}); }
  if (sec === 'potencia') { strK.slice(0, 2).forEach(k => { const n = pick(['Squat Jump','Pogo Jumps','Broad Jump'], true); if (n && ok(n) && !routines[k].ex.includes(n)) { routines[k].ex.unshift(n); routines[k].sets[n] = 3; rr[n] = [3, 5, 90]; } });
    notes.push({t:'Secundario: un ejercicio de salto al principio de 2 sesiones, fresco y a máxima intención.', ev:['villarreal10','markovic07']}); }
  if (sec === 'fuerza') { strK.forEach(k => { const n = routines[k].ex.find(x => ['squat','hinge','press_h','press_inc','press_v','row','pull_v'].includes(gm(x).pat)); if (n) rr[n] = [4, 6, 180]; });
    notes.push({t:'Secundario: el primer básico de cada día va a 4-6 repeticiones con 3 min de descanso.', ev:['lopez21','nunes21']}); }

  /* ---------- ajustar al tiempo disponible ---------- */
  const minutes = q.minutes || 60;
  for (const k of order) fitTime(routines[k], rr, minutes);
  return {routines, order, rr, notes, created: new Date().toISOString().slice(0, 10)};
}
/* Reparte series para que cada músculo grande quede en el rango semanal sin pasar de ~11 por sesión */
function balanceVolume(R, order, [lo, hi]){
  const vol = k => { const v = {}; for (const n of R[k].ex) { const m = gm(n); if (m.unit !== 'r' || ['mob','balance','cardio','jump'].includes(m.pat)) continue; m.mus.forEach((mu,i) => v[mu] = (v[mu]||0) + R[k].sets[n] * (i ? .5 : 1)); } return v; };
  const week = () => { const w = {}; for (const k of order) { const v = vol(k); for (const mu in v) w[mu] = (w[mu]||0) + v[mu]; } return w; };
  for (let it = 0; it < 40; it++) {
    const w = week(); let changed = false;
    for (const mu of ['pe','es','cu','fe','ho','bi','tr']) {
      if ((w[mu]||0) < lo) { for (const k of order) { const v = vol(k); if ((v[mu]||0) <= 0 || (v[mu]||0) + 1 > 11) continue;
          const n = R[k].ex.find(x => gm(x).mus[0] === mu && R[k].sets[x] < 4); if (n) { R[k].sets[n]++; changed = true; break; } } }
      else if ((w[mu]||0) > hi) { for (const k of order.slice().reverse()) { const n = R[k].ex.slice().reverse().find(x => gm(x).mus[0] === mu && R[k].sets[x] > 2); if (n) { R[k].sets[n]--; changed = true; break; } } }
    }
    if (!changed) break;
  }
}
function fitTime(r, rr, minutes){
  /* El cardio se ajusta a los minutos que queden (mínimo 10) y se guarda en la propia rutina */
  const card = r.ex.filter(n => gm(n).unit === 'm');
  if (card.length) { r.rr = r.rr || {};
    let other = 6; for (const n of r.ex) { const m = gm(n), sets = r.sets[n] || 3; if (m.unit === 'm') continue; const work = m.unit === 't' ? ((rr[n] && rr[n][1]) || m.hi) : 40, rest = (rr[n] && rr[n][2]) ?? m.rest; other += (sets*work + Math.max(0, sets-1)*rest + 60) / 60; }
    const each = Math.max(10, Math.floor((minutes - other) / card.length));
    for (const n of card) { const m = gm(n), base = rr[n] || [m.lo, m.hi, 0], hi = Math.min(base[1], each), lo = Math.min(base[0], hi); r.rr[n] = [lo, hi, 0]; }
  }
  const est = () => { let s = 6*60; for (const n of r.ex) { const m = gm(n), sets = r.sets[n] || 3; if (m.unit === 'm') { s += ((r.rr && r.rr[n] && r.rr[n][1]) || (rr[n] && rr[n][1]) || m.hi) * 60; continue; }
    const work = m.unit === 't' ? ((rr[n] && rr[n][1]) || m.hi) : 40, rest = (rr[n] && rr[n][2]) ?? m.rest; s += sets*work + Math.max(0, sets-1)*rest + 60; } return s/60; };
  let guard = 30;
  while (est() > minutes + 3 && guard--) {
    const iso = r.ex.slice().reverse().find((n, i) => i < r.ex.length - 2 && (r.sets[n] || 0) > 2);
    if (iso) { r.sets[iso]--; continue; }
    if (r.ex.length > 3) { const n = r.ex.pop(); delete r.sets[n]; continue; }
    break;
  }
  r.mins = Math.round(est());
}

/* ---------- Policía Nacional: baremos (de academias; coinciden con los mínimos del BOE-A-2026-15055) ---------- */
const PN = {
  ag:{h:[8.2,8.8,9.3,9.7,10.1,10.5,10.9,11.2,11.4,11.6], m:[9.3,9.8,10.3,10.8,11.2,11.6,12.0,12.3,12.5,12.7], lower:true, lab:'Circuito de agilidad (s)'},
  dom:{h:[17,16,15,14,12,10,8,7,6,5], lower:false, lab:'Dominadas'},
  sus:{m:[95,86,78,70,63,57,52,46,41,36], lower:false, lab:'Suspensión (s)'},
  run:{h:[174,180,186,192,198,204,210,216,222,228], m:[204,213,222,231,240,249,258,267,276,285], lower:true, lab:'1.000 m'}
};
function pnScore(test, sex, v){
  const t = PN[test], arr = t && t[sex === 'm' ? 'm' : 'h'] || t && (t.h || t.m); if (!arr || v == null || isNaN(v)) return null;
  for (let i = 0; i < arr.length; i++) if (t.lower ? v <= arr[i] + 1e-9 : v >= arr[i]) return 10 - i;
  return 0;
}

/* =====================================================================
   ESCALERAS DE FUERZA (pensadas para personas mayores o que empiezan de cero)
   Cada escalera va de lo más fácil a lo más difícil. Se pasa al siguiente paso cuando se hacen
   2 series del máximo de repeticiones con buena técnica; los pasos con mancuernas empiezan con 2 kg
   y suben poco a poco (Fragala 2019, NSCA: empezar ligero, 1 serie de 10-15, y progresar).
   ===================================================================== */
Object.assign(EX, {
 'Sit to Stand (Hands)':['Levantarse de la silla con ayuda de las manos','cu gl',5,10,1,60,'squat',[]],
 'Sit to Stand (Dumbbell)':['Levantarse de la silla con mancuerna','cu gl',8,12,1,75,'squat',['db']],
 'Hip Hinge Drill':['Bisagra de cadera sin peso (manos en los muslos)','fe gl',8,12,0,60,'hinge',[]],
 'Dumbbell Deadlift':['Peso muerto con mancuernas','fe gl cu',8,12,1,90,'hinge',['db']],
 'Wall Push Up':['Flexiones en la pared','pe tr',8,15,0,60,'press_h',[]],
 'Step Up (Bodyweight)':['Subir al escalón sin peso','cu gl',8,12,1,60,'squat',['box']]
});
Object.assign(GMAP, {'Sit to Stand (Hands)':'sit_stand', 'Sit to Stand (Dumbbell)':'sit_stand', 'Hip Hinge Drill':'hinge_db', 'Dumbbell Deadlift':'hinge_db', 'Wall Push Up':'pushup_inc', 'Step Up (Bodyweight)':'stepup'});
Object.assign(GCUE, {
 'Sit to Stand (Hands)':'Silla firme contra la pared. Échate adelante, empuja con las manos en los muslos o en los reposabrazos y siéntate despacio, sin dejarte caer.',
 'Sit to Stand':'Brazos cruzados sobre el pecho. Sube rápido y baja en 2-3 s.',
 'Sit to Stand (Dumbbell)':'Mancuerna pegada al pecho, sujeta con las dos manos. Empieza con 2 kg.',
 'Hip Hinge Drill':'Manos en los muslos: deslízalas hasta las rodillas echando el culo atrás, con la espalda recta, y vuelve apretando glúteos. Es el gesto del peso muerto sin carga.',
 'Romanian Deadlift (Dumbbell)':'Rodillas casi estiradas; baja las mancuernas pegadas a las piernas hasta donde la espalda siga recta. Si empiezas, 2 kg por mano.',
 'Dumbbell Deadlift':'Mancuernas a los lados de los pies; dobla un poco más las rodillas que en el rumano, espalda recta, y levántate empujando el suelo.',
 'Wall Push Up':'Manos en la pared a la altura del pecho; cuanto más lejos los pies, más difícil.',
 'Step Up (Bodyweight)':'Escalón bajo (10-20 cm), con una mano en la pared o la barandilla si hace falta. Sube con la pierna de delante, sin impulsarte con la de atrás.'
});
const LADDERS = {
 levantarse:{lab:'Levantarse', steps:['Sit to Stand (Hands)','Sit to Stand','Sit to Stand (Dumbbell)','Goblet Box Squat','Goblet Squat']},
 bisagra:{lab:'Peso muerto', steps:['Hip Hinge Drill','Romanian Deadlift (Dumbbell)','Dumbbell Deadlift']},
 empuje:{lab:'Empujar', steps:['Wall Push Up','Incline Push Up','Knee Push Up','Push Up']},
 tiron:{lab:'Tirar', steps:['Band Row','Dumbbell Row']},
 escalon:{lab:'Escalón', steps:['Step Up (Bodyweight)','Step Up (Dumbbell)']},
 gemelo:{lab:'Gemelo', steps:['Calf Raise (Bodyweight)','Calf Raise (Dumbbell)']},
 equilibrio:{lab:'Equilibrio', steps:['Tandem Stance','Single Leg Stand','Single Leg Stand (Eyes Closed)']}
};
/* Para cada ejercicio de una escalera: {key, lab, i (paso), n (total), prev, next} */
const LADDER_OF = {};
for (const [key, L] of Object.entries(LADDERS)) L.steps.forEach((n, i) => { LADDER_OF[n] = {key, lab:L.lab, i, n:L.steps.length, prev:L.steps[i-1] || null, next:L.steps[i+1] || null}; });
const LADDER_START_KG = 2; // kg por mano (o la mancuerna al pecho) al empezar un paso con mancuernas
