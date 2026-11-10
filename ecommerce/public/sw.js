const CACHE_NAME = "vitalfit-v4";

const STATIC_ASSETS = ["/icons/icon-192x192.png", "/icons/icon-512x512.png"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        }),
      );
    }),
  );
  clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/api") ||
    url.pathname.includes("/media/") ||
    event.request.headers.get("upgrade") === "websocket"
  ) {
    return;
  }

  if (event.request.method === "GET") {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(event.request);

          if (
            networkResponse &&
            networkResponse.status === 200 &&
            url.protocol.startsWith("http")
          ) {
            const responseClone = networkResponse.clone();
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, responseClone);
          }

          return networkResponse;
        } catch (error) {
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
        }
      })(),
    );
  }
});
