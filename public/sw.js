// Service Worker para cache offline e performance
const CACHE_NAME = 'aimindset-v1.0.0';
const STATIC_CACHE = 'static-v1.0.0';
const DYNAMIC_CACHE = 'dynamic-v1.0.0';
const API_CACHE = 'api-v1.0.0';
const IMAGE_CACHE = 'images-v1.0.0';

// Recursos estáticos para cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  // CSS e JS serão adicionados dinamicamente
];

// Estratégias de cache
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Configurações de cache por tipo de recurso
const CACHE_CONFIG = {
  static: {
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
    maxEntries: 100
  },
  api: {
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    maxAge: 5 * 60 * 1000, // 5 minutos
    maxEntries: 50
  },
  images: {
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    maxEntries: 200
  },
  dynamic: {
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    maxAge: 24 * 60 * 60 * 1000, // 1 dia
    maxEntries: 100
  }
};

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  
  event.waitUntil(
    Promise.all([
      // Cache de recursos estáticos
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Pular waiting para ativar imediatamente
      self.skipWaiting()
    ])
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      cleanupOldCaches(),
      // Tomar controle de todas as abas
      self.clients.claim()
    ])
  );
});

// Interceptação de requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requests não HTTP
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Estratégia baseada no tipo de recurso
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isImageRequest(url)) {
    event.respondWith(handleImageRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Background Sync para dados não críticos
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync-articles') {
    event.waitUntil(syncArticles());
  }
});

// Push notifications (preparação futura)
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'Nova atualização disponível',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('AIMindset', options)
  );
});

// Funções auxiliares

function isStaticAsset(url) {
  return url.pathname.match(/\.(js|css|html|ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/);
}

function isAPIRequest(url) {
  return url.pathname.startsWith('/api/') || 
         url.hostname.includes('supabase.co') ||
         url.hostname.includes('localhost') && url.port === '3001';
}

function isImageRequest(url) {
  return url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|avif)$/) ||
         url.hostname.includes('trae-api-us.mchost.guru');
}

async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Cache hit - retornar do cache
    return cachedResponse;
  }
  
  try {
    // Cache miss - buscar da rede e cachear
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Static asset fetch failed:', error);
    // Retornar página offline se disponível
    return caches.match('/offline.html') || new Response('Offline', { status: 503 });
  }
}

async function handleAPIRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    // Network first para dados da API
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cachear apenas GET requests bem-sucedidos
      if (request.method === 'GET') {
        cache.put(request, networkResponse.clone());
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] API request failed:', error);
    
    // Fallback para cache se disponível
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Retornar resposta de erro estruturada
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'Dados não disponíveis offline' 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Image fetch failed:', error);
    // Retornar imagem placeholder
    return caches.match('/placeholder.svg') || 
           new Response('', { status: 503 });
  }
}

async function handleDynamicRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  // Stale while revalidate
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const validCaches = [CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE, API_CACHE, IMAGE_CACHE];
  
  return Promise.all(
    cacheNames
      .filter(cacheName => !validCaches.includes(cacheName))
      .map(cacheName => {
        console.log('[SW] Deleting old cache:', cacheName);
        return caches.delete(cacheName);
      })
  );
}

async function syncArticles() {
  try {
    console.log('[SW] Syncing articles in background');
    
    // Buscar artigos mais recentes
    const response = await fetch('/api/articles?limit=10&sort=created_at');
    if (response.ok) {
      const articles = await response.json();
      
      // Cachear artigos
      const cache = await caches.open(API_CACHE);
      cache.put('/api/articles?limit=10&sort=created_at', response.clone());
      
      // Pré-carregar imagens dos artigos
      const imagePromises = articles
        .filter(article => article.image_url)
        .map(article => 
          fetch(article.image_url).then(response => {
            if (response.ok) {
              const imageCache = caches.open(IMAGE_CACHE);
              imageCache.then(cache => cache.put(article.image_url, response));
            }
          }).catch(() => {})
        );
      
      await Promise.all(imagePromises);
      console.log('[SW] Background sync completed');
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Limpeza periódica de cache
setInterval(async () => {
  const caches = await caches.keys();
  
  for (const cacheName of caches) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      const cacheDate = new Date(response.headers.get('date') || 0);
      const now = new Date();
      
      // Remover entradas expiradas baseado na configuração
      const maxAge = getCacheMaxAge(cacheName);
      if (now - cacheDate > maxAge) {
        await cache.delete(request);
        console.log('[SW] Expired cache entry removed:', request.url);
      }
    }
  }
}, 60 * 60 * 1000); // Executar a cada hora

function getCacheMaxAge(cacheName) {
  if (cacheName.includes('static')) return CACHE_CONFIG.static.maxAge;
  if (cacheName.includes('api')) return CACHE_CONFIG.api.maxAge;
  if (cacheName.includes('images')) return CACHE_CONFIG.images.maxAge;
  return CACHE_CONFIG.dynamic.maxAge;
}

// Mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    getCacheSize().then(size => {
      event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
    });
  }
});

async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      const blob = await response.blob();
      totalSize += blob.size;
    }
  }
  
  return totalSize;
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
}