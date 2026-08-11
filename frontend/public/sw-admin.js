// Service Worker for Admin Scope

const CACHE_NAME = 'admin-cache-v2';

self.addEventListener('install', (event) => {
  console.log('[SW] Admin Service Worker Install');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Admin Service Worker Activate');
  event.waitUntil(self.clients.claim());
});

// Removed fetch event listener to prevent breaking chunkLoadError navigations
