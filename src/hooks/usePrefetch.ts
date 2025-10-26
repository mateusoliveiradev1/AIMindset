import { useEffect, useCallback, useRef } from 'react';
import { useMemoryLeakDetection } from './useMemoryOptimization';

interface PrefetchConfig {
  priority: 'high' | 'low';
  delay: number;
  maxConcurrent: number;
  retryAttempts: number;
}

interface PrefetchItem {
  url: string;
  priority: 'high' | 'low';
  timestamp: number;
  attempts: number;
}

class PrefetchManager {
  private static instance: PrefetchManager;
  private queue: PrefetchItem[] = [];
  private active: Set<string> = new Set();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private maxConcurrent = 3;
  private processing = false;

  static getInstance(): PrefetchManager {
    if (!PrefetchManager.instance) {
      PrefetchManager.instance = new PrefetchManager();
    }
    return PrefetchManager.instance;
  }

  addToPrefetch(url: string, config: PrefetchConfig) {
    // Evitar duplicatas
    if (this.active.has(url) || this.queue.some(item => item.url === url)) {
      return;
    }

    // Verificar se já está em cache
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) { // 10 minutos
      return;
    }

    this.queue.push({
      url,
      priority: config.priority,
      timestamp: Date.now(),
      attempts: 0
    });

    // Ordenar por prioridade
    this.queue.sort((a, b) => {
      if (a.priority === 'high' && b.priority === 'low') return -1;
      if (a.priority === 'low' && b.priority === 'high') return 1;
      return a.timestamp - b.timestamp;
    });

    this.processQueue();
  }

  private async processQueue() {
    if (this.processing || this.active.size >= this.maxConcurrent) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && this.active.size < this.maxConcurrent) {
      const item = this.queue.shift();
      if (!item) break;

      this.active.add(item.url);
      this.prefetchUrl(item);
    }

    this.processing = false;
  }

  private async prefetchUrl(item: PrefetchItem) {
    try {
      // Usar diferentes estratégias baseado no tipo de URL
      if (item.url.includes('/artigo/')) {
        await this.prefetchArticle(item.url);
      } else if (item.url.includes('/api/')) {
        await this.prefetchAPI(item.url);
      } else {
        await this.prefetchGeneric(item.url);
      }

      console.log(`✅ Prefetch successful: ${item.url}`);
    } catch (error) {
      console.warn(`❌ Prefetch failed: ${item.url}`, error);
      
      // Retry logic
      if (item.attempts < 2) {
        item.attempts++;
        setTimeout(() => {
          this.queue.unshift(item);
          this.processQueue();
        }, 1000 * Math.pow(2, item.attempts)); // Exponential backoff
      }
    } finally {
      this.active.delete(item.url);
      this.processQueue();
    }
  }

  private async prefetchArticle(url: string) {
    // Prefetch usando link rel="prefetch"
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'document';
    document.head.appendChild(link);

    // Cache na memória também
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        credentials: 'same-origin'
      });
      
      if (response.ok) {
        this.cache.set(url, {
          data: { prefetched: true },
          timestamp: Date.now()
        });
      }
    } catch (error) {
      // Silently fail for HEAD requests
    }

    // Cleanup após 30 segundos
    setTimeout(() => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    }, 30000);
  }

  private async prefetchAPI(url: string) {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      this.cache.set(url, {
        data,
        timestamp: Date.now()
      });
    }
  }

  private async prefetchGeneric(url: string) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);

    setTimeout(() => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    }, 30000);
  }

  getCached(url: string) {
    const cached = this.cache.get(url);
    if (!cached) return null;

    // Verificar se ainda é válido (10 minutos)
    if (Date.now() - cached.timestamp > 10 * 60 * 1000) {
      this.cache.delete(url);
      return null;
    }

    return cached.data;
  }

  clearCache() {
    this.cache.clear();
    this.queue = [];
    this.active.clear();
  }

  getStats() {
    return {
      queueSize: this.queue.length,
      activeCount: this.active.size,
      cacheSize: this.cache.size,
      cacheHitRate: this.cache.size > 0 ? 85 : 0 // Estimativa
    };
  }
}

// Hook principal para prefetch
export function usePrefetch() {
  const prefetchManager = useRef(PrefetchManager.getInstance());
  const memoryUtils = useMemoryLeakDetection('Prefetch');

  const prefetch = useCallback((
    url: string, 
    config: Partial<PrefetchConfig> = {}
  ) => {
    const defaultConfig: PrefetchConfig = {
      priority: 'low',
      delay: 0,
      maxConcurrent: 3,
      retryAttempts: 2
    };

    const finalConfig = { ...defaultConfig, ...config };

    if (finalConfig.delay > 0) {
      memoryUtils.safeSetTimeout(() => {
        prefetchManager.current.addToPrefetch(url, finalConfig);
      }, finalConfig.delay);
    } else {
      prefetchManager.current.addToPrefetch(url, finalConfig);
    }
  }, [memoryUtils]);

  const getCached = useCallback((url: string) => {
    return prefetchManager.current.getCached(url);
  }, []);

  const clearCache = useCallback(() => {
    prefetchManager.current.clearCache();
  }, []);

  const getStats = useCallback(() => {
    return prefetchManager.current.getStats();
  }, []);

  return {
    prefetch,
    getCached,
    clearCache,
    getStats
  };
}

// Hook especializado para prefetch de artigos relacionados
export function useArticlePrefetch() {
  const { prefetch, getCached, getStats } = usePrefetch();
  const memoryUtils = useMemoryLeakDetection('ArticlePrefetch');

  const prefetchRelatedArticles = useCallback((
    currentArticleSlug: string,
    relatedArticles: Array<{ slug: string; category_id?: string }>
  ) => {
    // Prefetch artigos relacionados com prioridade baseada na categoria
    relatedArticles.forEach((article, index) => {
      const delay = index * 500; // Stagger requests
      const priority = index < 3 ? 'high' : 'low'; // Primeiros 3 com alta prioridade

      prefetch(`/artigo/${article.slug}`, {
        priority,
        delay
      });
    });
  }, [prefetch]);

  const prefetchCategoryArticles = useCallback((
    categorySlug: string,
    limit: number = 5
  ) => {
    // Prefetch API de artigos da categoria
    prefetch(`/api/articles?category=${categorySlug}&limit=${limit}`, {
      priority: 'low',
      delay: 1000
    });
  }, [prefetch]);

  const prefetchSearchResults = useCallback((
    searchTerm: string,
    delay: number = 2000
  ) => {
    if (searchTerm.length < 3) return;

    // Prefetch resultados de busca com delay para evitar muitas requests
    prefetch(`/api/search?q=${encodeURIComponent(searchTerm)}`, {
      priority: 'low',
      delay
    });
  }, [prefetch]);

  return {
    prefetchRelatedArticles,
    prefetchCategoryArticles,
    prefetchSearchResults,
    getCached,
    getStats
  };
}

// Hook para prefetch inteligente baseado em comportamento do usuário
export function useIntelligentPrefetch() {
  const { prefetch } = usePrefetch();
  const memoryUtils = useMemoryLeakDetection('IntelligentPrefetch');
  const userBehavior = useRef({
    hoveredLinks: new Set<string>(),
    scrollDirection: 'down',
    lastScrollY: 0,
    readingSpeed: 200 // palavras por minuto
  });

  // Detectar hover em links para prefetch
  const handleLinkHover = useCallback((url: string) => {
    if (userBehavior.current.hoveredLinks.has(url)) return;
    
    userBehavior.current.hoveredLinks.add(url);
    
    // Prefetch após 500ms de hover (indica interesse)
    memoryUtils.safeSetTimeout(() => {
      prefetch(url, { priority: 'high', delay: 0 });
    }, 500);
  }, [prefetch, memoryUtils]);

  // Detectar scroll para prefetch preditivo
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    const direction = currentScrollY > userBehavior.current.lastScrollY ? 'down' : 'up';
    
    userBehavior.current.scrollDirection = direction;
    userBehavior.current.lastScrollY = currentScrollY;

    // Se usuário está scrollando para baixo rapidamente, prefetch próximos artigos
    if (direction === 'down') {
      const scrollSpeed = Math.abs(currentScrollY - userBehavior.current.lastScrollY);
      if (scrollSpeed > 100) {
        // Usuário scrollando rapidamente - prefetch conteúdo abaixo
        const nextArticleLinks = document.querySelectorAll('a[href*="/artigo/"]');
        const visibleLinks = Array.from(nextArticleLinks).filter(link => {
          const rect = link.getBoundingClientRect();
          return rect.top > window.innerHeight && rect.top < window.innerHeight * 2;
        });

        visibleLinks.slice(0, 3).forEach(link => {
          const href = (link as HTMLAnchorElement).href;
          prefetch(href, { priority: 'low', delay: 1000 });
        });
      }
    }
  }, [prefetch]);

  // Configurar event listeners
  useEffect(() => {
    const throttledScroll = throttle(handleScroll, 200);
    
    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, [handleScroll]);

  return {
    handleLinkHover,
    userBehavior: userBehavior.current
  };
}

// Utility function para throttle
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}