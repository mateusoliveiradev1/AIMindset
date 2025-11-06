import { useState, useEffect, useCallback, useRef } from 'react';
import { useSystemLogs } from './useSystemLogs';

interface LazyLoadConfig {
  threshold?: number; // Intersection threshold (0-1)
  rootMargin?: string; // Margin for intersection observer
  delay?: number; // Delay before loading (ms)
  retryAttempts?: number; // Number of retry attempts on failure
  retryDelay?: number; // Delay between retries (ms)
  preload?: boolean; // Whether to preload when idle
  priority?: 'high' | 'medium' | 'low'; // Loading priority
}

interface LazyLoadState {
  isLoaded: boolean;
  isLoading: boolean;
  error: Error | null;
  loadTime: number;
  retryCount: number;
}

interface ComponentLoadMetrics {
  componentName: string;
  loadTime: number;
  bundleSize?: number;
  retryCount: number;
  error?: string;
}

/**
 * Hook para otimizar lazy loading de componentes e módulos
 * Implementa estratégias avançadas de carregamento sob demanda
 */
export const useOptimizedLazyLoad = (config: LazyLoadConfig = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    delay = 0,
    retryAttempts = 3,
    retryDelay = 1000,
    preload = false,
    priority = 'medium'
  } = config;

  const [loadStates, setLoadStates] = useState<Map<string, LazyLoadState>>(new Map());
  const [metrics, setMetrics] = useState<ComponentLoadMetrics[]>([]);
  const observersRef = useRef<Map<string, IntersectionObserver>>(new Map());
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const retryTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const { logInfo, logError, logWarn } = useSystemLogs();

  /**
   * Carrega componente com estratégias otimizadas
   */
  const loadComponent = useCallback(async <T>(
    componentName: string,
    loader: () => Promise<{ default: T }>,
    elementRef?: React.RefObject<HTMLElement>
  ): Promise<T | null> => {
    try {
      // Verificar se já está carregado
      const existingState = loadStates.get(componentName);
      if (existingState?.isLoaded) {
        return null; // Já carregado
      }

      // Atualizar estado para loading
      setLoadStates(prev => new Map(prev.set(componentName, {
        isLoaded: false,
        isLoading: true,
        error: null,
        loadTime: 0,
        retryCount: existingState?.retryCount || 0
      })));

      const startTime = performance.now();

      // Estratégia de carregamento baseada em prioridade
      let loadStrategy: () => Promise<T>;

      switch (priority) {
        case 'high':
          // Carregar imediatamente
          loadStrategy = async () => {
            const module = await loader();
            return module.default;
          };
          break;

        case 'medium':
          // Carregar com delay se especificado
          loadStrategy = async () => {
            if (delay > 0) {
              await new Promise(resolve => setTimeout(resolve, delay));
            }
            const module = await loader();
            return module.default;
          };
          break;

        case 'low':
          // Carregar quando idle
          loadStrategy = async () => {
            if (typeof requestIdleCallback !== 'undefined') {
              await new Promise<void>(resolve => {
                requestIdleCallback(() => resolve(), { timeout: 2000 });
              });
            } else {
              // Fallback para setTimeout
              await new Promise(resolve => setTimeout(resolve, Math.max(delay, 100)));
            }
            const module = await loader();
            return module.default;
          };
          break;

        default:
          loadStrategy = async () => {
            const module = await loader();
            return module.default;
          };
      }

      // Executar carregamento com retry logic
      let retryCount = 0;
      let lastError: Error | null = null;

      while (retryCount <= retryAttempts) {
        try {
          const component = await loadStrategy();
          const loadTime = performance.now() - startTime;

          // Atualizar estado como carregado
          setLoadStates(prev => new Map(prev.set(componentName, {
            isLoaded: true,
            isLoading: false,
            error: null,
            loadTime,
            retryCount
          })));

          // Registrar métricas
          const metric: ComponentLoadMetrics = {
            componentName,
            loadTime,
            retryCount,
            bundleSize: undefined // Pode ser estimado futuramente
          };

          setMetrics(prev => [...prev, metric]);

          await logInfo('Component loaded successfully', {
            componentName,
            loadTime,
            retryCount,
            priority,
            strategy: priority === 'low' ? 'idle_callback' : 'immediate'
          });

          return component;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error');
          retryCount++;

          await logError(`Component load failed (attempt ${retryCount})`, lastError, {
            componentName,
            retryCount,
            maxRetries: retryAttempts
          });

          if (retryCount <= retryAttempts) {
            // Aguardar antes de retry
            await new Promise(resolve => {
              const timeout = setTimeout(resolve, retryDelay * retryCount);
              retryTimeoutsRef.current.set(`${componentName}_retry_${retryCount}`, timeout);
            });
          }
        }
      }

      // Todas as tentativas falharam
      const loadTime = performance.now() - startTime;
      
      setLoadStates(prev => new Map(prev.set(componentName, {
        isLoaded: false,
        isLoading: false,
        error: lastError,
        loadTime,
        retryCount: retryAttempts
      })));

      const metric: ComponentLoadMetrics = {
        componentName,
        loadTime,
        retryCount: retryAttempts,
        error: lastError?.message
      };

      setMetrics(prev => [...prev, metric]);

      await logError('Component failed to load after all retries', lastError, {
        componentName,
        retryCount: retryAttempts,
        loadTime,
        critical: true
      });

      return null;
    } catch (error) {
      const startTimeLocal = performance.now();
      const loadTime = performance.now() - startTimeLocal;
      const errorObj = error instanceof Error ? error : new Error('Unknown error');

      setLoadStates(prev => new Map(prev.set(componentName, {
        isLoaded: false,
        isLoading: false,
        error: errorObj,
        loadTime,
        retryCount: 0
      })));

      await logError('Unexpected error during component loading', errorObj, {
        componentName,
        loadTime,
        critical: true
      });

      return null;
    }
  }, [loadStates, delay, priority, retryAttempts, retryDelay, logInfo, logError]);

  /**
   * Configura Intersection Observer para lazy loading baseado em viewport
   */
  const observeElement = useCallback((
    componentName: string,
    elementRef: React.RefObject<HTMLElement>,
    loader: () => Promise<any>
  ): void => {
    if (!elementRef.current) {
      logWarn('Element reference not provided for lazy loading', { componentName });
      return;
    }

    // Limpar observer existente
    const existingObserver = observersRef.current.get(componentName);
    if (existingObserver) {
      existingObserver.disconnect();
    }

    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        
        if (entry.isIntersecting) {
          await logInfo('Element entered viewport, loading component', {
            componentName,
            intersectionRatio: entry.intersectionRatio
          });

          // Carregar componente
          await loadComponent(componentName, loader, elementRef);

          // Parar de observar após carregar
          observer.disconnect();
          observersRef.current.delete(componentName);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(elementRef.current);
    observersRef.current.set(componentName, observer);
  }, [threshold, rootMargin, loadComponent, logWarn, logInfo]);

  /**
   * Configura preload quando o navegador está idle
   */
  const setupPreload = useCallback((
    componentName: string,
    loader: () => Promise<any>
  ): void => {
    if (!preload) return;

    const preloadTimeout = setTimeout(async () => {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(async () => {
          await logInfo('Preloading component during idle time', { componentName });
          await loadComponent(componentName, loader);
        }, { timeout: 5000 });
      } else {
        // Fallback
        await loadComponent(componentName, loader);
      }
    }, 1000); // Delay inicial para priorizar conteúdo crítico

    timeoutRefs.current.set(`${componentName}_preload`, preloadTimeout);
  }, [preload, loadComponent, logInfo]);

  /**
   * Obtém estatísticas de carregamento
   */
  const getLoadingStats = useCallback(() => {
    const totalComponents = loadStates.size;
    const loadedComponents = Array.from(loadStates.values()).filter(state => state.isLoaded).length;
    const failedComponents = Array.from(loadStates.values()).filter(state => state.error).length;
    const totalLoadTime = metrics.reduce((sum, metric) => sum + metric.loadTime, 0);
    const avgLoadTime = metrics.length > 0 ? totalLoadTime / metrics.length : 0;

    return {
      totalComponents,
      loadedComponents,
      failedComponents,
      loadingRate: totalComponents > 0 ? (loadedComponents / totalComponents) * 100 : 0,
      failureRate: totalComponents > 0 ? (failedComponents / totalComponents) * 100 : 0,
      avgLoadTime,
      totalLoadTime,
      metricsCount: metrics.length
    };
  }, [loadStates, metrics]);

  /**
   * Limpa recursos e observers
   */
  const cleanup = useCallback(() => {
    // Limpar observers
    observersRef.current.forEach(observer => observer.disconnect());
    observersRef.current.clear();

    // Limpar timeouts
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.clear();

    // Limpar retry timeouts
    retryTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    retryTimeoutsRef.current.clear();

    logInfo('Lazy loading cleanup completed', {
      observersCleared: observersRef.current.size,
      timeoutsCleared: timeoutRefs.current.size + retryTimeoutsRef.current.size
    });
  }, [logInfo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    // Estado
    loadStates,
    metrics,

    // Métodos principais
    loadComponent,
    observeElement,
    setupPreload,

    // Utilitários
    getLoadingStats,
    cleanup,

    // Helpers
    isComponentLoaded: (name: string) => loadStates.get(name)?.isLoaded || false,
    isComponentLoading: (name: string) => loadStates.get(name)?.isLoading || false,
    getComponentError: (name: string) => loadStates.get(name)?.error || null,
    getComponentLoadTime: (name: string) => loadStates.get(name)?.loadTime || 0
  };
};