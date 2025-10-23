// Service Worker otimizado para performance Lighthouse
const CACHE_VERSION = '1.1.0';
const CACHE_NAME = `aimindset-v${CACHE_VERSION}`;
const STATIC_CACHE = `aimindset-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `aimindset-dynamic-v${CACHE_VERSION}`;
const IMAGE_CACHE = `aimindset-images-v${CACHE_VERSION}`;

// Recursos críticos para cache imediato
const CRITICAL_RESOURCES = [
  '/',
  '/manifest.json',
  '/offline.html'
];

// Recursos estáticos para cache agressivo
const STATIC_RESOURCES = [
  '/assets/index.css',
  '/assets/index.js',
  '/favicon.ico',
  '/favicon.svg'
];

// Configurações de cache otimizadas
const CACHE_CONFIG = {
  maxEntries: 100,
  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
  imageMaxEntries: 50,
  imageMaxAgeSeconds: 7 * 24 * 60 * 60 // 7 dias para imagens
};

// Estratégias de cache
const CACHE_STRATEGIES = {
  // Cache First - Para assets estáticos
  cacheFirst: [
    /\.(?:js|css|woff2?|ttf|eot)$/,
    /\/assets\//
  ],
  
  // Network First - Para conteúdo dinâmico
  networkFirst: [
    /\/api\//,
    /supabase/
  ],
  
  // Stale While Revalidate - Para imagens e conteúdo
  staleWhileRevalidate: [
    /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
    /\/artigo\//,
    /\/categoria\//
  ]
};

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Instalando...');
  
  event.waitUntil(
    Promise.all([
      // Cache de recursos críticos
      caches.open(CACHE_NAME).then((cache) => {
        console.log('📦 Service Worker: Cacheando recursos críticos');
        return cache.addAll(CRITICAL_RESOURCES);
      }),
      
      // Cache de recursos estáticos
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 Service Worker: Cacheando recursos estáticos');
        return cache.addAll(STATIC_RESOURCES);
      })
    ]).then(() => {
      console.log('✅ Service Worker: Instalação concluída');
      // Força a ativação imediata
      return self.skipWaiting();
    })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Ativando...');
  
  event.waitUntil(
    // Limpar caches antigos de forma otimizada
    caches.keys().then((cacheNames) => {
      const currentCaches = [CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE];
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('🗑️ Service Worker: Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker: Ativação concluída');
      // Toma controle de todas as abas imediatamente
      return self.clients.claim();
    })
  );
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requisições não-HTTP
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Ignorar requisições de extensões do navegador
  if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
    return;
  }
  
  event.respondWith(
    handleRequest(request)
  );
});

// Função principal para lidar com requisições
async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Determinar estratégia de cache
    const strategy = getCacheStrategy(request);
    
    switch (strategy) {
      case 'cacheFirst':
        return await cacheFirst(request);
      
      case 'networkFirst':
        return await networkFirst(request);
      
      case 'staleWhileRevalidate':
        return await staleWhileRevalidate(request);
      
      default:
        return await networkFirst(request);
    }
  } catch (error) {
    console.error('❌ Service Worker: Erro ao processar requisição:', error);
    
    // Fallback para página offline se disponível
    if (request.destination === 'document') {
      const cache = await caches.open(CACHE_NAME);
      const offlinePage = await cache.match('/offline.html');
      if (offlinePage) {
        return offlinePage;
      }
    }
    
    // Resposta de erro genérica
    return new Response('Conteúdo não disponível offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Determinar estratégia de cache baseada na URL
function getCacheStrategy(request) {
  const url = request.url;
  
  // Cache First para assets estáticos
  for (const pattern of CACHE_STRATEGIES.cacheFirst) {
    if (pattern.test(url)) {
      return 'cacheFirst';
    }
  }
  
  // Network First para APIs
  for (const pattern of CACHE_STRATEGIES.networkFirst) {
    if (pattern.test(url)) {
      return 'networkFirst';
    }
  }
  
  // Stale While Revalidate para imagens e conteúdo
  for (const pattern of CACHE_STRATEGIES.staleWhileRevalidate) {
    if (pattern.test(url)) {
      return 'staleWhileRevalidate';
    }
  }
  
  return 'networkFirst';
}

// Estratégia Cache First - otimizada para performance
async function cacheFirst(request) {
  const isImage = request.destination === 'image' || /\.(png|jpg|jpeg|svg|gif|webp|avif)$/i.test(request.url);
  const cache = await caches.open(isImage ? IMAGE_CACHE : STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Implementar limpeza de cache para imagens
      if (isImage) {
        await cleanImageCache();
      }
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    throw error;
  }
}

// Estratégia Network First
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Verificar se a resposta é válida e não é uma resposta parcial (status 206)
    if (networkResponse.ok && networkResponse.status !== 206) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Estratégia Stale While Revalidate
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Buscar nova versão em background
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Ignorar erros de rede em background
  });
  
  // Retornar cache imediatamente se disponível
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Se não há cache, aguardar rede
  return await fetchPromise;
}

// Limpeza otimizada de cache
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAN_CACHE') {
    cleanOldCache();
  }
});

async function cleanOldCache() {
  const cache = await caches.open(DYNAMIC_CACHE);
  const requests = await cache.keys();
  
  // Manter apenas os itens configurados
  if (requests.length > CACHE_CONFIG.maxEntries) {
    const oldRequests = requests.slice(0, requests.length - CACHE_CONFIG.maxEntries);
    await Promise.all(
      oldRequests.map(request => cache.delete(request))
    );
  }
}

// Limpeza específica para cache de imagens
async function cleanImageCache() {
  const cache = await caches.open(IMAGE_CACHE);
  const requests = await cache.keys();
  
  if (requests.length > CACHE_CONFIG.imageMaxEntries) {
    const oldRequests = requests.slice(0, requests.length - CACHE_CONFIG.imageMaxEntries);
    await Promise.all(
      oldRequests.map(request => cache.delete(request))
    );
  }
}

// Executar limpeza a cada 24 horas
setInterval(cleanOldCache, 24 * 60 * 60 * 1000);