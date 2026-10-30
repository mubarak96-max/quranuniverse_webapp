// Service worker for Quran in 30 Days, registered with scope /quran-in-30-days by the "Save for offline" button.
// Booklets load from the network when online (so edits arrive) and from the cache when offline.
const CACHE = "q30-v1";
const SCOPE = "/quran-in-30-days";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "cache") e.waitUntil(cacheAll(e.data.urls, e.source));
});

// Fetch each booklet, then every script, style and font its HTML names, so a saved day opens with no network.
async function cacheAll(urls, client) {
  const cache = await caches.open(CACHE);
  const assets = new Set();
  let done = 0;
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (res.ok) {
        const html = await res.clone().text();
        await cache.put(url, res);
        for (const m of html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)) assets.add(m[1]);
      }
    } catch {
      // one failed page should not stop the rest
    }
    if (client) client.postMessage({ type: "progress", done: ++done });
  }
  await Promise.all(
    [...assets].map(async (a) => {
      if (await cache.match(a)) return;
      try {
        const res = await fetch(a);
        if (res.ok) await cache.put(a, res);
      } catch {}
    }),
  );
  if (client) client.postMessage({ type: "done" });
}

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(
      caches.match(e.request).then(
        (hit) =>
          hit ||
          fetch(e.request).then((res) => {
            const copy = res.clone();
            if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, copy));
            return res;
          }),
      ),
    );
    return;
  }
  if (e.request.mode === "navigate" && url.pathname.startsWith(SCOPE)) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          if (res.ok) caches.open(CACHE).then((c) => c.put(url.pathname, copy));
          return res;
        })
        .catch(() => caches.match(url.pathname).then((hit) => hit || caches.match(SCOPE))),
    );
  }
});
