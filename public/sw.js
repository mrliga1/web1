const CACHE_PREFIX = 'greeniahomes-';
const CACHE_NAME = 'greeniahomes-v3';

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('push', event => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'Greenia Homes';
  const options = {
    body: payload.body || 'Bạn có thông báo mới.',
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    tag: payload.tag || 'greenia-homes',
    renotify: true,
    data: { url: payload.url || '/admin' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || '/admin', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const matchingClient = clients.find(client => client.url.startsWith(self.location.origin));
      if (matchingClient) {
        matchingClient.navigate(targetUrl);
        return matchingClient.focus();
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});
