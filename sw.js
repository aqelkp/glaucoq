const CACHE_NAME = "glaucoq-v15";
const PRECACHE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./glaucoma_cognitive_skills.json",
  "./data/manifest.json",
  "./data/batch_01.json",
  "./data/batch_02.json",
  "./data/batch_03.json",
  "./data/batch_04.json",
  "./data/batch_05.json",
  "./data/batch_06.json",
  "./data/batch_07.json",
  "./data/batch_08.json",
  "./data/batch_09.json",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function isNetworkFirst(request, url) {
  if (request.mode === "navigate") return true;
  return (
    url.pathname.endsWith("/") ||
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/manifest.json") ||
    url.pathname.endsWith("/glaucoma_cognitive_skills.json")
  );
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  if (
    url.origin === self.location.origin ||
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    if (url.origin === self.location.origin && isNetworkFirst(event.request, url)) {
      // Network-first for HTML & manifests so new deployments appear immediately (offline fallback to cache)
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            }
            return response;
          })
          .catch(() => caches.match(event.request))
      );
      return;
    }

    // Cache-first with background refresh for batch JSONs, icons, and fonts
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
  }
});
