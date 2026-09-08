const CACHE_NAME = "core-protocol-companion-v1";
const PRECACHE_URLS = [
  "/",
  "/campaigns/new",
  "/cards",
  "/decks",
  "/rules",
  "/settings",
  "/settings/about",
  "/manifest.webmanifest",
  "/original-ui-only/icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.destination === "image" && !url.pathname.startsWith("/original-ui-only/")) return;
  if (url.pathname.startsWith("/api/cards/")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (event.request.method === "GET" && response.ok && event.request.destination !== "image") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/")))
  );
});
