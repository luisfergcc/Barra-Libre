// Cambia VERSION en cada actualización para que el iPhone descargue la nueva versión
const VERSION = 'barralibre-1.7.3';
const FILES = ['./', 'index.html', 'style.css', 'data.js', 'guia.js', 'objetivos.js', 'app.js', 'perfiles.js', 'figtree-400.woff2', 'figtree-500.woff2', 'figtree-600.woff2', 'figtree-700.woff2', 'barlow-condensed-600.woff2', 'barlow-condensed-700.woff2', 'manifest.webmanifest', 'icon-180.png', 'icon-512.png'];

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
