import React, { useState, useCallback, useEffect } from 'react';
import type { Article, Category } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { hybridCache, CacheKeys, setCacheKeyPrefix } from '../utils/hybridCache';
import { AdminCacheUtils } from '../utils/cacheInvalidation';
import { supabaseWithRetry } from '../utils/supabaseRetry';
import { useAutoFeedbackSync } from './useAutoFeedbackSync';
import { supabaseOptimizer } from '../utils/supabaseOptimizer';
import { useAuth } from '../contexts/AuthContext';
import { logEvent } from '../lib/logging';

export type { Article, Category };

// Debug logs para verificar conexão
console.log('🔍 useArticles: Verificando clientes Supabase...', {
  supabase: !!supabase,
  supabaseServiceClient: !!supabase,
  supabaseAdmin: 'lazy_import'
});

// Importação lazy do cliente admin para evitar múltiplas instâncias do GoTrueClient
async function getAdminClient() {
  const mod = await import('../lib/supabase-admin');
  return mod.supabaseAdmin;
}

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
      return slug;
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
  articlesCount: number;
  categoriesCount: number;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  adminUtils: typeof AdminCacheUtils;
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
  fetchHomeData: () => Promise<{ articles: Article[]; categories: Category[]; }>;
  getFeaturedArticles: () => Promise<Article[]>;
}

export const useArticles = (): UseArticlesReturn => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Prefixo de cache por user-role
  const { user } = useAuth();
  React.useEffect(() => {
    const prefix = user?.role ? String(user.role) : 'guest';
    setCacheKeyPrefix(prefix);
  }, [user?.role]);

  // Sistema 100% automático de sincronização de feedbacks
  const { forceSyncNow, isActive } = useAutoFeedbackSync();

    // Função otimizada para buscar artigos com queries seletivas
  const fetchArticlesOptimized = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar cache primeiro
      if (!forceRefresh) {
        const cached = await hybridCache.get<Article[]>(CacheKeys.ARTICLES_LIST);
        if (cached.data) {
          console.log(`🟢 [useArticles] Cache hit from ${cached.source}`);
          setArticles(cached.data);
          setLoading(false);
          return;
        }
      }

      console.log('🔄 [useArticles] Buscando artigos com query otimizada...');
      
      // Usar otimizador de queries para buscar apenas campos necessários
      const { data, error, queryTime, fromCache } = await supabaseOptimizer.getOptimizedArticles(50, 0);
      
      if (error) {
        throw new Error(`Erro ao buscar artigos: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ [useArticles] Nenhum artigo encontrado');
        setArticles([]);
        return;
      }

      // Buscar categorias relacionadas de forma otimizada
      const categoryIds = [...new Set(data.map(article => article.category_id).filter(Boolean))];
      if (categoryIds.length > 0) {
        const { data: categoriesData } = await supabaseOptimizer.optimizedQuery('categories', {
          select: ['id', 'name', 'slug', 'description'],
          filters: [{ column: 'id', operator: 'in', value: categoryIds }]
        });

        // Combinar artigos com categorias
        const articlesWithCategories = data.map(article => ({
          ...article,
          category: categoriesData?.find(cat => cat.id === article.category_id) || null
        }));

        // Cachear resultados
        await hybridCache.set(CacheKeys.ARTICLES_LIST, articlesWithCategories);
        setArticles(articlesWithCategories);
        
        console.log(`✅ [useArticles] ${articlesWithCategories.length} artigos carregados (${queryTime}ms)${fromCache ? ' [CACHE]' : ''}`);
      } else {
        // Cachear sem categorias
        await hybridCache.set(CacheKeys.ARTICLES_LIST, data);
        setArticles(data);
        
        console.log(`✅ [useArticles] ${data.length} artigos carregados (${queryTime}ms)${fromCache ? ' [CACHE]' : ''}`);
      }
    } catch (err) {
      console.error('❌ Error fetching optimized articles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cache-aware fetch articles (função original como fallback)
    const fetchArticles = useCallback(async (forceRefresh: boolean = false) => {
      try {
        setLoading(true);
        setError(null);
        
        // Try cache first if not forcing refresh
        if (!forceRefresh) {
          const cached = await hybridCache.get<Article[]>(CacheKeys.ARTICLES_LIST);
          if (cached.data) {
            console.log(`🟢 [useArticles] Using cached articles from ${cached.source}`);
            setArticles(cached.data);
            setLoading(false);
            return;
          }
        }

        console.log('🔄 [useArticles] Buscando artigos do Supabase...');
        console.log('🔍 [DEBUG] Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
        console.log('🔍 [DEBUG] Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

        // Função para buscar artigos com retry
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
                return articlesResult;
              }

              // Buscar métricas para cada artigo usando a função get_article_metrics
            const articlesWithMetrics = await Promise.all(
              articlesResult.data.map(async (article) => {
                try {
                  const { data: metrics } = await supabase
                    .rpc('get_article_metrics', { target_article_id: article.id });
                  
                  if (metrics) {
                    return {
                      ...article,
                      positive_feedbacks: metrics.positive_feedback || 0,
                      negative_feedbacks: metrics.negative_feedback || 0,
                      likes_count: metrics.total_likes || 0,
                      comments_count: metrics.total_comments || 0,
                      approval_rate: metrics.approval_rate || 0
                    };
                  }
                  
                  // Se não há métricas, usar valores padrão
                  return {
                    ...article,
                    positive_feedbacks: 0,
                    negative_feedbacks: 0,
                    likes_count: 0,
                    comments_count: 0,
                    approval_rate: 0
                  };
                } catch (error) {
                  console.warn(`⚠️ Métricas não disponíveis para "${article.title}":`, error);
                  // Em caso de erro, usar valores padrão
                  return {
                    ...article,
                    positive_feedbacks: 0,
                    negative_feedbacks: 0,
                    likes_count: 0,
                    comments_count: 0,
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

        // Se falhou com cliente normal, lançar erro
        throw new Error(normalResult.error?.message || 'Falha ao buscar artigos');

        // Este código não será executado devido ao throw acima
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

      const articlesData = result.data as Article[];
      
      // Cache the results
      await hybridCache.set(CacheKeys.ARTICLES_LIST, articlesData);

      console.log('✅ [useArticles] Artigos carregados com sucesso:', articlesData.length);
      setArticles(articlesData);
    } catch (err) {
      console.error('❌ Error fetching articles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async (forceRefresh: boolean = false) => {
    try {
      // Try cache first if not forcing refresh - usar cache rápido específico para categorias
      if (!forceRefresh) {
        const cached = await hybridCache.get<Category[]>(CacheKeys.CATEGORIES_FAST);
        if (cached.data) {
          console.log(`🚀 [useArticles] Using FAST cached categories from ${cached.source}`);
          setCategories(cached.data);
          return;
        }
      }

      console.log('🔄 [useArticles] Buscando categorias do Supabase (otimizado)...');
      console.log('🔍 [DEBUG] Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('🔍 [DEBUG] Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
      
      // Função para buscar categorias com retry - QUERY OTIMIZADA
      const fetchWithRetry = async () => {
        // Query otimizada - buscar apenas campos necessários
        const normalResult = await supabaseWithRetry(
          async () => {
            const response = await supabase
              .from('categories')
              .select('id, name, slug, description') // Apenas campos necessários
              .order('name', { ascending: true });
            console.log('🔍 [DEBUG] Categories response (normal):', response);
            return response;
          },
          'Fetch Categories (Optimized)'
        );

        if (normalResult.success && normalResult.data) {
          return { data: normalResult.data, error: null };
        }

        // Se falhou com cliente normal, lançar erro
        throw new Error(normalResult.error?.message || 'Falha ao buscar categorias');
      };

      const { data, error: fetchError } = await fetchWithRetry().catch(err => ({ data: null, error: err }));

      if (fetchError) {
        console.error('❌ [useArticles] Erro ao buscar categorias:', fetchError);
        setError(fetchError.message || 'Erro ao carregar categorias');
        return;
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        console.warn('⚠️ [useArticles] Nenhuma categoria encontrada no banco');
        setCategories([]);
        return;
      }

      const categoriesData = data as Category[];
      
      // Cache com TTL otimizado para categorias (2 minutos)
      await hybridCache.set(CacheKeys.CATEGORIES_FAST, categoriesData, { 
        accessCount: 10, // Marcar como popular para TTL maior
        isAdminOperation: false 
      });

      console.log('✅ [useArticles] Categorias carregadas com sucesso (otimizado):', categoriesData.length);
      setCategories(categoriesData);
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    }
  }, []);

  // Função otimizada para Home - busca única com cache específico
  const fetchHomeData = useCallback(async (forceRefresh: boolean = false): Promise<{ articles: Article[], categories: Category[] }> => {
    try {
      // Tentar cache específico da Home primeiro
      if (!forceRefresh) {
        const cachedHomeData = await hybridCache.get<{ articles: Article[], categories: Category[] }>(CacheKeys.HOME_DATA);
        if (cachedHomeData.data) {
          console.log(`🚀 [fetchHomeData] Using HOME cache from ${cachedHomeData.source}`);
          return cachedHomeData.data;
        }
      }

      console.log('🔄 [fetchHomeData] Buscando dados da Home do Supabase (query única)...');
      
      // Query única otimizada para a Home
      const [articlesResult, categoriesResult] = await Promise.all([
        supabaseWithRetry(
          async () => {
            const response = await supabase
              .from('articles')
              .select('id, title, slug, excerpt, content, image_url, published, created_at, updated_at, category_id, positive_feedback, negative_feedback, approval_rate')
              .eq('published', true)
              .order('created_at', { ascending: false })
              .limit(50); // Limitar para performance
            return response;
          },
          'Fetch Home Articles'
        ),
        supabaseWithRetry(
          async () => {
            const response = await supabase
              .from('categories')
              .select('id, name, slug, description')
              .order('name', { ascending: true });
            return response;
          },
          'Fetch Home Categories'
        )
      ]);

      if (!articlesResult.success || !categoriesResult.success) {
        throw new Error('Falha ao buscar dados da Home');
      }

      const homeData = {
        articles: articlesResult.data as Article[],
        categories: categoriesResult.data as Category[]
      };

      // Cache específico da Home com TTL de 2 minutos
      await hybridCache.set(CacheKeys.HOME_DATA, homeData, { 
        accessCount: 15, // Marcar como muito popular
        isAdminOperation: false 
      });

      console.log('✅ [fetchHomeData] Dados da Home carregados com sucesso');
      return homeData;
    } catch (err) {
      console.error('❌ Error fetching home data:', err);
      throw err;
    }
  }, []);

  // Only fetch data when explicitly called, not on mount
  const refreshArticles = useCallback(async (): Promise<void> => {
    console.log('🔄 [refreshArticles] Iniciando refresh com busca fresca...');
    setLoading(true);
    try {
      // 🔥 CORREÇÃO CRÍTICA: FORÇAR BUSCA FRESCA (forceRefresh = true)
      // Isso garante que não use cache após operações CRUD
      await Promise.all([fetchArticles(true), fetchCategories(true)]);
      console.log('✅ [refreshArticles] Refresh concluído com dados frescos do Supabase');
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
        await Promise.all([fetchArticlesOptimized(), fetchCategories()]);
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [fetchArticlesOptimized, fetchCategories]);

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
      
      // SOLUÇÃO DEFINITIVA: Inserir todos os campos incluindo published
      const { data, error: insertError } = await supabase
        .from('articles')
        .insert([articleWithSlug])
        .select()
        .single();

      if (insertError) {
        console.error('❌ ERRO na inserção principal:', insertError);
        throw insertError;
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
      
      // 🔥 CORREÇÃO CRÍTICA: INVALIDAR CACHE APÓS CRIAR ARTIGO
      console.log('🗑️ INVALIDANDO CACHE após createArticle...');
      await hybridCache.invalidateAfterCRUD('create', 'article', data?.id);
      console.log('✅ Cache invalidado com sucesso!');
      
      // console.log('🔄 ATUALIZANDO LISTA DE ARTIGOS...');
      await fetchArticles(true); // Force refresh
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
      if (articleData.is_featured_manual !== undefined) updateData.is_featured_manual = articleData.is_featured_manual;
      
      // 🚨 EMERGÊNCIA: REMOVER PUBLISHED COMPLETAMENTE DA FUNÇÃO PRINCIPAL
      // O campo published será tratado em função separada para evitar erro 42883
      console.log('🚨 PUBLISHED REMOVIDO DA FUNÇÃO PRINCIPAL - será tratado separadamente');

      // Evitar update vazio
      if (Object.keys(updateData).length === 0) {
        console.warn('Nenhum campo para atualizar. Operação ignorada.');
        throw new Error('Nenhuma alteração detectada');
      }
      
      // Gerar slug se título foi alterado
      if (updateData.title) {
        const baseSlug = generateSlug(updateData.title);
        updateData.slug = await ensureUniqueSlug(baseSlug, id);
        console.log('🔗 Slug gerado:', updateData.slug);
      }
      
      console.log('🔧 DADOS FINAIS PARA UPDATE:', JSON.stringify(updateData, null, 2));
      console.log('🔧 Quantidade de campos a atualizar:', Object.keys(updateData).length);
      
      // Selecionar cliente adequado: usar admin em DEV para is_featured_manual
      const useAdminForFeatured = import.meta.env.DEV === true && updateData.is_featured_manual !== undefined;
      const client = useAdminForFeatured ? await getAdminClient() : supabase;
      console.log('🧩 Cliente selecionado para update:', useAdminForFeatured ? 'supabaseAdmin (DEV)' : 'supabase (anon)');
      
      // UMA QUERY SIMPLES - SEM COMPLICAÇÕES
      console.log('🚀 Executando query de atualização...');
      const { data, error: updateError } = await client
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
        const { data: checkData, error: checkError } = await client
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

      // 🔥 CORREÇÃO CRÍTICA: INVALIDAR CACHE APÓS ATUALIZAR ARTIGO
      console.log('🗑️ INVALIDANDO CACHE após updateArticle...');
      await hybridCache.invalidateAfterCRUD('update', 'article', id);
      console.log('✅ Cache invalidado com sucesso!');
      
      console.log('🔄 Atualizando lista de artigos...');
      await fetchArticles(true); // Force refresh
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
      await logEvent('error', 'useArticles', 'SEO_AUTO_FAIL', { article_id: id, reason: 'invalid_id', published });
      return false;
    }
    
    try {
      await logEvent('info', 'useArticles', 'SEO_AUTO_START', { article_id: id, published });
      // Log detalhado antes da chamada RPC
      console.log('🔧 Chamando RPC emergency_update_published com BOOLEAN direto:', {
        article_id: id,
        published_value: published  // BOOLEAN direto agora
      });
      
      // Usar RPC que aceita BOOLEAN direto
      const { data, error } = await supabase
        .rpc('emergency_update_published', {
          article_id: id,
          published_value: published  // BOOLEAN direto
        });

      console.log('📊 Resposta da RPC:', { data, error });

      if (error) {
        console.error('❌ Erro na RPC emergency_update_published:', error);
        console.error('❌ Detalhes do erro:', JSON.stringify(error, null, 2));
        await logEvent('error', 'useArticles', 'SEO_AUTO_FAIL', { article_id: id, error_message: error.message, published });
        throw error;
      }

      if (data === false || data === null) {
        console.error('❌ RPC retornou false/null - artigo não encontrado ou não atualizado');
        console.error('❌ Verificar se o artigo com ID existe:', id);
        await logEvent('warn', 'useArticles', 'SEO_AUTO_FAIL', { article_id: id, reason: 'rpc_returned_false', published });
        return false;
      }

      console.log('✅ Published atualizado com sucesso via RPC:', data);
      
      // 🔥 CORREÇÃO CRÍTICA: INVALIDAR CACHE IMEDIATAMENTE APÓS OPERAÇÃO CRUD
      console.log('🗑️ INVALIDANDO CACHE após updateArticlePublished...');
      await hybridCache.invalidateAfterCRUD('update', 'article', id);
      console.log('✅ Cache invalidado com sucesso!');
      
      // Ping sitemap/robots e registrar sucesso
      try {
        const siteUrl = (import.meta.env.VITE_SITE_URL as string) || (typeof window !== 'undefined' ? window.location.origin : '');
        const sitemapUrl = `${siteUrl}/sitemap.xml`;
        const robotsUrl = `${siteUrl}/robots.txt`;

        // Warm endpoints
        await fetch(sitemapUrl, { method: 'GET', cache: 'reload' }).catch(() => {});
        await fetch(robotsUrl, { method: 'GET', cache: 'reload' }).catch(() => {});
        // Ping buscadores (no-cors)
        await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`, { mode: 'no-cors' }).catch(() => {});
        await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`, { mode: 'no-cors' }).catch(() => {});
        await logEvent('info', 'useArticles', 'SEO_PING_SITEMAP_ROBOTS', { article_id: id, sitemapUrl, robotsUrl, published });
      } catch {}

      await logEvent('info', 'useArticles', 'SEO_AUTO_SUCCESS', { article_id: id, published });
      
      return true;
    } catch (error) {
      console.error('❌ Erro geral em updateArticlePublished:', error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
      await logEvent('error', 'useArticles', 'SEO_AUTO_FAIL', { article_id: id, error_message: error instanceof Error ? error.message : String(error), published });
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

      // 🔥 CORREÇÃO CRÍTICA: INVALIDAR CACHE APÓS DELETAR ARTIGO
      console.log('🗑️ INVALIDANDO CACHE após deleteArticle...');
      await hybridCache.invalidateAfterCRUD('delete', 'article', id);
      console.log('✅ Cache invalidado com sucesso!');

      await fetchArticles(true); // Force refresh
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
      
      const { data, error: insertError } = await supabase
        .from('categories')
        .insert([categoryData])
        .select();

      if (insertError) {
        throw insertError;
      }

      // 🔥 CORREÇÃO CRÍTICA: INVALIDAR CACHE APÓS CRIAR CATEGORIA
      console.log('🗑️ INVALIDANDO CACHE após createCategory...');
      await hybridCache.invalidateAfterCRUD('create', 'category', data?.[0]?.id);
      console.log('✅ Cache invalidado com sucesso!');

      await fetchCategories(true); // Force refresh
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

      // 🔥 CORREÇÃO CRÍTICA: INVALIDAR CACHE APÓS ATUALIZAR CATEGORIA
      console.log('🗑️ INVALIDANDO CACHE após updateCategory...');
      await hybridCache.invalidateAfterCRUD('update', 'category', id);
      console.log('✅ Cache invalidado com sucesso!');

      await fetchCategories(true); // Force refresh
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

      // 🔥 CORREÇÃO CRÍTICA: INVALIDAR CACHE APÓS DELETAR CATEGORIA
      console.log('🗑️ INVALIDANDO CACHE após deleteCategory...');
      await hybridCache.invalidateAfterCRUD('delete', 'category', id);
      console.log('✅ Cache invalidado com sucesso!');

      await fetchCategories(true); // Force refresh
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

  // Initialize data on mount - removed duplicate useEffect

  // Função para buscar artigos em destaque usando a função SQL híbrida
  const getFeaturedArticles = useCallback(async (): Promise<Article[]> => {
    try {
      console.log('🔄 [getFeaturedArticles] Buscando artigos em destaque com função SQL híbrida...');
      
      // FORÇAR BUSCA FRESCA - IGNORAR CACHE TEMPORARIAMENTE PARA DEBUG
      console.log('🚨 [DEBUG] Ignorando cache para forçar busca fresca dos artigos em destaque');
      
      // Tentar cache primeiro (DESABILITADO PARA DEBUG)
      // const cached = await hybridCache.get<Article[]>('featured_articles');
      // if (cached.data) {
      //   console.log(`🟢 [getFeaturedArticles] Using cached featured articles from ${cached.source}`);
      //   return cached.data;
      // }

      // Chamar a função SQL get_featured_articles() diretamente
      const { data: featuredArticles, error } = await supabase.rpc('get_featured_articles');

      if (error) {
        console.error('❌ Erro na função SQL get_featured_articles:', error);
        throw new Error(`Erro ao buscar artigos em destaque: ${error.message}`);
      }

      if (!featuredArticles) {
        console.log('⚠️ Nenhum artigo em destaque retornado pela função SQL');
        return [];
      }
      
      // Cache com TTL de 2 minutos
      await hybridCache.set('featured_articles', featuredArticles, { 
        accessCount: 10,
        isAdminOperation: false 
      });

      console.log('✅ [getFeaturedArticles] Artigos em destaque carregados com sucesso:', featuredArticles.length);
      return featuredArticles;
    } catch (err) {
      console.error('❌ Error fetching featured articles:', err);
      throw err;
    }
  }, []);

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
        await Promise.all([fetchArticles(true), fetchCategories(true)]);
      } finally {
        setLoading(false);
      }
    },
    // Admin utilities for cache invalidation
    adminUtils: AdminCacheUtils,
    hasMore,
    loadMore,
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
    refreshArticles,
    fetchHomeData, // Nova função otimizada para Home
    getFeaturedArticles // Nova função para artigos em destaque com modo híbrido
  };

  // Sistema automático: escutar mudanças de feedback para invalidar cache
  React.useEffect(() => {
    const handleFeedbackChange = (event: CustomEvent) => {
      console.log('🔄 [useArticles] Feedback mudou automaticamente:', event.detail);
      
      // Invalidar cache automaticamente
      hybridCache.invalidatePattern('articles');
      hybridCache.invalidatePattern('metrics');
      
      // Recarregar dados automaticamente
      fetchArticles(true); // Force refresh
      fetchCategories(true); // Force refresh
    };

    const handleForceSync = () => {
      console.log('🔄 [useArticles] Sincronização forçada detectada');
      
      // Invalidar todo o cache
      hybridCache.invalidatePattern('articles');
      hybridCache.invalidatePattern('metrics');
      hybridCache.invalidatePattern('categories');
      
      // Recarregar tudo
      fetchArticles(true);
      fetchCategories(true);
    };

    // Escutar eventos de mudança de feedback
    window.addEventListener('feedbackChanged', handleFeedbackChange as EventListener);
    window.addEventListener('forceFeedbackSync', handleForceSync);

    return () => {
      window.removeEventListener('feedbackChanged', handleFeedbackChange as EventListener);
      window.removeEventListener('forceFeedbackSync', handleForceSync);
    };
  }, [fetchArticles, fetchCategories]);

  // Invalidação automática de cache ao publicar/excluir artigos (via Supabase Realtime)
  React.useEffect(() => {
    try {
      const channel = supabase
        .channel('articles-publish-realtime')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'articles'
        }, async (payload: any) => {
          const row = payload?.new ?? payload?.record ?? null;
          const oldRow = payload?.old ?? null;
          const eventType = payload?.eventType || payload?.type || null;

          if (!row && !oldRow) return;

          const publishedNow = row.published === true;
          const statusPublished = row.scheduling_status === 'published';
          
          // Tratar exclusões de artigos
          if (eventType === 'DELETE') {
            const id = oldRow?.id || row?.id;
            console.log('🗑️ [useArticles] Detected article deletion. Invalidating caches...', { id });
            try {
              await hybridCache.invalidateAfterCRUD('delete', 'article', id);
              await fetchArticles(true);

              // Limpar cache do Service Worker
              try {
                const { clearCache: swClearCache } = await import('../utils/serviceWorker');
                await swClearCache();
              } catch (swErr) {
                console.warn('SW cache clear failed or not available:', swErr);
              }

              // Notificar UI para atualizar Home
              try {
                window.dispatchEvent(new CustomEvent('realtime-cache-invalidate', {
                  detail: { source: 'articles-delete', id }
                }));
              } catch {}

              console.log('✅ [useArticles] Caches invalidados após exclusão');
            } catch (invErr) {
              console.error('❌ [useArticles] Falha ao invalidar caches após exclusão:', invErr);
            }
            return;
          }

          // Tratar publicações/atualizações que impactam published
          if (publishedNow || statusPublished || (eventType === 'INSERT' && row.published === true)) {
            console.log('⚡ [useArticles] Detected article publication. Invalidating caches...', {
              id: row.id,
              published: row.published,
              scheduling_status: row.scheduling_status
            });

            try {
              // Invalidação padronizada incluindo Home
              await hybridCache.invalidateAfterCRUD('publish', 'article', row.id);
              await fetchArticles(true);

              // Solicita limpeza do cache do Service Worker
              try {
                const { clearCache: swClearCache } = await import('../utils/serviceWorker');
                await swClearCache();
              } catch (swErr) {
                console.warn('SW cache clear failed or not available:', swErr);
              }

              // Notificar UI para atualizar Home
              try {
                window.dispatchEvent(new CustomEvent('realtime-cache-invalidate', {
                  detail: { source: 'articles-publish', id: row.id }
                }));
              } catch {}

              console.log('✅ [useArticles] Caches invalidados após publicação');
            } catch (invErr) {
              console.error('❌ [useArticles] Falha ao invalidar caches após publicação:', invErr);
            }
          }

          // Tratar UNPUBLISH (quando published muda de true -> false)
          if (eventType === 'UPDATE' && oldRow && oldRow.published === true && row.published === false) {
            console.log('🔕 [useArticles] Detected article unpublish. Invalidating caches...', { id: row.id });
            try {
              await hybridCache.invalidateAfterCRUD('unpublish', 'article', row.id);
              await fetchArticles(true);

              try {
                const { clearCache: swClearCache } = await import('../utils/serviceWorker');
                await swClearCache();
              } catch (swErr) {
                console.warn('SW cache clear failed or not available:', swErr);
              }

              try {
                window.dispatchEvent(new CustomEvent('realtime-cache-invalidate', {
                  detail: { source: 'articles-unpublish', id: row.id }
                }));
              } catch {}

              console.log('✅ [useArticles] Caches invalidados após unpublish');
            } catch (invErr) {
              console.error('❌ [useArticles] Falha ao invalidar caches após unpublish:', invErr);
            }
            return;
          }

          // Tratar UPDATE genérico que possa impactar listagens (título, slug, categoria, etc.)
          if (eventType === 'UPDATE' && row.published === true) {
            console.log('✏️ [useArticles] Detected article update. Invalidating list caches...', { id: row.id });
            try {
              await hybridCache.invalidateAfterCRUD('update', 'article', row.id);
              await fetchArticles(true);

              try {
                const { clearCache: swClearCache } = await import('../utils/serviceWorker');
                await swClearCache();
              } catch (swErr) {
                console.warn('SW cache clear failed or not available:', swErr);
              }

              try {
                window.dispatchEvent(new CustomEvent('realtime-cache-invalidate', {
                  detail: { source: 'articles-update', id: row.id }
                }));
              } catch {}

              console.log('✅ [useArticles] Caches invalidados após update');
            } catch (invErr) {
              console.error('❌ [useArticles] Falha ao invalidar caches após update:', invErr);
            }
          }
        })
        .subscribe((status) => {
          console.log('🔌 [useArticles] Realtime subscription status:', status);
        });

      return () => {
        try { supabase.removeChannel(channel); } catch {}
      };
    } catch (err) {
      console.warn('Realtime not available or failed to subscribe:', err);
    }
  }, [fetchArticles]);

  return {
    articles,
    categories,
    loading,
    error,
    articlesCount: articles.length,
    categoriesCount: categories.length,
    refresh: async () => {
      await Promise.all([fetchArticles(true), fetchCategories(true)]);
    },
    // Admin utilities for cache invalidation
    adminUtils: AdminCacheUtils,
    hasMore,
    loadMore,
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
    refreshArticles,
    fetchHomeData, // Nova função otimizada para Home
    getFeaturedArticles // Nova função para artigos em destaque com modo híbrido
  };
};