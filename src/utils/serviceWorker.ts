// Utilitários para gerenciamento do Service Worker
export interface ServiceWorkerConfig {
  swUrl: string;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

export interface CacheInfo {
  size: number;
  entries: number;
  lastUpdated: Date;
}

// Registrar Service Worker
export async function registerServiceWorker(config: ServiceWorkerConfig): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker não suportado neste navegador');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(config.swUrl, {
      scope: '/'
    });

    console.log('Service Worker registrado com sucesso:', registration.scope);

    // Verificar atualizações
    registration.addEventListener('updatefound', () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;

      installingWorker.addEventListener('statechange', () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // Nova versão disponível
            console.log('Nova versão do Service Worker disponível');
            config.onUpdate?.(registration);
          } else {
            // Service Worker instalado pela primeira vez
            console.log('Service Worker instalado pela primeira vez');
            config.onSuccess?.(registration);
          }
        }
      });
    });

    // Configurar listeners de conectividade
    setupConnectivityListeners(config);

    // Configurar background sync
    setupBackgroundSync(registration);

    return registration;
  } catch (error) {
    console.error('Erro ao registrar Service Worker:', error);
    return null;
  }
}

// Desregistrar Service Worker
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const result = await registration.unregister();
    console.log('Service Worker desregistrado:', result);
    return result;
  } catch (error) {
    console.error('Erro ao desregistrar Service Worker:', error);
    return false;
  }
}

// Atualizar Service Worker
export async function updateServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    console.log('Service Worker atualizado');
  } catch (error) {
    console.error('Erro ao atualizar Service Worker:', error);
  }
}

// Pular waiting e ativar nova versão
export async function skipWaitingAndActivate(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    if (registration.waiting) {
      // Enviar mensagem para o SW pular waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Aguardar ativação
      await new Promise<void>((resolve) => {
        const handleControllerChange = () => {
          navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
          resolve();
        };
        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      });
      
      // Recarregar página para usar nova versão
      window.location.reload();
    }
  } catch (error) {
    console.error('Erro ao ativar nova versão do Service Worker:', error);
  }
}

// Obter informações do cache
export async function getCacheInfo(): Promise<CacheInfo | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    return new Promise<CacheInfo>((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_SIZE') {
          resolve({
            size: event.data.size,
            entries: event.data.entries || 0,
            lastUpdated: new Date()
          });
        } else {
          reject(new Error('Resposta inválida do Service Worker'));
        }
      };
      
      registration.active?.postMessage(
        { type: 'GET_CACHE_SIZE' },
        [messageChannel.port2]
      );
    });
  } catch (error) {
    console.error('Erro ao obter informações do cache:', error);
    return null;
  }
}

// Limpar cache
export async function clearCache(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    return new Promise<boolean>((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_CLEARED') {
          resolve(true);
        } else {
          resolve(false);
        }
      };
      
      registration.active?.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
    });
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
    return false;
  }
}

// Verificar se está online
export function isOnline(): boolean {
  return navigator.onLine;
}

// Configurar listeners de conectividade
function setupConnectivityListeners(config: ServiceWorkerConfig): () => void {
  const handleOnline = () => {
    console.log('Aplicação online');
    config.onOnline?.();
  };

  const handleOffline = () => {
    console.log('Aplicação offline');
    config.onOffline?.();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// Configurar background sync
function setupBackgroundSync(registration: ServiceWorkerRegistration): void {
  if (!('sync' in window.ServiceWorkerRegistration.prototype)) {
    console.warn('Background Sync não suportado');
    return;
  }

  // Registrar sync para artigos (verificar se sync está disponível)
  if ('sync' in registration) {
    (registration as any).sync.register('background-sync-articles').catch((error: Error) => {
      console.error('Erro ao registrar background sync:', error);
    });
  }
}

// Pré-carregar recursos críticos
export async function preloadCriticalResources(urls: string[]): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const cache = await caches.open('critical-resources');
    
    const preloadPromises = urls.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
          console.log('Recurso crítico pré-carregado:', url);
        }
      } catch (error) {
        console.warn('Erro ao pré-carregar recurso:', url, error);
      }
    });

    await Promise.all(preloadPromises);
  } catch (error) {
    console.error('Erro ao pré-carregar recursos críticos:', error);
  }
}

// Monitorar performance do Service Worker
export function monitorServiceWorkerPerformance(): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  // Monitorar tempo de resposta do cache
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const startTime = performance.now();
    
    try {
      const response = await originalFetch(...args);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Log performance apenas para requests importantes
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      if (url.includes('/api/') || url.includes('articles')) {
        console.log(`[SW Performance] ${url}: ${duration.toFixed(2)}ms`);
      }
      
      return response;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.error(`[SW Performance] Error after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  };
}

// Configuração padrão do Service Worker
export const defaultServiceWorkerConfig: ServiceWorkerConfig = {
  swUrl: '/sw.js',
  onSuccess: (registration) => {
    console.log('Service Worker ativo e funcionando');
  },
  onUpdate: (registration) => {
    console.log('Nova versão disponível. Considere recarregar a página.');
    
    // Mostrar notificação de atualização (pode ser customizado)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Atualização Disponível', {
        body: 'Uma nova versão da aplicação está disponível.',
        icon: '/favicon.ico'
      });
    }
  },
  onOffline: () => {
    console.log('Aplicação funcionando offline');
  },
  onOnline: () => {
    console.log('Conexão restaurada');
  }
};

// Inicializar Service Worker com configuração padrão
export async function initServiceWorker(config?: Partial<ServiceWorkerConfig>): Promise<ServiceWorkerRegistration | null> {
  const finalConfig = { ...defaultServiceWorkerConfig, ...config };
  
  const registration = await registerServiceWorker(finalConfig);
  
  if (registration) {
    // Iniciar monitoramento de performance
    monitorServiceWorkerPerformance();
    
    // Pré-carregar recursos críticos
    await preloadCriticalResources([
      '/',
      '/artigos',
      '/manifest.json'
    ]);
  }
  
  return registration;
}