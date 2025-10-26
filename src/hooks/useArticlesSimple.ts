import { useState, useCallback, useEffect } from 'react';
import type { Article, Category } from '../lib/supabase';
import { supabase } from '../lib/supabase';

export const useArticlesSimple = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    try {
      console.log('🔄 [Simple] Buscando artigos...');
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
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

      console.log('🔍 [Simple] Resultado da query:', { data, error });

      if (error) {
        console.error('❌ [Simple] Erro:', error);
        setError(error.message);
        return;
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ [Simple] Nenhum artigo encontrado');
        setArticles([]);
        return;
      }

      console.log('✅ [Simple] Artigos carregados:', data.length);
      setArticles(data as Article[]);
    } catch (err) {
      console.error('❌ [Simple] Exceção:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      console.log('🔄 [Simple] Buscando categorias...');
      
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

      console.log('✅ [Simple] Categorias carregadas:', data?.length || 0);
      setCategories(data as Category[] || []);
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
      setLoading(true);
      try {
        await Promise.all([fetchArticles(), fetchCategories()]);
      } finally {
        setLoading(false);
      }
    }
  };
};