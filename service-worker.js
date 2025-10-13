self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // No interceptar navegación de documentos HTML ni llamadas a Supabase
  const isDocument = event.request.destination === 'document' || event.request.mode === 'navigate';
  const isSupabase = url.hostname.endsWith('.supabase.co');
  if (isDocument || isSupabase) return;

  // Cache First para assets estáticos (JS, CSS, imágenes)
  event.respondWith(
    caches.open('charlitron-static-v1').then(cache =>
      cache.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(networkResponse => {
          // Evitar cachear respuestas inválidas
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      })
    )
  );
});
