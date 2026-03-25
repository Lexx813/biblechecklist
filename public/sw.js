const CACHE = "nwt-v2";
const STATIC_EXTENSIONS = /\.(js|css|png|jpg|jpeg|svg|gif|webp|woff2?|ico)$/;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Only handle same-origin GET requests; pass through Supabase/external calls
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;

  // Never cache index.html — always fetch fresh so new deploys load immediately
  if (url.pathname === "/" || url.pathname === "/index.html") {
    e.respondWith(
      fetch(e.request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Hashed JS/CSS and static assets — cache-first (content hash guarantees freshness)
  if (STATIC_EXTENSIONS.test(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(e.request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // Everything else — network with cache fallback for offline
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
