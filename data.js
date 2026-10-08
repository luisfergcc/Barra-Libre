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
  crunchm:'Crunch en máquina', hyper:'Banco de hiperextensiones', dipm:'Fondos en máquina', band:'Bandas elásticas'
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
 'Dead Bug':['Dead bug','co',8,12,0,45,'core',[]]
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
