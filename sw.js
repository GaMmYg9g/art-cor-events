const CACHE_NAME = 'eventos-app-v1.0';
const urlsToCache = [
  '/',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png'
];

// Instalar Service Worker y cachear recursos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activar Service Worker y eliminar cachés antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estrategia: Cache First, luego red
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devuelve el recurso desde caché si está disponible
        if (response) {
          return response;
        }
        
        // Si no está en caché, haz la solicitud a la red
        return fetch(event.request).then(
          response => {
            // Verifica si la respuesta es válida
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clona la respuesta para guardarla en caché y devolverla
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          }
        );
      })
  );
});