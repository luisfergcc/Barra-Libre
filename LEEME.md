# Barra Libre

App de entrenamiento personal de Luis (web instalable para iPhone). Sin servidores ni cuentas: los datos se guardan en el propio iPhone.

- **Entrenar**: rutina del día según rotación y recuperación, pesos sugeridos (doble progresión), rodilla 0-10, descanso con aviso.
- **Progreso**: constancia, series por músculo, 1RM estimado por ejercicio, récords.
- **Recuperación**: mapa del cuerpo con % por músculo.
- **Cuerpo**: peso con media de 7 días, medidas y fotos con comparador.
- **Más**: gimnasios por material, importar CSV de Hevy y copia de seguridad.

Archivos: `index.html` (estructura), `style.css` (diseño), `data.js` (ejercicios y rutinas del plan), `app.js` (lógica), `sw.js` (funcionar sin conexión), `manifest.webmanifest` + iconos (instalación).

Al publicar una actualización, sube el número de `VERSION` en `sw.js`.
