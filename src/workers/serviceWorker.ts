/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'aimindset-v1';
const STATIC_CACHE = 'aimindset-static-v1';
const DYNAMIC_CACHE = 'aimindset-dynamic-v1';
const API_CACHE = 'aimindset-api-v1';

// Recursos para cache estático (críticos)
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  // Adicionar outros recursos críticos aqui
];

// Estratégias de cache por tipo de recurso
const CACHE_STRATEGIES = {
  // Cache First - para recursos estáticos
  static: ['css', 'js', 'woff', 'woff2', 'ttf', 'ico', 'png', 'jpg', 'jpeg', 'svg', 'webp'],
  
  // Network First - para conteúdo dinâmico
  dynamic: ['html'],
  
  // Stale While Revalidate - para APIs
  api: ['/api/'],
  
  // Network Only - para recursos críticos
  networkOnly: ['/auth/', '/admin/']
};

// Configurações de TTL por tipo de cache
const CACHE_TTL = {
  static: 7 * 24 * 60 * 60 * 1000, // 7 dias
  dynamic: 24 * 60 * 60 * 1000,    // 1 dia
  api: 5 * 60 * 1000,              // 5 minutos
};

// Install event - cache recursos estáticos
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Static assets cached');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Failed to cache static assets:', error);
      })
  );
});

// Activate event - limpar caches antigos
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Remover caches antigos
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - interceptar requests
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  
  // Ignorar requests não-HTTP
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Determinar estratégia de cache
  const strategy = getCacheStrategy(request);
  
  switch (strategy) {
    case 'static':
      event.respondWith(cacheFirst(request, STATIC_CACHE));
      break;
      
    case 'dynamic':
      event.respondWith(networkFirst(request, DYNAMIC_CACHE));
      break;
      
    case 'api':
      event.respondWith(staleWhileRevalidate(request, API_CACHE));
      break;
      
    case 'networkOnly':
      event.respondWith(networkOnly(request));
      break;
      
    default:
      event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  }
});

// Determinar estratégia de cache baseada na URL
function getCacheStrategy(request: Request): string {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const extension = pathname.split('.').pop()?.toLowerCase();
  
  // Network Only para rotas específicas
  if (CACHE_STRATEGIES.networkOnly.some(pattern => pathname.includes(pattern))) {
    return 'networkOnly';
  }
  
  // API routes
  if (CACHE_STRATEGIES.api.some(pattern => pathname.includes(pattern))) {
    return 'api';
  }
  
  // Static assets por extensão
  if (extension && CACHE_STRATEGIES.static.includes(extension)) {
    return 'static';
  }
  
  // HTML pages
  if (CACHE_STRATEGIES.dynamic.includes(extension || 'html')) {
    return 'dynamic';
  }
  
  return 'dynamic';
}

// Verificar se response está expirado
function isExpired(response: Response, ttl: number): boolean {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return true;
  
  const responseDate = new Date(dateHeader);
  const now = new Date();
  
  return (now.getTime() - responseDate.getTime()) > ttl;
}

// Cache First Strategy - para recursos estáticos
async function cacheFirst(request: Request, cacheName: string): Promise<Response> {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && !isExpired(cachedResponse, CACHE_TTL.static)) {
      return cachedResponse;
    }
    
    // Se não está em cache ou expirou, buscar da rede
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clonar response antes de cachear
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('Cache First failed:', error);
    
    // Fallback para cache mesmo se expirado
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Último recurso - página offline
    if (request.destination === 'document') {
      const offlineCache = await caches.open(STATIC_CACHE);
      const offlinePage = await offlineCache.match('/offline.html');
      if (offlinePage) return offlinePage;
    }
    
    throw error;
  }
}

// Network First Strategy - para conteúdo dinâmico
async function networkFirst(request: Request, cacheName: string): Promise<Response> {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('Network First failed:', error);
    
    // Fallback para cache
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Último recurso - página offline para documentos
    if (request.destination === 'document') {
      const offlineCache = await caches.open(STATIC_CACHE);
      const offlinePage = await offlineCache.match('/offline.html');
      if (offlinePage) return offlinePage;
    }
    
    throw error;
  }
}

// Stale While Revalidate Strategy - para APIs
async function staleWhileRevalidate(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Buscar da rede em background
  const networkResponsePromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse.ok) {
        const responseClone = networkResponse.clone();
        cache.put(request, responseClone);
      }
      return networkResponse;
    })
    .catch(error => {
      console.error('Stale While Revalidate network failed:', error);
      return null;
    });
  
  // Retornar cache imediatamente se disponível
  if (cachedResponse && !isExpired(cachedResponse, CACHE_TTL.api)) {
    return cachedResponse;
  }
  
  // Se não há cache ou expirou, aguardar rede
  const networkResponse = await networkResponsePromise;
  return networkResponse || cachedResponse || new Response('Network error', { status: 503 });
}

// Network Only Strategy - para recursos críticos
async function networkOnly(request: Request): Promise<Response> {
  try {
    return await fetch(request);
  } catch (error) {
    console.error('Network Only failed:', error);
    
    // Para documentos, retornar página offline
    if (request.destination === 'document') {
      const cache = await caches.open(STATIC_CACHE);
      const offlinePage = await cache.match('/offline.html');
      if (offlinePage) return offlinePage;
    }
    
    throw error;
  }
}

// Message event - comunicação com a main thread
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_STATS':
      getCacheStats().then(stats => {
        event.ports[0]?.postMessage({ type: 'CACHE_STATS', payload: stats });
      });
      break;
      
    case 'CLEAR_CACHE':
      clearCache(payload?.cacheName).then(success => {
        event.ports[0]?.postMessage({ type: 'CACHE_CLEARED', payload: { success } });
      });
      break;
      
    case 'PREFETCH_URL':
      prefetchUrl(payload?.url).then(success => {
        event.ports[0]?.postMessage({ type: 'PREFETCH_COMPLETE', payload: { success, url: payload?.url } });
      });
      break;
  }
});

// Obter estatísticas do cache
async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats: Record<string, any> = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    stats[cacheName] = {
      size: keys.length,
      urls: keys.map(request => request.url)
    };
  }
  
  return stats;
}

// Limpar cache específico
async function clearCache(cacheName?: string): Promise<boolean> {
  try {
    if (cacheName) {
      return await caches.delete(cacheName);
    } else {
      // Limpar todos os caches
      const cacheNames = await caches.keys();
      const results = await Promise.all(
        cacheNames.map(name => caches.delete(name))
      );
      return results.every(result => result);
    }
  } catch (error) {
    console.error('Failed to clear cache:', error);
    return false;
  }
}

// Prefetch URL
async function prefetchUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(url, response);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to prefetch URL:', error);
    return false;
  }
}

// Background Sync - para sincronização offline
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Executar sincronização em background
async function doBackgroundSync() {
  try {
    // Implementar lógica de sincronização aqui
    console.log('🔄 Background sync executing...');
    
    // Exemplo: sincronizar dados pendentes
    // await syncPendingData();
    
    console.log('✅ Background sync completed');
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event: any) => {
  const options = {
    body: event.data?.text() || 'Nova notificação do AIMindset',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver artigo',
        icon: '/icon-explore.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icon-close.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('AIMindset', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

export {};