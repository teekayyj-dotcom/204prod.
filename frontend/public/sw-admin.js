// Service Worker for Admin Scope

const CACHE_NAME = 'admin-cache-v1';

self.addEventListener('install', (event) => {
  console.log('[SW] Admin Service Worker Install');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Admin Service Worker Activate');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Ignore cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Ignore requests that are outside the /admin scope just in case the SW is registered broadly
  const url = new URL(event.request.url);
  if (!url.pathname.startsWith('/admin') && !url.pathname.startsWith('/sw-admin.js') && !url.pathname.startsWith('/manifest-admin.json')) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch((error) => {
      console.warn('[SW] Fetch failed (network error or offline):', error);
      return Response.error();
    })
  );
});
