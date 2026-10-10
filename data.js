/* =====================================================================
   BARRA LIBRE · datos fijos (plan v1.1)
   Si cambia el plan, se actualiza aquí: rutinas, calentamientos y ejercicios.
   ===================================================================== */

const MUSCLES = {pe:'Pecho',es:'Espalda',ho:'Hombro',bi:'Bíceps',tr:'Tríceps',cu:'Cuádriceps',fe:'Femoral',gl:'Glúteo',ad:'Aductores',ge:'Gemelo',co:'Core'};

/* Horas que tarda cada músculo en recuperarse de una sesión dura */
const RECOV_H = {pe:72,es:72,cu:72,fe:72,gl:72,ho:48,bi:48,tr:48,ad:48,ge:48,co:36};

/* Material que puede tener un gimnasio */
const EQUIP = {
  db:'Mancuernas', bb:'Barra y discos', bench:'Banco ajustable', smith:'Máquina Smith', cable:'Poleas',
  pull:'Barra de dominadas', dip:'Paralelas', lp:'Prensa', lext:'Extensión de cuádriceps', lcurl:'Curl femoral',
  abd:'Abductores', add:'Aductores', calf:'Gemelo en máquina', pec:'Peck deck', cpress:'Press de pecho en máquina',
  latm:'Jalón al pecho', rowm:'Remo en máquina', tbar:'Remo en T', latrm:'Laterales en máquina', rearm:'Pájaros en máquina',
  crunchm:'Crunch en máquina', hyper:'Banco de hiperextensiones', dipm:'Fondos en máquina', hipm:'Hip thrust en máquina', band:'Bandas elásticas'
};
const GYM_PRESETS = {
  full: Object.keys(EQUIP),
  hotel: ['db','bench','cable','band'],
  casa: ['db','bench','band']
};

/* Ejercicios con su nombre de Hevy.
   [español, músculos principales, reps mín, reps máx, carga la rodilla, descanso (s), patrón, material necesario] */
const EX = {
 'Incline Bench Press (Dumbbell)':['Press inclinado mancuernas','pe ho',8,12,0,150,'press_inc',['db','bench']],
 'Bench Press (Barbell)':['Press banca con barra','pe tr',6,10,0,150,'press_h',['bb','bench']],
 'Bench Press (Dumbbell)':['Press plano mancuernas','pe tr',8,12,0,150,'press_h',['db','bench']],
 'Chest Press (Machine)':['Press plano en máquina','pe tr',8,12,0,120,'press_h',['cpress']],
 'Iso-Lateral Chest Press (Machine)':['Press pecho iso-lateral','pe tr',8,12,0,120,'press_h',['cpress']],
 'Incline Chest Press (Machine)':['Press inclinado en máquina','pe ho',8,12,0,120,'press_inc',['cpress']],
 'Incline Bench Press (Smith Machine)':['Press inclinado en Smith','pe ho',8,12,0,150,'press_inc',['smith','bench']],
 'Push Up':['Flexiones','pe tr',8,20,0,90,'press_h',[]],
 'Chest Fly (Machine)':['Peck deck','pe',10,12,0,90,'fly',['pec']],
 'Cable Fly Crossovers':['Cruces en polea','pe',10,15,0,90,'fly',['cable']],
 'Incline Chest Fly (Dumbbell)':['Aperturas inclinadas','pe',10,15,0,90,'fly',['db','bench']],
 'Chest Dip':['Fondos','pe tr',6,12,0,120,'press_h',['dip']],
 'Seated Dip Machine':['Fondos en máquina','tr pe',8,12,0,90,'tri',['dipm']],
 'Lateral Raise (Dumbbell)':['Elevaciones laterales','ho',12,15,0,75,'lat_raise',['db']],
 'Lateral Raise (Machine)':['Laterales en máquina','ho',12,15,0,75,'lat_raise',['latrm']],
 'Single Arm Lateral Raise (Cable)':['Lateral unilateral en polea','ho',12,15,0,60,'lat_raise',['cable']],
 'Lateral Raise (Band)':['Elevaciones laterales con banda','ho',15,20,0,60,'lat_raise',['band']],
 'Shoulder Press (Dumbbell)':['Press militar mancuernas','ho tr',8,12,0,150,'press_v',['db','bench']],
 'Chest Supported Reverse Fly (Dumbbell)':['Pájaros en banco inclinado','ho es',15,20,0,75,'rear',['db','bench']],
 'Reverse Fly (Dumbbell)':['Pájaros con mancuernas','ho es',12,20,0,60,'rear',['db']],
 'Reverse Fly Single Arm (Cable)':['Pájaro unilateral en polea','ho',15,20,0,60,'rear',['cable']],
 'Rear Delt Reverse Fly (Machine)':['Pájaros en máquina','ho',12,15,0,75,'rear',['rearm']],
 'Face Pull':['Face pull','ho es',10,12,0,75,'rear',['cable']],
 'Band Pull Apart':['Separaciones con banda','ho es',15,25,0,45,'rear',['band']],
 'Triceps Pushdown':['Tríceps en polea alta','tr',10,15,0,75,'tri',['cable']],
 'Triceps Rope Pushdown':['Tríceps con cuerda','tr',10,15,0,75,'tri',['cable']],
 'Single Arm Triceps Pushdown (Cable)':['Tríceps unilateral en polea','tr',10,15,0,60,'tri',['cable']],
 'Overhead Triceps Extension (Cable)':['Tríceps tras nuca en polea','tr',10,12,0,75,'tri',['cable']],
 'Overhead Triceps Extension (Dumbbell)':['Tríceps tras nuca con mancuerna','tr',10,12,0,75,'tri',['db']],
 'Triceps Extension (Cable)':['Extensión de tríceps en polea','tr',10,12,0,75,'tri',['cable']],
 'Skullcrusher (Barbell)':['Press francés con barra','tr',8,12,0,90,'tri',['bb','bench']],
 'Skullcrusher (Dumbbell)':['Press francés mancuernas','tr',8,12,0,90,'tri',['db','bench']],
 'Bench Dip':['Fondos en banco','tr',10,15,0,75,'tri',['bench']],
 'Pull Up':['Dominadas','es bi',5,10,0,150,'pull_v',['pull']],
 'Lat Pulldown (Cable)':['Jalón al pecho','es bi',8,12,0,120,'pull_v',['latm']],
 'Single Arm Lat Pulldown':['Jalón unilateral','es',10,12,0,90,'pull_v',['cable']],
 'Straight Arm Lat Pulldown (Cable)':['Jalón con brazos rectos','es',10,12,0,75,'pull_v',['cable']],
 'Seated Row (Machine)':['Remo en máquina sentado','es bi',10,12,0,120,'row',['rowm']],
 'Iso-Lateral Row (Machine)':['Remo iso-lateral','es bi',8,12,0,120,'row',['rowm']],
 'Iso-Lateral Low Row':['Remo bajo iso-lateral','es bi',8,12,0,120,'row',['rowm']],
 'Seated Cable Row - V Grip (Cable)':['Remo en polea agarre V','es bi',8,12,0,120,'row',['cable']],
 'T Bar Row':['Remo en T','es bi',8,12,0,150,'row',['tbar']],
 'Chest Supported Incline Row (Dumbbell)':['Remo inclinado apoyado','es bi',8,12,0,120,'row',['db','bench']],
 'Dumbbell Row':['Remo con mancuerna','es bi',8,12,0,90,'row',['db','bench']],
 'Back Extension (Hyperextension)':['Hiperextensiones','gl fe',10,15,0,90,'hinge',['hyper']],
 'Bicep Curl (Cable)':['Curl Z en polea','bi',10,12,0,75,'curl',['cable']],
 'Hammer Curl (Cable)':['Curl martillo en polea','bi',10,12,0,75,'curl',['cable']],
 'Cross Body Hammer Curl':['Curl martillo cruzado','bi',10,12,0,75,'curl',['db']],
 'Bicep Curl (Dumbbell)':['Curl con mancuernas','bi',10,12,0,75,'curl',['db']],
 'Preacher Curl (Barbell)':['Curl predicador','bi',8,12,0,75,'curl',['bb','bench']],
 'Behind the Back Curl (Cable)':['Curl tras la espalda','bi',10,12,0,60,'curl',['cable']],
 'Romanian Deadlift (Barbell)':['Peso muerto rumano','fe gl',8,12,1,150,'hinge',['bb']],
 'Romanian Deadlift (Dumbbell)':['Peso muerto rumano mancuernas','fe gl',8,12,1,120,'hinge',['db']],
 'Leg Press (Machine)':['Prensa inclinada','cu gl',10,12,1,150,'squat',['lp']],
 'Leg Press Horizontal (Machine)':['Prensa horizontal','cu gl',10,15,1,150,'squat',['lp']],
 'Single Leg Press (Machine)':['Prensa unilateral','cu gl',10,12,1,120,'squat',['lp']],
 'Goblet Box Squat':['Sentadilla goblet a cajón','cu gl',8,12,1,120,'squat',['db','bench']],
 'Step Up (Dumbbell)':['Step-up a cajón bajo','cu gl',8,12,1,90,'squat',['db','bench']],
 'Leg Extension (Machine)':['Extensión de cuádriceps','cu',10,12,1,90,'knee_ext',['lext']],
 'Terminal Knee Extension (Band)':['Extensión terminal con banda','cu',15,20,1,45,'knee_ext',['band']],
 'Seated Leg Curl (Machine)':['Femoral sentado','fe',10,12,0,90,'leg_curl',['lcurl']],
 'Hip Abduction (Machine)':['Abducción de cadera','gl',12,15,0,75,'abd',['abd']],
 'Band Lateral Walk':['Pasos laterales con banda','gl',12,20,0,60,'abd',['band']],
 'Glute Bridge':['Puente de glúteo','gl fe',12,20,0,60,'abd',[]],
 'Hip Adduction (Machine)':['Aducción de cadera','ad',12,15,0,75,'add',['add']],
 'Single Leg Standing Calf Raise (Machine)':['Gemelo de pie unilateral','ge',10,15,0,60,'calf',['calf']],
 'Calf Raise (Dumbbell)':['Gemelo de pie con mancuerna','ge',12,20,0,60,'calf',['db']],
 'Crunch (Machine)':['Crunch en máquina','co',15,25,0,60,'core',['crunchm']],
 'Cable Crunch':['Crunch en polea','co',12,20,0,60,'core',['cable']],
 'Dead Bug':['Dead bug','co',8,12,0,45,'core',[]],
 'Hip Thrust (Barbell)':['Hip thrust con barra','gl fe',8,12,0,120,'hip',['bb','bench']],
 'Hip Thrust (Machine)':['Hip thrust en máquina','gl fe',8,12,0,120,'hip',['hipm']],
 'Bulgarian Split Squat':['Sentadilla búlgara','cu gl',8,12,1,120,'squat',['db','bench']],
 'Reverse Lunge (Dumbbell)':['Zancada atrás con mancuernas','cu gl',8,12,1,90,'squat',['db']],
 'Lying Leg Curl (Machine)':['Femoral tumbado','fe',10,12,0,90,'leg_curl',['lcurl']],
 'Seated Calf Raise':['Gemelo sentado (sóleo)','ge',12,20,0,60,'calf',['calf']],
 'Incline Curl (Dumbbell)':['Curl inclinado con mancuernas','bi',10,12,0,75,'curl',['db','bench']]
};
const SKIP = new Set(['Walking','Stretching']);

/* Rutinas del plan (nombres de Hevy, en orden) */
const ROUTINES = {
 d1:{code:'D1', title:'Pecho · Hombro · Tríceps', warm:'short', knee:true,
     ex:['Incline Bench Press (Dumbbell)','Chest Press (Machine)','Chest Fly (Machine)','Lateral Raise (Dumbbell)','Triceps Pushdown','Overhead Triceps Extension (Cable)']},
 d2:{code:'D2', title:'Espalda · Bíceps', warm:'short',
     ex:['Pull Up','Lat Pulldown (Cable)','Seated Row (Machine)','T Bar Row','Single Arm Lat Pulldown','Face Pull','Bicep Curl (Cable)','Cross Body Hammer Curl']},
 d3:{code:'D3', title:'Pierna', warm:'full',
     ex:['Leg Press (Machine)','Romanian Deadlift (Barbell)','Leg Extension (Machine)','Seated Leg Curl (Machine)','Hip Abduction (Machine)','Hip Adduction (Machine)','Single Leg Standing Calf Raise (Machine)']},
 d4:{code:'D4', title:'Hombro · Pecho', warm:'short', knee:true,
     ex:['Shoulder Press (Dumbbell)','Lateral Raise (Machine)','Single Arm Lateral Raise (Cable)','Chest Supported Reverse Fly (Dumbbell)','Incline Bench Press (Smith Machine)','Crunch (Machine)']}
};
const ORDER = ['d1','d2','d3','d4'];

const WARM = {
 short:['Caminata o bici suave · 2 min','90/90 de cadera · 6 cambios','Flexor de cadera en zancada · 20 s por lado','Puente de glúteo · 10 reps','Pull-apart + rotación externa · 15 + 10 por brazo'],
 full:['Bici o caminata suave · 3 min','90/90 de cadera · 8 cambios','Flexor de cadera en zancada · 30 s por lado','Rana en cuadrupedia · 10 balanceos','Puente de glúteo · 12 reps','Pasos laterales con mini banda · 10 por lado','Sentadilla isométrica en pared · 2 × 30-45 s','Sentadilla goblet con pausa · 5 reps','Extensión de cuádriceps ligera · 2 × 15']
};
const KNEE_BLOCK = ['Sentadilla isométrica en pared · 2 × 45 s','Extensión terminal de rodilla · 2 × 15 por pierna','Bajada lenta desde escalón · 2 × 8 por pierna'];
const PLAN_VERSION = 'v1.1';

/* =====================================================================
   CIENCIA: base de estudios (revisada el 10/10/2026)
   tema: hip = hipertrofia · fuerza · rodilla = rodilla y cadera · correr · movilidad
   ===================================================================== */
const EVIDENCE = [
 {id:'pelland', tema:'hip', cita:'Pelland y col.', rev:'Sports Medicine', year:2026, tipo:'Meta-regresión',
  hallazgo:'Más series semanales dan más hipertrofia y fuerza, con rendimientos decrecientes (más marcados en fuerza). La frecuencia apenas influye en la hipertrofia con el volumen igualado, pero sí ayuda a la fuerza. Contar las series indirectas como media serie es lo que mejor predice los resultados.',
  regla:'Cuenta las series de cada músculo: 1 si es el principal y 0,5 si trabaja de apoyo. Apunta a 10-20 por semana.'},
 {id:'schoenfeld17v', tema:'hip', cita:'Schoenfeld, Ogborn y Krieger', rev:'Journal of Sports Sciences', year:2017, tipo:'Metaanálisis',
  hallazgo:'Hacer 10 o más series por músculo a la semana produjo más crecimiento que hacer menos de 5.', regla:'Por debajo de 10 series semanales, ese músculo tiene margen claro para crecer más.'},
 {id:'schoenfeld18f', tema:'hip', cita:'Schoenfeld, Grgic y Krieger', rev:'Journal of Sports Sciences', year:2019, tipo:'Metaanálisis',
  hallazgo:'Con el mismo volumen semanal, entrenar un músculo 1 o 2+ veces por semana dio un crecimiento prácticamente igual.', regla:'Lo que manda es el volumen total semanal. Repartirlo en más días es útil cuando una sola sesión no da para todo.'},
 {id:'remmert25', tema:'hip', cita:'Remmert y col.', rev:'SportRxiv (preprint, sin revisión por pares)', year:2025, tipo:'Meta-regresión',
  hallazgo:'Por sesión, la hipertrofia deja de mejorar de forma detectable a partir de unas 11 series fraccionales por músculo; la fuerza, a partir de unas 2 series directas.', regla:'Más de ~11 series de un músculo en un día: mejor pasar parte a otro día o quitarlas para acortar la sesión.'},
 {id:'refalo23', tema:'hip', cita:'Refalo y col.', rev:'Sports Medicine', year:2023, tipo:'Metaanálisis',
  hallazgo:'Llegar al fallo muscular no produjo más hipertrofia que quedarse cerca de él. La relación entre cercanía al fallo y crecimiento no es lineal.', regla:'Deja 1-2 repeticiones en reserva; el fallo no es necesario y cansa más (y en ejercicios de rodilla, quédate en 2).'},
 {id:'lopez21', tema:'fuerza', cita:'Lopez y col.', rev:'Medicine & Science in Sports & Exercise', year:2021, tipo:'Metaanálisis en red',
  hallazgo:'Con series exigentes, cargas bajas, medias y altas dan una hipertrofia similar. Para la fuerza, las cargas altas y medias superan a las bajas.', regla:'Para crecer vale cualquier rango exigente (6-30 reps). Para estar fuerte, mete algo de trabajo pesado (6-8 reps) en los básicos.'},
 {id:'singer24', tema:'hip', cita:'Singer y col.', rev:'Frontiers in Sports and Active Living', year:2024, tipo:'Metaanálisis bayesiano',
  hallazgo:'Descansar más de 60 s entre series puede dar un pequeño beneficio en hipertrofia; por encima de 90 s no se vieron diferencias claras.', regla:'Descansa al menos 90 s, y 2-3 min en ejercicios grandes si notas que pierdes muchas repeticiones de una serie a otra.'},
 {id:'schoenfeld16r', tema:'fuerza', cita:'Schoenfeld y col.', rev:'Journal of Strength and Conditioning Research', year:2016, tipo:'Ensayo controlado',
  hallazgo:'En hombres entrenados, descansar 3 min entre series dio más fuerza y más grosor muscular que descansar 1 min.', regla:'En los básicos pesados, descansos largos (2-3 min).'},
 {id:'plotkin22', tema:'hip', cita:'Plotkin y col.', rev:'PeerJ', year:2022, tipo:'Ensayo controlado',
  hallazgo:'Progresar sumando repeticiones o sumando peso dio una hipertrofia similar.', regla:'Tu doble progresión (reps primero, luego peso) es válida.'},
 {id:'wolf23', tema:'hip', cita:'Wolf y col.', rev:'International Journal of Strength and Conditioning', year:2023, tipo:'Metaanálisis',
  hallazgo:'El recorrido completo dio un crecimiento igual o ligeramente mayor que el parcial; los parciales con el músculo estirado podrían ser incluso mejores (evidencia aún tentativa).', regla:'Prioriza recorridos largos, sobre todo la parte en la que el músculo está estirado.'},
 {id:'pedrosa22', tema:'hip', cita:'Pedrosa y col.', rev:'European Journal of Sport Science', year:2022, tipo:'Ensayo controlado',
  hallazgo:'En la extensión de cuádriceps, trabajar el tramo con la rodilla más doblada (músculo estirado) dio más hipertrofia que el tramo final.', regla:'En la extensión, céntrate en el tramo de 90° a 45°.'},
 {id:'maeo21', tema:'hip', cita:'Maeo y col.', rev:'Medicine & Science in Sports & Exercise', year:2021, tipo:'Ensayo controlado',
  hallazgo:'El curl femoral sentado hizo crecer más los isquiotibiales que el curl tumbado.', regla:'Para el femoral, prioriza la máquina sentada.'},
 {id:'maeo23', tema:'hip', cita:'Maeo y col.', rev:'European Journal of Sport Science', year:2023, tipo:'Ensayo controlado',
  hallazgo:'El tríceps creció alrededor de un 40 % más con extensiones con el brazo por encima de la cabeza que con extensiones en polea alta.', regla:'Mantén una extensión de tríceps tras nuca en tu rutina.'},
 {id:'nascimento18', tema:'rodilla', cita:'Nascimento y col.', rev:'Journal of Orthopaedic & Sports Physical Therapy', year:2018, tipo:'Metaanálisis',
  hallazgo:'En dolor femoropatelar, fortalecer cadera + rodilla redujo el dolor y mejoró la actividad más que fortalecer solo la rodilla.', regla:'Abductores y glúteo, al menos 2 veces por semana, además del cuádriceps.'},
 {id:'willy19', tema:'rodilla', cita:'Willy y col.', rev:'JOSPT · Guía de práctica clínica', year:2019, tipo:'Guía clínica',
  hallazgo:'Para el dolor femoropatelar recomienda ejercicio de cadera y rodilla como base, empezando por la cadera posterolateral; reentrenar la zancada al correr puede ayudar.', regla:'Ejercicio de cadera + cuádriceps como base del cuidado de tu rodilla.'},
 {id:'powers14', tema:'rodilla', cita:'Powers y col. · Steinkamp y col.', rev:'JOSPT 2014 · Am J Sports Med 1993', year:2014, tipo:'Estudios biomecánicos',
  hallazgo:'Entre 90° y 45° de flexión, la sentadilla carga más la rótula que la extensión de cuádriceps. En la extensión, la carga sobre la rótula sube en los últimos grados hasta estirar; en la prensa y la sentadilla sube cuanto más doblas la rodilla.', regla:'Extensión: tramo 90°-45°. Prensa y sentadilla: profundidad hasta donde el semáforo siga en verde.'},
 {id:'bricca19', tema:'rodilla', cita:'Bricca y col.', rev:'British Journal of Sports Medicine', year:2019, tipo:'Revisión sistemática',
  hallazgo:'El ejercicio que carga la rodilla no parece dañar el cartílago en personas con riesgo de artrosis o con artrosis (evidencia de calidad baja).', regla:'Cargar la rodilla de forma progresiva no es el enemigo; el dolor que empeora al día siguiente sí es la señal para ajustar.'},
 {id:'afonso21', tema:'movilidad', cita:'Afonso y col.', rev:'Healthcare', year:2021, tipo:'Metaanálisis',
  hallazgo:'El entrenamiento de fuerza mejoró el rango de movimiento lo mismo que los estiramientos.', regla:'Ejercicios con recorrido largo (rumano, sentadilla a cajón cada vez más baja, hip thrust) también te dan movilidad de cadera.'},
 {id:'lenhart14', tema:'correr', cita:'Lenhart y col.', rev:'Medicine & Science in Sports & Exercise', year:2014, tipo:'Estudio biomecánico',
  hallazgo:'Aumentar la cadencia un 10 % redujo la fuerza máxima sobre la articulación femoropatelar alrededor de un 14 %.', regla:'Al trotar, pasos un poco más cortos y rápidos (+5-10 % de cadencia).'},
 {id:'nielsen14', tema:'correr', cita:'Nielsen y col.', rev:'Journal of Orthopaedic & Sports Physical Therapy', year:2014, tipo:'Estudio de cohorte',
  hallazgo:'Los corredores novatos que aumentaban su distancia semanal más de un 30 % tenían más lesiones relacionadas con la distancia, entre ellas el dolor femoropatelar.', regla:'Sube los km de carrera poco a poco (lejos de +30 % semanal).'},
 {id:'lauersen14', tema:'correr', cita:'Lauersen, Bertelsen y Andersen', rev:'British Journal of Sports Medicine', year:2014, tipo:'Metaanálisis',
  hallazgo:'El entrenamiento de fuerza redujo las lesiones deportivas a menos de un tercio y casi a la mitad las de sobrecarga.', regla:'Si corres, no sueltes el día de pierna.'},
 {id:'blagrove18', tema:'correr', cita:'Blagrove, Howatson y Hayes', rev:'Sports Medicine', year:2018, tipo:'Revisión sistemática',
  hallazgo:'Añadir fuerza al entrenamiento de carrera mejoró la economía de carrera en corredores de fondo.', regla:'Fuerza de pierna 1-2 veces por semana te hace correr con menos gasto.'},
 {id:'alentorn17', tema:'correr', cita:'Alentorn-Geli y col.', rev:'Journal of Orthopaedic & Sports Physical Therapy', year:2017, tipo:'Metaanálisis',
  hallazgo:'Los corredores recreativos tenían menos artrosis de cadera y rodilla (3,5 %) que los sedentarios (10,2 %) y los corredores de élite (13,3 %).', regla:'Correr de forma recreativa no es malo para las rodillas.'}
];
const EV = Object.fromEntries(EVIDENCE.map(e => [e.id, e]));
const TEMAS = {hip:'Hipertrofia', fuerza:'Fuerza', rodilla:'Rodilla y cadera', movilidad:'Movilidad', correr:'Correr'};

/* Músculos grandes: más margen de crecimiento y más impacto en el físico */
const BIG = ['cu','gl','es','pe','fe'];

/* Consejo basado en estudios para ejercicios concretos */
const EX_TIPS = {
 'Overhead Triceps Extension (Cable)':{ev:'maeo23', txt:'Brazo por encima de la cabeza: el tríceps creció ~40 % más que en polea alta. Es tu mejor ejercicio de tríceps.'},
 'Overhead Triceps Extension (Dumbbell)':{ev:'maeo23', txt:'Brazo por encima de la cabeza: el tríceps creció ~40 % más que en polea alta.'},
 'Triceps Pushdown':{ev:'maeo23', txt:'Suma, pero la versión tras nuca hizo crecer más el tríceps. Si vas justo de tiempo, prioriza la tras nuca.'},
 'Triceps Rope Pushdown':{ev:'maeo23', txt:'Suma, pero la versión tras nuca hizo crecer más el tríceps.'},
 'Seated Leg Curl (Machine)':{ev:'maeo21', txt:'Sentado hace crecer más el femoral que tumbado. Bien elegido.'},
 'Lying Leg Curl (Machine)':{ev:'maeo21', txt:'Si hay máquina sentada, el femoral creció más con ella.'},
 'Leg Extension (Machine)':{ev:'pedrosa22', txt:'Céntrate en el tramo de 90° a 45°: más crecimiento con el músculo estirado y menos carga sobre la rótula.'},
 'Leg Press (Machine)':{ev:'powers14', txt:'La rótula se carga más cuanto más doblas la rodilla: baja hasta donde el semáforo siga en verde.'},
 'Leg Press Horizontal (Machine)':{ev:'powers14', txt:'La rótula se carga más cuanto más doblas la rodilla: baja hasta donde el semáforo siga en verde.'},
 'Goblet Box Squat':{ev:'afonso21', txt:'Baja la altura del cajón con las semanas: ganas cuádriceps y movilidad de cadera a la vez.'},
 'Romanian Deadlift (Barbell)':{ev:'afonso21', txt:'Recorrido largo con el femoral estirado: crecimiento y movilidad de cadera.'},
 'Romanian Deadlift (Dumbbell)':{ev:'afonso21', txt:'Recorrido largo con el femoral estirado: crecimiento y movilidad de cadera.'},
 'Hip Abduction (Machine)':{ev:'nascimento18', txt:'Cadera + rodilla reduce más el dolor de rodilla que trabajar solo la rodilla. No la saltes.'},
 'Band Lateral Walk':{ev:'nascimento18', txt:'Glúteo medio: rodilla más estable. Útil en casa o como calentamiento.'},
 'Hip Thrust (Barbell)':{ev:'nascimento18', txt:'Glúteo fuerte sin cargar la rodilla.'},
 'Hip Thrust (Machine)':{ev:'nascimento18', txt:'Glúteo fuerte sin cargar la rodilla.'},
 'Hip Adduction (Machine)':{ev:'nascimento18', txt:'Parte del trabajo de cadera que estabiliza la rodilla.'},
 'Incline Bench Press (Dumbbell)':{ev:'refalo23', txt:'Deja 1-2 reps en reserva: el fallo no da más músculo y te quita repeticiones en las series siguientes.'}
};
