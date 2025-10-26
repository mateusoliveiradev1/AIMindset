/**
 * Hook de otimização de performance para escalabilidade massiva
 * Integra todas as técnicas de performance em um hook reutilizável
 */

import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { 
  debounce, 
  throttle, 
  lazyLoadManager, 
  memoryManager, 
  articleCache, 
  performanceMonitor,
  PERFORMANCE_CONFIG 
} from '../utils/performanceOptimizer';
import { Article } from '../types';

interface UsePerformanceOptimizationOptions {
  enableCache?: boolean;
  enableLazyLoading?: boolean;
  enableMemoryManagement?: boolean;
  enablePerformanceMonitoring?: boolean;
  debounceMs?: number;
  throttleMs?: number;
}

interface PerformanceMetrics {
  renderTime: number;
  scrollTime: number;
  searchTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  grade: string;
  score: number;
  recommendations: string[];
}

export function usePerformanceOptimization(options: UsePerformanceOptimizationOptions = {}) {
  const {
    enableCache = true,
    enableLazyLoading = true,
    enableMemoryManagement = true,
    enablePerformanceMonitoring = true,
    debounceMs = PERFORMANCE_CONFIG.SEARCH_DEBOUNCE_MS,
    throttleMs = PERFORMANCE_CONFIG.SCROLL_DEBOUNCE_MS
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    scrollTime: 0,
    searchTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    grade: 'A+',
    score: 100,
    recommendations: []
  });

  const renderStartTime = useRef<number>(0);
  const scrollStartTime = useRef<number>(0);
  const searchStartTime = useRef<number>(0);

  // Debounced search function
  const createDebouncedSearch = useCallback(
    (searchFn: (query: string) => void) => {
      return debounce(searchFn, debounceMs);
    },
    [debounceMs]
  );

  // Throttled scroll handler
  const createThrottledScroll = useCallback(
    (scrollFn: (event: Event) => void) => {
      return throttle(scrollFn, throttleMs);
    },
    [throttleMs]
  );

  // Cache management
  const cacheArticle = useCallback(
    (key: string, article: Article) => {
      if (enableCache) {
        articleCache.set(key, article);
        if (enablePerformanceMonitoring) {
          performanceMonitor.recordCacheHit();
        }
      }
    },
    [enableCache, enablePerformanceMonitoring]
  );

  const getCachedArticle = useCallback(
    (key: string): Article | null => {
      if (!enableCache) return null;
      
      const cached = articleCache.get(key);
      if (enablePerformanceMonitoring) {
        if (cached) {
          performanceMonitor.recordCacheHit();
        } else {
          performanceMonitor.recordCacheMiss();
        }
      }
      return cached;
    },
    [enableCache, enablePerformanceMonitoring]
  );

  // Lazy loading management
  const observeElement = useCallback(
    (element: Element, callback: () => void) => {
      if (enableLazyLoading) {
        lazyLoadManager.observe(element, callback);
      } else {
        callback();
      }
    },
    [enableLazyLoading]
  );

  // Performance measurement helpers
  const startRenderMeasurement = useCallback(() => {
    if (enablePerformanceMonitoring) {
      renderStartTime.current = performance.now();
    }
  }, [enablePerformanceMonitoring]);

  const endRenderMeasurement = useCallback(() => {
    if (enablePerformanceMonitoring && renderStartTime.current > 0) {
      const renderTime = performance.now() - renderStartTime.current;
      performanceMonitor.recordRenderTime(renderTime);
      renderStartTime.current = 0;
    }
  }, [enablePerformanceMonitoring]);

  const startScrollMeasurement = useCallback(() => {
    if (enablePerformanceMonitoring) {
      scrollStartTime.current = performance.now();
    }
  }, [enablePerformanceMonitoring]);

  const endScrollMeasurement = useCallback(() => {
    if (enablePerformanceMonitoring && scrollStartTime.current > 0) {
      const scrollTime = performance.now() - scrollStartTime.current;
      performanceMonitor.recordScrollTime(scrollTime);
      scrollStartTime.current = 0;
    }
  }, [enablePerformanceMonitoring]);

  const startSearchMeasurement = useCallback(() => {
    if (enablePerformanceMonitoring) {
      searchStartTime.current = performance.now();
    }
  }, [enablePerformanceMonitoring]);

  const endSearchMeasurement = useCallback(() => {
    if (enablePerformanceMonitoring && searchStartTime.current > 0) {
      const searchTime = performance.now() - searchStartTime.current;
      performanceMonitor.recordSearchTime(searchTime);
      searchStartTime.current = 0;
    }
  }, [enablePerformanceMonitoring]);

  // Memory usage tracking
  const trackMemoryUsage = useCallback(() => {
    if (enablePerformanceMonitoring && typeof window !== 'undefined') {
      const memory = (performance as any).memory;
      if (memory) {
        performanceMonitor.recordMemoryUsage(memory.usedJSHeapSize);
      }
    }
  }, [enablePerformanceMonitoring]);

  // Update metrics periodically
  useEffect(() => {
    if (!enablePerformanceMonitoring) return;

    const updateMetrics = () => {
      const performanceGrade = performanceMonitor.getPerformanceGrade();
      
      setMetrics({
        renderTime: performanceMonitor.getAverageRenderTime(),
        scrollTime: performanceMonitor.getAverageScrollTime(),
        searchTime: performanceMonitor.getAverageSearchTime(),
        memoryUsage: performanceMonitor.getAverageMemoryUsage(),
        cacheHitRate: performanceMonitor.getCacheHitRate(),
        grade: performanceGrade.grade,
        score: performanceGrade.score,
        recommendations: performanceGrade.recommendations
      });
    };

    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, [enablePerformanceMonitoring]);

  // Memory management cleanup
  useEffect(() => {
    if (!enableMemoryManagement) return;

    const cleanupTask = () => {
      // Cleanup logic específica pode ser adicionada aqui
      trackMemoryUsage();
    };

    memoryManager.addCleanupTask(cleanupTask);

    return () => {
      memoryManager.removeCleanupTask(cleanupTask);
    };
  }, [enableMemoryManagement, trackMemoryUsage]);

  // Optimized article filtering with cache
  const filterArticles = useCallback(
    (articles: Article[], query: string): Article[] => {
      if (!query.trim()) return articles;

      const cacheKey = `filter_${query}_${articles.length}`;
      const cached = getCachedArticle(cacheKey);
      
      if (cached) {
        return [cached]; // Retorna array com resultado cached
      }

      startSearchMeasurement();
      
      const filtered = articles.filter(article => {
        const titleMatch = article.title.toLowerCase().includes(query.toLowerCase());
        const contentMatch = article.content.toLowerCase().includes(query.toLowerCase());
        
        let categoryMatch = false;
        if (article.category) {
          if (typeof article.category === 'string') {
            categoryMatch = (article.category as string).toLowerCase().includes(query.toLowerCase());
          } else if (typeof article.category === 'object' && article.category.name) {
            categoryMatch = article.category.name.toLowerCase().includes(query.toLowerCase());
          }
        }
        
        return titleMatch || contentMatch || categoryMatch;
      });

      endSearchMeasurement();

      // Cache apenas se o resultado for significativo
      if (filtered.length > 0 && filtered.length < articles.length) {
        // Para cache de filtros, armazenamos um artigo especial com os IDs
        const filterResult: Article = {
          id: cacheKey,
          title: `Filter: ${query}`,
          content: JSON.stringify(filtered.map(a => a.id)),
          slug: cacheKey,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          published: true,
          category_id: 'filter-result',
          author_id: 'system',
          category: { 
            id: 'filter-result', 
            name: 'Filter Result', 
            slug: 'filter-result', 
            description: 'Cached filter result',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          image_url: '',
          excerpt: '',
          tags: []
        };
        cacheArticle(cacheKey, filterResult);
      }

      return filtered;
    },
    [getCachedArticle, cacheArticle, startSearchMeasurement, endSearchMeasurement]
  );

  // Optimized article sorting with memoization
  const sortArticles = useMemo(() => {
    return (articles: Article[], sortBy: 'date' | 'title' | 'category' = 'date') => {
      return [...articles].sort((a, b) => {
        switch (sortBy) {
          case 'date':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'title':
            return a.title.localeCompare(b.title);
          case 'category':
            const catA = typeof a.category === 'string' ? a.category : a.category?.name || '';
            const catB = typeof b.category === 'string' ? b.category : b.category?.name || '';
            return catA.localeCompare(catB);
          default:
            return 0;
        }
      });
    };
  }, []);

  // Batch operations for better performance
  const batchProcess = useCallback(
    <T, R>(
      items: T[],
      processor: (item: T) => R,
      batchSize: number = PERFORMANCE_CONFIG.ITEMS_PER_PAGE
    ): Promise<R[]> => {
      return new Promise((resolve) => {
        const results: R[] = [];
        let index = 0;

        const processBatch = () => {
          const endIndex = Math.min(index + batchSize, items.length);
          
          for (let i = index; i < endIndex; i++) {
            results.push(processor(items[i]));
          }
          
          index = endIndex;
          
          if (index < items.length) {
            // Use requestIdleCallback se disponível, senão setTimeout
            if (typeof requestIdleCallback !== 'undefined') {
              requestIdleCallback(processBatch);
            } else {
              setTimeout(processBatch, 0);
            }
          } else {
            resolve(results);
          }
        };

        processBatch();
      });
    },
    []
  );

  return {
    // Cache functions
    cacheArticle,
    getCachedArticle,
    
    // Lazy loading
    observeElement,
    
    // Performance measurement
    startRenderMeasurement,
    endRenderMeasurement,
    startScrollMeasurement,
    endScrollMeasurement,
    startSearchMeasurement,
    endSearchMeasurement,
    trackMemoryUsage,
    
    // Optimized operations
    createDebouncedSearch,
    createThrottledScroll,
    filterArticles,
    sortArticles,
    batchProcess,
    
    // Metrics
    metrics,
    
    // Cache stats
    cacheStats: enableCache ? articleCache.getStats() : null
  };
}