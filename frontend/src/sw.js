import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL, matchPrecache } from 'workbox-precaching';
import { registerRoute, NavigationRoute, setCatchHandler } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

const APP_SHELL_HANDLER = createHandlerBoundToURL('/index.html');

registerRoute(
  new NavigationRoute(APP_SHELL_HANDLER, {
    // Skip navigation fallback for known API prefixes and non-app files.
    denylist: [/^\/api\//, /^\/__/, /\/[^/?]+\.[^/]+$/],
  })
);

registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'worker',
  new StaleWhileRevalidate({
    cacheName: 'static-resources-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 7 * 24 * 60 * 60 }),
    ],
  })
);

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-assets-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

const API_ORIGINS = [self.location.origin, 'https://habittracker-fi4y.onrender.com'];

registerRoute(
  ({ request, url }) =>
    request.method === 'GET' &&
    API_ORIGINS.includes(url.origin) &&
    url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-get-runtime-v1',
    networkTimeoutSeconds: 6,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 60 * 60 }),
    ],
  })
);

setCatchHandler(async ({ request }) => {
  if (request.destination === 'document') {
    return (await matchPrecache('/offline.html')) || Response.error();
  }
  return Response.error();
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  const payload = event.data.json();
  const title = payload.title || 'HabitTrack';
  const options = {
    body: payload.message || 'You have a new update.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: payload,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/dashboard');
      return null;
    })
  );
});
