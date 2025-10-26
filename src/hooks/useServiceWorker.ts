import { useState, useEffect, useCallback } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isInstalling: boolean;
  isWaiting: boolean;
  isControlling: boolean;
  hasUpdate: boolean;
  error: string | null;
  registration: ServiceWorkerRegistration | null;
}

interface CacheStats {
  totalCaches: number;
  cacheDetails: Array<{
    name: string;
    size: number;
  }>;
}

interface ServiceWorkerActions {
  register: () => Promise<void>;
  unregister: () => Promise<void>;
  update: () => Promise<void>;
  skipWaiting: () => void;
  getCacheStats: () => Promise<CacheStats>;
  clearCache: () => Promise<void>;
  prefetchUrls: (urls: string[]) => void;
}

export function useServiceWorker(): ServiceWorkerState & ServiceWorkerActions {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isInstalling: false,
    isWaiting: false,
    isControlling: false,
    hasUpdate: false,
    error: null,
    registration: null,
  });

  // Registrar Service Worker
  const register = useCallback(async () => {
    if (!state.isSupported) {
      setState(prev => ({
        ...prev,
        error: 'Service Worker não é suportado neste navegador'
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isInstalling: true, error: null }));

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Sempre verificar atualizações
      });

      console.log('✅ Service Worker registrado:', registration);

      setState(prev => ({
        ...prev,
        isRegistered: true,
        isInstalling: false,
        registration,
        isControlling: !!navigator.serviceWorker.controller
      }));

      // Verificar se há um SW esperando
      if (registration.waiting) {
        setState(prev => ({ ...prev, isWaiting: true, hasUpdate: true }));
      }

      // Verificar se há um SW instalando
      if (registration.installing) {
        trackInstalling(registration.installing);
      }

      // Escutar mudanças no registration
      registration.addEventListener('updatefound', () => {
        console.log('🔄 Nova versão do Service Worker encontrada');
        const newWorker = registration.installing;
        if (newWorker) {
          trackInstalling(newWorker);
        }
      });

    } catch (error) {
      console.error('❌ Falha ao registrar Service Worker:', error);
      setState(prev => ({
        ...prev,
        isInstalling: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
    }
  }, [state.isSupported]);

  // Rastrear instalação do SW
  const trackInstalling = useCallback((worker: ServiceWorker) => {
    worker.addEventListener('statechange', () => {
      console.log('🔄 Service Worker state changed:', worker.state);
      
      if (worker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          // Há uma nova versão disponível
          setState(prev => ({ 
            ...prev, 
            isWaiting: true, 
            hasUpdate: true,
            isInstalling: false 
          }));
        } else {
          // Primeira instalação
          setState(prev => ({ 
            ...prev, 
            isControlling: true,
            isInstalling: false 
          }));
        }
      }
    });
  }, []);

  // Desregistrar Service Worker
  const unregister = useCallback(async () => {
    if (!state.registration) return;

    try {
      const result = await state.registration.unregister();
      if (result) {
        console.log('✅ Service Worker desregistrado');
        setState(prev => ({
          ...prev,
          isRegistered: false,
          isControlling: false,
          registration: null
        }));
      }
    } catch (error) {
      console.error('❌ Falha ao desregistrar Service Worker:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro ao desregistrar'
      }));
    }
  }, [state.registration]);

  // Atualizar Service Worker
  const update = useCallback(async () => {
    if (!state.registration) return;

    try {
      await state.registration.update();
      console.log('🔄 Verificação de atualização iniciada');
    } catch (error) {
      console.error('❌ Falha ao verificar atualizações:', error);
    }
  }, [state.registration]);

  // Pular espera e ativar nova versão
  const skipWaiting = useCallback(() => {
    if (!state.registration?.waiting) return;

    // Enviar mensagem para o SW pular a espera
    state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Recarregar página quando o novo SW assumir controle
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }, [state.registration]);

  // Obter estatísticas do cache
  const getCacheStats = useCallback(async (): Promise<CacheStats> => {
    return new Promise((resolve, reject) => {
      if (!navigator.serviceWorker.controller) {
        reject(new Error('Nenhum Service Worker ativo'));
        return;
      }

      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_STATS') {
          resolve(event.data.payload);
        }
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_CACHE_STATS' },
        [messageChannel.port2]
      );

      // Timeout após 5 segundos
      setTimeout(() => {
        reject(new Error('Timeout ao obter estatísticas do cache'));
      }, 5000);
    });
  }, []);

  // Limpar todo o cache
  const clearCache = useCallback(async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!navigator.serviceWorker.controller) {
        reject(new Error('Nenhum Service Worker ativo'));
        return;
      }

      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_CLEARED') {
          resolve();
        }
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );

      // Timeout após 10 segundos
      setTimeout(() => {
        reject(new Error('Timeout ao limpar cache'));
      }, 10000);
    });
  }, []);

  // Prefetch de URLs
  const prefetchUrls = useCallback((urls: string[]) => {
    if (!navigator.serviceWorker.controller) return;

    navigator.serviceWorker.controller.postMessage({
      type: 'PREFETCH_URLS',
      payload: { urls }
    });
  }, []);

  // Efeitos para escutar mudanças do Service Worker
  useEffect(() => {
    if (!state.isSupported) return;

    // Escutar mudanças no controller
    const handleControllerChange = () => {
      setState(prev => ({
        ...prev,
        isControlling: !!navigator.serviceWorker.controller
      }));
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Verificar se já há um SW registrado
    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration) {
        setState(prev => ({
          ...prev,
          isRegistered: true,
          registration,
          isControlling: !!navigator.serviceWorker.controller,
          isWaiting: !!registration.waiting,
          hasUpdate: !!registration.waiting
        }));
      }
    });

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, [state.isSupported]);

  return {
    ...state,
    register,
    unregister,
    update,
    skipWaiting,
    getCacheStats,
    clearCache,
    prefetchUrls,
  };
}

// Hook para cache inteligente de artigos
export function useArticleCache() {
  const { prefetchUrls, getCacheStats } = useServiceWorker();

  // Prefetch de artigos relacionados
  const prefetchRelatedArticles = useCallback((articleIds: string[]) => {
    const urls = articleIds.map(id => `/api/articles/${id}`);
    prefetchUrls(urls);
  }, [prefetchUrls]);

  // Prefetch de categoria
  const prefetchCategory = useCallback((categoryId: string) => {
    prefetchUrls([`/api/categories/${categoryId}/articles`]);
  }, [prefetchUrls]);

  // Prefetch de busca popular
  const prefetchPopularSearches = useCallback((queries: string[]) => {
    const urls = queries.map(query => `/api/search?q=${encodeURIComponent(query)}`);
    prefetchUrls(urls);
  }, [prefetchUrls]);

  return {
    prefetchRelatedArticles,
    prefetchCategory,
    prefetchPopularSearches,
    getCacheStats,
  };
}

// Hook para monitoramento de performance do cache
export function useCachePerformance() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { getCacheStats, clearCache } = useServiceWorker();

  const refreshStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const cacheStats = await getCacheStats();
      setStats(cacheStats);
    } catch (error) {
      console.error('Erro ao obter estatísticas do cache:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getCacheStats]);

  const clearAllCache = useCallback(async () => {
    try {
      await clearCache();
      await refreshStats(); // Atualizar stats após limpar
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }, [clearCache, refreshStats]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return {
    stats,
    isLoading,
    refreshStats,
    clearAllCache,
  };
}