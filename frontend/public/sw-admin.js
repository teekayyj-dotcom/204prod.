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
  // Add custom caching strategy for admin routes here if needed
  // Currently falling back to network
  event.respondWith(fetch(event.request));
});
