import { useState, useEffect, useCallback } from 'react';
import { supabase, supabaseServiceClient } from '../lib/supabase';
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
  const [loading, setLoading] = useState(true); // Changed back to true for initial load
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    try {
      setError(null);
      console.log('🔄 Tentando buscar artigos do Supabase...');

      // Verificar se o Supabase está configurado
      if (!supabase) {
        throw new Error('Supabase não está configurado');
      }

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
        console.error('❌ Error fetching articles:', fetchError);
        setError('Failed to fetch articles from database');
        
        // Fallback para dados mock
        console.log('🔄 Usando dados mock como fallback...');
        const { mockArticles } = await import('../data/mockData');
        setArticles(mockArticles || []);
        return;
      }

      console.log('✅ Artigos carregados com sucesso:', data?.length || 0);
      setArticles(data || []);
    } catch (err) {
      console.error('❌ Error fetching articles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch articles');
      
      // Fallback para dados mock em caso de erro
      try {
        console.log('🔄 Carregando dados mock como fallback...');
        const { mockArticles } = await import('../data/mockData');
        setArticles(mockArticles || []);
        console.log('✅ Dados mock carregados:', mockArticles?.length || 0);
      } catch (mockError) {
        console.error('❌ Erro ao carregar dados mock:', mockError);
      }
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
      
      // 🔥 LOGS EXTREMOS PARA DEBUG
      console.log('🚀🚀🚀 INÍCIO - Processo de criação de artigo');
      console.log('📊 DADOS RECEBIDOS:', {
        title: articleData.title,
        excerpt: articleData.excerpt?.substring(0, 100) + '...',
        contentLength: articleData.content?.length || 0,
        category_id: articleData.category_id,
        author_id: articleData.author_id,
        published: articleData.published,
        tags: articleData.tags
      });
      
      console.log('📊 TAMANHOS DETALHADOS:');
      console.log('- Conteúdo:', articleData.content?.length || 0, 'caracteres');
      console.log('- Título:', articleData.title?.length || 0, 'caracteres');
      console.log('- Excerpt:', articleData.excerpt?.length || 0, 'caracteres');
      console.log('- Tags:', JSON.stringify(articleData.tags).length, 'caracteres');
      
      const totalDataSize = JSON.stringify(articleData).length;
      console.log('📊 TAMANHO TOTAL DOS DADOS:', totalDataSize, 'bytes');
      console.log('📊 TAMANHO TOTAL EM KB:', Math.round(totalDataSize / 1024), 'KB');
      
      // Verificar se os dados são muito grandes
      if (totalDataSize > 1024 * 1024) { // 1MB
        console.warn('⚠️ AVISO: Dados muito grandes (>1MB)');
      }
      
      // Gerar slug único a partir do título
      console.log('🔗 Gerando slug único...');
      const baseSlug = generateSlug(articleData.title);
      console.log('🔗 Base slug:', baseSlug);
      
      const uniqueSlug = await ensureUniqueSlug(baseSlug);
      console.log('🔗 Slug único gerado:', uniqueSlug);
      
      const articleWithSlug = { 
        ...articleData, 
        slug: uniqueSlug 
      };
      
      const finalDataSize = JSON.stringify(articleWithSlug).length;
      console.log('📝 DADOS FINAIS PARA INSERÇÃO:');
      console.log('- Título:', articleWithSlug.title);
      console.log('- Slug:', articleWithSlug.slug);
      console.log('- Tamanho do conteúdo:', articleWithSlug.content?.length || 0, 'caracteres');
      console.log('- Category ID:', articleWithSlug.category_id);
      console.log('- Author ID:', articleWithSlug.author_id);
      console.log('- Published:', articleWithSlug.published);
      console.log('- Tags:', articleWithSlug.tags);
      console.log('- Tamanho final dos dados:', finalDataSize, 'bytes');
      console.log('- Tamanho final em KB:', Math.round(finalDataSize / 1024), 'KB');
      
      console.log('⏱️ INICIANDO INSERÇÃO NO SUPABASE...');
      console.log('🔧 Cliente Supabase:', supabaseServiceClient ? 'Configurado' : 'NÃO CONFIGURADO');
      
      const startTime = Date.now();
      console.log('⏱️ Timestamp de início:', new Date(startTime).toISOString());
      
      // Usar service role client singleton para evitar múltiplas instâncias
      const { data, error: insertError } = await supabaseServiceClient
        .from('articles')
        .insert([articleWithSlug])
        .select()
        .single();

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log('⏱️ INSERÇÃO CONCLUÍDA:');
      console.log('- Timestamp de fim:', new Date(endTime).toISOString());
      console.log('- Duração total:', duration, 'ms');
      console.log('- Duração em segundos:', Math.round(duration / 1000), 's');

      if (insertError) {
        console.error('❌❌❌ ERRO DETALHADO AO SALVAR:');
        console.error('- Código:', insertError.code);
        console.error('- Mensagem:', insertError.message);
        console.error('- Detalhes:', insertError.details);
        console.error('- Hint:', insertError.hint);
        console.error('- Erro completo:', insertError);
        
        // Verificar tipos específicos de erro
        if (insertError.code === 'PGRST116') {
          console.error('💥 ERRO: Payload muito grande para o Supabase');
        } else if (insertError.code === '22001') {
          console.error('💥 ERRO: String muito longa para o campo');
        } else if (insertError.message?.includes('timeout')) {
          console.error('💥 ERRO: Timeout na requisição');
        }
        
        throw insertError;
      }

      console.log('✅✅✅ ARTIGO SALVO COM SUCESSO!');
      console.log('- ID do artigo:', data?.id);
      console.log('- Slug final:', data?.slug);
      console.log('- Dados retornados:', data);
      
      console.log('🔄 ATUALIZANDO LISTA DE ARTIGOS...');
      await fetchArticles();
      console.log('✅ LISTA DE ARTIGOS ATUALIZADA!');
      
      console.log('🎉🎉🎉 PROCESSO CONCLUÍDO COM SUCESSO TOTAL!');
      return true;
    } catch (err) {
      console.error('❌❌❌ ERRO CRÍTICO NA CRIAÇÃO DO ARTIGO:');
      console.error('- Tipo do erro:', err?.constructor?.name || 'Desconhecido');
      console.error('- Mensagem:', err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('- Stack trace:', err instanceof Error ? err.stack : 'N/A');
      console.error('- Erro completo:', err);
      
      // Verificar se é erro de rede
      if (err instanceof TypeError && err.message.includes('fetch')) {
        console.error('💥 ERRO DE REDE: Problema de conectividade');
      }
      
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
      
      console.log('🔧 Executando query UPDATE no Supabase...');
      
      // Usar service role client singleton para evitar múltiplas instâncias
      const { data, error: updateError } = await supabaseServiceClient
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

  // Initialize data on mount
  useEffect(() => {
    refreshArticles();
  }, [refreshArticles]);

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