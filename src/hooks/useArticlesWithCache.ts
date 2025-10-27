/**
 * Hook otimizado com Cache Híbrido - Fase 1
 * 
 * FUNCIONALIDADES:
 * - Cache híbrido L1 (memória) + L2 (IndexedDB)
 * - Fallback automático para Supabase
 * - Zero impacto nas operações CRUD do admin
 * - Invalidação automática inteligente
 * - Performance melhorada sem quebrar funcionalidades
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Article, Category } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { hybridCache, CacheKeys, useCacheMetrics } from '../utils/hybridCache';
import { cacheInvalidation, useCacheInvalidation } from '../utils/cacheInvalidation';

// Função de retry com backoff exponencial
const supabaseWithRetry = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 3
): Promise<{ success: boolean; data?: T; error?: any }> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 [${operationName}] Tentativa ${attempt}/${maxRetries}`);
      const result = await operation();
      console.log(`✅ [${operationName}] Sucesso na tentativa ${attempt}`);
      return { success: true, data: result };
    } catch (error) {
      console.error(`❌ [${operationName}] Erro na tentativa ${attempt}:`, error);
      
      if (attempt === maxRetries) {
        return { success: false, error };
      }
      
      // Backoff exponencial: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000;
      console.log(`⏳ [${operationName}] Aguardando ${delay}ms antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return { success: false, error: new Error('Max retries exceeded') };
};

export const useArticlesWithCache = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<'loading' | 'cache' | 'network' | 'error'>('loading');
  
  // Refs para evitar re-renders desnecessários
  const lastFetchTime = useRef<number>(0);
  const isInitialized = useRef<boolean>(false);
  
  // Hooks de monitoramento
  const { logPerformance } = useCacheMetrics();
  const { onInvalidation } = useCacheInvalidation();
  
  // Listener para invalidações automáticas
  useEffect(() => {
    const unsubscribe = onInvalidation((event) => {
      console.log(`🔄 [useArticlesWithCache] Cache invalidated:`, event);
      // Re-fetch apenas se necessário
      if (event.entityType === 'article' || event.entityType === 'category') {
        fetchData(true); // Force refresh
      }
    });
    
    return unsubscribe;
  }, []);
  
  // Buscar artigos com cache híbrido
  const fetchArticles = useCallback(async (forceRefresh: boolean = false): Promise<Article[]> => {
    const cacheKey = CacheKeys.ARTICLES_LIST;
    
    try {
      // Tentar cache primeiro (se não for refresh forçado)
      if (!forceRefresh) {
        const cached = await hybridCache.get<Article[]>(cacheKey);
        if (cached.data) {
          console.log(`🟢 [useArticlesWithCache] Articles from ${cached.source} cache`);
          setCacheStatus('cache');
          return cached.data;
        }
      }
      
      console.log(`🌐 [useArticlesWithCache] Fetching articles from Supabase...`);
      setCacheStatus('network');
      
      // Função para buscar com retry
      const fetchWithRetry = async () => {
        // Tentar primeiro com cliente normal
        const normalResult = await supabaseWithRetry(
          async () => {
            const articlesResult = await supabase
              .from('articles')
              .select(`
                *,
                category:categories (
                  id,
                  name,
                  slug,
                  description
                )
              `)
              .order('created_at', { ascending: false });
            
            if (articlesResult.error || !articlesResult.data) {
              throw new Error(articlesResult.error?.message || 'Failed to fetch articles');
            }

            // Buscar métricas para cada artigo
            const articlesWithMetrics = await Promise.all(
              articlesResult.data.map(async (article) => {
                try {
                  const { data: metrics } = await supabase
                    .rpc('get_article_metrics', { article_id_param: article.id });
                  
                  if (metrics && metrics.length > 0) {
                    const metric = metrics[0];
                    return {
                      ...article,
                      positive_feedback: metric.positive_feedback || 0,
                      negative_feedback: metric.negative_feedback || 0,
                      total_comments: metric.total_comments || 0,
                      approval_rate: metric.approval_rate || 0
                    };
                  }
                  
                  return {
                    ...article,
                    positive_feedback: 0,
                    negative_feedback: 0,
                    total_comments: 0,
                    approval_rate: 0
                  };
                } catch (error) {
                  console.warn('⚠️ Erro ao buscar métricas para artigo:', article.id, error);
                  return {
                    ...article,
                    positive_feedback: 0,
                    negative_feedback: 0,
                    total_comments: 0,
                    approval_rate: 0
                  };
                }
              })
            );

            return articlesWithMetrics;
          },
          'Fetch Articles (Normal Client)'
        );

        if (normalResult.success && normalResult.data) {
          return normalResult.data;
        }

        // Se falhou com cliente normal, retornar erro
        throw new Error(normalResult.error?.message || 'Failed to fetch articles');
      };

      const articlesData = await fetchWithRetry();
      
      // Salvar no cache híbrido
      await hybridCache.set(cacheKey, articlesData);
      
      console.log(`✅ [useArticlesWithCache] Articles fetched and cached:`, articlesData.length);
      setCacheStatus('network');
      
      return articlesData;
    } catch (err) {
      console.error('❌ [useArticlesWithCache] Error fetching articles:', err);
      setCacheStatus('error');
      throw err;
    }
  }, []);

  // Buscar categorias com cache híbrido
  const fetchCategories = useCallback(async (forceRefresh: boolean = false): Promise<Category[]> => {
    const cacheKey = CacheKeys.CATEGORIES_LIST;
    
    try {
      // Tentar cache primeiro (se não for refresh forçado)
      if (!forceRefresh) {
        const cached = await hybridCache.get<Category[]>(cacheKey);
        if (cached.data) {
          console.log(`🟢 [useArticlesWithCache] Categories from ${cached.source} cache`);
          return cached.data;
        }
      }
      
      console.log(`🌐 [useArticlesWithCache] Fetching categories from Supabase...`);
      
      // Função para buscar categorias com retry
      const fetchWithRetry = async () => {
        // Tentar primeiro com cliente normal
        const normalResult = await supabaseWithRetry(
          async () => {
            const response = await supabase
              .from('categories')
              .select('*')
              .order('name', { ascending: true });
              
            if (response.error || !response.data) {
              throw new Error(response.error?.message || 'Failed to fetch categories');
            }
            
            return response.data;
          },
          'Fetch Categories (Normal Client)'
        );

        if (normalResult.success && normalResult.data) {
          return normalResult.data;
        }

        // Se falhou com cliente normal, retornar erro
        throw new Error(normalResult.error?.message || 'Failed to fetch categories');
      };

      const categoriesData = await fetchWithRetry();
      
      // Salvar no cache híbrido
      await hybridCache.set(cacheKey, categoriesData);
      
      console.log(`✅ [useArticlesWithCache] Categories fetched and cached:`, categoriesData.length);
      
      return categoriesData;
    } catch (err) {
      console.error('❌ [useArticlesWithCache] Error fetching categories:', err);
      throw err;
    }
  }, []);

  // Função principal para buscar dados
  const fetchData = useCallback(async (forceRefresh: boolean = false) => {
    // Evitar múltiplas chamadas simultâneas
    const now = Date.now();
    if (!forceRefresh && now - lastFetchTime.current < 1000) {
      console.log('🚫 [useArticlesWithCache] Skipping fetch - too soon');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      lastFetchTime.current = now;
      
      console.log(`🚀 [useArticlesWithCache] Starting data fetch (force: ${forceRefresh})`);
      
      // Buscar dados em paralelo
      const [articlesData, categoriesData] = await Promise.all([
        fetchArticles(forceRefresh),
        fetchCategories(forceRefresh)
      ]);
      
      setArticles(articlesData || []);
      setCategories(categoriesData || []);
      
      // Log de performance
      logPerformance();
      
      console.log(`✅ [useArticlesWithCache] Data fetch completed:`, {
        articles: articlesData?.length || 0,
        categories: categoriesData?.length || 0,
        cacheStatus
      });
    } catch (err) {
      console.error('❌ [useArticlesWithCache] Error in fetchData:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setCacheStatus('error');
    } finally {
      setLoading(false);
    }
  }, [fetchArticles, fetchCategories, logPerformance, cacheStatus]);

  // Inicialização automática
  useEffect(() => {
    if (!isInitialized.current) {
      console.log('🚀 [useArticlesWithCache] Initializing...');
      isInitialized.current = true;
      fetchData();
    }
  }, [fetchData]);

  // Função de refresh manual
  const refresh = useCallback(async () => {
    console.log('🔄 [useArticlesWithCache] Manual refresh requested');
    await fetchData(true);
  }, [fetchData]);

  // Função para invalidar cache manualmente
  const invalidateCache = useCallback(async () => {
    console.log('🗑️ [useArticlesWithCache] Manual cache invalidation');
    await hybridCache.invalidatePattern('articles');
    await hybridCache.invalidatePattern('categories');
    await fetchData(true);
  }, [fetchData]);

  return {
    // Dados
    articles,
    categories,
    
    // Estados
    loading,
    error,
    cacheStatus,
    
    // Contadores
    articlesCount: articles.length,
    categoriesCount: categories.length,
    
    // Ações
    refresh,
    invalidateCache,
    
    // Utilitários
    isFromCache: cacheStatus === 'cache',
    isFromNetwork: cacheStatus === 'network',
    hasError: cacheStatus === 'error'
  };
};