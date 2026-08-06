self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "204PROD.";
  const body = data.body || "Bạn có tin báo mới";
  const icon = data.icon || "/favicon/icon.png";
  const url = data.url || "/";

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: icon,
      data: { url: url },
      badge: "/favicon/icon.png",
      vibrate: [200, 100, 200]
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data.url || "/";

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      // Focus if window already open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(new URL(urlToOpen, self.location.origin).href) && 'focus' in client) {
          return client.focus();
        }
      }
      // Or open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
