import { useState, useCallback, useEffect } from 'react';
import type { Article, Category } from '../lib/supabase';
import { supabase, supabaseServiceClient } from '../lib/supabase';
import { supabaseAdmin } from '../lib/supabase-admin';
import { supabaseWithRetry } from '../utils/supabaseRetry';

export type { Article, Category };

// Debug logs para verificar conexão
console.log('🔍 useArticles: Verificando clientes Supabase...', {
  supabase: !!supabase,
  supabaseServiceClient: !!supabaseServiceClient,
  supabaseAdmin: !!supabaseAdmin
});

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
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  createArticle: (article: Omit<Article, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateArticle: (id: string, article: Partial<Article>) => Promise<boolean>;
  updateArticlePublished: (id: string, published: boolean) => Promise<boolean>; // 🚨 FUNÇÃO DE EMERGÊNCIA
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const fetchArticles = useCallback(async () => {
    try {
      console.log('🔄 [useArticles] Buscando artigos do Supabase...');
      console.log('🌍 [useArticles] Environment check:', {
        url: import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET',
        key: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'
      });
      setLoading(true);
      setError(null);
      
      // Função para buscar artigos com retry
      const fetchWithRetry = async () => {
        console.log('🔍 [DEBUG] Iniciando fetchWithRetry...');
        
        // Tentar primeiro com cliente normal
        const normalResult = await supabaseWithRetry(
          async () => {
            console.log('🔍 [DEBUG] Executando query com cliente normal...');
            
            // Primeiro buscar os artigos
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
              return articlesResult;
            }

            // Buscar métricas para cada artigo usando a função get_article_metrics
            const articlesWithMetrics = await Promise.all(
              articlesResult.data.map(async (article) => {
                try {
                  console.log(`🎯 [DEBUG CRÍTICO] Chamando get_article_metrics para "${article.title}" (ID: ${article.id})`);
                  
                  const { data: metrics, error: metricsError } = await supabase
                    .rpc('get_article_metrics', { target_article_id: article.id });
                  
                  console.log(`🔍 [DEBUG CRÍTICO] Resultado RPC para "${article.title}":`, {
                    id: article.id,
                    metrics_raw: metrics,
                    metrics_length: metrics?.length || 0,
                    error: metricsError,
                    error_message: metricsError?.message,
                    error_details: metricsError?.details
                  });
                  
                  if (metricsError) {
                    console.error(`❌ [DEBUG CRÍTICO] ERRO na RPC para "${article.title}":`, metricsError);
                    throw metricsError;
                  }
                  
                  if (metrics && metrics.length > 0) {
                    const metric = metrics[0];
                    const processedArticle = {
                      ...article,
                      positive_feedback: Number(metric.positive_feedback) || 0,
                      negative_feedback: Number(metric.negative_feedback) || 0,
                      total_comments: Number(metric.total_comments) || 0,
                      approval_rate: Number(metric.approval_rate) || 0
                    };
                    
                    console.log(`✅ [DEBUG CRÍTICO] Artigo COM métricas "${article.title}":`, {
                      positive_feedback: processedArticle.positive_feedback,
                      negative_feedback: processedArticle.negative_feedback,
                      total_comments: processedArticle.total_comments,
                      approval_rate: processedArticle.approval_rate,
                      calculated_rate: processedArticle.positive_feedback + processedArticle.negative_feedback > 0 ? 
                        (processedArticle.positive_feedback / (processedArticle.positive_feedback + processedArticle.negative_feedback)) * 100 : 0,
                      raw_metric: metric
                    });
                    
                    return processedArticle;
                  }
                  
                  // Se não há métricas, usar valores padrão
                  const defaultArticle = {
                    ...article,
                    positive_feedback: 0,
                    negative_feedback: 0,
                    total_comments: 0,
                    approval_rate: 0
                  };
                  
                  console.log(`⚠️ [DEBUG CRÍTICO] Artigo SEM métricas "${article.title}":`, {
                    positive_feedback: 0,
                    negative_feedback: 0,
                    total_comments: 0,
                    approval_rate: 0,
                    reason: 'metrics array empty or null'
                  });
                  
                  return defaultArticle;
                } catch (error) {
                  console.error(`❌ [DEBUG CRÍTICO] ERRO ao buscar métricas para "${article.title}":`, error);
                  // Em caso de erro, usar valores padrão
                  const errorArticle = {
                    ...article,
                    positive_feedback: 0,
                    negative_feedback: 0,
                    total_comments: 0,
                    approval_rate: 0
                  };
                  
                  console.log(`❌ [DEBUG CRÍTICO] Artigo com ERRO "${article.title}":`, {
                    error: error.message,
                    fallback_values: { positive_feedback: 0, negative_feedback: 0, approval_rate: 0 }
                  });
                  
                  return errorArticle;
                }
              })
            );

            console.log('🔍 [DEBUG CRÍTICO] RESUMO FINAL - Todos os artigos processados:', 
              articlesWithMetrics.map(a => ({
                title: a.title,
                id: a.id,
                approval_rate: a.approval_rate,
                positive_feedback: a.positive_feedback,
                negative_feedback: a.negative_feedback,
                total_comments: a.total_comments,
                created_at: a.created_at
              }))
            );

            return {
              ...articlesResult,
              data: articlesWithMetrics
            };
          },
          'Fetch Articles (Normal Client)'
        );

        console.log('🔍 [DEBUG] normalResult completo:', normalResult);
        console.log('🔍 [DEBUG] normalResult.success:', normalResult.success);
        console.log('🔍 [DEBUG] normalResult.data:', normalResult.data);

        // Se deu certo com cliente normal, usar os dados
        if (normalResult.success && normalResult.data) {
          console.log('✅ [DEBUG] Usando dados do cliente normal');
          return normalResult;
        }

        // Se falhou com cliente normal, tentar com admin
        if (!normalResult.success) {
          console.log('🔄 [useArticles] Tentando com cliente admin...');
        }

        const adminResult = await supabaseWithRetry(
          async () => {
            // Primeiro buscar os artigos com admin client
            const articlesResult = await supabaseAdmin
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
              return articlesResult;
            }

            // Buscar métricas para cada artigo usando a função get_article_metrics
            const articlesWithMetrics = await Promise.all(
              articlesResult.data.map(async (article) => {
                try {
                  const { data: metrics } = await supabaseAdmin
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
                  
                  // Se não há métricas, usar valores padrão
                  return {
                    ...article,
                    positive_feedback: 0,
                    negative_feedback: 0,
                    total_comments: 0,
                    approval_rate: 0
                  };
                } catch (error) {
                  console.warn('⚠️ Erro ao buscar métricas para artigo (admin):', article.id, error);
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

            return {
              ...articlesResult,
              data: articlesWithMetrics
            };
          },
          'Fetch Articles (Admin Client)'
        );

        console.log('🔍 [DEBUG] adminResult completo:', adminResult);
        console.log('🔍 [DEBUG] adminResult.success:', adminResult.success);
        console.log('🔍 [DEBUG] adminResult.data:', adminResult.data);

        return adminResult;
      };

      const result = await fetchWithRetry();
      console.log('🔍 [DEBUG] Resultado final de fetchWithRetry:', result);

      if (!result.success || result.error) {
        console.error('❌ [useArticles] Erro ao buscar artigos:', result.error);
        setError(result.error?.message || 'Erro ao carregar artigos');
        return;
      }

      if (!result.data || (result.data as Article[]).length === 0) {
        console.warn('⚠️ [useArticles] Nenhum artigo encontrado no banco');
        setArticles([]);
        return;
      }

      console.log('✅ [useArticles] Artigos carregados com sucesso:', (result.data as Article[]).length);
      setArticles(result.data as Article[] || []);
    } catch (err) {
      console.error('❌ Error fetching articles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      console.log('🔄 [useArticles] Buscando categorias do Supabase...');
      console.log('🔍 [DEBUG] Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('🔍 [DEBUG] Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
      
      // Função para buscar categorias com retry
      const fetchWithRetry = async () => {
        // Tentar primeiro com cliente normal
        const normalResult = await supabaseWithRetry(
          async () => {
            const response = await supabase
              .from('categories')
              .select('*')
              .order('name', { ascending: true });
            console.log('🔍 [DEBUG] Categories response (normal):', response);
            return response;
          },
          'Fetch Categories (Normal Client)'
        );

        if (normalResult.success && normalResult.data) {
          return { data: normalResult.data, error: null };
        }

        // Se falhou com cliente normal, tentar com admin
        console.warn('⚠️ [useArticles] Tentando categorias com supabaseAdmin...');
        const adminResult = await supabaseWithRetry(
          () => supabaseAdmin
            .from('categories')
            .select('*')
            .order('name', { ascending: true }),
          'Fetch Categories (Admin Client)'
        );

        console.log('🔍 [DEBUG] Categories response (admin):', adminResult);

        return { 
          data: adminResult.data, 
          error: adminResult.error || normalResult.error 
        };
      };

      const { data, error: fetchError } = await fetchWithRetry();

      if (fetchError) {
        console.error('❌ Error fetching categories:', fetchError);
        setError(fetchError.message || 'Erro ao carregar categorias');
        return;
      }

      if (!data || (data as Category[]).length === 0) {
        console.warn('⚠️ [useArticles] Nenhuma categoria encontrada no banco');
        console.log('🔍 [DEBUG] Data received:', data);
        setCategories([]);
        return;
      }

      console.log('✅ [useArticles] Categorias carregadas com sucesso:', (data as Category[])?.length || 0);
      console.log('📋 [useArticles] Categorias:', (data as Category[])?.map(cat => ({ id: cat.id, name: cat.name, slug: cat.slug })));
      setCategories((data as Category[]) || []);
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
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

  // Inicializar dados do Supabase
  useEffect(() => {
    console.log('🚀 [useArticles] useEffect executado - iniciando carregamento de dados');
    console.log('🔍 [useArticles] Estado inicial:', { loading, articles: articles.length, categories: categories.length });
    
    // Chamar as funções diretamente para garantir que executem
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchArticles(), fetchCategories()]);
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [fetchArticles, fetchCategories]);

  const createArticle = async (articleData: Omit<Article, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    try {
      setError(null);
      
      // 🔥 LOGS EXTREMOS PARA DEBUG - DESABILITADOS
      // console.log('🚀🚀🚀 INÍCIO - Processo de criação de artigo');
      // console.log('📊 DADOS RECEBIDOS:', {
      //   title: articleData.title,
      //   excerpt: articleData.excerpt?.substring(0, 100) + '...',
      //   contentLength: articleData.content?.length || 0,
      //   category_id: articleData.category_id,
      //   author_id: articleData.author_id,
      //   published: articleData.published,
      //   tags: articleData.tags
      // });
      
      // console.log('📊 TAMANHOS DETALHADOS:');
      // console.log('- Conteúdo:', articleData.content?.length || 0, 'caracteres');
      // console.log('- Título:', articleData.title?.length || 0, 'caracteres');
      // console.log('- Excerpt:', articleData.excerpt?.length || 0, 'caracteres');
      // console.log('- Tags:', JSON.stringify(articleData.tags).length, 'caracteres');
      
      const totalDataSize = JSON.stringify(articleData).length;
      // console.log('📊 TAMANHO TOTAL DOS DADOS:', totalDataSize, 'bytes');
      // console.log('📊 TAMANHO TOTAL EM KB:', Math.round(totalDataSize / 1024), 'KB');
      
      // Verificar se os dados são muito grandes
      if (totalDataSize > 1024 * 1024) { // 1MB
        console.warn('⚠️ AVISO: Dados muito grandes (>1MB)');
      }
      
      // Gerar slug único a partir do título
      // console.log('🔗 Gerando slug único...');
      const baseSlug = generateSlug(articleData.title);
      // console.log('🔗 Base slug:', baseSlug);
      
      const uniqueSlug = await ensureUniqueSlug(baseSlug);
      // console.log('🔗 Slug único gerado:', uniqueSlug);
      
      const articleWithSlug = { 
        ...articleData, 
        slug: uniqueSlug 
      };
      
      const finalDataSize = JSON.stringify(articleWithSlug).length;
      // console.log('📝 DADOS FINAIS PARA INSERÇÃO:');
      // console.log('- Título:', articleWithSlug.title);
      // console.log('- Slug:', articleWithSlug.slug);
      // console.log('- Tamanho do conteúdo:', articleWithSlug.content?.length || 0, 'caracteres');
      // console.log('- Category ID:', articleWithSlug.category_id);
      // console.log('- Author ID:', articleWithSlug.author_id);
      // console.log('- Published:', articleWithSlug.published);
      // console.log('- Tags:', articleWithSlug.tags);
      // console.log('- Tamanho final dos dados:', finalDataSize, 'bytes');
      // console.log('- Tamanho final em KB:', Math.round(finalDataSize / 1024), 'KB');
      
      // console.log('⏱️ INICIANDO INSERÇÃO NO SUPABASE...');
      // console.log('🔧 Cliente Supabase:', supabaseServiceClient ? 'Configurado' : 'NÃO CONFIGURADO');
      
      const startTime = Date.now();
      // console.log('⏱️ Timestamp de início:', new Date(startTime).toISOString());
      
      // SOLUÇÃO DEFINITIVA: Separar published da inserção principal
      const { published, ...articleDataWithoutPublished } = articleWithSlug;
      
      // PRIMEIRA INSERÇÃO - Todos os campos EXCETO published
      const { data, error: insertError } = await supabaseServiceClient
        .from('articles')
        .insert([articleDataWithoutPublished])
        .select()
        .single();

      if (insertError) {
        console.error('❌ ERRO na inserção principal:', insertError);
        throw insertError;
      }

      // SEGUNDA QUERY - Atualizar APENAS o campo published se necessário
      if (published !== undefined && data?.id) {
        console.log('🔧 Atualizando campo published no artigo criado:', published);
        
        const { error: publishedError } = await supabaseServiceClient
          .from('articles')
          .update({ published: Boolean(published) })
          .eq('id', data.id);

        if (publishedError) {
          console.error('❌ ERRO na atualização do published:', publishedError);
          throw publishedError;
        }
        
        console.log('✅ Campo published atualizado com sucesso no artigo criado');
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // console.log('⏱️ INSERÇÃO CONCLUÍDA:');
      // console.log('- Timestamp de fim:', new Date(endTime).toISOString());
      // console.log('- Duração total:', duration, 'ms');
      // console.log('- Duração em segundos:', Math.round(duration / 1000), 's');

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

      // console.log('✅✅✅ ARTIGO SALVO COM SUCESSO!');
      // console.log('- ID do artigo:', data?.id);
      // console.log('- Slug final:', data?.slug);
      // console.log('- Dados retornados:', data);
      
      // console.log('🔄 ATUALIZANDO LISTA DE ARTIGOS...');
      await fetchArticles();
      // console.log('✅ LISTA DE ARTIGOS ATUALIZADA!');
      
      // console.log('🎉🎉🎉 PROCESSO CONCLUÍDO COM SUCESSO TOTAL!');
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
      
      console.log('🚀 SOLUÇÃO ULTRA SIMPLES - ID recebido:', id);
      console.log('🚀 Tipo do ID:', typeof id);
      console.log('🚀 ID válido?', !!id && id.trim() !== '');
      console.log('🚀 DADOS RECEBIDOS:', JSON.stringify(articleData, null, 2));
      
      // Validação básica
      if (!id || id.trim() === '') {
        console.error('❌ ID inválido:', id);
        throw new Error('ID do artigo é obrigatório');
      }

      // Preparar dados ULTRA SIMPLES - INCLUINDO PUBLISHED
      const updateData: any = {};
      
      // Copiar TODOS os campos de forma simples
      if (articleData.title !== undefined) updateData.title = articleData.title;
      if (articleData.excerpt !== undefined) updateData.excerpt = articleData.excerpt;
      if (articleData.content !== undefined) updateData.content = articleData.content;
      if (articleData.image_url !== undefined) updateData.image_url = articleData.image_url;
      if (articleData.category_id !== undefined) updateData.category_id = articleData.category_id;
      if (articleData.author_id !== undefined) updateData.author_id = articleData.author_id;
      if (articleData.slug !== undefined) updateData.slug = articleData.slug;
      if (articleData.tags !== undefined) updateData.tags = articleData.tags;
      
      // 🚨 EMERGÊNCIA: REMOVER PUBLISHED COMPLETAMENTE DA FUNÇÃO PRINCIPAL
      // O campo published será tratado em função separada para evitar erro 42883
      console.log('🚨 PUBLISHED REMOVIDO DA FUNÇÃO PRINCIPAL - será tratado separadamente');
      
      // Gerar slug se título foi alterado
      if (updateData.title) {
        const baseSlug = generateSlug(updateData.title);
        updateData.slug = await ensureUniqueSlug(baseSlug, id);
        console.log('🔗 Slug gerado:', updateData.slug);
      }
      
      console.log('🔧 DADOS FINAIS PARA UPDATE:', JSON.stringify(updateData, null, 2));
      console.log('🔧 Quantidade de campos a atualizar:', Object.keys(updateData).length);
      
      // UMA QUERY SIMPLES - SEM COMPLICAÇÕES
      console.log('🚀 Executando query de atualização...');
      const { data, error: updateError } = await supabase
        .from('articles')
        .update(updateData)
        .eq('id', id)
        .select();

      console.log('🔍 Resultado da query:', { data, error: updateError });

      if (updateError) {
        console.error('❌ ERRO na query:', updateError);
        throw updateError;
      }

      if (!data || data.length === 0) {
        console.error('❌ NENHUM ARTIGO ATUALIZADO - Verificando se ID existe...');
        
        // Verificar se o artigo existe
        const { data: checkData, error: checkError } = await supabase
          .from('articles')
          .select('id, title')
          .eq('id', id);
          
        console.log('🔍 Verificação de existência:', { checkData, checkError });
        
        if (checkError) {
          console.error('❌ Erro ao verificar existência:', checkError);
          throw new Error(`Erro ao verificar artigo: ${checkError.message}`);
        }
        
        if (!checkData || checkData.length === 0) {
          console.error('❌ Artigo não existe com ID:', id);
          throw new Error(`Artigo não encontrado com ID: ${id}`);
        }
        
        console.error('❌ Artigo existe mas não foi atualizado - dados:', checkData);
        throw new Error('Falha na atualização - artigo existe mas não foi modificado');
      }

      console.log('✅ SUCESSO! Artigos atualizados:', data.length);
      console.log('✅ Dados atualizados:', data[0]);

      console.log('🔄 Atualizando lista de artigos...');
      await fetchArticles();
      console.log('✅ PROCESSO COMPLETO - Artigo atualizado com sucesso!');
      return true;
      
    } catch (err) {
      console.error('❌ ERRO ao atualizar artigo:', err);
      setError(err instanceof Error ? err.message : 'Failed to update article');
      return false;
    }
  };

  // 🚨 FUNÇÃO DE EMERGÊNCIA PARA ATUALIZAR PUBLISHED SEM ERRO 42883
  const updateArticlePublished = async (id: string, published: boolean): Promise<boolean> => {
    console.log('🚨 EMERGÊNCIA - updateArticlePublished iniciado');
    console.log('📋 Parâmetros recebidos:', { id, published, type_id: typeof id, type_published: typeof published });
    
    // Validar ID
    if (!id || typeof id !== 'string') {
      console.error('❌ ID inválido:', id);
      return false;
    }
    
    try {
      // Log detalhado antes da chamada RPC
      console.log('🔧 Chamando RPC emergency_update_published com BOOLEAN direto:', {
        article_id: id,
        published_value: published  // BOOLEAN direto agora
      });
      
      // Usar RPC que aceita BOOLEAN direto
      const { data, error } = await supabaseServiceClient
        .rpc('emergency_update_published', {
          article_id: id,
          published_value: published  // BOOLEAN direto
        });

      console.log('📊 Resposta da RPC:', { data, error });

      if (error) {
        console.error('❌ Erro na RPC emergency_update_published:', error);
        console.error('❌ Detalhes do erro:', JSON.stringify(error, null, 2));
        throw error;
      }

      if (data === false || data === null) {
        console.error('❌ RPC retornou false/null - artigo não encontrado ou não atualizado');
        console.error('❌ Verificar se o artigo com ID existe:', id);
        return false;
      }

      console.log('✅ Published atualizado com sucesso via RPC:', data);
      return true;
    } catch (error) {
      console.error('❌ Erro geral em updateArticlePublished:', error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
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

  // Load more articles for infinite scroll
  const loadMore = useCallback(async (): Promise<void> => {
    if (!hasMore || loading) return;
    
    try {
      setLoading(true);
      const nextPage = page + 1;
      
      // Simulate pagination - in real app, you'd fetch next page from API
      // For now, just mark as no more data after first load
      setHasMore(false);
      setPage(nextPage);
    } catch (err) {
      console.error('Error loading more articles:', err);
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, page]);

  // Refresh function alias
  const refresh = useCallback(async (): Promise<void> => {
    setPage(1);
    setHasMore(true);
    await refreshArticles();
  }, [refreshArticles]);

  // Initialize data on mount
  useEffect(() => {
    refreshArticles();
  }, [refreshArticles]);

  return {
    articles,
    categories,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    createArticle,
    updateArticle,
    updateArticlePublished, // 🚨 FUNÇÃO DE EMERGÊNCIA PARA PUBLISHED
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