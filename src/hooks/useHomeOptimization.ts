import { useCallback, useEffect, useMemo, useState } from 'react';
import { useArticles } from './useArticles';
import { hybridCache, CacheKeys } from '../utils/hybridCache';
import { Article, Category } from '../types';

// Hook especializado para otimizações da Home
export const useHomeOptimization = () => {
  const { fetchHomeData } = useArticles();
  const [homeData, setHomeData] = useState<{ articles: Article[], categories: Category[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce para pull-to-refresh em mobile
  const [refreshDebounce, setRefreshDebounce] = useState<NodeJS.Timeout | null>(null);

  // Função otimizada para carregar dados da Home
  const loadHomeData = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchHomeData();
      setHomeData(data);
    } catch (err) {
      console.error('❌ Error loading home data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load home data');
    } finally {
      setLoading(false);
    }
  }, [fetchHomeData]);

  // Refresh com debounce para mobile/tablet
  const debouncedRefresh = useCallback(async () => {
    if (refreshDebounce) {
      clearTimeout(refreshDebounce);
    }

    const timeout = setTimeout(async () => {
      await loadHomeData(true);
    }, 300); // 300ms debounce

    setRefreshDebounce(timeout);
  }, [loadHomeData, refreshDebounce]);

  // Memoizar artigos em destaque com ordenação otimizada
  const featuredArticles = useMemo(() => {
    if (!homeData?.articles) return [];

    return homeData.articles
      .filter(article => article.published)
      .sort((a, b) => {
        const getTotalFeedback = (article: Article): number => {
          return (article.positive_feedback || 0) + (article.negative_feedback || 0);
        };

        const getRating = (article: Article): number => {
          if (typeof article.approval_rate === 'number') {
            return article.approval_rate;
          }
          
          const positive = article.positive_feedback || 0;
          const negative = article.negative_feedback || 0;
          const total = positive + negative;
          
          if (total === 0) return 0;
          return (positive / total) * 100;
        };

        const totalFeedbackA = getTotalFeedback(a);
        const totalFeedbackB = getTotalFeedback(b);
        const ratingA = getRating(a);
        const ratingB = getRating(b);
        
        // Prioridade: mais feedback primeiro
        if (totalFeedbackA !== totalFeedbackB) {
          return totalFeedbackB - totalFeedbackA;
        }
        
        // Se feedback igual, ordenar por rating
        if (ratingA !== ratingB) {
          return ratingB - ratingA;
        }
        
        // Se tudo igual, ordenar por data
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, 3);
  }, [homeData?.articles]);

  // Memoizar métricas do Hero
  const heroMetrics = useMemo(() => {
    if (!homeData) return { totalArticles: 0, totalCategories: 0, estimatedReaders: 100 };

    const publishedArticles = homeData.articles.filter(article => article.published);
    const totalArticles = publishedArticles.length;
    const totalCategories = homeData.categories.length;
    const estimatedReaders = totalArticles > 0 ? Math.max(100, totalArticles * 50) : 100;

    return {
      totalArticles,
      totalCategories,
      estimatedReaders
    };
  }, [homeData]);

  // Memoizar categorias principais
  const mainCategories = useMemo(() => {
    if (!homeData?.categories) return [];

    const mainCategorySlugs = ['ia-tecnologia', 'produtividade', 'futuro'];
    return homeData.categories.filter(category => 
      mainCategorySlugs.includes(category.slug)
    );
  }, [homeData?.categories]);

  // Lazy loading com Intersection Observer
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useCallback((node: HTMLElement | null) => {
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          // Preload de recursos críticos quando componente fica visível
          if (!homeData) {
            loadHomeData();
          }
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible, homeData, loadHomeData]);

  // Prefetch inteligente de dados críticos
  useEffect(() => {
    const prefetchCriticalData = async () => {
      // Prefetch apenas se não tiver dados em cache
      const cached = await hybridCache.get(CacheKeys.HOME_DATA);
      if (!cached.data) {
        loadHomeData();
      } else {
        setHomeData(cached.data as { articles: Article[]; categories: Category[]; });
      }
    };

    prefetchCriticalData();
  }, [loadHomeData]);

  // Cleanup do debounce
  useEffect(() => {
    return () => {
      if (refreshDebounce) {
        clearTimeout(refreshDebounce);
      }
    };
  }, [refreshDebounce]);

  return {
    // Dados otimizados
    homeData,
    featuredArticles,
    heroMetrics,
    mainCategories,
    
    // Estados
    loading,
    error,
    isVisible,
    
    // Funções otimizadas
    loadHomeData,
    debouncedRefresh,
    observerRef,
    
    // Utilitários
    refresh: () => loadHomeData(true),
    prefetch: () => loadHomeData(false)
  };
};

export default useHomeOptimization;