const CACHE_NAME = 'workout-planner-v1';
const ASSETS_TO_CACHE = [
  './index.html',
  './css/style.css',
  './js/script.js',
  './images/default.jpg',
  './sounds/timer.mp3',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js' // External dependency
];

// Install: cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
});

// Fetch: serve from cache or fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});