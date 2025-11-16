// Service Worker EXTREMO para performance máxima
const CACHE_NAME = 'aimindset-extreme-v2.1.0';
const STATIC_CACHE = 'static-extreme-v2.1.0';
const DYNAMIC_CACHE = 'dynamic-extreme-v2.1.0';
const API_CACHE = 'api-extreme-v2.1.0';
const SUPABASE_CACHE = 'supabase-extreme-v2.1.0';
const ARTICLES_CACHE = 'articles-extreme-v2.1.0';
const IMAGE_CACHE = 'images-extreme-v2.1.0';
const FONT_CACHE = 'fonts-extreme-v2.1.0';
const CSS_CACHE = 'css-extreme-v2.1.0';
const JS_CACHE = 'js-extreme-v2.1.0';

// Recursos críticos para cache agressivo
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/robots.txt',
  '/site.webmanifest',
  '/offline.html'
];

// Rotas críticas para navegação rápida e suporte offline
const CRITICAL_ROUTES = [
  '/',
  '/artigos',
  '/newsletter',
  '/contato',
  '/sobre',
  '/politica-privacidade',
  '/admin',
  '/admin/articles',
  '/admin/editor',
  '/admin/newsletter',
  '/admin/feedback',
  '/admin/settings'
];

// Estratégias de cache otimizadas
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only',
  FASTEST: 'fastest' // Nova estratégia: cache e network em paralelo
};

// Configurações extremas de cache
const CACHE_CONFIG = {
  static: {
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 ano para assets estáticos
    maxEntries: 500
  },
  api: {
    strategy: CACHE_STRATEGIES.FASTEST,
    maxAge: 5 * 60 * 1000, // 5 minutos para API geral
    maxEntries: 200
  },
  supabase: {
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    maxAge: 10 * 60 * 1000, // 10 minutos para Supabase
    maxEntries: 300
  },
  articles: {
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    maxAge: 30 * 60 * 1000, // 30 minutos para artigos
    maxEntries: 500
  },
  images: {
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias para imagens
    maxEntries: 1000
  },
  fonts: {
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 ano para fontes
    maxEntries: 50
  },
  css: {
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias para CSS
    maxEntries: 100
  },
  js: {
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias para JS
    maxEntries: 200
  },
  dynamic: {
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    maxAge: 60 * 60 * 1000, // 1 hora para conteúdo dinâmico
    maxEntries: 300
  }
};

// Instalação EXTREMA do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing EXTREME Service Worker v2.0.0');
  
  event.waitUntil(
    Promise.all([
      // Cache agressivo de recursos críticos
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching critical assets and routes aggressively');
        return cache.addAll([...CRITICAL_ASSETS, ...CRITICAL_ROUTES]);
      }),
      // Pre-cache de recursos dinâmicos importantes
      caches.open(DYNAMIC_CACHE).then((cache) => {
        console.log('[SW] Pre-caching dynamic resources');
        return Promise.allSettled([
          cache.add('/').catch(() => {}),
          cache.add('/?utm_source=pwa').catch(() => {})
        ]);
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
      // Habilitar navigation preload para reduzir TTFB de navegações
      (async () => {
        try {
          if ('navigationPreload' in self.registration) {
            await self.registration.navigationPreload.enable();
            console.log('[SW] Navigation preload enabled');
          }
        } catch {}
      })(),
      // Limpar caches antigos
      cleanupOldCaches(),
      // Tomar controle de todas as abas
      self.clients.claim()
    ])
  );
});

// Interceptação EXTREMA de requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Tratar navegações SPA primeiro para melhor TTFB com navigation preload
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(event));
    return;
  }
  
  // Ignorar requests não HTTP e extensões do browser
  if (!request.url.startsWith('http') || 
      url.protocol === 'chrome-extension:' || 
      url.protocol === 'moz-extension:') {
    return;
  }
  
  // Estratégia otimizada baseada no tipo de recurso
  if (isFontRequest(url)) {
    event.respondWith(handleFontRequest(request));
  } else if (isCSSRequest(url)) {
    event.respondWith(handleCSSRequest(request));
  } else if (isJSRequest(url)) {
    event.respondWith(handleJSRequest(request));
  } else if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isSupabaseRequest(url)) {
    event.respondWith(handleSupabaseRequest(request));
  } else if (isArticleRequest(url)) {
    event.respondWith(handleArticleRequest(request));
  } else if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request));
  } else if (request.destination === 'image' || isImageRequest(url)) {
    event.respondWith(handleImageRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Navegação SPA com suporte a navigation preload e offline
async function handleNavigation(event) {
  try {
    // Usar resposta pré-carregada se disponível
    if ('navigationPreload' in self.registration) {
      const preloaded = await event.preloadResponse;
      if (preloaded) return preloaded;
    }
    // Tentar rede normal
    return await fetch(event.request);
  } catch (error) {
    console.warn('[SW] Navigation fetch failed, falling back to cache/offline', error);
    const cache = await caches.open(STATIC_CACHE);
    const cachedIndex = await cache.match('/index.html');
    return cachedIndex || (await caches.match('/offline.html')) || new Response('Offline', { status: 503 });
  }
}

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

// Funções auxiliares otimizadas

function isFontRequest(url) {
  return url.pathname.match(/\.(woff|woff2|ttf|eot|otf)$/);
}

function isCSSRequest(url) {
  return url.pathname.match(/\.css$/) || url.pathname.includes('/css/');
}

function isJSRequest(url) {
  return url.pathname.match(/\.js$/) || url.pathname.includes('/js/');
}

function isStaticAsset(url) {
  return url.pathname.match(/\.(html|ico|png|jpg|jpeg|gif|svg|json|xml|txt|webmanifest)$/);
}

function isAPIRequest(url) {
  return url.pathname.startsWith('/api/') || 
         (url.hostname.includes('localhost') && url.port === '3001');
}

function isSupabaseRequest(url) {
  return url.hostname.includes('supabase.co') || 
         url.hostname.includes('supabase.io');
}

function isArticleRequest(url) {
  return url.pathname.includes('/articles') || 
         url.pathname.includes('/posts') ||
         url.pathname.includes('/blog');
}

function isImageRequest(url) {
  return (
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|avif|bmp|tiff)$/) ||
    url.hostname.includes('trae-api-us.mchost.guru') ||
    url.hostname.includes('images.unsplash.com')
  );
}

// Handlers otimizados para cada tipo de recurso

async function handleFontRequest(request) {
  return handleCacheFirst(request, FONT_CACHE);
}

async function handleCSSRequest(request) {
  return handleCacheFirst(request, CSS_CACHE);
}

async function handleJSRequest(request) {
  return handleCacheFirst(request, JS_CACHE);
}

async function handleStaticAsset(request) {
  return handleCacheFirst(request, STATIC_CACHE);
}

// Estratégia cache-first otimizada
async function handleCacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Cache hit - retornar do cache imediatamente
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
    // Fallback por destino para evitar erros de MIME
    const dest = request.destination;
    if (dest === 'document') {
      return (await caches.match('/offline.html')) || new Response('Offline', { status: 503 });
    }
    if (dest === 'script') {
      return new Response('/* offline */', { status: 200, headers: { 'Content-Type': 'application/javascript' } });
    }
    if (dest === 'style') {
      return new Response('/* offline */', { status: 200, headers: { 'Content-Type': 'text/css' } });
    }
    if (dest === 'image') {
      return (await caches.match('/placeholder.svg')) || new Response('', { status: 503 });
    }
    // Demais assets: resposta genérica
    return new Response('Offline', { status: 503 });
  }
}

async function handleAPIRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  // Estratégia FASTEST: cache e network em paralelo
  const cachePromise = cache.match(request);
  const networkPromise = fetch(request).then(response => {
    if (response.ok && request.method === 'GET') {
      // Cachear resposta bem-sucedida em background
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);
  
  try {
    // Retornar o primeiro que responder (cache ou network)
    const cachedResponse = await cachePromise;
    
    if (cachedResponse) {
      // Se tem cache, retorna imediatamente e atualiza em background
      networkPromise.catch(() => {}); // Silenciar erros de network
      return cachedResponse;
    }
    
    // Se não tem cache, aguarda network
    const networkResponse = await networkPromise;
    if (networkResponse) {
      return networkResponse;
    }
    
    throw new Error('No cache and network failed');
  } catch (error) {
    console.error('[SW] API request failed:', error);
    
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

async function handleSupabaseRequest(request) {
  // Se for método que modifica dados (POST, PUT, PATCH, DELETE), passar direto para rede
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    try {
      return await fetch(request);
    } catch (error) {
      console.error('[SW] Supabase write request failed:', error);
      throw error; // Re-throw para não mascarar o erro real
    }
  }

  const cache = await caches.open(SUPABASE_CACHE);
  
  try {
    // Estratégia Stale-While-Revalidate apenas para requisições GET
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Retorna cache imediatamente e atualiza em background
      const networkPromise = fetch(request).then(response => {
        if (response.ok && request.method === 'GET') {
          cache.put(request, response.clone());
        }
        return response;
      }).catch(() => {});
      
      // Não aguarda a network, retorna cache imediatamente
      networkPromise.catch(() => {});
      return cachedResponse;
    }
    
    // Se não tem cache, busca na network
    const networkResponse = await fetch(request);
    if (networkResponse.ok && request.method === 'GET') {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
    
  } catch (error) {
    console.error('[SW] Supabase request failed:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'Dados do Supabase não disponíveis offline' 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

async function handleArticleRequest(request) {
  const cache = await caches.open(ARTICLES_CACHE);
  
  try {
    // Cache First para artigos (conteúdo mais estável)
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Se não tem cache, busca na network
    const networkResponse = await fetch(request);
    if (networkResponse.ok && request.method === 'GET') {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
    
  } catch (error) {
    console.error('[SW] Article request failed:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'Artigo não disponível offline' 
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
  const validCaches = [
    CACHE_NAME, 
    STATIC_CACHE, 
    DYNAMIC_CACHE, 
    API_CACHE, 
    SUPABASE_CACHE,
    ARTICLES_CACHE,
    IMAGE_CACHE,
    FONT_CACHE,
    CSS_CACHE,
    JS_CACHE
  ];
  
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

  // Limpeza de IndexedDB para evitar impacto em performance do Lighthouse
  if (event.data && event.data.type === 'CLEAR_INDEXEDDB') {
    clearIndexedDB().then((ok) => {
      event.ports[0]?.postMessage({ type: 'INDEXEDDB_CLEARED', ok });
    }).catch(() => {
      event.ports[0]?.postMessage({ type: 'INDEXEDDB_CLEARED', ok: false });
    });
  }
  
  // Limpeza completa de armazenamento (Cache + IndexedDB + Storage)
  if (event.data && event.data.type === 'CLEAR_STORAGE_ALL') {
    Promise.allSettled([
      clearAllCaches(),
      clearIndexedDB(),
      clearBrowserStorage()
    ]).then(() => {
      event.ports[0]?.postMessage({ type: 'STORAGE_ALL_CLEARED' });
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

// Limpar IndexedDB (todas as bases conhecidas do app)
async function clearIndexedDB() {
  try {
    // Lista de possíveis bancos usados no projeto
    const dbs = ['AIMindsetCache', 'aimindset-cache'];
    for (const name of dbs) {
      try {
        await indexedDB.deleteDatabase(name);
        console.log('[SW] IndexedDB deletado:', name);
      } catch (e) {
        console.warn('[SW] Falha ao deletar IndexedDB:', name, e);
      }
    }
    return true;
  } catch (e) {
    console.warn('[SW] Erro geral ao limpar IndexedDB:', e);
    return false;
  }
}

// Limpar localStorage e sessionStorage (via clients)
async function clearBrowserStorage() {
  const clientsList = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  await Promise.allSettled(clientsList.map(client => {
    return client.postMessage({ type: 'CLEAR_BROWSER_STORAGE' });
  }));
}