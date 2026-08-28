const CACHE = 'crpay-v6';
const OFFLINE = './index.html';
const PRIVATE_PATHS = ['/api/', '/auth/', '/admin/'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(OFFLINE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
      self.clients.claim(),
    ])
  );
});

function isPrivateRequest(request, url) {
  if (request.method !== 'GET') return true;
  if (request.headers.has('authorization')) return true;
  if (url.origin !== self.location.origin) return true;
  return PRIVATE_PATHS.some((path) => url.pathname.includes(path));
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (isPrivateRequest(request, url)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .catch(() => caches.match(OFFLINE))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
