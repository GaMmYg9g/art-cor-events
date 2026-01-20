const CACHE_NAME = 'event-manager-kpop-v2';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './icon-32x32.png',
    './icon-192x192.png',
    './icon-512x512.png',
    './favicon.ico'
];

// Install Service Worker
self.addEventListener('install', event => {
    console.log('Service Worker: Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Cacheando archivos');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate Service Worker
self.addEventListener('activate', event => {
    console.log('Service Worker: Activando...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Limpiando cache viejo');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Fetch Strategy: Cache First, fallback a Network
self.addEventListener('fetch', event => {
    // No cachear solicitudes a la API o recursos dinámicos
    if (event.request.url.includes('/api/') || 
        event.request.method !== 'GET') {
        return fetch(event.request);
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Si está en cache, devolverlo
                if (response) {
                    return response;
                }
                
                // Si no está en cache, hacer fetch
                return fetch(event.request)
                    .then(fetchResponse => {
                        // Verificar si la respuesta es válida
                        if (!fetchResponse || fetchResponse.status !== 200 || 
                            fetchResponse.type !== 'basic') {
                            return fetchResponse;
                        }
                        
                        // Clonar la respuesta
                        const responseToCache = fetchResponse.clone();
                        
                        // Agregar al cache
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return fetchResponse;
                    })
                    .catch(error => {
                        console.log('Fetch failed; returning offline page:', error);
                        // Puedes devolver una página offline personalizada aquí
                        return caches.match('./index.html');
                    });
            })
    );
});

// Manejar mensajes del cliente
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
