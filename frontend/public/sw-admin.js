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
  // Ignore cross-origin requests (like Google Tag Manager, Analytics, APIs)
  // This prevents adblockers from causing Uncaught TypeErrors in the Service Worker
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch((error) => {
      console.warn('[SW] Fetch failed (network error or offline):', error);
      return Response.error();
    })
  );
});
