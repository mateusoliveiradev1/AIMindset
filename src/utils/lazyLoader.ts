import { lazy, ComponentType, LazyExoticComponent } from 'react';

// Configurações para lazy loading
export const LAZY_LOADING_CONFIG = {
  // Delay mínimo para evitar flashes de loading muito rápidos
  MIN_LOADING_TIME: 200,
  // Timeout para carregamento de componentes
  LOADING_TIMEOUT: 10000,
  // Retry attempts para componentes que falharam ao carregar
  MAX_RETRY_ATTEMPTS: 3,
  // Delay entre tentativas de retry
  RETRY_DELAY: 1000
};

// Interface para opções de lazy loading
interface LazyLoadOptions {
  minLoadingTime?: number;
  retryAttempts?: number;
  retryDelay?: number;
  fallback?: ComponentType;
}

// Função utilitária para criar componentes lazy com retry e loading mínimo
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): LazyExoticComponent<T> {
  const {
    minLoadingTime = LAZY_LOADING_CONFIG.MIN_LOADING_TIME,
    retryAttempts = LAZY_LOADING_CONFIG.MAX_RETRY_ATTEMPTS,
    retryDelay = LAZY_LOADING_CONFIG.RETRY_DELAY
  } = options;

  return lazy(() => {
    const startTime = Date.now();
    
    const loadWithRetry = async (attempt = 1): Promise<{ default: T }> => {
      try {
        const module = await importFn();
        
        // Garantir tempo mínimo de loading para evitar flashes
        const loadTime = Date.now() - startTime;
        if (loadTime < minLoadingTime) {
          await new Promise(resolve => setTimeout(resolve, minLoadingTime - loadTime));
        }
        
        return module;
      } catch (error) {
        console.error(`Failed to load component (attempt ${attempt}):`, error);
        
        if (attempt < retryAttempts) {
          console.log(`Retrying in ${retryDelay}ms... (attempt ${attempt + 1}/${retryAttempts})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return loadWithRetry(attempt + 1);
        }
        
        throw error;
      }
    };

    return loadWithRetry();
  });
}

// Preload function para carregar componentes em background
export function preloadComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): Promise<{ default: T }> {
  return importFn().catch(error => {
    console.warn('Failed to preload component:', error);
    throw error;
  });
}

// Hook para preload baseado em interação do usuário
export function usePreloadOnHover<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  let preloadPromise: Promise<{ default: T }> | null = null;

  const handleMouseEnter = () => {
    if (!preloadPromise) {
      preloadPromise = preloadComponent(importFn);
    }
  };

  const handleTouchStart = () => {
    if (!preloadPromise) {
      preloadPromise = preloadComponent(importFn);
    }
  };

  return {
    onMouseEnter: handleMouseEnter,
    onTouchStart: handleTouchStart,
    preloadPromise
  };
}

// Função para preload baseado em Intersection Observer
export function preloadOnVisible<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: IntersectionObserverInit = {}
) {
  return (element: Element) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            preloadComponent(importFn);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
        ...options
      }
    );

    observer.observe(element);

    return () => observer.unobserve(element);
  };
}

// Função para preload baseado em idle time
export function preloadOnIdle<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  timeout = 2000
) {
  const preload = () => {
    preloadComponent(importFn);
  };

  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(preload, { timeout });
  } else {
    setTimeout(preload, timeout);
  }
}

// Bundle analyzer helper para desenvolvimento
export function logBundleInfo(componentName: string, size?: number) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`📦 Lazy loaded: ${componentName}${size ? ` (${size}KB)` : ''}`);
  }
}

// Função para criar chunks nomeados
export function createNamedChunk<T extends ComponentType<any>>(
  chunkName: string,
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): LazyExoticComponent<T> {
  return createLazyComponent(() => {
    logBundleInfo(chunkName);
    return importFn();
  }, options);
}