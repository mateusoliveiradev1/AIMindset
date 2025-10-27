/**
 * Hook otimizado com Cache Híbrido - Fase 1 OTIMIZADO
 * 
 * FUNCIONALIDADES:
 * - Cache híbrido L1 (memória) + L2 (IndexedDB)
 * - Fallback automático para Supabase
 * - Zero impacto nas operações CRUD do admin
 * - Invalidação automática inteligente
 * - Prefetch inteligente baseado em comportamento
 * - Performance melhorada sem quebrar funcionalidades
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Article, Category } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { hybridCache, CacheKeys, useCacheMetrics } from '../utils/hybridCache';
import { cacheInvalidation, useCacheInvalidation } from '../utils/cacheInvalidation';

// Interface para prefetch inteligente
interface PrefetchConfig {
  enabled: boolean;
  maxConcurrent: number;
  delayMs: number;
  relatedArticlesCount: number;
}

// Configuração padrão do prefetch
const DEFAULT_PREFETCH_CONFIG: PrefetchConfig = {
  enabled: true,
  maxConcurrent: 3,
  delayMs: 2000,
  relatedArticlesCount: 5
};

// Sistema de prefetch inteligente
class SmartPrefetchManager {
  private prefetchQueue: Set<string> = new Set();
  private prefetchingNow: Set<string> = new Set();
  private config: PrefetchConfig;
  private userBehavior: Map<string, number> = new Map(); // Track user interactions
  
  constructor(config: PrefetchConfig = DEFAULT_PREFETCH_CONFIG) {
    this.config = config;
  }
  
  // Registrar interação do usuário (para aprender padrões)
  recordUserInteraction(articleId: string, interactionType: 'view' | 'click' | 'scroll'): void {
    if (!this.config.enabled) return;
    
    const key = `${articleId}_${interactionType}`;
    const current = this.userBehavior.get(key) || 0;
    this.userBehavior.set(key, current + 1);
    
    // Limitar histórico para evitar vazamento de memória
    if (this.userBehavior.size > 1000) {
      const entries = Array.from(this.userBehavior.entries());
      entries.sort((a, b) => b[1] - a[1]); // Ordenar por frequência
      this.userBehavior.clear();
      entries.slice(0, 500).forEach(([key, value]) => {
        this.userBehavior.set(key, value);
      });
    }
  }
  
  // Calcular score de relevância para prefetch
  private calculateRelevanceScore(article: Article, currentArticle?: Article): number {
    let score = 0;
    
    // Score base por interações do usuário
    const viewScore = this.userBehavior.get(`${article.id}_view`) || 0;
    const clickScore = this.userBehavior.get(`${article.id}_click`) || 0;
    score += viewScore * 1 + clickScore * 3;
    
    // Bonus se for da mesma categoria
    if (currentArticle && article.category_id === currentArticle.category_id) {
      score += 10;
    }
    
    // Bonus por artigos recentes
    const daysSinceCreated = (Date.now() - new Date(article.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated < 7) score += 5;
    if (daysSinceCreated < 1) score += 10;
    
    // Bonus por artigos populares (baseado em métricas)
    if (article.positive_feedback > 5) score += 5;
    if (article.total_comments > 3) score += 3;
    
    return score;
  }
  
  // Prefetch inteligente de artigos relacionados
  async prefetchRelatedArticles(currentArticle: Article, allArticles: Article[]): Promise<void> {
    if (!this.config.enabled || this.prefetchingNow.size >= this.config.maxConcurrent) {
      return;
    }
    
    console.log(`🧠 [Smart Prefetch] Analyzing related articles for: ${currentArticle.title}`);
    
    // Filtrar e ordenar artigos por relevância
    const candidates = allArticles
      .filter(article => 
        article.id !== currentArticle.id && 
        !this.prefetchQueue.has(article.id) &&
        !this.prefetchingNow.has(article.id)
      )
      .map(article => ({
        article,
        score: this.calculateRelevanceScore(article, currentArticle)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, this.config.relatedArticlesCount);
    
    if (candidates.length === 0) {
      console.log(`🧠 [Smart Prefetch] No candidates found for prefetch`);
      return;
    }
    
    console.log(`🧠 [Smart Prefetch] Found ${candidates.length} candidates:`, 
      candidates.map(c => ({ id: c.article.id, title: c.article.title, score: c.score }))
    );
    
    // Agendar prefetch com delay
    setTimeout(() => {
      this.executePrefetch(candidates.map(c => c.article));
    }, this.config.delayMs);
  }
  
  // Executar prefetch de artigos
  private async executePrefetch(articles: Article[]): Promise<void> {
    const prefetchPromises = articles
      .slice(0, this.config.maxConcurrent)
      .map(async (article) => {
        if (this.prefetchingNow.has(article.id)) return;
        
        this.prefetchingNow.add(article.id);
        
        try {
          const cacheKey = CacheKeys.ARTICLE_BY_ID(article.id);
          
          // Verificar se já está em cache
          const cached = await hybridCache.get(cacheKey);
          if (cached.hit) {
            console.log(`🧠 [Smart Prefetch] Article ${article.id} already cached`);
            return;
          }
          
          console.log(`🧠 [Smart Prefetch] Prefetching article: ${article.title}`);
          
          // Buscar dados completos do artigo
          const { data: fullArticle, error } = await supabase
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
            .eq('id', article.id)
            .single();
          
          if (error || !fullArticle) {
            console.warn(`⚠️ [Smart Prefetch] Failed to prefetch article ${article.id}:`, error);
            return;
          }
          
          // Buscar métricas
          try {
            const { data: metrics } = await supabase
              .rpc('get_article_metrics', { article_id_param: article.id });
            
            if (metrics && metrics.length > 0) {
              const metric = metrics[0];
              fullArticle.positive_feedback = metric.positive_feedback || 0;
              fullArticle.negative_feedback = metric.negative_feedback || 0;
              fullArticle.total_comments = metric.total_comments || 0;
              fullArticle.approval_rate = metric.approval_rate || 0;
            }
          } catch (metricsError) {
            console.warn(`⚠️ [Smart Prefetch] Failed to fetch metrics for ${article.id}:`, metricsError);
          }
          
          // Armazenar no cache com TTL menor (prefetch tem prioridade menor)
          await hybridCache.set(cacheKey, fullArticle);
          
          console.log(`✅ [Smart Prefetch] Successfully prefetched: ${article.title}`);
          
        } catch (error) {
          console.error(`❌ [Smart Prefetch] Error prefetching article ${article.id}:`, error);
        } finally {
          this.prefetchingNow.delete(article.id);
        }
      });
    
    await Promise.allSettled(prefetchPromises);
  }
  
  // Prefetch de categorias relacionadas
  async prefetchRelatedCategories(currentCategoryId: string, allCategories: Category[]): Promise<void> {
    if (!this.config.enabled) return;
    
    console.log(`🧠 [Smart Prefetch] Prefetching articles for category: ${currentCategoryId}`);
    
    try {
      const cacheKey = CacheKeys.ARTICLES_BY_CATEGORY(currentCategoryId);
      
      // Verificar se já está em cache
      const cached = await hybridCache.get(cacheKey);
      if (cached.hit) {
        console.log(`🧠 [Smart Prefetch] Category articles already cached: ${currentCategoryId}`);
        return;
      }
      
      // Buscar artigos da categoria
      const { data: categoryArticles, error } = await supabase
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
        .eq('category_id', currentCategoryId)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error || !categoryArticles) {
        console.warn(`⚠️ [Smart Prefetch] Failed to prefetch category articles:`, error);
        return;
      }
      
      // Armazenar no cache
      await hybridCache.set(cacheKey, categoryArticles);
      
      console.log(`✅ [Smart Prefetch] Prefetched ${categoryArticles.length} articles for category`);
      
    } catch (error) {
      console.error(`❌ [Smart Prefetch] Error prefetching category articles:`, error);
    }
  }
  
  // Limpar estado do prefetch
  clear(): void {
    this.prefetchQueue.clear();
    this.prefetchingNow.clear();
    this.userBehavior.clear();
  }
  
  // Obter estatísticas do prefetch
  getStats() {
    return {
      queueSize: this.prefetchQueue.size,
      prefetchingNow: this.prefetchingNow.size,
      userInteractions: this.userBehavior.size,
      config: this.config
    };
  }
}

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

export const useArticlesWithCache = (prefetchConfig?: Partial<PrefetchConfig>) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<'loading' | 'cache' | 'network' | 'error'>('loading');
  
  // Refs para evitar re-renders desnecessários
  const lastFetchTime = useRef<number>(0);
  const isInitialized = useRef<boolean>(false);
  const prefetchManager = useRef<SmartPrefetchManager>(
    new SmartPrefetchManager({ ...DEFAULT_PREFETCH_CONFIG, ...prefetchConfig })
  );
  
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
      
      // Iniciar prefetch inteligente após carregar dados principais
      if (articlesData && articlesData.length > 0) {
        // Prefetch dos artigos mais relevantes
        const featuredArticles = articlesData
          .filter(article => article.published)
          .slice(0, 3); // Top 3 artigos
        
        featuredArticles.forEach(article => {
          prefetchManager.current.prefetchRelatedArticles(article, articlesData);
        });
      }
      
      // Log de performance
      logPerformance();
      
      console.log(`✅ [useArticlesWithCache] Data fetch completed:`, {
        articles: articlesData?.length || 0,
        categories: categoriesData?.length || 0,
        cacheStatus,
        prefetchStats: prefetchManager.current.getStats()
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
    prefetchManager.current.clear();
    await fetchData(true);
  }, [fetchData]);

  // Função para registrar interação do usuário (para prefetch inteligente)
  const recordUserInteraction = useCallback((articleId: string, interactionType: 'view' | 'click' | 'scroll') => {
    prefetchManager.current.recordUserInteraction(articleId, interactionType);
  }, []);

  // Função para prefetch manual de artigo específico
  const prefetchArticle = useCallback(async (articleId: string) => {
    const article = articles.find(a => a.id === articleId);
    if (article) {
      await prefetchManager.current.prefetchRelatedArticles(article, articles);
    }
  }, [articles]);

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
    
    // Prefetch inteligente
    recordUserInteraction,
    prefetchArticle,
    prefetchStats: prefetchManager.current.getStats(),
    
    // Utilitários
    isFromCache: cacheStatus === 'cache',
    isFromNetwork: cacheStatus === 'network',
    hasError: cacheStatus === 'error'
  };
};