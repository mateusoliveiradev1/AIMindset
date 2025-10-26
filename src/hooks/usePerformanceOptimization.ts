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
import { Article, SortBy } from '../types';

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
    (articles: Article[], query: string, selectedCategory?: string): Article[] => {
      let filtered = articles;

      // Filtrar por categoria primeiro se especificada
      if (selectedCategory && selectedCategory !== 'all' && selectedCategory !== '') {
        filtered = filtered.filter(article => {
          if (typeof article.category === 'string') {
            return article.category === selectedCategory;
          }
          return article.category?.id === selectedCategory;
        });
      }

      // Se não há query de busca, retornar apenas o filtro de categoria
      if (!query.trim()) return filtered;

      startSearchMeasurement();
      
      const queryLower = query.toLowerCase().trim();
      const queryWords = queryLower.split(/\s+/).filter(word => word.length > 0);
      
      const searchFiltered = filtered.filter(article => {
        // Função auxiliar para verificar se alguma palavra da query está presente no texto
        const matchesQuery = (text: string) => {
          const textLower = text.toLowerCase();
          return queryWords.some(word => textLower.includes(word));
        };
        
        // Busca no título (peso maior)
        const titleMatch = matchesQuery(article.title);
        
        // Busca no conteúdo
        const contentMatch = matchesQuery(article.content);
        
        // Busca no excerpt se existir
        const excerptMatch = article.excerpt ? matchesQuery(article.excerpt) : false;
        
        // Busca na categoria
        let categoryMatch = false;
        if (article.category) {
          if (typeof article.category === 'string') {
            categoryMatch = matchesQuery(article.category);
          } else if (typeof article.category === 'object' && article.category.name) {
            categoryMatch = matchesQuery(article.category.name);
          }
        }
        
        // Busca nas tags (melhorada)
        let tagsMatch = false;
        if (article.tags) {
          if (Array.isArray(article.tags)) {
            tagsMatch = article.tags.some(tag => {
              const tagStr = typeof tag === 'string' ? tag : String(tag);
              return matchesQuery(tagStr);
            });
          } else if (typeof article.tags === 'string') {
            // Se tags é uma string separada por vírgulas ou espaços
            const tagsArray = article.tags.split(/[,\s]+/).map(tag => tag.trim()).filter(tag => tag.length > 0);
            tagsMatch = tagsArray.some(tag => matchesQuery(tag));
          }
        }
        
        // Busca no slug se existir
        const slugMatch = article.slug ? matchesQuery(article.slug.replace(/-/g, ' ')) : false;
        
        return titleMatch || contentMatch || excerptMatch || categoryMatch || tagsMatch || slugMatch;
      });

      endSearchMeasurement();
      return searchFiltered;
    },
    [startSearchMeasurement, endSearchMeasurement]
  );

  // Optimized article sorting with memoization
  const sortArticles = useMemo(() => {
    return (articles: Article[], sortBy: SortBy = 'date') => {
      return [...articles].sort((a, b) => {
        switch (sortBy) {
          case 'date':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'title':
            return a.title.localeCompare(b.title);
          case 'rating':
            // Ordenar por avaliação usando dados reais de feedback do banco de dados
            const getRating = (article: Article): number => {
              console.log(`🔍 [DEBUG CRÍTICO ORDENAÇÃO] Calculando rating para "${article.title}":`, {
                 approval_rate: article.approval_rate,
                 positive_feedback: article.positive_feedback,
                 negative_feedback: article.negative_feedback,
                 total_feedback: (article.positive_feedback || 0) + (article.negative_feedback || 0)
               });
               
               // Usar approval_rate se disponível
               if (typeof article.approval_rate === 'number') {
                 console.log(`✅ [DEBUG CRÍTICO ORDENAÇÃO] Usando approval_rate para "${article.title}": ${article.approval_rate}`);
                 return article.approval_rate;
               }
               
               // Fallback para campos antigos se approval_rate não estiver disponível
               const positive = article.positive_feedback || 0;
               const negative = article.negative_feedback || 0;
               const total = positive + negative;
               
               if (total === 0) {
                 console.log(`⚠️ [DEBUG CRÍTICO ORDENAÇÃO] Sem feedback para "${article.title}", retornando 0`);
                 return 0;
               }
               
               const calculatedRate = (positive / total) * 100;
               console.log(`📊 [DEBUG CRÍTICO ORDENAÇÃO] Calculando rate para "${article.title}": ${calculatedRate}% (${positive}/${total})`);
               return calculatedRate;
             };

             const ratingA = getRating(a);
             const ratingB = getRating(b);
             
             console.log(`🔍 [DEBUG CRÍTICO ORDENAÇÃO] Comparando ratings: "${a.title}" (${ratingA}) vs "${b.title}" (${ratingB})`);
             
             // Se os ratings são iguais, usar quantidade total de feedback como critério secundário
             if (ratingA === ratingB) {
               const totalFeedbackA = (a.positive_feedback || 0) + (a.negative_feedback || 0);
               const totalFeedbackB = (b.positive_feedback || 0) + (b.negative_feedback || 0);
               
               console.log(`📊 [DEBUG CRÍTICO ORDENAÇÃO] Ratings iguais, comparando total de feedback: "${a.title}" (${totalFeedbackA}) vs "${b.title}" (${totalFeedbackB})`);
               
               // Se o total de feedback também for igual, usar data como critério terciário
               if (totalFeedbackA === totalFeedbackB) {
                 const dateComparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                 console.log(`📅 [DEBUG CRÍTICO ORDENAÇÃO] Total de feedback igual, ordenando por data: "${a.title}" vs "${b.title}" = ${dateComparison}`);
                 return dateComparison;
               }
               
               const feedbackComparison = totalFeedbackB - totalFeedbackA; // Mais feedback primeiro
               console.log(`📊 [DEBUG CRÍTICO ORDENAÇÃO] Resultado da comparação por feedback: ${feedbackComparison} (${totalFeedbackB} - ${totalFeedbackA})`);
               return feedbackComparison;
             }
             
             const ratingComparison = ratingB - ratingA; // Maior rating primeiro
             console.log(`📊 [DEBUG CRÍTICO ORDENAÇÃO] Resultado da comparação: ${ratingComparison} (${ratingB} - ${ratingA})`);
             return ratingComparison;
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