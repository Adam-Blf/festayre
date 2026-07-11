/**
 * sw.js, service worker Festayre.
 *
 * Strategies par type de ressource, pensees pour le terrain
 * (reseau mobile sature en pleine feria) :
 *  - pages HTML     : reseau d'abord, cache en secours, page /offline
 *                     en dernier recours,
 *  - assets statiques (js/css/img/fonts) : cache d'abord (rapide),
 *  - APIs de donnees (Overpass, Open-Meteo) : stale-while-revalidate,
 *    on affiche tout de suite les dernieres toilettes connues et on
 *    rafraichit en arriere-plan.
 *
 * IMPORTANT : incrementer CACHE_VERSION a chaque deploiement qui
 * change les assets, sinon les anciens fichiers restent servis.
 */
const CACHE_VERSION = "v1";
const STATIC_CACHE = `festayre-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `festayre-dynamic-${CACHE_VERSION}`;

/* Coquille minimale pre-cachee a l'installation. */
const APP_SHELL = ["/", "/offline", "/icons/icon-192.png", "/logo.svg"];

/* Hotes de donnees externes autorises dans le cache dynamique. */
const DATA_HOSTS = [
  "overpass-api.de",
  "overpass.kumi.systems",
  "api.open-meteo.com",
  "tile.openstreetmap.org",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Purge des caches des versions precedentes.
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((n) => n !== STATIC_CACHE && n !== DYNAMIC_CACHE)
          .map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isDataHost = DATA_HOSTS.some((h) => url.hostname.endsWith(h));

  // Donnees externes (toilettes, meteo, tuiles de carte) : SWR.
  if (isDataHost) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (url.origin !== location.origin) return;

  // Navigation HTML : reseau d'abord, offline en dernier recours.
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  // Assets memes origine : cache d'abord.
  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Indisponible hors ligne", { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || caches.match("/offline");
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}
