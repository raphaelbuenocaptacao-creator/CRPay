const CACHE_PREFIX = 'crpay-';
const CACHE = `${CACHE_PREFIX}v11-safe-shell`;
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

function isSafeResponse(response) {
  if (!response || !response.ok || response.type !== 'basic') return false;
  const cacheControl = response.headers.get('cache-control') || '';
  if (/\b(private|no-store)\b/i.test(cacheControl)) return false;
  if (response.headers.has('set-cookie')) return false;
  return true;
}

async function precacheShell() {
  const cache = await caches.open(CACHE);
  await Promise.all(APP_SHELL.map(async (path) => {
    try {
      const request = new Request(path, { credentials: 'omit', cache: 'reload' });
      const response = await fetch(request);
      if (isSafeResponse(response)) await cache.put(request, response.clone());
    } catch (_) {}
  }));
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheShell());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE)
          .map((key) => caches.delete(key))
      )),
      self.clients.claim(),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (bypass(request, url)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(async () => {
        const cache = await caches.open(CACHE);
        return (await cache.match(OFFLINE)) || Response.error();
      })
    );
    return;
  }

  if (url.search) return;

  const allowedStatic = APP_SHELL.some((path) => {
    const absolute = new URL(path, self.registration.scope).href;
    return request.url === absolute;
  });
  if (!allowedStatic) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request, { cache: 'no-store', credentials: 'omit' });
    if (isSafeResponse(response)) {
      event.waitUntil(cache.put(request, response.clone()));
    }
    return response;
  })());
});
