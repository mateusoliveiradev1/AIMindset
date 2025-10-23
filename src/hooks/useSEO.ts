import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { SEOMetadata } from '../components/SEO/SEOManager';

interface SEOData {
  id: string;
  page_type: 'home' | 'article' | 'category' | 'about' | 'contact' | 'newsletter' | 'privacy';
  page_slug?: string;
  title: string;
  description: string;
  keywords: string[];
  og_image?: string;
  canonical_url: string;
  schema_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface UseSEOOptions {
  pageType: 'home' | 'article' | 'category' | 'about' | 'contact' | 'newsletter' | 'privacy';
  pageSlug?: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
  fallbackKeywords?: string[];
  fallbackImage?: string;
}

// Cache global para metadados SEO
const seoCache = new Map<string, SEOData>();
const cacheExpiry = new Map<string, number>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Função para gerar chave do cache
const getCacheKey = (pageType: string, pageSlug?: string) => {
  return `${pageType}${pageSlug ? `_${pageSlug}` : ''}`;
};

// Função para verificar se o cache é válido
const isCacheValid = (key: string): boolean => {
  const expiry = cacheExpiry.get(key);
  return expiry ? Date.now() < expiry : false;
};

// Função para definir título imediatamente
const setDocumentTitle = (title: string) => {
  if (typeof document !== 'undefined') {
    document.title = title;
  }
};

export const useSEO = (options: UseSEOOptions) => {
  const [seoData, setSeoData] = useState<SEOData | null>(null);
  const [loading, setLoading] = useState(false); // Mudança: iniciar como false
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    pageType,
    pageSlug,
    fallbackTitle = 'AIMindset - Inteligência Artificial e Produtividade',
    fallbackDescription = 'Descubra como a inteligência artificial pode transformar sua produtividade. Artigos, dicas e insights sobre IA, automação e tecnologia.',
    fallbackKeywords = ['inteligência artificial', 'IA', 'produtividade', 'automação', 'tecnologia'],
    fallbackImage = 'https://aimindset.com.br/og-image.jpg'
  } = options;

  // Definir título imediatamente com fallback
  useEffect(() => {
    const cacheKey = getCacheKey(pageType, pageSlug);
    const cachedData = seoCache.get(cacheKey);
    
    if (cachedData && isCacheValid(cacheKey)) {
      // Se temos dados em cache, usar imediatamente
      setSeoData(cachedData);
      setDocumentTitle(cachedData.title);
    } else {
      // Definir título fallback imediatamente para evitar delay
      setDocumentTitle(fallbackTitle);
    }
  }, [pageType, pageSlug, fallbackTitle]);

  useEffect(() => {
    const fetchSEOData = async () => {
      // Cancelar requisição anterior se existir e não estiver já abortada
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        abortControllerRef.current.abort();
      }

      const cacheKey = getCacheKey(pageType, pageSlug);
      
      // Verificar cache primeiro
      if (seoCache.has(cacheKey) && isCacheValid(cacheKey)) {
        const cachedData = seoCache.get(cacheKey)!;
        setSeoData(cachedData);
        setDocumentTitle(cachedData.title);
        return;
      }

      // Criar novo AbortController para esta requisição
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        // Só mostrar loading se não temos dados em cache
        if (!seoCache.has(cacheKey)) {
          setLoading(true);
        }
        setError(null);

        let query = supabase
          .from('seo_metadata')
          .select('*')
          .eq('page_type', pageType)
          .abortSignal(abortController.signal);

        if (pageSlug) {
          query = query.eq('page_slug', pageSlug);
        } else {
          query = query.is('page_slug', null);
        }

        const { data, error: fetchError } = await query.single();

        // Verificar se a requisição foi cancelada antes de processar resultado
        if (abortController.signal.aborted) {
          return;
        }

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            // Nenhum registro encontrado, usar fallbacks
            console.log(`Nenhum metadado SEO encontrado para ${pageType}${pageSlug ? `/${pageSlug}` : ''}, usando fallbacks`);
            setSeoData(null);
          } else {
            // Para outros erros (incluindo 406), usar fallbacks silenciosamente
            console.log(`Erro ao buscar metadados SEO (${fetchError.code}): ${fetchError.message}. Usando fallbacks.`);
            setSeoData(null);
          }
        } else {
          setSeoData(data);
          setDocumentTitle(data.title);
          
          // Armazenar no cache
          seoCache.set(cacheKey, data);
          cacheExpiry.set(cacheKey, Date.now() + CACHE_DURATION);
        }
      } catch (err) {
        // Verificar se a requisição foi cancelada
        if (abortController.signal.aborted) {
          return; // Requisição cancelada, não fazer nada
        }
        
        if (err instanceof Error && err.name === 'AbortError') {
          return; // Requisição cancelada, não fazer nada
        }
        
        // Para qualquer erro, usar fallbacks silenciosamente
        console.log(`Erro ao buscar dados SEO: ${err instanceof Error ? err.message : 'Erro desconhecido'}. Usando fallbacks.`);
        setSeoData(null);
        setError(null); // Não definir erro para evitar mostrar mensagens de erro ao usuário
      } finally {
        // Só atualizar estado se a requisição não foi cancelada
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
        
        // Limpar referência se esta ainda é a requisição atual
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      }
    };

    fetchSEOData();

    // Cleanup
    return () => {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [pageType, pageSlug]);

  // Gerar metadados SEO formatados para o SEOManager
  const getMetadata = (): SEOMetadata => {
    const baseUrl = 'https://aimindset.com.br';
    
    if (seoData) {
      return {
        title: seoData.title,
        description: seoData.description,
        keywords: seoData.keywords,
        ogImage: seoData.og_image || fallbackImage,
        canonicalUrl: seoData.canonical_url,
        schemaData: seoData.schema_data,
        type: pageType === 'article' ? 'article' : 'website'
      };
    }

    // Fallback metadata
    let canonicalUrl = baseUrl;
    if (pageType === 'article' && pageSlug) {
      canonicalUrl = `${baseUrl}/artigo/${pageSlug}`;
    } else if (pageType === 'category' && pageSlug) {
      canonicalUrl = `${baseUrl}/categoria/${pageSlug}`;
    } else if (pageType === 'about') {
      canonicalUrl = `${baseUrl}/sobre`;
    } else if (pageType === 'contact') {
      canonicalUrl = `${baseUrl}/contato`;
    } else if (pageType === 'newsletter') {
      canonicalUrl = `${baseUrl}/newsletter`;
    } else if (pageType === 'privacy') {
      canonicalUrl = `${baseUrl}/privacidade`;
    }

    return {
      title: fallbackTitle,
      description: fallbackDescription,
      keywords: fallbackKeywords,
      ogImage: fallbackImage,
      canonicalUrl,
      type: pageType === 'article' ? 'article' : 'website'
    };
  };

  // Função para criar/atualizar metadados SEO
  const updateSEOData = async (metadata: Partial<SEOData>) => {
    try {
      const { data, error } = await supabase
        .from('seo_metadata')
        .upsert({
          page_type: pageType,
          page_slug: pageSlug || null,
          ...metadata
        })
        .select()
        .single();

      if (error) throw error;

      setSeoData(data);
      setDocumentTitle(data.title);
      
      // Atualizar cache
      const cacheKey = getCacheKey(pageType, pageSlug);
      seoCache.set(cacheKey, data);
      cacheExpiry.set(cacheKey, Date.now() + CACHE_DURATION);
      
      return data;
    } catch (err) {
      console.error('Erro ao atualizar dados SEO:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar');
      throw err;
    }
  };

  // Função para gerar metadados automaticamente para artigos
  const generateArticleSEO = async (articleData: {
    title: string;
    excerpt?: string;
    tags?: string;
    image_url?: string;
    slug: string;
    created_at: string;
    updated_at?: string;
  }) => {
    const keywords = articleData.tags 
      ? articleData.tags.split(',').map(tag => tag.trim())
      : [];
    
    // Adicionar keywords padrão
    const allKeywords = [...keywords, 'inteligência artificial', 'IA', 'produtividade'];

    const metadata = {
      title: `${articleData.title} | AIMindset`,
      description: articleData.excerpt || `Leia sobre ${articleData.title} no AIMindset`,
      keywords: allKeywords,
      og_image: articleData.image_url,
      canonical_url: `https://aimindset.com.br/artigo/${articleData.slug}`,
      schema_data: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: articleData.title,
        description: articleData.excerpt || '',
        image: articleData.image_url,
        author: {
          '@type': 'Organization',
          name: 'AIMindset',
          url: 'https://aimindset.com.br'
        },
        publisher: {
          '@type': 'Organization',
          name: 'AIMindset',
          url: 'https://aimindset.com.br',
          logo: {
            '@type': 'ImageObject',
            url: 'https://aimindset.com.br/logo.png'
          }
        },
        datePublished: articleData.created_at,
        dateModified: articleData.updated_at || articleData.created_at,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `https://aimindset.com.br/artigo/${articleData.slug}`
        },
        url: `https://aimindset.com.br/artigo/${articleData.slug}`
      }
    };

    return updateSEOData(metadata);
  };

  // Função para gerar metadados automaticamente para categorias
  const generateCategorySEO = async (categoryData: {
    name: string;
    description?: string;
    slug: string;
  }) => {
    const metadata = {
      title: `${categoryData.name} | AIMindset`,
      description: categoryData.description || `Artigos sobre ${categoryData.name} - Descubra conteúdos relacionados a ${categoryData.name}`,
      keywords: [categoryData.name, 'categoria', 'artigos', 'inteligência artificial'],
      canonical_url: `https://aimindset.com.br/categoria/${categoryData.slug}`,
      schema_data: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: categoryData.name,
        description: categoryData.description || '',
        url: `https://aimindset.com.br/categoria/${categoryData.slug}`,
        mainEntity: {
          '@type': 'ItemList',
          name: `Artigos sobre ${categoryData.name}`,
          description: categoryData.description || ''
        }
      }
    };

    return updateSEOData(metadata);
  };

  // Função para pré-carregar metadados de categorias
  const preloadCategorySEO = async (categories: Array<{ name: string; slug: string; description?: string }>) => {
    const promises = categories.map(async (category) => {
      const cacheKey = getCacheKey('category', category.slug);
      
      // Só buscar se não estiver em cache ou cache expirado
      if (!seoCache.has(cacheKey) || !isCacheValid(cacheKey)) {
        try {
          const { data } = await supabase
            .from('seo_metadata')
            .select('*')
            .eq('page_type', 'category')
            .eq('page_slug', category.slug)
            .single();

          if (data) {
            seoCache.set(cacheKey, data);
            cacheExpiry.set(cacheKey, Date.now() + CACHE_DURATION);
          }
        } catch (error) {
          // Silenciosamente ignorar erros de pré-carregamento
          console.log(`Pré-carregamento falhou para categoria ${category.slug}`);
        }
      }
    });

    await Promise.allSettled(promises);
  };

  return {
    seoData,
    loading,
    error,
    getMetadata,
    updateSEOData,
    generateArticleSEO,
    generateCategorySEO,
    preloadCategorySEO
  };
};