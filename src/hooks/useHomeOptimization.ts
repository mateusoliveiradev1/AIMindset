import { useCallback, useEffect, useMemo, useState } from 'react';
import { useArticles } from './useArticles';
import { hybridCache, CacheKeys } from '../utils/hybridCache';
import { Article, Category } from '../types';
import { getCount } from '../utils/supabaseOptimizer';
import { supabase } from '../lib/supabase';

// Hook especializado para otimizações da Home
export const useHomeOptimization = () => {
  const { fetchHomeData, getFeaturedArticles } = useArticles();
  const [homeData, setHomeData] = useState<{ articles: Article[], categories: Category[] } | null>(null);
  const [featuredArticlesData, setFeaturedArticlesData] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heroCounts, setHeroCounts] = useState<{ articles: number; categories: number } | null>(null);

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
      const [homeData, featuredArticles, articlesCountResult, categoriesCountResult] = await Promise.all([
        fetchHomeData(forceRefresh),
        getFeaturedArticles(),
        getCount('articles', [{ column: 'published', operator: 'eq', value: true }]),
        getCount('categories')
      ]);
      
      console.log('✅ [useHomeOptimization] Dados carregados:', {
        homeDataArticles: homeData?.articles?.length || 0,
        featuredArticlesCount: featuredArticles?.length || 0,
        featuredArticlesTitles: featuredArticles?.map(a => a.title) || []
      });
      
      setHomeData(homeData);
      setFeaturedArticlesData(featuredArticles);

      // Atualizar contadores reais (sem limite)
      const totalArticlesCount = articlesCountResult?.count ?? 0;
      const totalCategoriesCount = categoriesCountResult?.count ?? 0;
      console.log('📊 [useHomeOptimization] Contagens reais:', {
        totalArticlesCount,
        totalCategoriesCount
      });
      setHeroCounts({ articles: totalArticlesCount, categories: totalCategoriesCount });
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

  const featuredArticles = useMemo(() => {
    if (featuredArticlesData && featuredArticlesData.length > 0) {
      return featuredArticlesData;
    }

    const source = homeData?.articles || [];
    if (!source || source.length === 0) {
      return [];
    }

    const sorted = [...source].sort((a, b) => {
      const arA = typeof a.approval_rate === 'number' ? a.approval_rate : 0;
      const arB = typeof b.approval_rate === 'number' ? b.approval_rate : 0;
      if (arB !== arA) return arB - arA;

      const pfA = typeof (a as any).positive_feedback === 'number' ? (a as any).positive_feedback : 0;
      const pfB = typeof (b as any).positive_feedback === 'number' ? (b as any).positive_feedback : 0;
      if (pfB !== pfA) return pfB - pfA;

      const da = a.created_at ? new Date(a.created_at).getTime() : 0;
      const db = b.created_at ? new Date(b.created_at).getTime() : 0;
      return db - da;
    });

    return sorted.slice(0, 3);
  }, [featuredArticlesData, homeData?.articles]);

  // Memoizar métricas do Hero
  const heroMetrics = useMemo(() => {
    const totalArticles = heroCounts?.articles ?? (homeData ? homeData.articles.filter(a => a.published).length : 0);
    const totalCategories = heroCounts?.categories ?? (homeData ? homeData.categories.length : 0);
    const estimatedReaders = totalArticles > 0 ? Math.max(100, totalArticles * 50) : 100;

    return {
      totalArticles,
      totalCategories,
      estimatedReaders
    };
  }, [homeData, heroCounts]);

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
    // Ouvir invalidação de cache em tempo real (publicação, exclusão, etc.)
    const handleRealtimeInvalidate = (event: CustomEvent) => {
      const detail = event?.detail || {};
      console.log('🔄 [useHomeOptimization] Realtime invalidate recebido:', detail);
      // Quando algo impacta artigos/categorias, recarregar Home com dados frescos
      loadHomeData(true);
    };

    window.addEventListener('realtime-cache-invalidate', handleRealtimeInvalidate as EventListener);

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

        // Mesmo com cache, atualizar contadores reais de forma imediata
        try {
          const [articlesCountResult, categoriesCountResult] = await Promise.all([
            getCount('articles', [{ column: 'published', operator: 'eq', value: true }]),
            getCount('categories')
          ]);
          const totalArticlesCount = articlesCountResult?.count ?? 0;
          const totalCategoriesCount = categoriesCountResult?.count ?? 0;
          console.log('📊 [useHomeOptimization] Contagens reais atualizadas (com cache):', {
            totalArticlesCount,
            totalCategoriesCount
          });
          setHeroCounts({ articles: totalArticlesCount, categories: totalCategoriesCount });
        } catch (countErr) {
          console.warn('⚠️ [useHomeOptimization] Falha ao atualizar contagens reais com cache:', countErr);
        }

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
    return () => {
      window.removeEventListener('realtime-cache-invalidate', handleRealtimeInvalidate as EventListener);
    };
  }, [loadHomeData]);

  // Assinatura direta do Supabase Realtime para garantir atualização imediata
  useEffect(() => {
    try {
      const channel = supabase
        .channel('home-articles-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, async (payload: any) => {
          const eventType = payload?.eventType || payload?.type || null;
          const row = payload?.new ?? payload?.record ?? null;
          const oldRow = payload?.old ?? null;

          console.log('🔌 [useHomeOptimization] Realtime (articles) recebido:', { eventType, id: row?.id || oldRow?.id });

          // Invalida caches críticos e força recarga
          try {
            await hybridCache.invalidate(CacheKeys.HOME_DATA);
            await hybridCache.invalidate(CacheKeys.HOME_FEATURED);
          } catch (invErr) {
            console.warn('[useHomeOptimization] Falha ao invalidar cache da Home/Featured:', invErr);
          }

          // Recarrega dados da Home imediatamente
          loadHomeData(true);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, async () => {
          console.log('🔌 [useHomeOptimization] Realtime (categories) recebido');
          try {
            await hybridCache.invalidate(CacheKeys.HOME_DATA);
          } catch (invErr) {
            console.warn('[useHomeOptimization] Falha ao invalidar cache HOME_DATA:', invErr);
          }
          loadHomeData(true);
        })
        .subscribe((status) => {
          console.log('🔌 [useHomeOptimization] Status da assinatura Realtime (Home):', status);
        });

      return () => {
        try { supabase.removeChannel(channel); } catch {}
      };
    } catch (err) {
      console.warn('[useHomeOptimization] Realtime indisponível ou falhou ao assinar:', err);
    }
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