const CACHE_NAME = 'greeniahomes-v2';

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseToCache))
              .catch(error => console.warn('Không thể lưu trang vào bộ nhớ ngoại tuyến:', error));
          }
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(event.request);
          const cachedHomepage = await caches.match('/');
          return cachedPage || cachedHomepage || Response.error();
        })
    );
  }
});
