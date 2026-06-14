const CACHE_NAME = "touraluxe-v2";
const OFFLINE_URLS = [
  "/",
  "/assets/airplane.glb",
  "/assets/logo-transparent.webp",
];

// Install — cache the shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network-first with cache fallback
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isVideoRequest =
    event.request.destination === "video" ||
    event.request.headers.has("range") ||
    url.pathname.endsWith(".mp4");
  const isScrubSequenceFrame = url.pathname.includes("/sequence/") || url.pathname.includes("/sequence-mobile/");

  if (isVideoRequest || isScrubSequenceFrame) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for offline use
        const clone = response.clone();
        caches
          .open(CACHE_NAME)
          .then((cache) => cache.put(event.request, clone))
          .catch(() => undefined);
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
