/* Copia local de archivos públicos para poder estudiar sin conexión, una vez visitada la web. */
const CACHE = 'medyte-academy-2026-accesos-juegos-v10';
const ASSETS = ['./', './index.html', './juegos.html', './juegos.css', './juegos.js', './epico.css', './epico.js', './estilos.css', './app.js', './preguntas.js', './dificultad.js', './logo.jpg', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('medyte-academy-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const copy=r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.open(CACHE).then(c => c.match(e.request)).then(r => r || Response.error())));
});
