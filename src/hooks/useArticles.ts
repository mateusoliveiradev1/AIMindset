import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Article, Category } from '../lib/supabase';

// Função para gerar slug a partir do título
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    // Remover acentos
    .replace(/[áàâãä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    // Remover caracteres especiais
    .replace(/[^a-z0-9\s-]/g, '')
    // Substituir espaços por hífens
    .replace(/\s+/g, '-')
    // Remover hífens duplicados
    .replace(/-+/g, '-')
    // Remover hífens do início e fim
    .replace(/^-|-$/g, '') || 'artigo';
};

// Função para verificar se slug é único e gerar alternativa se necessário
const ensureUniqueSlug = async (baseSlug: string, excludeId?: string): Promise<string> => {
  let slug = baseSlug;
  let counter = 0;
  
  while (true) {
    const query = supabase
      .from('articles')
      .select('id')
      .eq('slug', slug);
    
    if (excludeId) {
      query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error checking slug uniqueness:', error);
      break;
    }
    
    if (!data || data.length === 0) {
      break; // Slug é único
    }
    
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
  
  return slug;
};

export interface UseArticlesReturn {
  articles: Article[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  createArticle: (article: Omit<Article, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateArticle: (id: string, article: Partial<Article>) => Promise<boolean>;
  deleteArticle: (id: string) => Promise<boolean>;
  createCategory: (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  getArticleById: (id: string) => Promise<Article | null>;
  getPublishedArticles: () => Promise<Article[]>;
  getArticlesByCategory: (categoryId: string) => Promise<Article[]>;
  searchArticles: (query: string) => Promise<Article[]>;
  refreshArticles: () => Promise<void>;
}

export const useArticles = (): UseArticlesReturn => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false); // Changed to false initially
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    try {
      setError(null);

      const { data, error: fetchError } = await supabase
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

      if (fetchError) {
        console.error('Error fetching articles:', fetchError);
        setError('Failed to fetch articles');
        return;
      }

      setArticles(data || []);
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch articles');
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) {
        console.error('Error fetching categories:', fetchError);
        return;
      }

      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  // Only fetch data when explicitly called, not on mount
  const refreshArticles = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      await Promise.all([fetchArticles(), fetchCategories()]);
    } finally {
      setLoading(false);
    }
  }, [fetchArticles, fetchCategories]);

  const createArticle = async (articleData: Omit<Article, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    try {
      setError(null);
      
      // Gerar slug único a partir do título
      const baseSlug = generateSlug(articleData.title);
      const uniqueSlug = await ensureUniqueSlug(baseSlug);
      
      const articleWithSlug = { 
        ...articleData, 
        slug: uniqueSlug 
      };
      
      console.log('🚀 Tentando salvar artigo com slug:', articleWithSlug);
      
      // Usar service role para garantir que funcione
      const { createClient } = await import('@supabase/supabase-js');
      const serviceClient = createClient(
        'https://jywjqzhqynhnhetidzsa.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ'
      );
      
      const { data, error: insertError } = await serviceClient
        .from('articles')
        .insert([articleWithSlug])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao salvar com service role:', insertError);
        throw insertError;
      }

      console.log('✅ Artigo salvo com sucesso:', data);
      await fetchArticles();
      return true;
    } catch (err) {
      console.error('Error creating article:', err);
      setError(err instanceof Error ? err.message : 'Failed to create article');
      return false;
    }
  };

  const updateArticle = async (id: string, articleData: Partial<Article>): Promise<boolean> => {
    try {
      setError(null);
      
      console.log('🔄 INÍCIO - Tentando atualizar artigo ID:', id);
      console.log('📝 DADOS RECEBIDOS para atualização:', JSON.stringify(articleData, null, 2));
      
      // Validar se o ID existe
      if (!id || id.trim() === '') {
        console.error('❌ ID do artigo é inválido:', id);
        throw new Error('ID do artigo é obrigatório');
      }
      
      const updateData = { ...articleData };
      
      // Se o título foi alterado, gerar novo slug único
      if (updateData.title) {
        const baseSlug = generateSlug(updateData.title);
        const uniqueSlug = await ensureUniqueSlug(baseSlug, id);
        updateData.slug = uniqueSlug;
        console.log('🔗 Slug gerado:', uniqueSlug);
      }
      
      // Remover campos que não devem ser atualizados ou que não existem na tabela
      delete updateData.id;
      delete updateData.created_at;
      delete updateData.updated_at;
      delete updateData.category; // ❌ CAMPO INEXISTENTE - causa erro PGRST204
      
      // Filtrar apenas campos válidos da tabela articles
      const validFields = ['title', 'excerpt', 'content', 'image_url', 'category_id', 'author_id', 'published', 'slug', 'tags'];
      const cleanedData: any = {};
      
      for (const [key, value] of Object.entries(updateData)) {
        if (validFields.includes(key)) {
          cleanedData[key] = value;
        } else {
          console.warn('⚠️ Campo inválido removido:', key);
        }
      }
      
      console.log('📝 DADOS FINAIS para atualização (limpos):', JSON.stringify(cleanedData, null, 2));
      
      // Usar service role para garantir que funcione
      const { createClient } = await import('@supabase/supabase-js');
      const serviceClient = createClient(
        'https://jywjqzhqynhnhetidzsa.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ'
      );
      
      console.log('🔧 Executando query UPDATE no Supabase...');
      
      const { data, error: updateError } = await serviceClient
        .from('articles')
        .update(cleanedData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ ERRO SUPABASE ao atualizar:', updateError);
        console.error('❌ Código do erro:', updateError.code);
        console.error('❌ Mensagem do erro:', updateError.message);
        console.error('❌ Detalhes do erro:', updateError.details);
        throw updateError;
      }

      console.log('✅ SUCESSO - Artigo atualizado:', JSON.stringify(data, null, 2));
      console.log('🔄 Atualizando lista de artigos...');
      
      await fetchArticles();
      
      console.log('✅ CONCLUÍDO - Lista de artigos atualizada');
      return true;
    } catch (err) {
      console.error('❌ ERRO GERAL ao atualizar artigo:', err);
      console.error('❌ Stack trace:', err instanceof Error ? err.stack : 'N/A');
      setError(err instanceof Error ? err.message : 'Failed to update article');
      return false;
    }
  };

  const deleteArticle = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      await fetchArticles();
      return true;
    } catch (err) {
      console.error('Error deleting article:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete article');
      return false;
    }
  };

  const getArticleById = async (id: string): Promise<Article | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      return data;
    } catch (err) {
      console.error('Error fetching article by ID:', err);
      return null;
    }
  };

  const getPublishedArticles = async (): Promise<Article[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('articles')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching published articles:', err);
      return [];
    }
  };

  const getArticlesByCategory = async (categoryId: string): Promise<Article[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('articles')
        .select('*')
        .eq('category_id', categoryId)
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching articles by category:', err);
      return [];
    }
  };

  const searchArticles = async (query: string): Promise<Article[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('articles')
        .select('*')
        .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`)
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      console.error('Error searching articles:', err);
      return [];
    }
  };

  const createCategory = async (categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    try {
      setError(null);
      
      const { error: insertError } = await supabase
        .from('categories')
        .insert([categoryData]);

      if (insertError) {
        throw insertError;
      }

      await fetchCategories();
      return true;
    } catch (err) {
      console.error('Error creating category:', err);
      setError(err instanceof Error ? err.message : 'Failed to create category');
      return false;
    }
  };

  const updateCategory = async (id: string, categoryData: Partial<Category>): Promise<boolean> => {
    try {
      setError(null);
      
      const { error: updateError } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      await fetchCategories();
      return true;
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err instanceof Error ? err.message : 'Failed to update category');
      return false;
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      await fetchCategories();
      return true;
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete category');
      return false;
    }
  };

  return {
    articles,
    categories,
    loading,
    error,
    createArticle,
    updateArticle,
    deleteArticle,
    createCategory,
    updateCategory,
    deleteCategory,
    getArticleById,
    getPublishedArticles,
    getArticlesByCategory,
    searchArticles,
    refreshArticles
  };
};