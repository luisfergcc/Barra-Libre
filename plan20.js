/* =====================================================================
   BARRA LIBRE · ejercicios nuevos del plan v2.0 (21/10/2026)
   Cada uno con su animación (GT), sus pasos y errores (GTXT) y su matiz (GCUE).
   Se carga después de guia.js y antes de objetivos.js.
   ===================================================================== */

/* ---------- ejercicios: [español, músculos, reps mín, reps máx, carga la rodilla, descanso, patrón, material, unidad] ---------- */
Object.assign(EX, {
 /* Plan v2.0 */
 'Tibialis Raise':['Elevación de tibial anterior','',15,20,0,60,'calf',[]],
 'Hip External Rotation (Band)':['Rotación externa de cadera con banda','gl',12,15,0,45,'abd',['band']],
 'Frog Stretch':['Rana en cuadrupedia (balanceos)','ad',8,12,0,15,'mob',[]],
 'Leg Swing (Forward)':['Balanceo de pierna adelante-atrás','cu fe',10,12,0,15,'mob',[]],
 'Leg Swing (Lateral)':['Balanceo de pierna lateral','ad gl',10,12,0,15,'mob',[]],
 'Lunge with Rotation':['Zancada con rotación de tronco','cu co',5,8,1,15,'mob',[]],
 'Hip 90/90 Switch':['90/90 de cadera con cambios','gl',6,8,0,15,'mob',[]],
 'Hip Internal Rotation (Windshield Wiper)':['Rotación interna de cadera (limpiaparabrisas)','gl ad',10,10,0,15,'mob',[]],
 'Ankle Mobility (Knee to Wall)':['Movilidad de tobillo (rodilla a la pared)','ge',8,12,0,15,'mob',[]],
 'Standing Calf Raise (Machine)':['Gemelo de pie en máquina','ge',10,15,0,90,'calf',['calf']],
 /* Biblioteca ampliada con la v2.0 */
 'Single Leg Extension (Machine)':['Extensión de cuádriceps a una pierna','cu',10,12,1,75,'knee_ext',['lext']],
 'Split Squat (Smith Machine)':['Sentadilla dividida en Smith','cu gl',8,10,1,120,'squat',['smith']],
 'Bayesian Curl (Cable)':['Curl bayesiano en polea (brazo por detrás)','bi',10,12,0,75,'curl',['cable']],
 'Overhead Triceps Extension (Rope)':['Tríceps sobre la cabeza con cuerda','tr',10,15,0,75,'tri',['cable']],
 'Single Arm Cable Row':['Remo a una mano en polea','es bi',10,14,0,90,'row',['cable']],
 'Reverse Fly (Cable)':['Pájaros en polea cruzada','ho',12,15,0,60,'rear',['cable']]
});

/* ---------- animaciones ---------- */
Object.assign(GT, {
  /* Tibial anterior: espalda contra la pared, talones en el suelo, puntas arriba */
  tibraise:{hl:['sh'], props:[FL, {k:'line', p:[57,18,57,110], w:3}],
    A:{hip:[62,65.5], t:184, th:28, sh:28, ft:90, ua:6, fa:6, anchor:['ank',[86,107]]},
    B:{hip:[62,65.5], t:184, th:28, sh:28, ft:138, ua:6, fa:6, anchor:['ank',[86,107]]}},
  /* Rotación externa de cadera con banda (sentado, banda alrededor de las rodillas, se abre una rodilla) */
  hipER:{view:'front', hl:['th'], props:[{k:'rect', x:62, y:66, w:36, h:5}, {k:'band', a:'kneeL', b:'kneeR'}],
    A:{cx:80, hy:64, seated:true, th:4, sh:4, thR:4, shR:4, thL:4, shL:4, ua:20, fa:20}, B:{cx:80, hy:64, seated:true, th:4, sh:4, thR:64, shR:22, thL:4, shL:4, ua:20, fa:20}},
  /* Rana en cuadrupedia: las caderas se balancean hacia los talones */
  frog:{hl:['hipj'], props:[FL],
    A:{hip:[56,82], S:[88,84], H:[90,107], el:'b', th:0, sh:-90, ft:-90},
    B:{hip:[37.6,90.6], S:[88,84], H:[90,107], el:'b', th:50, sh:-90, ft:-90}},
  /* Balanceo de pierna adelante-atrás, con una mano en la pared */
  legswing:{hl:['th2'], props:[FL, {k:'line', p:[118,8,118,110], w:3}],
    A:{hip:[80,60], t:180, F:[80,107], kn:'f', th2:62, sh2:62, ft2:120, H:[108,40], el:'d'},
    B:{hip:[80,60], t:176, F:[80,107], kn:'f', th2:-28, sh2:-28, ft2:60, H:[108,40], el:'d'}},
  /* Balanceo lateral (de frente): la pierna se abre y cruza por delante */
  legswing_lat:{view:'front', hl:['th'], props:[FL, {k:'line', p:[36,8,36,110], w:3}],
    A:{cx:80, hy:62, thL:2, shL:2, thR:34, shR:34, uaL:75, faL:80, uaR:20, faR:20},
    B:{cx:80, hy:62, thL:2, shL:2, thR:-12, shR:-12, uaL:75, faL:80, uaR:20, faR:20}},
  /* Zancada con rotación de tronco (los brazos se acercan al pecho al girar) */
  lunge_rot:{hl:['torso'], props:[FL],
    A:{hip:[72,84], t:178, F:[94,107], F2:[52,104], kn:'f', kn2:'f', ft2:60, Hs:[24,4], el:'d'},
    B:{hip:[72,84], t:178, F:[94,107], F2:[52,104], kn:'f', kn2:'f', ft2:60, Hs:[5,10], el:'d'}},
  /* 90/90 con cambios: las dos rodillas giran de un lado a otro */
  hip9090_sw:{hl:['hipj'], props:[FL],
    A:{hip:[64,102], t:172, th:90, sh:180, ft:90, th2:-90, sh2:0, H:[78,108], el:'f'},
    B:{hip:[64,102], t:172, th:-90, sh:0, ft:-90, th2:90, sh2:180, H:[78,108], el:'f'}},
  /* Limpiaparabrisas: tumbado boca arriba, rodillas dobladas; las rodillas caen hacia un lado y vuelven (de perfil, la rodilla baja hacia el suelo) */
  hipwiper:{hl:['hipj'], props:[FL],
    A:{hip:[64,104], S:[34,104], F:[84,107], kn:'u', ua:90, fa:90, nk:0}, B:{hip:[64,104], S:[34,104], F:[100,107], kn:'u', ua:90, fa:90, nk:0}},
  /* Rodilla a la pared: el talón no se despega */
  ankle_wall:{hl:['sh'], props:[FL, {k:'line', p:[110,8,110,110], w:3}],
    A:{hip:[74,60], t:180, F:[84,107], kn:'f', F2:[52,107], ft2:60, H:[106,48], el:'d'},
    B:{hip:[90,71], t:180, F:[84,107], kn:'f', F2:[52,107], ft2:60, H:[106,48], el:'d'}},
  /* Plancha lateral (de frente, apoyado en el antebrazo, cuerpo recto) */
  sideplank:{hold:true, view:'front', rot:-64, hl:['torso'], props:[{k:'line', p:[6,18,67.5,144], w:2}],
    A:{cx:55.5, hy:60, th:2, sh:2, uaL:90, faL:90, uaR:4, faR:4}, B:{cx:55.5, hy:59, th:2, sh:2, uaL:90, faL:90, uaR:4, faR:4}}
});

/* ---------- qué plantilla usa cada ejercicio ---------- */
Object.assign(GMAP, {
 'Tibialis Raise':'tibraise', 'Hip External Rotation (Band)':'hipER', 'Frog Stretch':'frog', 'Leg Swing (Forward)':'legswing', 'Leg Swing (Lateral)':'legswing_lat',
 'Lunge with Rotation':'lunge_rot', 'Hip 90/90 Switch':'hip9090_sw', 'Hip Internal Rotation (Windshield Wiper)':'hipwiper', 'Ankle Mobility (Knee to Wall)':'ankle_wall', 'Standing Calf Raise (Machine)':'calf',
 'Side Plank':'sideplank', 'Single Leg Extension (Machine)':'legext', 'Split Squat (Smith Machine)':'lunge', 'Bayesian Curl (Cable)':'curl_cable',
 'Overhead Triceps Extension (Rope)':'ohext_cable', 'Single Arm Cable Row':'row_cable', 'Reverse Fly (Cable)':'rearfly'
});

/* ---------- cómo se hace ---------- */
Object.assign(GTXT, {
 tibraise:{how:['Espalda apoyada en una pared y los pies unos 30-40 cm por delante, a la anchura de la cadera.','Con los talones en el suelo, sube las puntas de los pies todo lo que puedas.','Aguanta 1 segundo arriba y baja despacio, sin dejar caer los pies de golpe.'], err:['Despegar los talones del suelo.','Ir rápido y sin recorrido: es un músculo pequeño, necesita control.','Doblar las rodillas para ayudarte.']},
 hipER:{how:['Sentado en un banco o silla, con una banda alrededor de las rodillas y los pies apoyados.','Abre una rodilla hacia fuera contra la banda sin mover la pelvis ni inclinar el tronco.','Vuelve despacio. Termina todas las repeticiones de un lado y cambia. También vale tumbado de lado (almeja).'], err:['Girar la pelvis o inclinarte para abrir más.','Soltar la banda de golpe al volver.','Subir los hombros.']},
 frog:{how:['A cuatro patas, con los antebrazos apoyados y las rodillas separadas más que la cadera, los pies girados hacia fuera.','Lleva la cadera hacia los talones sin redondear la espalda, hasta notar el interior del muslo.','Vuelve a la posición inicial y repite con balanceos lentos.'], err:['Forzar si notas pinzamiento en la cadera o dolor en la ingle: separa menos las rodillas.','Arquear la zona lumbar.','Ir rápido y con rebotes.']},
 legswing:{how:['De pie al lado de una pared, con una mano apoyada. Mantén el tronco alto.','Balancea la pierna de fuera adelante y atrás, como un péndulo, con la rodilla casi estirada.','Aumenta el recorrido poco a poco; el movimiento sale de la cadera.'], err:['Inclinar o arquear el tronco para balancear más.','Lanzar la pierna con fuerza: es un calentamiento, no un ejercicio de fuerza.','Doblar la rodilla de apoyo.']},
 legswing_lat:{how:['De pie de frente a la pared lateral, con una mano apoyada.','Balancea la pierna de fuera hacia el lado y cruza por delante del cuerpo, como un limpiaparabrisas.','Tronco quieto y pelvis nivelada; el recorrido crece poco a poco.'], err:['Inclinar el tronco hacia el lado contrario.','Lanzar la pierna con fuerza.','Girar el pie de apoyo.']},
 lunge_rot:{how:['Da un paso largo hacia delante y baja en zancada, con el tronco alto y las manos juntas delante del pecho.','Gira el tronco hacia el lado de la pierna adelantada sin mover la pelvis ni la rodilla.','Vuelve al centro, sube y alterna.'], err:['Mover la rodilla delantera hacia dentro al girar.','Girar con la zona lumbar en vez del tronco alto.','Bajar tanto que la rodilla pase a molestar: usa menos recorrido.']},
 hipwiper:{how:['Tumbado boca arriba, rodillas dobladas y los pies un poco más separados que la cadera.','Deja caer las dos rodillas hacia un lado sin despegar los hombros del suelo, hasta donde llegues sin forzar.','Aguanta 2 segundos al final y vuelve al centro; repite hacia el otro lado.'], err:['Despegar el hombro o el pie del suelo.','Ir rápido y rebotar al final.','Forzar el rango si pellizca la cadera.']},
 hip9090_sw:{how:['Sentado en el suelo con las dos rodillas dobladas a 90°, una delante y otra al lado.','Gira las rodillas hacia el otro lado y cambia de postura sin ayudarte con las manos, si puedes.','Mantén el tronco alto; cada cambio es una repetición.'], err:['Redondear la espalda.','Ayudarte con las manos y perder el control de la rotación.','Forzar si notas pinzamiento en la cadera.']},
 ankle_wall:{how:['De pie frente a una pared, un pie adelantado a unos 10 cm de ella y el otro detrás.','Lleva la rodilla del pie de delante hacia la pared sin despegar el talón del suelo.','Aguanta 1-2 segundos y vuelve. Si es fácil, aleja el pie de la pared.'], err:['Despegar el talón.','Dejar caer la rodilla hacia dentro.','Aguantar con dolor en la parte delantera del tobillo.']},
 sideplank:{how:['Tumbado de lado, apoyado en el antebrazo con el codo justo debajo del hombro y las piernas estiradas.','Levanta la cadera hasta que el cuerpo forme una línea recta de los pies a la cabeza.','Aguanta respirando con normalidad y cambia de lado. Si es difícil, apoya la rodilla de abajo.'], err:['Dejar caer la cadera.','Girar el pecho hacia el suelo o hacia el techo.','Aguantar la respiración.']}
});

/* ---------- matices por ejercicio ---------- */
Object.assign(GCUE, {
 'Tibialis Raise':'Es un ejercicio opcional del plan: no hay un ensayo que lo respalde. Sirve para equilibrar la pantorrilla; si molesta la espinilla, déjalo.',
 'Hip External Rotation (Band)':'Calentamiento de cadera (efecto pequeño en la rodilla según Willy 2019). 2 × 12-15 por lado.',
 'Frog Stretch':'Para el rango de cadera: la movilidad mejora por frecuencia. 10 balanceos lentos.',
 'Leg Swing (Forward)':'Movilidad A (antes de correr): 10 por pierna, sin forzar el recorrido.',
 'Leg Swing (Lateral)':'Movilidad A (antes de correr): 10 por pierna, sin forzar el recorrido.',
 'Lunge with Rotation':'Movilidad A (antes de correr): 5 por lado, con la rodilla en verde.',
 'Hip Internal Rotation (Windshield Wiper)':'Movilidad B: 10 por lado, pausa de 2 s al final. La rotación interna limitada es lo único que se asoció a lumbalgia entre los movimientos de cadera (evidencia muy baja, Avman 2019).',
 'Hip 90/90 Switch':'8 cambios. Si tu cadera es rígida, empieza con las manos apoyadas detrás.',
 'Ankle Mobility (Knee to Wall)':'Un tobillo con más recorrido deja bajar más la sentadilla sin cargar tanto la rodilla.',
 'Side Plank':'Plancha lateral sobre un antebrazo, cuerpo recto de pies a cabeza. En D4: 2 × 20-30 s por lado.',
 'Standing Calf Raise (Machine)':'Pausa de 1-2 s abajo, con el músculo estirado (Kassiano 2023).',
 'Single Leg Press (Machine)':'Con RIR 3: la rodilla manda, no la carga.',
 'Split Squat (Dumbbell)':'Paso largo (≈ la longitud de tu pierna) y tronco vertical: baja la exigencia de la rodilla. Antes, 1-2 series de aproximación ligeras. Pie de atrás en el suelo; pasa a búlgara tras 3 semanas en verde.',
 'Split Squat (Smith Machine)':'Paso largo y tronco vertical; la barra guiada da estabilidad.',
 'Single Leg Extension (Machine)':'Tramo de 90° a 45°, igual que con las dos piernas.',
 'Bayesian Curl (Cable)':'De espaldas a la polea baja, con el brazo por detrás del cuerpo: el bíceps trabaja estirado.',
 'Overhead Triceps Extension (Rope)':'Brazo por encima de la cabeza: el tríceps crece más que en polea alta (Maeo 2023).',
 'Single Arm Cable Row':'Tronco quieto; lleva el codo hacia la cadera.',
 'Reverse Fly (Cable)':'Poleas altas cruzadas: abre los brazos a la altura del hombro con el codo ligeramente doblado.'
});
