/* =====================================================================
   BARRA LIBRE · programa por niveles con fisioterapia (portado de MeryCon)
   Contenido de referencia GENÉRICO: aquí no hay ningún dato de salud de nadie.
   Los datos de cada persona (dolor habitual, sesiones, pruebas) viven solo en el iPhone.
   ===================================================================== */
const LV_LEVELS = {
  1: { nombre: 'Base', desc: 'Sentada o tumbada, con apoyo total. Rutina inicial.' },
  2: { nombre: 'Activación', desc: 'Más control y pequeñas cargas, aún con mucho apoyo.' },
  3: { nombre: 'Fuerza funcional', desc: 'De pie con apoyo y menos ayuda de los brazos. Comentar con la fisio antes de empezar.' },
  4: { nombre: 'Control y equilibrio', desc: 'Escalón bajo, equilibrio con apoyo cercano. Requiere visto bueno de la fisio.' },
  5: { nombre: 'Autonomía', desc: 'Tareas cercanas a la vida diaria. Solo con visto bueno de la fisio.' }
};

const LV_BLOQUES = {
  resp: 'Respiración', tobillo: 'Tobillo y pantorrilla', rodilla: 'Rodilla', cadera: 'Cadera',
  core: 'Control lumbar / core', levantarse: 'Levantarse', equilibrio: 'Equilibrio', escalon: 'Escalones',
  movilidad: 'Movilidad de tronco', postura: 'Espalda alta / postura'
};

/* Cada ejercicio: previo = id del ejercicio que hay que dominar para desbloquearlo.
   fisio = true → conviene confirmar con la fisioterapeuta antes de empezarlo. */
const LV_EX = [
  // ---------------- NIVEL 1 (rutina inicial) ----------------
  { id: 'r1', nivel: 1, bloque: 'resp', orden: 1, min: 1.5, nombre: 'Respiración diafragmática',
    objetivo: 'Activar la respiración y bajar el tono muscular antes de empezar.',
    posicion: 'Sentada en silla con respaldo, o tumbada boca arriba con rodillas dobladas.',
    ejecucion: 'Inhalar por la nariz llevando el aire al abdomen (que se eleve la tripa, no el pecho); exhalar despacio por la boca.',
    dosis: '5-8 respiraciones (1-2 min).', respiracion: 'Inhalar 3-4 s, exhalar 4-6 s.',
    esperadas: 'Relajación progresiva, ninguna molestia.', parar: 'Mareo, ahogo, aumento de ansiedad.',
    errores: 'Respirar rápido o forzar la respiración.', facil: 'Respiración natural sin contar tiempos.',
    progresion: 'Respiración con activación abdominal suave.' },
  { id: 't1', nivel: 1, bloque: 'tobillo', orden: 2, min: 1, nombre: 'Movilidad de tobillos (bombeo)',
    objetivo: 'Mantener movilidad y activar la circulación en las piernas.',
    posicion: 'Sentada en silla, pies apoyados en el suelo.',
    ejecucion: 'Subir y bajar las puntas de los pies alternando ambos pies.',
    dosis: '10-15 repeticiones por pie (1 min).', respiracion: 'Libre y continua, sin retenerla.',
    esperadas: 'Ligera sensación de movimiento, nada doloroso.', parar: 'Dolor agudo, calambre que no cede.',
    errores: 'Hacerlo muy rápido y sin control.', facil: 'Menos recorrido o más despacio.',
    progresion: 'Círculos de tobillo en ambos sentidos.' },
  { id: 'k1', nivel: 1, bloque: 'rodilla', orden: 3, min: 1.5, nombre: 'Extensión de rodilla sentada',
    objetivo: 'Mantener el rango de movimiento de la rodilla sin carga.',
    posicion: 'Sentada en silla con respaldo.',
    ejecucion: 'Estirar una rodilla llevando la pierna hacia delante y volver a doblarla apoyando el pie.',
    dosis: '8-10 repeticiones por pierna (1-2 min).', respiracion: 'Exhalar al estirar, inhalar al volver.',
    esperadas: 'Tirantez leve, nunca dolor agudo en la rodilla.', parar: 'Dolor punzante, bloqueo, hinchazón inmediata.',
    errores: 'Estirar de golpe o con impulso.', facil: 'No estirar del todo; solo hasta donde no moleste.',
    progresion: 'Añadir una pausa de 2-3 s con la pierna estirada.' },
  { id: 'h1', nivel: 1, bloque: 'cadera', orden: 4, min: 1.5, nombre: 'Elevación de rodilla sentada',
    objetivo: 'Movilizar la cadera en un rango tolerable sin cargar la zona lumbar.',
    posicion: 'Sentada en silla con respaldo, manos en el asiento o en los muslos.',
    ejecucion: 'Elevar una rodilla suavemente hacia el pecho y bajarla con control.',
    dosis: '6-8 repeticiones por pierna (1-2 min).', respiracion: 'Exhalar al subir, inhalar al bajar.',
    esperadas: 'Activación suave de cadera/abdomen, sin dolor lumbar.', parar: 'Dolor lumbar que aumenta, dolor que baja a la pierna, pérdida de equilibrio.',
    errores: 'Arquear la espalda en lugar de mover la cadera.', facil: 'Subir menos la rodilla o ayudarse con las manos.',
    progresion: 'Apretar un cojín entre las rodillas (activación de cadera).' },
  { id: 'c1', nivel: 1, bloque: 'core', orden: 5, min: 2, nombre: 'Báscula pélvica',
    objetivo: 'Activar la musculatura profunda del abdomen y movilizar suavemente la zona lumbar.',
    posicion: 'Tumbada boca arriba en la cama, rodillas dobladas, pies apoyados.',
    ejecucion: 'Aplanar suavemente la zona lumbar contra la cama contrayendo el abdomen bajo, mantener y soltar.',
    dosis: '8-10 repeticiones manteniendo 3-5 s (2 min).', respiracion: 'Exhalar al contraer, inhalar al soltar.',
    esperadas: 'Activación suave del abdomen, nunca dolor.', parar: 'Dolor lumbar que aumenta; hormigueo o adormecimiento que aparece o empeora.',
    errores: 'Contraer demasiado fuerte o levantar la pelvis.', facil: 'Contracción más suave, movimiento más pequeño.',
    progresion: 'Puente de glúteos parcial (cuando lo indique la fisio).' },
  { id: 's1', nivel: 1, bloque: 'levantarse', orden: 6, min: 1.5, nombre: 'Levantarse y sentarse con apoyo',
    objetivo: 'Mejorar la fuerza de piernas y la capacidad de levantarse con seguridad.',
    posicion: 'Sentada en silla firme con reposabrazos o con apoyo estable delante (mesa, encimera).',
    ejecucion: 'Levantarse apoyándose con los brazos, controlar el movimiento y volver a sentarse despacio.',
    dosis: '3-5 repeticiones con pausa entre cada una (1-2 min).', respiracion: 'Exhalar al levantarse, inhalar al sentarse.',
    esperadas: 'Esfuerzo en piernas, ligera fatiga, sin dolor agudo.', parar: 'Mareo al levantarse, dolor agudo, pérdida de equilibrio, piernas que fallan.',
    errores: 'Levantarse de golpe o dejarse caer al sentarse.', facil: 'Silla más alta, más apoyo de brazos, 2-3 repeticiones.',
    progresion: 'Reducir el apoyo de los brazos (una mano).' },
  { id: 'b1', nivel: 1, bloque: 'equilibrio', orden: 7, min: 1.5, nombre: 'Transferencia de peso con apoyo',
    objetivo: 'Trabajar el equilibrio de forma segura para ganar confianza.',
    posicion: 'De pie, con apoyo firme de ambas manos en encimera, silla fija o pared.',
    ejecucion: 'Pasar el peso suavemente de un pie al otro, sin soltar las manos.',
    dosis: '6-8 repeticiones por lado (1-2 min).', respiracion: 'Libre y continua.',
    esperadas: 'Sensación de control, ligera activación de piernas.', parar: 'Mareo, sensación de caída, aumento del miedo.',
    errores: 'Soltar el apoyo antes de sentirse segura.', facil: 'Movimiento más pequeño, ambas manos bien apoyadas.',
    progresion: 'Marcha en el sitio con apoyo.' },

  // ---------------- NIVEL 2 ----------------
  { id: 'r2', nivel: 2, bloque: 'resp', previo: 'r1', min: 1.5, nombre: 'Respiración con activación abdominal',
    objetivo: 'Coordinar respiración y faja abdominal profunda.',
    posicion: 'Tumbada boca arriba con rodillas dobladas, o sentada.',
    ejecucion: 'Al exhalar, meter suavemente el ombligo hacia dentro (como al abrocharse un pantalón ajustado) sin mover la espalda; soltar al inhalar.',
    dosis: '6-8 respiraciones.', respiracion: 'Exhalación larga mientras activa.',
    esperadas: 'Ligera tensión abdominal, sin dolor.', parar: 'Dolor lumbar, mareo, ahogo.',
    errores: 'Aguantar la respiración o apretar demasiado.', facil: 'Volver a respiración diafragmática simple.',
    progresion: 'Mantener la activación mientras mueve los talones (talones alternos tumbada).' },
  { id: 't2', nivel: 2, bloque: 'tobillo', previo: 't1', min: 1, nombre: 'Círculos de tobillo',
    objetivo: 'Movilidad completa del tobillo.', posicion: 'Sentada, pie ligeramente levantado o apoyado en el talón.',
    ejecucion: 'Dibujar círculos lentos con la punta del pie en ambos sentidos.',
    dosis: '8 círculos en cada sentido por pie.', respiracion: 'Libre.',
    esperadas: 'Movimiento suave.', parar: 'Dolor agudo o calambre.', errores: 'Mover toda la pierna en lugar del tobillo.',
    facil: 'Apoyar el talón en el suelo y hacer círculos pequeños.', progresion: 'Elevación de talones de pie con apoyo.' },
  { id: 'k2', nivel: 2, bloque: 'rodilla', previo: 'k1', min: 2, nombre: 'Extensión de rodilla con pausa',
    objetivo: 'Fortalecer el cuádriceps sin carga articular.', posicion: 'Sentada en silla con respaldo.',
    ejecucion: 'Estirar la rodilla, apretar el muslo 3 s con la pierna estirada y bajar despacio.',
    dosis: '8-10 repeticiones por pierna.', respiracion: 'Exhalar al estirar y mantener; inhalar al bajar.',
    esperadas: 'Esfuerzo en el muslo.', parar: 'Dolor punzante o bloqueo de rodilla.',
    errores: 'Bloquear la rodilla de golpe; echarse hacia atrás.', facil: 'Pausa de 1 s o menos recorrido.',
    progresion: 'Pausa de 5 s; más adelante lastre ligero si la fisio lo indica.' },
  { id: 'h2', nivel: 2, bloque: 'cadera', previo: 'h1', min: 1.5, nombre: 'Apretar cojín entre las rodillas',
    objetivo: 'Activar la musculatura de la cadera y la faja abdominal.', posicion: 'Sentada, cojín o toalla doblada entre las rodillas.',
    ejecucion: 'Apretar el cojín suavemente 5 s y soltar.',
    dosis: '8-10 repeticiones.', respiracion: 'Exhalar al apretar.',
    esperadas: 'Activación en la cara interna de los muslos.', parar: 'Dolor en ingle o cadera que aumenta.',
    errores: 'Apretar al máximo; aguantar la respiración.', facil: 'Apretar más suave y 3 s.',
    progresion: 'Separar rodillas contra la resistencia de las manos, o abducción de pie con apoyo.' },
  { id: 'c2', nivel: 2, bloque: 'core', previo: 'c1', fisio: true, min: 2, nombre: 'Puente de glúteos parcial',
    objetivo: 'Activar glúteos y extensores de cadera con poca carga lumbar.',
    posicion: 'Tumbada boca arriba en cama firme, rodillas dobladas, pies apoyados a la anchura de las caderas.',
    ejecucion: 'Hacer la báscula pélvica y elevar la pelvis solo unos centímetros; bajar despacio.',
    dosis: '6-8 repeticiones.', respiracion: 'Exhalar al subir, inhalar al bajar.',
    esperadas: 'Trabajo en glúteos y parte posterior del muslo.', parar: 'Dolor lumbar que aumenta o que baja a la pierna; hormigueo.',
    errores: 'Subir demasiado arqueando la zona lumbar.', facil: 'Volver a báscula pélvica con más mantenimiento.',
    progresion: 'Puente con pausa de 5 s arriba.' },
  { id: 'm1', nivel: 2, bloque: 'movilidad', previo: 'c1', min: 1.5, nombre: 'Balanceo pélvico sentada',
    objetivo: 'Movilidad suave de la zona lumbar sin carga.', posicion: 'Sentada en el borde de una silla estable, pies apoyados.',
    ejecucion: 'Rodar la pelvis hacia delante (arquear un poco) y hacia atrás (redondear un poco), en rango pequeño.',
    dosis: '8-10 repeticiones lentas.', respiracion: 'Inhalar hacia delante, exhalar hacia atrás.',
    esperadas: 'Movimiento cómodo en la zona lumbar.', parar: 'Si una de las dos direcciones aumenta el dolor de pierna o el hormigueo → dejar esa dirección y anotarlo para la fisio.',
    errores: 'Mover los hombros en lugar de la pelvis.', facil: 'Recorrido más pequeño.',
    progresion: 'Mantener recorrido cómodo; la fisio puede indicar una dirección preferente.' },
  { id: 'p1', nivel: 2, bloque: 'postura', previo: 'r1', min: 1, nombre: 'Retracción escapular sentada',
    objetivo: 'Activar la espalda alta y mejorar la postura.', posicion: 'Sentada con la espalda separada del respaldo.',
    ejecucion: 'Juntar suavemente los omóplatos hacia atrás y abajo, mantener 3 s y soltar.',
    dosis: '8-10 repeticiones.', respiracion: 'Exhalar al juntar.',
    esperadas: 'Ligero trabajo entre los omóplatos.', parar: 'Dolor de cuello u hombro.',
    errores: 'Subir los hombros hacia las orejas.', facil: 'Menos tiempo de mantenimiento.',
    progresion: 'Remo con banda elástica o toalla.' },
  { id: 's2', nivel: 2, bloque: 'levantarse', previo: 's1', min: 1.5, nombre: 'Levantarse con apoyo de una mano',
    objetivo: 'Reducir la dependencia de los brazos al levantarse.', posicion: 'Silla firme con reposabrazos; apoyo estable al lado.',
    ejecucion: 'Echar el tronco ligeramente adelante, apoyar solo una mano y levantarse; sentarse despacio.',
    dosis: '4-6 repeticiones con pausa.', respiracion: 'Exhalar al levantarse.',
    esperadas: 'Más trabajo de piernas.', parar: 'Mareo, dolor agudo, piernas que fallan.',
    errores: 'Impulsarse con balanceo; dejarse caer.', facil: 'Silla más alta (cojín) o volver a dos manos.',
    progresion: 'Levantarse sin brazos desde silla alta.' },
  { id: 't3', nivel: 2, bloque: 'tobillo', previo: 't2', min: 1.5, nombre: 'Elevación de talones con apoyo',
    objetivo: 'Fortalecer pantorrillas para la marcha y el equilibrio.', posicion: 'De pie frente a una encimera, ambas manos apoyadas.',
    ejecucion: 'Subir de puntillas despacio y bajar con control.',
    dosis: '8-10 repeticiones.', respiracion: 'Exhalar al subir.',
    esperadas: 'Trabajo en pantorrillas.', parar: 'Mareo, calambre, inestabilidad.',
    errores: 'Soltar las manos; subir con impulso.', facil: 'Subir solo un poco.',
    progresion: 'Mismo ejercicio con una sola mano de apoyo.' },
  { id: 'b2', nivel: 2, bloque: 'equilibrio', previo: 'b1', min: 1.5, nombre: 'Marcha en el sitio con apoyo',
    objetivo: 'Equilibrio dinámico y confianza.', posicion: 'De pie frente a una encimera, ambas manos apoyadas.',
    ejecucion: 'Levantar alternativamente los pies del suelo, como caminando en el sitio, a ritmo lento.',
    dosis: '30-60 s.', respiracion: 'Libre.',
    esperadas: 'Sensación de control.', parar: 'Mareo, miedo a caerse, dolor que baja a la pierna.',
    errores: 'Levantar mucho la rodilla o ir rápido.', facil: 'Solo levantar el talón, sin despegar la punta.',
    progresion: 'Pies juntos con apoyo de una mano.' },

  // ---------------- NIVEL 3 ----------------
  { id: 'c5', nivel: 3, bloque: 'core', previo: 'r2', min: 2, nombre: 'Talones alternos tumbada',
    objetivo: 'Control abdominal con movimiento de piernas.', posicion: 'Tumbada boca arriba, rodillas dobladas, pies apoyados.',
    ejecucion: 'Con el abdomen activado, deslizar un talón por la cama estirando la pierna y volver; alternar.',
    dosis: '6-8 por pierna.', respiracion: 'Exhalar al deslizar.',
    esperadas: 'Trabajo abdominal suave.', parar: 'Dolor lumbar o de pierna que aumenta.',
    errores: 'Arquear la espalda cuando se estira la pierna.', facil: 'Recorrido más corto.',
    progresion: 'Variante brazo-pierna contraria (dead bug suave), con visto bueno de la fisio.' },
  { id: 'c3', nivel: 3, bloque: 'core', previo: 'c2', fisio: true, min: 2, nombre: 'Puente de glúteos con pausa',
    objetivo: 'Fuerza de glúteos para levantarse y caminar.', posicion: 'Tumbada boca arriba, rodillas dobladas.',
    ejecucion: 'Elevar la pelvis hasta una altura cómoda, mantener 5 s y bajar vértebra a vértebra.',
    dosis: '6-8 repeticiones.', respiracion: 'Exhalar al subir; respirar normal durante la pausa.',
    esperadas: 'Trabajo de glúteos.', parar: 'Dolor lumbar o irradiado que aumenta; calambre.',
    errores: 'Arquear la zona lumbar; empujar con el cuello.', facil: 'Pausa de 2 s o puente parcial.',
    progresion: 'Puente con marcha alterna (nivel 5, con fisio).' },
  { id: 'a1', nivel: 3, bloque: 'cadera', previo: 'h2', min: 2, nombre: 'Almeja tumbada de lado',
    objetivo: 'Fortalecer el glúteo medio (estabilidad de cadera al caminar).',
    posicion: 'Tumbada de lado, cadera y rodillas dobladas, cojín entre las rodillas si molesta la cadera.',
    ejecucion: 'Manteniendo los pies juntos, separar la rodilla de arriba unos centímetros y bajar.',
    dosis: '8-10 por lado.', respiracion: 'Exhalar al abrir.',
    esperadas: 'Trabajo en el lateral de la cadera.', parar: 'Dolor de cadera que aumenta; dolor lumbar al estar de lado.',
    errores: 'Girar la pelvis hacia atrás.', facil: 'Abrir menos o hacerlo sentada (separar rodillas contra las manos).',
    progresion: 'Abducción de cadera de pie con apoyo.' },
  { id: 'h3', nivel: 3, bloque: 'cadera', previo: 'h2', min: 2, nombre: 'Abducción de cadera de pie con apoyo',
    objetivo: 'Fuerza lateral de cadera para la estabilidad.', posicion: 'De pie, ambas manos en una encimera.',
    ejecucion: 'Separar una pierna hacia el lado unos centímetros, sin inclinar el tronco, y volver.',
    dosis: '6-8 por pierna.', respiracion: 'Exhalar al separar.',
    esperadas: 'Trabajo en el lateral de la cadera.', parar: 'Dolor de cadera o lumbar que aumenta, inestabilidad.',
    errores: 'Inclinar el tronco hacia el lado contrario.', facil: 'Menos recorrido.',
    progresion: 'Pasos laterales junto a la encimera.' },
  { id: 'h4', nivel: 3, bloque: 'cadera', previo: 'h2', min: 2, nombre: 'Extensión de cadera de pie con apoyo',
    objetivo: 'Activar glúteos en posición de marcha.', posicion: 'De pie, ambas manos en una encimera, ligera inclinación adelante.',
    ejecucion: 'Llevar una pierna estirada ligeramente hacia atrás sin arquear la espalda y volver.',
    dosis: '6-8 por pierna.', respiracion: 'Exhalar al llevar atrás.',
    esperadas: 'Trabajo en glúteo.', parar: 'Dolor lumbar al llevar la pierna atrás; dolor irradiado.',
    errores: 'Arquear la zona lumbar para subir más.', facil: 'Recorrido muy pequeño.',
    progresion: 'Mantener 2 s atrás.' },
  { id: 'k4', nivel: 3, bloque: 'rodilla', previo: 'k2', min: 2, nombre: 'Flexión de rodilla de pie con apoyo',
    objetivo: 'Fortalecer la parte posterior del muslo.', posicion: 'De pie, ambas manos en una encimera.',
    ejecucion: 'Doblar una rodilla llevando el talón hacia el glúteo y bajar despacio.',
    dosis: '8 por pierna.', respiracion: 'Exhalar al doblar.',
    esperadas: 'Trabajo posterior del muslo.', parar: 'Dolor de rodilla punzante; calambre.',
    errores: 'Adelantar la cadera; ir rápido.', facil: 'Menos recorrido.',
    progresion: 'Pausa de 2 s arriba.' },
  { id: 's3', nivel: 3, bloque: 'levantarse', previo: 's2', min: 2, nombre: 'Levantarse sin brazos (silla alta)',
    objetivo: 'Levantarse sin depender de los brazos.', posicion: 'Silla firme y alta (o con cojín), brazos cruzados o en los muslos; apoyo cerca por seguridad.',
    ejecucion: 'Pies algo por detrás de las rodillas, tronco adelante, levantarse; sentarse despacio.',
    dosis: '5 repeticiones.', respiracion: 'Exhalar al levantarse.',
    esperadas: 'Esfuerzo moderado en piernas.', parar: 'Mareo, dolor agudo, piernas que fallan.',
    errores: 'Rodillas hacia dentro; caer al sentarse.', facil: 'Usar una mano.',
    progresion: 'Silla de altura normal, 8-10 repeticiones.' },
  { id: 'b3', nivel: 3, bloque: 'equilibrio', previo: 'b2', min: 1.5, nombre: 'Pies juntos con apoyo de una mano',
    objetivo: 'Equilibrio estático con menos base.', posicion: 'De pie junto a una encimera, una mano apoyada, la otra lista.',
    ejecucion: 'Juntar los pies y mantener la posición mirando al frente.',
    dosis: '3 × 20-30 s.', respiracion: 'Libre.',
    esperadas: 'Pequeños ajustes de equilibrio.', parar: 'Mareo, sensación de caída.',
    errores: 'Mirar al suelo; bloquear las rodillas.', facil: 'Pies un poco separados o dos manos.',
    progresion: 'Semitándem con apoyo cercano (con la fisio).' },
  { id: 'e1', nivel: 3, bloque: 'escalon', previo: 'b2', min: 1.5, nombre: 'Paso adelante y atrás con apoyo',
    objetivo: 'Preparar el gesto de subir escalones.', posicion: 'De pie junto a una encimera, una o dos manos apoyadas.',
    ejecucion: 'Dar un paso corto adelante, pasar el peso y volver; alternar piernas.',
    dosis: '6-8 por pierna.', respiracion: 'Libre.',
    esperadas: 'Control del peso.', parar: 'Inestabilidad, dolor de rodilla o cadera que aumenta.',
    errores: 'Pasos largos; girar el tronco.', facil: 'Paso más corto, dos manos.',
    progresion: 'Subir un escalón bajo con barandilla.' },
  { id: 'p2', nivel: 3, bloque: 'postura', previo: 'p1', min: 1.5, nombre: 'Remo con banda o toalla',
    objetivo: 'Fuerza de espalda alta.', posicion: 'Sentada, banda elástica sujeta a una puerta o una toalla que tira otra persona.',
    ejecucion: 'Tirar hacia atrás con los codos pegados al cuerpo juntando omóplatos; volver despacio.',
    dosis: '8-10 repeticiones.', respiracion: 'Exhalar al tirar.',
    esperadas: 'Trabajo en espalda alta.', parar: 'Dolor de hombro, cuello o lumbar.',
    errores: 'Encoger hombros; echarse hacia atrás.', facil: 'Banda más suave.',
    progresion: 'Más repeticiones o banda un poco más dura.' },

  // ---------------- NIVEL 4 ----------------
  { id: 'c6', nivel: 4, bloque: 'core', previo: 'c5', fisio: true, min: 2, nombre: 'Brazo y pierna contrarios tumbada (dead bug suave)',
    objetivo: 'Control lumbar con coordinación.', posicion: 'Tumbada boca arriba, rodillas dobladas, brazos hacia el techo.',
    ejecucion: 'Con el abdomen activado, deslizar un talón y llevar el brazo contrario hacia atrás; volver y alternar.',
    dosis: '5-6 por lado.', respiracion: 'Exhalar al alejar.',
    esperadas: 'Trabajo abdominal.', parar: 'Dolor lumbar, arqueo que no controla.',
    errores: 'Separar la zona lumbar de la cama.', facil: 'Solo piernas (talones alternos).',
    progresion: 'Más repeticiones con buen control.' },
  { id: 'k3', nivel: 4, bloque: 'rodilla', previo: 'k2', fisio: true, min: 2, nombre: 'Extensión de rodilla con lastre ligero',
    objetivo: 'Fuerza de cuádriceps progresiva.', posicion: 'Sentada, tobillera de 0,5-1 kg.',
    ejecucion: 'Estirar la rodilla, mantener 3 s y bajar despacio.',
    dosis: '8-10 por pierna.', respiracion: 'Exhalar al estirar.',
    esperadas: 'Esfuerzo en el muslo.', parar: 'Dolor de rodilla que aumenta o hinchazón al día siguiente.',
    errores: 'Lastre excesivo; movimiento brusco.', facil: 'Sin lastre.',
    progresion: 'Subir lastre solo si la fisio lo indica.' },
  { id: 'h5', nivel: 4, bloque: 'cadera', previo: 'h3', min: 2, nombre: 'Pasos laterales junto a la encimera',
    objetivo: 'Estabilidad lateral funcional.', posicion: 'De pie de cara a la encimera, manos apoyadas.',
    ejecucion: 'Dar pasos laterales cortos a lo largo de la encimera, ida y vuelta.',
    dosis: '3-4 idas y vueltas.', respiracion: 'Libre.',
    esperadas: 'Trabajo de cadera.', parar: 'Inestabilidad, dolor de cadera.',
    errores: 'Cruzar los pies; pasos largos.', facil: 'Menos distancia.',
    progresion: 'Más idas y vueltas.' },
  { id: 's4', nivel: 4, bloque: 'levantarse', previo: 's3', min: 2, nombre: 'Levantarse sin brazos (silla normal)',
    objetivo: 'Autonomía para levantarse de cualquier silla.', posicion: 'Silla de altura normal, brazos cruzados; apoyo cerca.',
    ejecucion: 'Levantarse y sentarse con control.',
    dosis: '8-10 repeticiones.', respiracion: 'Exhalar al levantarse.',
    esperadas: 'Esfuerzo en piernas.', parar: 'Mareo, dolor agudo, piernas que fallan.',
    errores: 'Impulso con el tronco; caer al sentarse.', facil: 'Silla alta.',
    progresion: 'Bajada lenta de 3 s.' },
  { id: 't4', nivel: 4, bloque: 'tobillo', previo: 't3', min: 1.5, nombre: 'Elevación de talones con una mano',
    objetivo: 'Fuerza de pantorrilla y equilibrio.', posicion: 'De pie junto a una encimera, una mano apoyada.',
    ejecucion: 'Subir de puntillas y bajar despacio.',
    dosis: '10-12 repeticiones.', respiracion: 'Exhalar al subir.',
    esperadas: 'Trabajo en pantorrilla.', parar: 'Inestabilidad, calambre.',
    errores: 'Balancearse.', facil: 'Dos manos.', progresion: 'Más repeticiones.' },
  { id: 'b4', nivel: 4, bloque: 'equilibrio', previo: 'b3', fisio: true, min: 1.5, nombre: 'Semitándem con apoyo cercano',
    objetivo: 'Equilibrio con base estrecha.', posicion: 'Junto a la encimera, una mano apoyada o rozando.',
    ejecucion: 'Colocar un pie medio adelantado (el talón a la altura del arco del otro) y mantener.',
    dosis: '3 × 15-30 s por lado.', respiracion: 'Libre.',
    esperadas: 'Ajustes de equilibrio.', parar: 'Mareo, sensación de caída.',
    errores: 'Mirar al suelo.', facil: 'Pies juntos.', progresion: 'Tándem completo con apoyo cercano.' },
  { id: 'e2', nivel: 4, bloque: 'escalon', previo: 'e1', fisio: true, min: 2, nombre: 'Subir un escalón bajo con barandilla',
    objetivo: 'Recuperar la capacidad de subir escaleras.', posicion: 'Frente a un escalón bajo (10-15 cm) con barandilla firme.',
    ejecucion: 'Subir con la pierna más fuerte, bajar con la más débil ("sube el bueno, baja el malo"); agarrada siempre.',
    dosis: '5-6 por lado.', respiracion: 'Exhalar al subir.',
    esperadas: 'Esfuerzo en muslo y glúteo.', parar: 'Dolor de rodilla punzante, inestabilidad, mareo.',
    errores: 'Soltar la barandilla; subir con impulso.', facil: 'Escalón más bajo o paso adelante en llano.',
    progresion: 'Subir y bajar 2-3 escalones.' },

  // ---------------- NIVEL 5 ----------------
  { id: 's5', nivel: 5, bloque: 'levantarse', previo: 's4', min: 2, nombre: 'Levantarse con bajada lenta',
    objetivo: 'Fuerza excéntrica y control al sentarse.', posicion: 'Silla normal, brazos cruzados.',
    ejecucion: 'Levantarse normal y sentarse contando 3 s de bajada.',
    dosis: '8-10 repeticiones.', respiracion: 'Exhalar al levantarse, inhalar al bajar.',
    esperadas: 'Esfuerzo moderado.', parar: 'Dolor de rodilla o lumbar que aumenta.',
    errores: 'Dejarse caer al final.', facil: 'Bajada de 2 s.', progresion: 'Mantener y usar como mantenimiento.' },
  { id: 'c4', nivel: 5, bloque: 'core', previo: 'c3', fisio: true, min: 2, nombre: 'Puente con marcha alterna',
    objetivo: 'Estabilidad de pelvis.', posicion: 'Tumbada boca arriba, en puente parcial.',
    ejecucion: 'Desde el puente, despegar un pie unos centímetros sin que caiga la pelvis; alternar.',
    dosis: '4-6 por lado.', respiracion: 'Libre, sin retener.',
    esperadas: 'Trabajo de glúteo y abdomen.', parar: 'Dolor lumbar o irradiado.',
    errores: 'Pelvis que se inclina.', facil: 'Puente con pausa.', progresion: 'Mantenimiento.' },
  { id: 'b5', nivel: 5, bloque: 'equilibrio', previo: 'b4', fisio: true, min: 1.5, nombre: 'Tándem con apoyo cercano',
    objetivo: 'Equilibrio avanzado con seguridad.', posicion: 'Junto a la encimera, mano rozando.',
    ejecucion: 'Un pie justo delante del otro (talón con punta) y mantener.',
    dosis: '3 × 15-30 s por lado.', respiracion: 'Libre.',
    esperadas: 'Ajustes de equilibrio.', parar: 'Mareo, sensación de caída.',
    errores: 'Soltarse del todo.', facil: 'Semitándem.', progresion: 'Caminar en línea junto a la encimera.' },
  { id: 'b6', nivel: 5, bloque: 'equilibrio', previo: 'b4', fisio: true, min: 1.5, nombre: 'Apoyo en un pie con ambas manos',
    objetivo: 'Equilibrio monopodal para escaleras y bordillos.', posicion: 'Frente a la encimera, ambas manos apoyadas.',
    ejecucion: 'Levantar un pie unos centímetros y mantener.',
    dosis: '3 × 5-10 s por lado.', respiracion: 'Libre.',
    esperadas: 'Trabajo de tobillo y cadera.', parar: 'Inestabilidad, dolor.',
    errores: 'Inclinar el tronco.', facil: 'Solo apoyar la punta del pie levantado.', progresion: 'Una mano.' },
  { id: 'e3', nivel: 5, bloque: 'escalon', previo: 'e2', fisio: true, min: 2, nombre: 'Subir y bajar 2-3 escalones',
    objetivo: 'Autonomía en escaleras.', posicion: 'Escalera con barandilla firme.',
    ejecucion: 'Subir y bajar 2-3 escalones agarrada, alternando o "sube el bueno, baja el malo".',
    dosis: '2-3 series.', respiracion: 'Libre.',
    esperadas: 'Esfuerzo en piernas.', parar: 'Dolor de rodilla, mareo, inestabilidad.',
    errores: 'Soltar la barandilla; prisa.', facil: 'Un solo escalón.', progresion: 'Más escalones según tolerancia.' },
  { id: 'm2', nivel: 5, bloque: 'movilidad', previo: 'm1', fisio: true, min: 1.5, nombre: 'Rodillas a un lado tumbada',
    objetivo: 'Movilidad de rotación muy suave de la columna.', posicion: 'Tumbada boca arriba, rodillas dobladas y juntas.',
    ejecucion: 'Dejar caer las rodillas un poco hacia un lado, en rango pequeño, y volver; alternar.',
    dosis: '6-8 por lado.', respiracion: 'Exhalar al bajar.',
    esperadas: 'Movilidad cómoda.', parar: 'Dolor lumbar o de pierna que aumenta.',
    errores: 'Bajar mucho o con impulso (evitar torsiones fuertes).', facil: 'Rango muy pequeño.', progresion: 'Mantenimiento.' }
];

/* Pruebas funcionales (cada 14 días). mejor: 'mas' | 'menos' | null */
const LV_TESTS = [
  { id: 'sts30', nombre: 'Levantarse de la silla en 30 s', corto: 'Silla 30 s', unidad: 'rep', mejor: 'mas', grupo: 'Fuerza',
    como: 'Silla firme sin ruedas contra la pared. Contar cuántas veces se levanta del todo y se sienta en 30 s. Anotar si usa los brazos. Alguien al lado.',
    extra: { key: 'brazos', label: '¿Usó los brazos?', opts: ['No', 'Una mano', 'Ambas'] } },
  { id: 'caminata', nombre: 'Caminata continua tolerada', corto: 'Caminata', unidad: 'min', mejor: 'mas', grupo: 'Tolerancia',
    como: 'Minutos que camina a su ritmo hasta tener que parar por dolor/fatiga (no forzar). Anotar si el dolor mejora al sentarse o inclinarse.' },
  { id: 'pie', nombre: 'Tiempo de pie tolerado', corto: 'De pie', unidad: 'min', mejor: 'mas', grupo: 'Tolerancia',
    como: 'Minutos de pie (p. ej. en la cocina) hasta necesitar sentarse o apoyarse.' },
  { id: 'sentada', nombre: 'Tiempo sentada antes de cambiar de postura', corto: 'Sentada', unidad: 'min', mejor: 'mas', grupo: 'Tolerancia',
    como: 'Minutos sentada antes de que la molestia obligue a moverse.' },
  { id: 'piesjuntos', nombre: 'Pies juntos con apoyo ligero', corto: 'Pies juntos', unidad: 's', mejor: 'mas', grupo: 'Equilibrio', max: 30,
    como: 'Junto a una encimera con una mano rozando. Segundos con los pies juntos (máx. 30). Parar si hay mareo.' },
  { id: 'semitandem', nombre: 'Semitándem con apoyo cercano', corto: 'Semitándem', unidad: 's', mejor: 'mas', grupo: 'Equilibrio', max: 30, fisio: true,
    como: 'Solo si la fisio lo ve seguro. Un pie medio adelantado, mano cerca de la encimera. Segundos (máx. 30).' },
  { id: 'escalones', nombre: 'Escalones seguidos', corto: 'Escalones', unidad: 'esc.', mejor: 'mas', grupo: 'Escalones',
    como: 'Número de escalones que sube seguidos agarrada a la barandilla, sin dolor fuerte.',
    extra: { key: 'barandilla', label: 'Barandilla', opts: ['Con barandilla', 'Sin barandilla', 'Con ayuda de alguien'] } },
  { id: 'peso', nombre: 'Peso', corto: 'Peso', unidad: 'kg', mejor: null, grupo: 'Peso', step: 0.1,
    como: 'Misma báscula, por la mañana y con ropa similar.' }
];

/* Señales de alarma  */
const LV_ALARMS = [
  { id: 'silla', nivel: 'urgente', texto: 'Adormecimiento nuevo en genitales, periné o zona de "silla de montar"' },
  { id: 'esfinter', nivel: 'urgente', texto: 'Pérdida nueva del control de orina o heces, o no poder orinar' },
  { id: 'episodio', nivel: 'urgente', texto: 'Nuevo episodio de adormecimiento de cintura para abajo o no poder caminar' },
  { id: 'fuerza', nivel: 'urgente', texto: 'Pérdida de fuerza nueva o que va a más' },
  { id: 'sensib', nivel: 'hoy', texto: 'Pérdida de sensibilidad extensa nueva' },
  { id: 'miccion', nivel: 'hoy', texto: 'Dificultad nueva importante para iniciar o mantener la micción' },
  { id: 'dolor', nivel: 'hoy', texto: 'Dolor súbito o muy diferente al habitual' },
  { id: 'fiebre', nivel: 'hoy', texto: 'Fiebre junto con dolor lumbar' },
  { id: 'caida', nivel: 'hoy', texto: 'Caída importante o golpe relevante' },
  { id: 'otro', nivel: 'hoy', texto: 'Otro síntoma que un profesional indicó como motivo de urgencia' }
];


/* =====================================================================
   ESTUDIOS en los que se apoya el programa
   ===================================================================== */
EVIDENCE.push(
 {id:'finucane20', tema:'rehab', cita:'Finucane y col.', rev:'Journal of Orthopaedic & Sports Physical Therapy', year:2020, tipo:'Marco internacional de consenso',
  hallazgo:'Las señales de alarma de patología grave de columna (como la compresión de la cola de caballo: adormecimiento en silla de montar, cambios nuevos al orinar o en las heces, pérdida de fuerza que avanza) requieren valoración médica urgente; el resto del dolor lumbar se maneja con ejercicio y actividad.', regla:'Antes de cada sesión, check de señales de alarma: si aparece una nueva, no se hace la rutina y se avisa al médico o a Urgencias.'},
 {id:'pocovi24', tema:'rehab', cita:'Pocovi y col. (WalkBack)', rev:'The Lancet', year:2024, tipo:'Ensayo aleatorizado (701 personas)',
  hallazgo:'Un programa de caminar individualizado y progresivo, con educación, alargó el tiempo hasta la siguiente recaída de dolor lumbar (mediana 208 frente a 112 días) y redujo las bajas y las consultas.', regla:'La caminata es una parte central del plan: se sube 1 min cuando 3 caminatas seguidas llegan al objetivo sin empeorar al día siguiente.'},
 {id:'jones99', tema:'mayores', cita:'Jones, Rikli y Beam', rev:'Research Quarterly for Exercise and Sport', year:1999, tipo:'Estudio de validación',
  hallazgo:'Contar cuántas veces una persona se levanta de una silla en 30 s es una medida fiable y válida de la fuerza de las piernas en adultos.', regla:'Prueba de la silla en 30 s cada 2 semanas para ver si el programa funciona.'}
);
for (const e of EVIDENCE) EV[e.id] = e;

/* Plantillas del muñeco que encajan con cada ejercicio (si no encaja ninguna, solo texto) */
const LV_TPL = {k1:'legext', k2:'legext', k3:'legext', s1:'sit_stand', s2:'sit_stand', s3:'sit_stand', s4:'sit_stand', s5:'sit_stand', t3:'calf', t4:'calf',
  c2:'bridge', c3:'bridge', c4:'bridge', c5:'deadbug', c6:'deadbug', a1:'sidelying', h5:'bandwalk', b3:'tandem', b4:'tandem', b5:'tandem', b6:'singleleg',
  e1:'stepup', e2:'stepup', e3:'stepup', p2:'row_cable'};
const LV_LAB = {si:'Sí', parcial:'Parcial', no:'No'};
const lvEx = id => LV_EX.find(e => e.id === id);
const lvSeated = e => /^(Sentada|Tumbada)/.test(e.posicion) || ['resp'].includes(e.bloque);
const lvKey = (p = curProf()) => `lv:${p.id}`;
const lvState = (p = curProf()) => Object.assign({routine:LV_EX.filter(e => e.nivel === 1).map(e => e.id), dom:{}, fisioOk:{}, lastProg:null, base:{lumbar:5, pierna:5}, walkTarget:5}, kv(lvKey(p), {}));
const setLvState = async st => setKv(lvKey(), st);
const lvDraftKey = () => `lvdraft:${curProf().id}`;
const today0 = () => dayKey(new Date());
function lvDraft(){ const d = kv(lvDraftKey(), null); return d && d.day === today0() ? d : {day:today0(), check:null, items:{}, sint:{}, walk:{min:'', donde:'fuera', sint:false}}; }
const saveDraft = d => setKv(lvDraftKey(), d);
const lvSessions = () => Object.values(S.app).filter(s => s.kind === 'lv' && s.p === curProf().id && s.status === 'done').sort((a,b) => a.date < b.date ? 1 : -1);

/* ---------- semáforo (mismas reglas que MeryCon) ---------- */
function lvEvaluate(c, st){
  const alarms = LV_ALARMS.filter(a => c.alarmas && c.alarmas[a.id]);
  if (alarms.length) return {color:'rojo', urgent:alarms.some(a => a.nivel === 'urgente'), reasons:alarms.map(a => a.texto), cautions:[]};
  const r = [], bl = st.base.lumbar, bp = st.base.pierna;
  if (c.lumbar != null && c.lumbar >= bl + 2) r.push(`Dolor lumbar ${c.lumbar}/10, por encima de lo habitual (${bl})`);
  if (c.pierna != null && c.pierna >= bp + 2) r.push(`Dolor de pierna ${c.pierna}/10, por encima de lo habitual (${bp})`);
  if (c.sueno === 'mala') r.push('Ha dormido mal');
  if (c.energia != null && c.energia <= 3) r.push(`Energía baja (${c.energia}/10)`);
  if (c.somn != null && c.somn >= 6) r.push(`Somnolencia alta (${c.somn}/10)`);
  if (c.mareo != null && c.mareo >= 3) r.push(`Mareo (${c.mareo}/10)`);
  if (c.neuro === 'si') r.push('Síntoma neurológico nuevo (leve): anotarlo y comentarlo con su médico o la fisio si se repite o va a más');
  if (c.urin === 'si') r.push('Cambio urinario o intestinal leve: vigilar y comentarlo con su médico');
  const prev = lvSessions()[0]; if (prev && prev.resp24 === 'peor') r.push('Respondió peor al ejercicio anterior');
  const cautions = [];
  if ((c.somn ?? 0) >= 5 || (c.mareo ?? 0) >= 3) cautions.push('Con somnolencia o mareo: hoy nada de equilibrio ni de levantarse sin alguien al lado.');
  return {color: r.length ? 'amarillo' : 'verde', reasons:r, cautions, urgent:false};
}
const LV_LIGHT = {
  verde:{t:'Verde', d:'Sin señales de alarma y estado estable.', rec:['Rutina completa (~10 min).', 'Caminata según el objetivo.', 'Mejor cuando esté despierta y alerta, no justo antes de dormir.']},
  amarillo:{t:'Amarillo', d:'Día más flojo: menos volumen.', rec:['Solo los ejercicios sentada o tumbada (~5 min).', 'Caminata corta (3-5 min) o dentro de casa.', 'Un día malo no significa que el plan haya fallado.']},
  rojo:{t:'Rojo', d:'Hay un cambio importante respecto a lo habitual.', rec:['Hoy no se hace la rutina.', 'No es "reposo y ya": este cambio lo tiene que valorar un médico.']}
};
function lvLightHtml(ev){
  const L = LV_LIGHT[ev.color], rec = L.rec.slice();
  if (ev.color === 'rojo') rec.unshift(ev.urgent ? 'Valoración médica urgente: ir hoy a Urgencias. Si no puede moverse o es muy intenso, llamar al 112.' : 'Contactar hoy con su médico (o con Urgencias si no es posible).');
  return `<article class="light ${ev.color}"><div class="light-h"><span class="light-dot"></span><b>Semáforo ${L.t}</b></div><p>${esc(L.d)}</p>
    ${ev.reasons.length ? `<ul>${ev.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    <p><b>Hoy:</b></p><ul>${rec.concat(ev.cautions || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    <div class="row" style="gap:6px">${evChip('finucane20')}</div></article>`;
}

/* ---------- progresión (reglas prudentes de MeryCon: no salen de un estudio concreto) ----------
   Listo para progresar: 6 sesiones en "Sí" en 21 días, sin síntomas, y las 3 últimas sin síntomas ni peor respuesta a las 24 h.
   Un cambio cada vez: máximo uno por semana. Lo que diga la fisio manda. */
function lvInfo(){
  const st = lvState(), ss = lvSessions(), cut = dayKey(new Date(Date.now() - 21*864e5)), info = {};
  for (const e of LV_EX) {
    const estado = st.dom[e.id] ? 'dominado' : (!e.previo || st.dom[e.previo]) ? 'disponible' : 'bloqueado';
    const rec = ss.filter(s => s.date.slice(0,10) >= cut && s.items && s.items[e.id]);
    const good = rec.filter(s => s.items[e.id] === 'si' && !(s.sint && s.sint[e.id]) && s.semaforo !== 'rojo').length;
    const clean = rec.slice(0, 3).every(s => !(s.sint && s.sint[e.id]) && s.resp24 !== 'peor');
    info[e.id] = {estado, good, ready: estado === 'disponible' && st.routine.includes(e.id) && good >= 6 && clean, inR: st.routine.includes(e.id), needFisio: !!e.fisio && !st.fisioOk[e.id]};
  }
  const days = st.lastProg ? Math.round((startOfDay(new Date()) - parseIso(st.lastProg)) / 864e5) : 999;
  return {st, info, canProg: days >= 7, days};
}
function lvWalkSuggest(){
  const st = lvState(), cut = dayKey(new Date(Date.now() - 10*864e5));
  const w = lvSessions().filter(s => s.walk && toNum(s.walk.min) && s.date.slice(0,10) >= cut).slice(0, 3);
  const ok = w.length === 3 && w.every(s => toNum(s.walk.min) >= st.walkTarget && s.semaforo === 'verde' && s.resp24 !== 'peor' && !s.walk.sint);
  return ok ? st.walkTarget + 1 : null;
}

/* ---------- pantalla Entrenar del perfil por niveles ---------- */
const rng = (id, lab, v, max = 10) => `<label class="lv-rng"><span>${lab}</span><input type="range" min="0" max="${max}" step="1" value="${v ?? 0}" data-lvc="${id}"><b id="lvv-${id}">${v ?? 0}</b></label>`;
const yn = (id, lab, v) => `<div class="lv-yn"><span>${lab}</span><div class="chip-row">${['no','si'].map(x => `<button class="chip small ${v === x ? 'on' : ''}" data-lvcs="${id}:${x}">${x === 'si' ? 'Sí' : 'No'}</button>`).join('')}</div></div>`;
function lvCheckForm(c){
  c = c || {lumbar:lvState().base.lumbar, pierna:lvState().base.pierna, energia:6, somn:2, mareo:0, sueno:'regular', neuro:'no', urin:'no', alarmas:{}};
  S.lvCheck = c;
  return `<section class="card pad stack" style="gap:12px">
    <h2>Antes de empezar: ¿cómo está hoy?</h2>
    <p class="muted" style="margin:0;font-size:14px">1 minuto. Decide si hoy toca rutina completa, suave o nada.</p>
    ${rng('lumbar','Dolor lumbar',c.lumbar)}${rng('pierna','Dolor de pierna',c.pierna)}${rng('energia','Energía',c.energia)}${rng('somn','Somnolencia',c.somn)}${rng('mareo','Mareo',c.mareo)}
    <div class="lv-yn"><span>Sueño</span><div class="chip-row">${['buena','regular','mala'].map(x => `<button class="chip small ${c.sueno === x ? 'on' : ''}" data-lvcs="sueno:${x}">${x[0].toUpperCase() + x.slice(1)}</button>`).join('')}</div></div>
    ${yn('neuro','Hormigueo o adormecimiento nuevo leve', c.neuro)}${yn('urin','Cambio leve al orinar o en las heces', c.urin)}
    <div class="lv-alarm"><div class="eyebrow">Señales de alarma: marca solo si es NUEVO</div>
      ${LV_ALARMS.map(a => `<label class="${a.nivel === 'urgente' ? 'urg' : ''}"><input type="checkbox" data-lva="${a.id}" ${c.alarmas[a.id] ? 'checked' : ''}> <span>${esc(a.texto)}</span></label>`).join('')}</div>
    <button class="btn primary wide" id="lvCheckOk">Ver semáforo</button>
  </section>`;
}
function lvTodayList(d, ev){
  const st = lvState(); let ids = st.routine.slice();
  const lim = [];
  if (ev.color === 'amarillo') { ids = ids.filter(id => lvSeated(lvEx(id))); lim.push('solo sentada o tumbada'); }
  if (ev.cautions.length) { ids = ids.filter(id => !['equilibrio','levantarse','escalon'].includes(lvEx(id).bloque)); lim.push('sin equilibrio ni levantarse'); }
  return {ids, lim};
}
function renderLv(){
  const p = curProf(), st = lvState(), d = lvDraft(), pend = lvSessions().find(s => !s.resp24 && s.date.slice(0,10) < today0());
  const parts = [profBar()];
  if (pend) parts.push(`<section class="card pad stack" style="gap:10px"><h2>¿Cómo respondió al ejercicio del ${fmtDate(parseIso(pend.date),{weekday:'long', day:'numeric'})}?</h2>
    <p class="muted" style="margin:0;font-size:14px">Al día siguiente, comparado con lo habitual. Sirve para decidir si se puede progresar.</p>
    <div class="row" style="gap:8px">${[['mejor','Mejor'],['igual','Igual'],['peor','Peor']].map(([k,l]) => `<button class="btn" style="flex:1" data-lvresp="${pend.id}:${k}">${l}</button>`).join('')}</div></section>`);
  if (!d.check) { parts.push(lvCheckForm(S.lvCheck && S.lvCheck._day === today0() ? S.lvCheck : null)); return `<div class="stack">${parts.join('')}</div>`; }
  const ev = lvEvaluate(d.check, st);
  parts.push(lvLightHtml(ev) + `<button class="btn ghost small" id="lvRecheck" style="align-self:flex-start">Repetir el check</button>`);
  if (ev.color === 'rojo') return `<div class="stack">${parts.join('')}</div>`;
  const {ids, lim} = lvTodayList(d, ev), mins = ids.reduce((a, id) => a + (lvEx(id).min || 1), 0);
  parts.push(`<div class="eyebrow">Rutina de hoy · ${ids.length} ejercicios · ~${Math.round(mins)} min${lim.length ? ' · ' + lim.join(', ') : ''}</div>`);
  parts.push(ids.map(id => { const e = lvEx(id), v = d.items[id], sx = !!d.sint[id];
    return `<article class="card lv-ex ${v ? 'done' : ''}"><div class="lv-ex-h"><span class="lv-lvl l${e.nivel}">N${e.nivel}</span><button class="ex-name" data-lvguide="${id}">${esc(e.nombre)} <span class="ex-how">▶︎</span></button></div>
      <div class="muted" style="font-size:14px">${esc(e.dosis)}</div>
      <div class="lv-stop">Parar si: ${esc(e.parar)}</div>
      <div class="row" style="gap:6px;flex-wrap:wrap">${Object.entries(LV_LAB).map(([k,l]) => `<button class="chip small ${v === k ? 'on' : ''}" data-lvitem="${id}:${k}">${l}</button>`).join('')}
        <button class="chip small ${sx ? 'on warnc' : ''}" data-lvsint="${id}">${sx ? '⚠︎ Notó síntomas' : '¿Síntomas?'}</button></div></article>`; }).join(''));
  const wt = ev.color === 'amarillo' ? '3-5' : String(st.walkTarget), sug = lvWalkSuggest();
  parts.push(`<section class="card pad stack" style="gap:10px"><h2>Caminata · objetivo ${wt} min</h2>
    <p class="muted" style="margin:0;font-size:14px">A su ritmo, pudiendo parar y sentarse. Si no puede hablar con normalidad, más despacio.</p>
    <div class="row" style="gap:8px;align-items:center"><input class="field" id="lvWalk" inputmode="numeric" placeholder="min" value="${esc(d.walk.min)}" style="width:90px">
      <div class="chip-row">${[['fuera','Fuera'],['casa','En casa']].map(([k,l]) => `<button class="chip small ${d.walk.donde === k ? 'on' : ''}" data-lvwd="${k}">${l}</button>`).join('')}<button class="chip small ${d.walk.sint ? 'on warnc' : ''}" data-lvws>${d.walk.sint ? '⚠︎ Síntomas' : '¿Síntomas?'}</button></div></div>
    ${sug ? `<div class="tipc good"><div class="tipc-b">Las 3 últimas caminatas llegaron a ${st.walkTarget} min sin empeorar: se puede probar <b>${sug} min</b>. <button class="btn small primary" data-lvwalkup="${sug}">Subir a ${sug} min</button></div><div class="row">${evChip('pocovi24')}</div></div>` : ''}</section>`);
  parts.push(`<button class="btn primary wide" id="lvSave">Guardar la sesión de hoy</button>`);
  parts.push(lvProgressCard());
  return `<div class="stack">${parts.join('')}</div>`;
}
function lvProgressCard(){
  const {st, info, canProg, days} = lvInfo();
  const ready = st.routine.filter(id => info[id].ready);
  const avail = LV_EX.filter(e => info[e.id].estado === 'disponible' && !info[e.id].inR);
  const rows = st.routine.map(id => { const e = lvEx(id), i = info[id];
    return `<div class="lv-pr"><span>${esc(e.nombre)}</span><div class="bar"><i style="width:${Math.min(100, i.good/6*100)}%"></i></div><span class="num faint">${Math.min(6, i.good)}/6</span></div>`; }).join('');
  return `<section class="card pad stack" style="gap:10px">
    <header class="row" style="justify-content:space-between"><h2>Progresión</h2><button class="btn small ghost" data-lvlevels>Ver niveles</button></header>
    <p class="faint" style="font-size:12px;margin:0">Sesiones en "Sí" sin síntomas en 3 semanas (hacen falta 6). Un cambio cada vez, máximo uno por semana${canProg ? '' : ` (el último fue hace ${days} días)`}. Es una regla prudente del programa, no de un estudio: lo que diga la fisio manda.</p>
    ${rows}
    ${ready.length && canProg ? ready.map(id => { const nx = LV_EX.filter(e => e.previo === id);
      return `<div class="tipc good"><div class="tipc-b"><b>${esc(lvEx(id).nombre)}</b> está dominado. ${nx.length ? 'Siguiente paso:' : 'Es el último de su línea.'}</div><div class="row" style="gap:6px;flex-wrap:wrap">${nx.map(n => `<button class="btn small ${n.fisio && !st.fisioOk[n.id] ? '' : 'primary'}" data-lvprog="${id}:${n.id}">${esc(n.nombre)}${n.fisio && !st.fisioOk[n.id] ? ' · 🔒 fisio' : ''}</button>`).join('')}${nx.length ? '' : `<button class="btn small" data-lvprog="${id}:">Marcar dominado</button>`}</div></div>`; }).join('') : ''}
    ${avail.length ? `<details class="ra"><summary>Disponibles para añadir (${avail.length})</summary><div class="stack" style="gap:6px;padding-top:8px">${avail.map(e => `<div class="lv-pr"><span>N${e.nivel} · ${esc(e.nombre)}${e.fisio ? ' · fisio' : ''}</span><button class="btn small" data-lvadd="${e.id}">Añadir</button></div>`).join('')}</div></details>` : ''}
  </section>`;
}
function sheetLvGuide(id){
  const e = lvEx(id), st = lvState(), inR = st.routine.includes(id);
  const f = (t, v, cls) => v ? `<h4 class="g-h">${t}</h4><p class="${cls || 'muted'}" style="margin:0;font-size:14px">${esc(v)}</p>` : '';
  openSheet(`<div class="pk-head"><h3 class="sheet-t" style="margin:0">${esc(e.nombre)}</h3><button class="btn small ghost" data-sheetclose>Cerrar</button></div>
    <p class="faint" style="margin:2px 0 10px;font-size:12px">Nivel ${e.nivel} · ${esc(LV_LEVELS[e.nivel].nombre)} · ${esc(LV_BLOQUES[e.bloque] || '')}${e.fisio ? ' · con visto bueno de la fisio' : ''}</p>
    ${LV_TPL[id] && GT[LV_TPL[id]] ? '<div id="gAnim"></div>' : ''}
    ${f('Para qué', e.objetivo)}${f('Posición', e.posicion)}${f('Cómo', e.ejecucion)}${f('Dosis', e.dosis)}${f('Respiración', e.respiracion)}
    ${f('Qué es normal notar', e.esperadas)}${f('PARAR si', e.parar, 'lv-stop')}${f('Errores', e.errores)}${f('Más fácil', e.facil)}${f('Siguiente paso', e.progresion)}
    ${e.fisio ? `<label class="row" style="gap:8px;margin-top:12px;font-size:14px"><input type="checkbox" data-lvfisio="${id}" ${st.fisioOk[id] ? 'checked' : ''}> La fisio ha dado el visto bueno</label>` : ''}
    ${inR && st.routine.length > 1 ? `<button class="btn ghost wide" data-lvrem="${id}" style="margin-top:12px">Quitar de la rutina</button>` : ''}
    ${inR && e.previo ? `<button class="btn ghost wide" data-lvback="${id}" style="margin-top:8px">Volver al paso anterior (${esc(lvEx(e.previo).nombre)})</button>` : ''}`);
  if (LV_TPL[id] && GT[LV_TPL[id]]) gmount($('#gAnim'), LV_TPL[id]);
}
function sheetLvLevels(){
  const {info} = lvInfo();
  openSheet(`<div class="pk-head"><h3 class="sheet-t" style="margin:0">Niveles</h3><button class="btn small ghost" data-sheetclose>Cerrar</button></div>
    ${[1,2,3,4,5].map(n => `<h4 class="g-h">N${n} · ${esc(LV_LEVELS[n].nombre)}</h4><p class="faint" style="margin:0 0 6px;font-size:12px">${esc(LV_LEVELS[n].desc)}</p>
      <div class="sheet-list">${LV_EX.filter(e => e.nivel === n).map(e => { const i = info[e.id];
        return `<button class="sheet-item sess-row" data-lvguide="${e.id}"><span><b>${esc(e.nombre)}</b><small>${i.estado === 'dominado' ? '✓ Dominado' : i.estado === 'bloqueado' ? 'Se desbloquea con: ' + esc(lvEx(e.previo).nombre) : i.inR ? 'En la rutina' : 'Disponible'}${e.fisio ? (i.needFisio ? ' · 🔒 falta visto bueno de la fisio' : ' · fisio ✓') : ''}</small></span><span class="faint">›</span></button>`; }).join('')}</div>`).join('')}`);
}
async function lvSave(){
  const d = lvDraft(), p = curProf();
  const any = Object.keys(d.items).length || toNum(d.walk.min);
  if (!any) { toast('Marca al menos un ejercicio o los minutos de caminata.'); return; }
  const ev = lvEvaluate(d.check, lvState());
  const s = {id:uid('lv'), date:isoLocal(new Date()), start:Date.now(), end:Date.now(), status:'done', kind:'lv', p:p.id, title:'Rutina por niveles', ex:[],
    items:d.items, sint:d.sint, check:d.check, semaforo:ev.color, walk:{min:toNum(d.walk.min), donde:d.walk.donde, sint:!!d.walk.sint}, resp24:null};
  await IDB.put('sessions', s); S.app[s.id] = s;
  await setKv(lvDraftKey(), {day:today0(), check:d.check, items:{}, sint:{}, walk:{min:'', donde:'fuera', sint:false}, saved:true});
  rebuild(); render(); window.scrollTo({top:0});
  const done = Object.values(d.items).filter(x => x === 'si').length;
  toast(`Sesión guardada: ${done} ejercicios en "Sí"${toNum(d.walk.min) ? ` y ${toNum(d.walk.min)} min de caminata` : ''}.`);
}

/* ---------- Progreso del perfil por niveles ---------- */
function renderLvProgress(){
  const p = curProf(), ss = lvSessions(), st = lvState(), now = Date.now();
  const d14 = ss.filter(s => now - parseIso(s.date) < 14*864e5);
  const items = d14.flatMap(s => Object.values(s.items || {})), adh = items.length ? Math.round(items.filter(x => x === 'si').length / items.length * 100) : null;
  const sem = {verde:0, amarillo:0, rojo:0}; for (const s of d14) sem[s.semaforo] = (sem[s.semaforo] || 0) + 1;
  const walks = ss.filter(s => s.walk && toNum(s.walk.min)).slice(0, 12).reverse(), wmax = Math.max(10, ...walks.map(s => s.walk.min));
  const tests = kv(`lvtests:${p.id}`, []) || [], lastT = tests[0], dT = lastT ? Math.round((now - parseIso(lastT.d)) / 864e5) : null;
  const byTest = id => tests.filter(t => t.test === id);
  return `<div class="stack">
    <div class="tiles">
      <div class="card tile"><span class="l">Sesiones (14 días)</span><span class="v">${d14.length}</span><span class="d muted">${sem.verde} verde · ${sem.amarillo} amarillo · ${sem.rojo} rojo</span></div>
      <div class="card tile"><span class="l">Ejercicios en "Sí"</span><span class="v">${adh == null ? '—' : adh + ' %'}</span><span class="d muted">últimos 14 días</span></div>
      <div class="card tile"><span class="l">Caminata</span><span class="v">${st.walkTarget}<small style="font-size:14px"> min</small></span><span class="d muted">objetivo actual</span></div>
    </div>
    <section class="card pad stack" style="gap:8px"><h2>Caminatas</h2>
      ${walks.length ? `<div class="lv-walks">${walks.map(s => `<div title="${fmtDate(parseIso(s.date))}"><i style="height:${s.walk.min / wmax * 100}%" class="${s.walk.sint || s.semaforo !== 'verde' ? 'w' : ''}"></i><span>${s.walk.min}</span></div>`).join('')}</div><p class="faint" style="font-size:12px;margin:0">Minutos de las últimas caminatas · en naranja, con síntomas o en día no verde</p>` : '<p class="muted" style="margin:0">Aún no hay caminatas.</p>'}
      <div class="row">${evChip('pocovi24')}${evChip('hay21')}</div></section>
    <section class="card pad stack" style="gap:10px"><header class="row" style="justify-content:space-between"><h2>Pruebas funcionales</h2><span class="pill ${dT == null || dT >= 14 ? 'warn' : 'good'}">${dT == null ? 'pendiente' : dT >= 14 ? `hace ${dT} días` : 'al día'}</span></header>
      <p class="faint" style="font-size:12px;margin:0">Cada 2 semanas, en las mismas condiciones. Alguien al lado en las de equilibrio y de pie.</p>
      <div class="row" style="gap:8px;flex-wrap:wrap"><select class="field" id="lvTest" style="flex:2;min-width:180px">${LV_TESTS.filter(t => t.id !== 'peso').map(t => `<option value="${t.id}">${esc(t.nombre)}${t.fisio ? ' (con fisio)' : ''}</option>`).join('')}</select><input class="field" id="lvTestV" inputmode="decimal" placeholder="valor" style="flex:1;min-width:80px"><button class="btn primary" id="lvTestSave">Guardar</button></div>
      <p class="faint" id="lvTestHow" style="font-size:12px;margin:0">${esc(LV_TESTS[0].como)}</p>
      <div class="sheet-list">${LV_TESTS.filter(t => byTest(t.id).length).map(t => { const l = byTest(t.id), a = l[l.length - 1], b = l[0], dlt = b.v - a.v;
        return `<div class="sheet-item sess-row"><span><b>${esc(t.corto)}: ${fmtKg(b.v)} ${esc(t.unidad)}</b><small>${l.length > 1 ? `Antes ${fmtKg(a.v)} (${fmtDate(parseIso(a.d))}) · ${dlt > 0 ? '+' : ''}${fmtKg(dlt)}` : fmtDate(parseIso(b.d))}</small></span><button class="btn small ghost" data-lvtdel="${esc(b.id)}" aria-label="Borrar la última">✕</button></div>`; }).join('')}</div>
      <div class="row">${evChip('jones99')}${evChip('sher19')}</div></section>
    <section class="card pad stack" style="gap:8px"><h2>Sesiones</h2>
      <div class="sheet-list">${ss.slice(0, S.showAllSess ? 60 : 8).map(s => { const it = Object.values(s.items || {});
        return `<div class="sheet-item sess-row"><span><b><span class="light-dot ${s.semaforo}"></span> ${fmtDate(parseIso(s.date),{weekday:'short', day:'numeric', month:'short'})}</b><small>${it.filter(x => x === 'si').length}/${it.length} en "Sí"${s.walk && s.walk.min ? ` · caminata ${s.walk.min} min` : ''}${s.resp24 ? ` · al día siguiente: ${s.resp24}` : ''}${Object.keys(s.sint || {}).length || (s.walk && s.walk.sint) ? ' · ⚠︎ síntomas' : ''}</small></span><button class="btn small ghost" data-lvsdel="${esc(s.id)}" aria-label="Borrar sesión">✕</button></div>`; }).join('') || '<p class="muted" style="margin:0">Aún no hay sesiones.</p>'}</div>
      ${ss.length > 8 ? `<button class="btn ghost wide" data-allsess>${S.showAllSess ? 'Ver menos' : 'Ver todas'}</button>` : ''}<div id="lvDelZone"></div></section>
    <p class="faint" style="font-size:12px;margin:0;text-align:center">No sustituye a la fisioterapeuta ni al médico. Ante una señal de alarma nueva, no se hace la rutina.</p>
  </div>`;
}

/* ---------- crear el perfil ---------- */
function sheetLvNew(){
  openSheet(`<h3 class="sheet-t">Programa por niveles con fisio</h3>
    <p class="muted" style="font-size:14px;margin:0 0 10px">Para empezar desde muy poco con dolor crónico o miedo a caerse: ejercicios sentada o tumbada y con apoyo, semáforo antes de cada sesión y progresión muy gradual. No sustituye a la fisio.</p>
    <div class="stack" style="gap:10px">
      <input class="field" id="lvName" placeholder="Nombre (p. ej. Mamá)" autocomplete="off">
      <label class="lv-rng"><span>Dolor lumbar habitual</span><input type="range" min="0" max="10" value="5" id="lvBL" oninput="this.nextElementSibling.textContent=this.value"><b>5</b></label>
      <label class="lv-rng"><span>Dolor de pierna habitual</span><input type="range" min="0" max="10" value="5" id="lvBP" oninput="this.nextElementSibling.textContent=this.value"><b>5</b></label>
      <label class="lv-rng"><span>Caminata inicial (min)</span><input type="range" min="2" max="30" value="5" id="lvWT" oninput="this.nextElementSibling.textContent=this.value"><b>5</b></label>
      <p class="faint" style="font-size:12px;margin:0">El dolor habitual sirve de referencia: si un día está 2 puntos por encima, el semáforo pasa a amarillo.</p>
      <button class="btn primary wide" id="lvCreate">Crear perfil</button></div>`);
}
async function lvCreate(){
  const name = $('#lvName').value.trim() || 'Programa por niveles', id = uid('pf');
  const prof = {id, name, person:id, kind:'lv', q:{main:'lv', days:7}, created:dayKey(new Date())};
  await setKv('profiles', (kv('profiles', []) || []).concat(prof));
  await setKv(`lv:${id}`, {routine:LV_EX.filter(e => e.nivel === 1).map(e => e.id), dom:{}, fisioOk:{}, lastProg:null, base:{lumbar:+$('#lvBL').value, pierna:+$('#lvBP').value}, walkTarget:+$('#lvWT').value});
  closeSheet(); await switchProfile(id); toast(`Perfil "${name}" creado`);
}

/* ---------- eventos ---------- */
document.addEventListener('click', async e => {
  const t = e.target;
  if (t.closest('[data-lvnew]')) return sheetLvNew();
  if (t.closest('#lvCreate')) return lvCreate();
  if (!curProf().kind || curProf().kind !== 'lv') return;
  const g = t.closest('[data-lvguide]'); if (g) return sheetLvGuide(g.dataset.lvguide);
  if (t.closest('[data-lvlevels]')) return sheetLvLevels();
  const cs = t.closest('[data-lvcs]'); if (cs) { const [k, v] = cs.dataset.lvcs.split(':'); S.lvCheck[k] = v; S.lvCheck._day = today0(); render(); return; }
  if (t.closest('#lvCheckOk')) { const c = {...S.lvCheck}; delete c._day; const d = lvDraft(); d.check = c; await saveDraft(d); S.lvCheck = null; render(); window.scrollTo({top:0}); return; }
  if (t.closest('#lvRecheck')) { const d = lvDraft(); S.lvCheck = {...d.check, _day:today0()}; d.check = null; await saveDraft(d); render(); return; }
  const it = t.closest('[data-lvitem]'); if (it) { const [id, v] = it.dataset.lvitem.split(':'); const d = lvDraft(); d.items[id] = d.items[id] === v ? undefined : v; if (!d.items[id]) delete d.items[id]; await saveDraft(d); render(); return; }
  const sx = t.closest('[data-lvsint]'); if (sx) { const id = sx.dataset.lvsint, d = lvDraft(); if (d.sint[id]) delete d.sint[id]; else d.sint[id] = true; await saveDraft(d); render(); return; }
  const wd = t.closest('[data-lvwd]'); if (wd) { const d = lvDraft(); d.walk.donde = wd.dataset.lvwd; await saveDraft(d); render(); return; }
  if (t.closest('[data-lvws]')) { const d = lvDraft(); d.walk.sint = !d.walk.sint; await saveDraft(d); render(); return; }
  const wu = t.closest('[data-lvwalkup]'); if (wu) { const st = lvState(); st.walkTarget = +wu.dataset.lvwalkup; await setLvState(st); render(); toast(`Objetivo de caminata: ${st.walkTarget} min`); return; }
  if (t.closest('#lvSave')) return lvSave();
  const rp = t.closest('[data-lvresp]'); if (rp) { const [id, v] = rp.dataset.lvresp.split(':'); const s = S.app[id]; s.resp24 = v; await IDB.put('sessions', JSON.parse(JSON.stringify(s))); render(); toast(v === 'peor' ? 'Anotado. El semáforo lo tendrá en cuenta hoy.' : 'Anotado'); return; }
  const pg = t.closest('[data-lvprog]');
  if (pg) { const [from, to] = pg.dataset.lvprog.split(':'); const st = lvState(), nx = to && lvEx(to);
    if (nx && nx.fisio && !st.fisioOk[to]) { toast('Este paso necesita el visto bueno de la fisio: márcalo en su ficha.'); return sheetLvGuide(to); }
    st.dom[from] = today0(); st.lastProg = today0(); if (to) st.routine = st.routine.map(x => x === from ? to : x);
    await setLvState(st); render(); toast(to ? `Nuevo paso: ${nx.nombre}` : 'Marcado como dominado'); return; }
  const ad = t.closest('[data-lvadd]'); if (ad) { const id = ad.dataset.lvadd, st = lvState(), ex = lvEx(id);
    if (ex.fisio && !st.fisioOk[id]) { toast('Necesita el visto bueno de la fisio: márcalo en su ficha.'); return sheetLvGuide(id); }
    const mins = st.routine.reduce((a, x) => a + (lvEx(x).min || 1), 0) + (ex.min || 1);
    st.routine.push(id); await setLvState(st); render(); toast(mins > 12 ? `Añadido. La rutina pasa de 12 min (${Math.round(mins)}): mejor quitar otro.` : 'Añadido a la rutina'); return; }
  const fo = t.closest('[data-lvfisio]'); if (fo) { const st = lvState(); if (fo.checked) st.fisioOk[fo.dataset.lvfisio] = today0(); else delete st.fisioOk[fo.dataset.lvfisio]; await setLvState(st); return; }
  const rm = t.closest('[data-lvrem]'); if (rm) { const st = lvState(); st.routine = st.routine.filter(x => x !== rm.dataset.lvrem); await setLvState(st); closeSheet(); render(); toast('Quitado de la rutina'); return; }
  const bk = t.closest('[data-lvback]'); if (bk) { const st = lvState(), id = bk.dataset.lvback, pv = lvEx(id).previo; st.routine = st.routine.map(x => x === id ? pv : x); delete st.dom[pv]; await setLvState(st); closeSheet(); render(); toast('Vuelta al paso anterior'); return; }
  if (t.closest('#lvTestSave')) { const id = $('#lvTest').value, v = toNum($('#lvTestV').value); if (v == null) { toast('Escribe el valor.'); return; }
    const key = `lvtests:${curProf().id}`; await setKv(key, [{id:uid('t'), test:id, v, d:today0()}].concat(kv(key, []) || [])); render(); toast('Prueba guardada'); return; }
  const td = t.closest('[data-lvtdel]'); if (td) { const key = `lvtests:${curProf().id}`; await setKv(key, (kv(key, []) || []).filter(x => x.id !== td.dataset.lvtdel)); render(); return; }
  const sd = t.closest('[data-lvsdel]'); if (sd) { $('#lvDelZone').innerHTML = `<div class="confirm"><span>¿Borrar esa sesión?</span><button class="btn small danger" data-lvsdelyes="${esc(sd.dataset.lvsdel)}">Sí, borrar</button></div>`; return; }
  const sdy = t.closest('[data-lvsdelyes]'); if (sdy) { const id = sdy.dataset.lvsdelyes; await IDB.del('sessions', id); delete S.app[id]; rebuild(); render(); toast('Sesión borrada'); return; }
});
document.addEventListener('input', async e => {
  const el = e.target;
  if (el.dataset && el.dataset.lvc && S.lvCheck) { S.lvCheck[el.dataset.lvc] = +el.value; S.lvCheck._day = today0(); const o = $('#lvv-' + el.dataset.lvc); if (o) o.textContent = el.value; return; }
  if (el.id === 'lvWalk') { const d = lvDraft(); d.walk.min = el.value.replace(/[^\d]/g, ''); await saveDraft(d); return; }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset && el.dataset.lva && S.lvCheck) { S.lvCheck.alarmas = {...(S.lvCheck.alarmas || {})}; if (el.checked) S.lvCheck.alarmas[el.dataset.lva] = true; else delete S.lvCheck.alarmas[el.dataset.lva]; S.lvCheck._day = today0(); }
  if (el.id === 'lvTest') { const tt = LV_TESTS.find(x => x.id === el.value); $('#lvTestHow').textContent = tt ? tt.como : ''; }
});
