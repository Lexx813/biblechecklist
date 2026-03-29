const CACHE = "nwt-v10";
const STATIC_EXTENSIONS = /\.(js|css|png|jpg|jpeg|svg|gif|webp|woff2?|ico)$/;

// Precache critical assets on install so repeat visits are instant
const PRECACHE = [
  "/",
  "/fonts/plus-jakarta-sans-variable.woff2",
  "/locales/en/translation.json",
  "/manifest.json",
];

self.addEventListener("install", (e) => {
  // Swallow individual fetch failures so a slow CDN or missing asset
  // never prevents the SW from installing and becoming active.
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.allSettled(PRECACHE.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

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

  // Never cache Vite dev server source files or HMR endpoints
  if (url.pathname.startsWith("/src/") || url.pathname.startsWith("/@")) return;

  // Never cache index.html — always fetch fresh so new deploys load immediately
  if (url.pathname === "/" || url.pathname === "/index.html") {
    e.respondWith(
      fetch(e.request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Hashed Vite chunks under /assets/ — network-only, never cache.
  // Content hashes already bust CDN cache; caching here risks serving poisoned
  // HTML entries if Vercel's SPA rewrite ever matched an /assets/ URL.
  if (url.pathname.startsWith("/assets/")) return;

  // Other static assets (fonts, icons, images) — cache-first
  if (STATIC_EXTENSIONS.test(url.pathname)) {
    e.respondWith(
      caches.open(CACHE).then((cache) => cache.match(e.request)).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((res) => {
          if (!res.ok) return res; // let the browser handle 404s normally
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
          return res;
        }).catch(() => fetch(e.request)); // network error: try again uncached
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

// ── Push notifications ─────────────────────────────────────
self.addEventListener("push", (e) => {
  if (!e.data) return;
  let data;
  try { data = e.data.json(); } catch { return; }

  const targetUrl = data.url ?? "/";

  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      // If the user already has the target page open and focused, skip the OS popup —
      // the in-app realtime listener handles it. Still notify if they're on a different page.
      const focused = list.find(
        (c) => c.focused && c.url.includes(targetUrl.replace(/^\//, ""))
      );
      if (focused) return; // app is open on that exact page — don't double-notify

      return self.registration.showNotification(data.title ?? "NWT Progress", {
        body: data.body ?? "",
        icon: "/icon-192.png",
        badge: "/badge-96.png",
        data: { url: targetUrl },
        tag: data.tag ?? "nwt-notification",
        renotify: true,
        vibrate: [200, 100, 200],
      });
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url ?? "/";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      // Focus existing tab if open; otherwise open a new one.
      // Avoid client.navigate() — it is unreliable on Android Chrome.
      const existing = list.find((c) => c.url.startsWith(self.location.origin));
      if (existing) {
        existing.focus();
        // Tell the React app to navigate via postMessage
        existing.postMessage({ type: "push-navigate", url });
      } else {
        clients.openWindow(url);
      }
    })
  );
});
