const CACHE_NAME = "pennywise-v3";
const CACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/icon-192.png",
  "/icon-512.png"
];

const isSameOrigin = url => url.origin === self.location.origin;
const isPrecacheable = request => ["style", "script", "image", "font", "manifest", "document"].includes(request.destination);

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

async function cacheFirst(event) {
  const cached = await caches.match(event.request);
  if (cached) return cached;

  try {
    const response = await fetch(event.request);
    if (response && response.status === 200 && response.type !== "opaque") {
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, response.clone());
    }
    return response;
  } catch {
    return cached;
  }
}

async function networkFirst(event) {
  try {
    const response = await fetch(event.request);
    if (response && response.status === 200 && response.type !== "opaque") {
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, response.clone());
    }
    return response;
  } catch {
    return caches.match(event.request) || caches.match("/index.html");
  }
}

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const requestURL = new URL(event.request.url);
  if (!isSameOrigin(requestURL)) return;

  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event));
    return;
  }

  if (isPrecacheable(event.request)) {
    event.respondWith(cacheFirst(event));
    return;
  }

  event.respondWith(networkFirst(event));
});
