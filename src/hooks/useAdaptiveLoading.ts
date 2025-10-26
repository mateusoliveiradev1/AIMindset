import { useState, useEffect, useCallback, useRef } from 'react';
import { useMemoryLeakDetection } from './useMemoryOptimization';

// Tipos para conexão de rede
interface NetworkInfo {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g' | 'unknown';
  downlink: number;
  rtt: number;
  saveData: boolean;
}

interface AdaptiveConfig {
  imageQuality: 'low' | 'medium' | 'high';
  prefetchCount: number;
  chunkSize: number;
  enableLazyLoading: boolean;
  enablePrefetch: boolean;
  maxConcurrentRequests: number;
  requestTimeout: number;
}

interface LoadingStrategy {
  name: string;
  config: AdaptiveConfig;
  description: string;
}

// Estratégias de carregamento por tipo de conexão
const LOADING_STRATEGIES: Record<string, LoadingStrategy> = {
  'slow-2g': {
    name: 'Ultra Conservador',
    config: {
      imageQuality: 'low',
      prefetchCount: 1,
      chunkSize: 5,
      enableLazyLoading: true,
      enablePrefetch: false,
      maxConcurrentRequests: 1,
      requestTimeout: 30000,
    },
    description: 'Conexão muito lenta - mínimo de dados'
  },
  
  '2g': {
    name: 'Conservador',
    config: {
      imageQuality: 'low',
      prefetchCount: 2,
      chunkSize: 10,
      enableLazyLoading: true,
      enablePrefetch: false,
      maxConcurrentRequests: 2,
      requestTimeout: 20000,
    },
    description: 'Conexão lenta - economia de dados'
  },
  
  '3g': {
    name: 'Balanceado',
    config: {
      imageQuality: 'medium',
      prefetchCount: 5,
      chunkSize: 20,
      enableLazyLoading: true,
      enablePrefetch: true,
      maxConcurrentRequests: 3,
      requestTimeout: 15000,
    },
    description: 'Conexão moderada - balanceado'
  },
  
  '4g': {
    name: 'Agressivo',
    config: {
      imageQuality: 'high',
      prefetchCount: 10,
      chunkSize: 50,
      enableLazyLoading: false,
      enablePrefetch: true,
      maxConcurrentRequests: 6,
      requestTimeout: 10000,
    },
    description: 'Conexão rápida - carregamento otimizado'
  },
  
  'unknown': {
    name: 'Padrão',
    config: {
      imageQuality: 'medium',
      prefetchCount: 3,
      chunkSize: 15,
      enableLazyLoading: true,
      enablePrefetch: true,
      maxConcurrentRequests: 3,
      requestTimeout: 15000,
    },
    description: 'Conexão desconhecida - configuração padrão'
  }
};

// Hook para detectar informações de rede
export function useNetworkInfo() {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false,
  });
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const memoryUtils = useMemoryLeakDetection('AdaptiveLoading');

  useEffect(() => {
    // Função para atualizar informações de rede
    const updateNetworkInfo = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;

      if (connection) {
        setNetworkInfo({
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0,
          saveData: connection.saveData || false,
        });
      }
    };

    // Atualizar status online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listener para mudanças de conexão
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);

    }

    // Atualização inicial
    updateNetworkInfo();

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, []);

  return {
    networkInfo,
    isOnline,
    isSlowConnection: networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g',
    isFastConnection: networkInfo.effectiveType === '4g',
    saveDataEnabled: networkInfo.saveData,
  };
}

// Hook para carregamento adaptativo
export function useAdaptiveLoading() {
  const { networkInfo, isOnline, isSlowConnection, saveDataEnabled } = useNetworkInfo();
  const [currentStrategy, setCurrentStrategy] = useState<LoadingStrategy>(LOADING_STRATEGIES.unknown);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const requestQueueRef = useRef<Array<() => Promise<any>>>([]);
  const activeRequestsRef = useRef(0);
  const memoryUtils = useMemoryLeakDetection('AdaptiveLoading');

  // Atualizar estratégia baseada na conexão
  useEffect(() => {
    const strategy = LOADING_STRATEGIES[networkInfo.effectiveType] || LOADING_STRATEGIES.unknown;
    
    // Ajustar para modo economia de dados
    if (saveDataEnabled) {
      const conservativeStrategy = {
        ...strategy,
        config: {
          ...strategy.config,
          imageQuality: 'low' as const,
          prefetchCount: Math.min(strategy.config.prefetchCount, 2),
          enablePrefetch: false,
          maxConcurrentRequests: Math.min(strategy.config.maxConcurrentRequests, 2),
        }
      };
      setCurrentStrategy(conservativeStrategy);
    } else {
      setCurrentStrategy(strategy);
    }
  }, [networkInfo, saveDataEnabled]);

  // Gerenciador de fila de requisições
  const processRequestQueue = useCallback(async () => {
    if (!isOnline || activeRequestsRef.current >= currentStrategy.config.maxConcurrentRequests) {
      return;
    }

    const request = requestQueueRef.current.shift();
    if (!request) return;

    activeRequestsRef.current++;
    setIsLoading(true);

    try {
      await request();
    } catch (error) {
      console.error('Request failed:', error);
    } finally {
      activeRequestsRef.current--;
      
      if (activeRequestsRef.current === 0 && requestQueueRef.current.length === 0) {
        setIsLoading(false);
        setLoadingProgress(0);
      } else {
        // Atualizar progresso
        const total = activeRequestsRef.current + requestQueueRef.current.length;
        const completed = total - requestQueueRef.current.length;
        setLoadingProgress((completed / total) * 100);
        
        // Processar próxima requisição
        setTimeout(processRequestQueue, 50);
      }
    }
  }, [isOnline, currentStrategy.config.maxConcurrentRequests]);

  // Adicionar requisição à fila
  const queueRequest = useCallback((requestFn: () => Promise<any>): Promise<any> => {
    return new Promise((resolve, reject) => {
      const wrappedRequest = async () => {
        try {
          const result = await Promise.race([
            requestFn(),
            new Promise((_, timeoutReject) => {
              setTimeout(() => timeoutReject(new Error('Request timeout')), 
                        currentStrategy.config.requestTimeout);
            })
          ]);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      requestQueueRef.current.push(wrappedRequest);
      processRequestQueue();
    });
  }, [currentStrategy.config.requestTimeout, processRequestQueue]);

  // Função para carregar imagem com qualidade adaptativa
  const loadImage = useCallback((src: string, alt: string = ''): Promise<HTMLImageElement> => {
    return queueRequest(() => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        
        // Ajustar qualidade da imagem baseada na estratégia
        let adaptedSrc = src;
        if (src.includes('trae-api-us.mchost.guru')) {
          const url = new URL(src);
          const quality = currentStrategy.config.imageQuality;
          
          // Mapear qualidade para tamanho de imagem
          const sizeMap = {
            low: 'square',
            medium: 'square_hd',
            high: 'landscape_16_9'
          };
          
          url.searchParams.set('image_size', sizeMap[quality]);
          adaptedSrc = url.toString();
        }
        
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${adaptedSrc}`));
        img.alt = alt;
        img.src = adaptedSrc;
      });
    });
  }, [queueRequest, currentStrategy.config.imageQuality]);

  // Função para carregar dados com chunking adaptativo
  const loadData = useCallback(async <T>(
    fetcher: () => Promise<T[]>,
    chunkProcessor?: (chunk: T[]) => void
  ): Promise<T[]> => {
    const data = await queueRequest(fetcher);
    
    if (!chunkProcessor || !Array.isArray(data)) {
      return data;
    }

    // Processar em chunks baseado na estratégia
    const chunkSize = currentStrategy.config.chunkSize;
    const chunks: T[][] = [];
    
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }

    // Processar chunks com delay para não bloquear UI
    for (const chunk of chunks) {
      chunkProcessor(chunk);
      
      // Pequeno delay entre chunks em conexões lentas
      if (isSlowConnection) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return data;
  }, [queueRequest, currentStrategy.config.chunkSize, isSlowConnection]);

  // Função para prefetch inteligente
  const prefetch = useCallback((urls: string[]) => {
    if (!currentStrategy.config.enablePrefetch || !isOnline) {
      return;
    }

    const urlsToFetch = urls.slice(0, currentStrategy.config.prefetchCount);
    
    urlsToFetch.forEach(url => {
      queueRequest(() => fetch(url, { 
        method: 'HEAD',
        cache: 'force-cache'
      }));
    });
  }, [currentStrategy.config.enablePrefetch, currentStrategy.config.prefetchCount, isOnline, queueRequest]);

  // Função para obter configuração de lazy loading
  const getLazyLoadingConfig = useCallback(() => {
    return {
      enabled: currentStrategy.config.enableLazyLoading,
      rootMargin: isSlowConnection ? '50px' : '200px',
      threshold: isSlowConnection ? 0.1 : 0.25,
    };
  }, [currentStrategy.config.enableLazyLoading, isSlowConnection]);

  // Limpar fila ao desmontar
  useEffect(() => {
  }, []);

  return {
    strategy: currentStrategy,
    networkInfo,
    isOnline,
    isSlowConnection,
    isLoading,
    loadingProgress,
    loadImage,
    loadData,
    prefetch,
    queueRequest,
    getLazyLoadingConfig,
    
    // Configurações úteis para componentes
    shouldLazyLoad: currentStrategy.config.enableLazyLoading,
    shouldPrefetch: currentStrategy.config.enablePrefetch,
    imageQuality: currentStrategy.config.imageQuality,
    chunkSize: currentStrategy.config.chunkSize,
  };
}

// Hook para carregamento adaptativo de artigos
export function useAdaptiveArticleLoading() {
  const adaptive = useAdaptiveLoading();
  
  const loadArticles = useCallback(async (
    fetcher: () => Promise<any[]>,
    onChunkLoaded?: (articles: any[]) => void
  ) => {
    return adaptive.loadData(fetcher, onChunkLoaded);
  }, [adaptive]);

  const loadArticleImages = useCallback(async (articles: any[]) => {
    const imagePromises = articles
      .filter(article => article.image)
      .slice(0, adaptive.strategy.config.prefetchCount)
      .map(article => adaptive.loadImage(article.image, article.title));

    try {
      await Promise.allSettled(imagePromises);
    } catch (error) {
      console.warn('Some article images failed to load:', error);
    }
  }, [adaptive]);

  const prefetchRelatedArticles = useCallback((articleIds: string[]) => {
    const urls = articleIds.map(id => `/api/articles/${id}`);
    adaptive.prefetch(urls);
  }, [adaptive]);

  return {
    ...adaptive,
    loadArticles,
    loadArticleImages,
    prefetchRelatedArticles,
  };
}

// Hook para monitoramento de performance de rede
export function useNetworkPerformance() {
  const [metrics, setMetrics] = useState({
    averageLoadTime: 0,
    successRate: 0,
    totalRequests: 0,
    failedRequests: 0,
  });
  
  const metricsRef = useRef(metrics);
  const memoryUtils = useMemoryLeakDetection('AdaptiveLoading');

  const recordRequest = useCallback((duration: number, success: boolean) => {
    const current = metricsRef.current;
    const newTotal = current.totalRequests + 1;
    const newFailed = success ? current.failedRequests : current.failedRequests + 1;
    
    const newMetrics = {
      totalRequests: newTotal,
      failedRequests: newFailed,
      successRate: ((newTotal - newFailed) / newTotal) * 100,
      averageLoadTime: success 
        ? (current.averageLoadTime * current.totalRequests + duration) / newTotal
        : current.averageLoadTime,
    };
    
    metricsRef.current = newMetrics;
    setMetrics(newMetrics);
  }, []);

  const measureRequest = useCallback(async <T>(
    requestFn: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await requestFn();
      const duration = performance.now() - startTime;
      recordRequest(duration, true);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      recordRequest(duration, false);
      throw error;
    }
  }, [recordRequest]);

  // Reset metrics periodicamente
  useEffect(() => {
    const resetInterval = setInterval(() => {
      setMetrics({
        averageLoadTime: 0,
        successRate: 0,
        totalRequests: 0,
        failedRequests: 0,
      });
      metricsRef.current = {
        averageLoadTime: 0,
        successRate: 0,
        totalRequests: 0,
        failedRequests: 0,
      };
    }, 5 * 60 * 1000); // Reset a cada 5 minutos

    return () => clearInterval(resetInterval);
  }, []);

  return {
    metrics,
    measureRequest,
    recordRequest,
  };
}