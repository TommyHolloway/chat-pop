/**
 * ChatPop Widget Service Worker
 * Provides offline support and caching for the chat widget
 */

const CACHE_NAME = 'chatpop-widget-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/favicon.png',
];

// Install event - precache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - network first with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests except for specific domains
  if (url.origin !== location.origin) {
    // Allow caching of Supabase widget and fonts
    if (!url.hostname.includes('supabase.co') && 
        !url.hostname.includes('fonts.googleapis.com') &&
        !url.hostname.includes('fonts.gstatic.com')) {
      return;
    }
  }

  // Handle API requests - network only
  if (url.pathname.includes('/functions/') || 
      url.pathname.includes('/rest/') ||
      url.pathname.includes('/auth/')) {
    return;
  }

  // For everything else - network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone response for caching
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(async () => {
        // Try to return cached version
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
          const offlineResponse = await caches.match(OFFLINE_URL);
          if (offlineResponse) {
            return offlineResponse;
          }
        }

        // Return offline fallback for widget requests
        if (url.pathname.includes('chat-widget')) {
          return new Response(
            `(function(){
              console.log('[ChatPop] Widget offline - will retry when connected');
              window.ChatPopWidget = {
                open: function() { console.log('ChatPop offline'); },
                close: function() {},
                toggle: function() { console.log('ChatPop offline'); }
              };
            })();`,
            {
              headers: { 'Content-Type': 'application/javascript' },
            }
          );
        }

        // Generic offline response
        return new Response('Offline', { status: 503 });
      })
  );
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
