import { useCallback, useEffect, useMemo, useState } from 'react';
import { useArticles } from './useArticles';
import { hybridCache, CacheKeys } from '../utils/hybridCache';
import { Article, Category } from '../types';

// Hook especializado para otimizações da Home
export const useHomeOptimization = () => {
  const { fetchHomeData, getFeaturedArticles } = useArticles();
  const [homeData, setHomeData] = useState<{ articles: Article[], categories: Category[] } | null>(null);
  const [featuredArticlesData, setFeaturedArticlesData] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // DEBUG: Log do estado inicial
  console.log('🔍 [useHomeOptimization] Estado inicial:', {
    featuredArticlesData: featuredArticlesData.length,
    loading,
    error
  });

  // Debounce para pull-to-refresh em mobile
  const [refreshDebounce, setRefreshDebounce] = useState<NodeJS.Timeout | null>(null);

  // Função otimizada para carregar dados da Home
  const loadHomeData = useCallback(async (forceRefresh: boolean = false) => {
    try {
      console.log('🔄 [useHomeOptimization] Iniciando loadHomeData...');
      setLoading(true);
      setError(null);

      // Carregar dados da home e artigos em destaque em paralelo
      console.log('🔄 [useHomeOptimization] Chamando Promise.all...');
      const [homeData, featuredArticles] = await Promise.all([
        fetchHomeData(),
        getFeaturedArticles()
      ]);
      
      console.log('✅ [useHomeOptimization] Dados carregados:', {
        homeDataArticles: homeData?.articles?.length || 0,
        featuredArticlesCount: featuredArticles?.length || 0,
        featuredArticlesTitles: featuredArticles?.map(a => a.title) || []
      });
      
      setHomeData(homeData);
      setFeaturedArticlesData(featuredArticles);
    } catch (err) {
      console.error('❌ [useHomeOptimization] Error loading home data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load home data');
    } finally {
      setLoading(false);
    }
  }, [fetchHomeData, getFeaturedArticles]);

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

  // Artigos em destaque usando a nova função SQL híbrida
  const featuredArticles = useMemo(() => {
    // Usar os dados da função SQL que já implementa o modo híbrido
    return featuredArticlesData || [];
  }, [featuredArticlesData]);

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
    console.log('🔄 [useHomeOptimization] useEffect executado!');
    
    const prefetchCriticalData = async () => {
      console.log('🔄 [useHomeOptimization] prefetchCriticalData iniciado...');
      // Prefetch apenas se não tiver dados em cache
      const cached = await hybridCache.get(CacheKeys.HOME_DATA);
      console.log('🔍 [useHomeOptimization] Cache verificado:', { hasData: !!cached.data });
      
      if (!cached.data) {
        console.log('🔄 [useHomeOptimization] Sem cache, chamando loadHomeData...');
        await loadHomeData();
      } else {
        console.log('✅ [useHomeOptimization] Usando dados do cache');
        setHomeData(cached.data as { articles: Article[]; categories: Category[]; });
        
        // SEMPRE carregar artigos em destaque, mesmo com cache
        console.log('🔄 [useHomeOptimization] Carregando artigos em destaque...');
        try {
          const featuredArticles = await getFeaturedArticles();
          console.log('✅ [useHomeOptimization] Artigos em destaque carregados:', featuredArticles.length);
          setFeaturedArticlesData(featuredArticles);
        } catch (err) {
          console.error('❌ [useHomeOptimization] Erro ao carregar artigos em destaque:', err);
        }
      }
    };

    prefetchCriticalData().catch(err => {
      console.error('❌ [useHomeOptimization] Erro no prefetchCriticalData:', err);
    });
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