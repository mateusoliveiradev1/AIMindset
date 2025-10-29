import { useState, useCallback, useEffect } from 'react';
import type { Article, Category } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { hybridCache, CacheKeys } from '../utils/hybridCache';

export const useArticlesSimple = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async (forceRefresh: boolean = false) => {
    try {
      console.log('🔄 [Simple] Buscando artigos...');
      setLoading(true);
      setError(null);
      
      // Try cache first if not forcing refresh
      if (!forceRefresh) {
        const cached = await hybridCache.get<Article[]>(CacheKeys.ARTICLES_LIST);
        if (cached.data) {
          console.log(`🟢 [Simple] Using cached articles from ${cached.source}`);
          setArticles(cached.data);
          setLoading(false);
          return;
        }
      }
      
      // Buscar artigos com métricas de feedback
      const { data: articlesData, error } = await supabase
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

      if (error) {
        console.error('❌ [Simple] Erro:', error);
        setError(error.message);
        return;
      }

      if (!articlesData || articlesData.length === 0) {
        console.warn('⚠️ [Simple] Nenhum artigo encontrado');
        setArticles([]);
        return;
      }

      // Buscar métricas para cada artigo usando a função get_article_metrics
      const articlesWithMetrics = await Promise.all(
        articlesData.map(async (article) => {
          try {
            console.log(`🔍 [Simple] Buscando métricas para "${article.title}"`);
            const { data: metrics } = await supabase
              .rpc('get_article_metrics', { target_article_id: article.id });
            
            if (metrics && metrics.length > 0) {
              const metric = metrics[0];
              console.log(`✅ [Simple] Métricas encontradas para "${article.title}":`, metric);
              return {
                ...article,
                positive_feedback: metric.positive_feedback || 0,
                negative_feedback: metric.negative_feedback || 0,
                total_comments: metric.total_comments || 0,
                approval_rate: metric.approval_rate || 0
              };
            }
            
            console.log(`⚠️ [Simple] Nenhuma métrica para "${article.title}"`);
            return {
              ...article,
              positive_feedback: 0,
              negative_feedback: 0,
              total_comments: 0,
              approval_rate: 0
            };
          } catch (error) {
            console.warn(`⚠️ [Simple] Erro ao buscar métricas para "${article.title}":`, error);
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

      const data = articlesWithMetrics as Article[];

      console.log('🔍 [Simple] Resultado da query:', { data, error: null });
      
      // Cache the results
      await hybridCache.set(CacheKeys.ARTICLES_LIST, data);

      console.log('✅ [Simple] Artigos carregados:', data.length);
      setArticles(data);
    } catch (err) {
      console.error('❌ [Simple] Exceção:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async (forceRefresh: boolean = false) => {
    try {
      console.log('🔄 [Simple] Buscando categorias...');
      
      // Try cache first if not forcing refresh
      if (!forceRefresh) {
        const cached = await hybridCache.get<Category[]>(CacheKeys.CATEGORIES_LIST);
        if (cached.data) {
          console.log(`🟢 [Simple] Using cached categories from ${cached.source}`);
          setCategories(cached.data);
          return;
        }
      }
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      console.log('🔍 [Simple] Categorias resultado:', { data, error });

      if (error) {
        console.error('❌ [Simple] Erro categorias:', error);
        setError(error.message);
        return;
      }

      const categoriesData = data as Category[] || [];
      
      // Cache the results
      await hybridCache.set(CacheKeys.CATEGORIES_LIST, categoriesData);

      console.log('✅ [Simple] Categorias carregadas:', categoriesData.length);
      setCategories(categoriesData);
    } catch (err) {
      console.error('❌ [Simple] Exceção categorias:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  }, []);

  useEffect(() => {
    console.log('🚀 [Simple] Iniciando carregamento...');
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchArticles(), fetchCategories()]);
      } catch (error) {
        console.error('❌ [Simple] Erro no carregamento:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [fetchArticles, fetchCategories]);

  return {
    articles,
    categories,
    loading,
    error,
    articlesCount: articles.length,
    categoriesCount: categories.length,
    refresh: async () => {
      console.log('🔄 [Simple] Forçando refresh...');
      setLoading(true);
      try {
        // Limpar cache antes de buscar dados frescos
        await hybridCache.delete(CacheKeys.ARTICLES_LIST);
        await hybridCache.delete(CacheKeys.CATEGORIES_LIST);
        await Promise.all([fetchArticles(true), fetchCategories(true)]);
      } finally {
        setLoading(false);
      }
    }
  };
};