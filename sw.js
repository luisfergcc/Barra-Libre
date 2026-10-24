// Cambia VERSION en cada actualización para que el iPhone descargue la nueva versión
const VERSION = 'barralibre-1.9.3';
const FILES = ['./', 'index.html', 'style.css', 'data.js', 'guia.js', 'plan20.js', 'plan21.js', 'objetivos.js', 'estudios.js', 'app.js', 'perfiles.js', 'avisos.js', 'editor.js', 'mejoras.js', 'banca.js', 'figtree-400.woff2', 'figtree-500.woff2', 'figtree-600.woff2', 'figtree-700.woff2', 'barlow-condensed-600.woff2', 'barlow-condensed-700.woff2', 'manifest.webmanifest', 'icon-180.png', 'icon-512.png'];

// Al instalar una versión nueva, descarga todo saltándose la caché del navegador
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, {cache: 'reload'})))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))));
  self.clients.claim();
});

// Primero la copia guardada (abre al instante, aunque no haya cobertura) y,
// por detrás, se pide a la red la versión nueva para la próxima vez.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(req, {ignoreSearch: true});
    const net = fetch(req).then(r => {
      if (r && (r.ok || r.type === 'opaque')) cache.put(req, r.clone());
      return r;
    }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    const r = await net;
    return r || (req.mode === 'navigate' ? cache.match('index.html') : Response.error());
  }));
});

// Aviso de fin de descanso: respaldo por si la página está congelada. La app avisa sola cuando puede;
// aquí solo se notifica si no hay ninguna ventana a la vista y no se ha avisado ya (misma etiqueta 'rest').
let restTimer = null;
self.addEventListener('message', e => {
  const m = e.data || {};
  clearTimeout(restTimer);
  if (m.t !== 'rest') return;
  const ms = Math.max(0, m.end - Date.now());
  if (ms > 15 * 60 * 1000) return;
  e.waitUntil(new Promise(res => {
    restTimer = setTimeout(async () => {
      try {
        const vis = (await self.clients.matchAll({type: 'window'})).some(c => c.visibilityState === 'visible');
        const already = await self.registration.getNotifications({tag: 'rest'});
        if (!vis && !already.length) await self.registration.showNotification('Descanso terminado', {body: '¡A por la serie!', tag: 'rest', renotify: true, icon: 'icon-180.png', vibrate: [200, 100, 200]});
      } catch (err) {}
      res();
    }, ms);
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type: 'window'}).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow('./')));
});
