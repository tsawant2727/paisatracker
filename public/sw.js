// Paisa Tracker service worker — enables installability + basic offline.
// Bump CACHE when you change caching behaviour to invalidate old caches.
const CACHE = "paisa-v1";

const OFFLINE_HTML = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Offline · Paisa Tracker</title>
<style>
  html,body{height:100%;margin:0}
  body{display:flex;flex-direction:column;align-items:center;justify-content:center;
    gap:12px;background:#0b0f14;color:#f4f7fb;font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:24px}
  .r{color:#3dffa8;font-size:48px;font-weight:800}
  p{color:#6b778a;margin:0}
  button{margin-top:8px;border:1px solid rgba(255,255,255,.12);background:#1c2430;color:#f4f7fb;
    border-radius:999px;padding:10px 18px;font-size:14px}
</style></head><body>
  <div class="r">&#8377;</div>
  <h2 style="margin:0">You're offline</h2>
  <p>Check your connection and try again.</p>
  <button onclick="location.reload()">Retry</button>
</body></html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll([
        "/manifest.webmanifest",
        "/icons/icon-192.png",
        "/icons/icon-512.png",
      ]),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: network-first, fall back to an offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          return new Response(OFFLINE_HTML, {
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        }
      })(),
    );
    return;
  }

  // Static assets: cache-first, then network (and cache it).
  if (/\.(?:png|svg|ico|webmanifest|css|js|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const hit = await cache.match(request);
        if (hit) return hit;
        try {
          const res = await fetch(request);
          if (res.ok) cache.put(request, res.clone());
          return res;
        } catch {
          return hit || Response.error();
        }
      })(),
    );
  }
});
