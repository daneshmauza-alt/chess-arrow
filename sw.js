// Offline cache for the app shell and the Stockfish engine (about 600 kB).
// Engine files are cache-first (large, versioned by name). Everything else is network-first,
// so a deployed fix reaches the phone on the next load instead of waiting for a cache bump.
const CACHE = 'chess-arrows-mobile-v3';
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'engine/stockfish-nnue-16-single.js',
  'engine/stockfish-nnue-16-single.wasm',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const isEngine = new URL(event.request.url).pathname.includes('/engine/');
  if (isEngine) {
    event.respondWith(caches.match(event.request).then((hit) => hit || fetch(event.request)));
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        caches.open(CACHE).then((c) => c.put(event.request, res.clone()));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
