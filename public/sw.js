const CACHE = 'crpay-v10-safe-shell';
const OFFLINE = './index.html';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  './icons/icon-512-maskable.svg',
];
const PRIVATE_PATH = /\/(api|auth|login|logout|admin|session|sessions|token|tokens|password|account|profile|me)(\/|$)/i;
const SENSITIVE_QUERY_KEYS = new Set([
  'token', 'access_token', 'refresh_token', 'password', 'passwd', 'secret', 'session',
  'auth', 'authorization', 'api_key', 'apikey', 'key', 'code', 'credential', 'credentials',
]);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)));
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

function hasSensitiveQuery(url) {
  for (const key of url.searchParams.keys()) {
    if (SENSITIVE_QUERY_KEYS.has(String(key).toLowerCase())) return true;
  }
  return false;
}

function bypass(request, url) {
  if (request.method !== 'GET') return true;
  if (request.headers.has('authorization')) return true;
  if (request.headers.has('cookie')) return true;
  if (url.origin !== self.location.origin) return true;
  if (PRIVATE_PATH.test(url.pathname)) return true;
  if (hasSensitiveQuery(url)) return true;
  return false;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (bypass(request, url)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => response)
        .catch(() => caches.match(OFFLINE))
    );
    return;
  }

  if (url.search) return;

  const allowedStatic = APP_SHELL.some((path) => {
    const absolute = new URL(path, self.registration.scope).href;
    return request.url === absolute;
  });
  if (!allowedStatic) return;

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request, { cache: 'no-store' }).then((response) => {
      if (!response.ok || response.type !== 'basic') return response;
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)));
      return response;
    }))
  );
});
