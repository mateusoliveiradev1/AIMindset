import { useState, useEffect, useRef } from 'react';
import { SEOMetadata, BreadcrumbItem } from '../components/SEO/SEOManager';
import { supabaseServiceClient } from '../lib/supabase';
import { computeReadingTime } from './useReadingTime';

// Importar utilitário Gemini para SEO dinâmico
import { generateGenericSEO } from '../utils/geminiSEO';

interface SEOData {
  id: string;
  page_type: 'home' | 'article' | 'category' | 'about' | 'contact' | 'newsletter' | 'privacy' | 'all_articles' | 'admin' | 'faq';
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
  pageType: 'home' | 'article' | 'category' | 'about' | 'contact' | 'newsletter' | 'privacy' | 'all_articles' | 'admin' | 'faq';
  pageSlug?: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
  fallbackKeywords?: string[];
  fallbackImage?: string;
  articleData?: {
    title: string;
    content?: string;
    excerpt?: string;
    tags?: string;
    category?: string;
    image_url?: string;
    created_at?: string;
    updated_at?: string;
  };
  breadcrumbs?: BreadcrumbItem[];
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

// Função para extrair keywords automaticamente do conteúdo
const extractKeywords = (content: string, title: string, category?: string): string[] => {
  const keywords: string[] = [];

  // Keywords do título
  const titleWords = title.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);

  keywords.push(...titleWords);

  // Keywords da categoria
  if (category) {
    keywords.push(category.toLowerCase());
  }

  // Keywords técnicas comuns em IA
  const aiKeywords = [
    'inteligência artificial', 'machine learning', 'deep learning', 'ia', 'ml',
    'automação', 'tecnologia', 'produtividade', 'inovação', 'algoritmo',
    'dados', 'análise', 'otimização', 'eficiência'
  ];

  // Verificar se o conteúdo contém keywords técnicas
  const contentLower = content.toLowerCase();
  aiKeywords.forEach(keyword => {
    if (contentLower.includes(keyword)) {
      keywords.push(keyword);
    }
  });

  // Remover duplicatas e limitar a 10 keywords
  return [...new Set(keywords)].slice(0, 10);
};

// Função para gerar meta description automaticamente
const generateMetaDescription = (content: string, title: string, maxLength: number = 155): string => {
  if (!content) {
    return `Leia sobre ${title} no AIMindset. Descubra insights sobre inteligência artificial, produtividade e tecnologia.`;
  }

  // Remover HTML tags e caracteres especiais
  const cleanContent = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Tentar encontrar o primeiro parágrafo significativo
  const sentences = cleanContent.split(/[.!?]+/);
  let description = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (trimmedSentence.length > 50) {
      description = trimmedSentence;
      break;
    }
  }

  // Se não encontrou uma boa descrição, usar o início do conteúdo
  if (!description) {
    description = cleanContent.substring(0, maxLength - 20);
  }

  // Truncar se necessário e adicionar call-to-action
  if (description.length > maxLength - 20) {
    description = description.substring(0, maxLength - 20).trim();
    // Encontrar o último espaço para não cortar palavras
    const lastSpace = description.lastIndexOf(' ');
    if (lastSpace > maxLength - 50) {
      description = description.substring(0, lastSpace);
    }
  }

  // Adicionar call-to-action se houver espaço
  const cta = ' Leia mais no AIMindset.';
  if (description.length + cta.length <= maxLength) {
    description += cta;
  }

  return description;
};

const calculateReadingTime = (content: string): number => {
  return computeReadingTime(content);
};

export const useSEO = (options: UseSEOOptions) => {
  const [seoData, setSeoData] = useState<SEOData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    pageType,
    pageSlug,
    fallbackTitle = 'AIMindset - Inteligência Artificial e Produtividade',
    fallbackDescription = 'Descubra como a inteligência artificial pode transformar sua produtividade. Artigos, dicas e insights sobre IA, automação e tecnologia.',
    fallbackKeywords = ['inteligência artificial', 'IA', 'produtividade', 'automação', 'tecnologia'],
    fallbackImage = 'https://aimindset.com.br/og-image.jpg',
    articleData,
    breadcrumbs = []
  } = options;

  // Definir título imediatamente com fallback
  useEffect(() => {
    const cacheKey = getCacheKey(pageType, pageSlug);
    const cachedData = seoCache.get(cacheKey);

    if (cachedData && isCacheValid(cacheKey)) {
      setSeoData(cachedData);
      setDocumentTitle(cachedData.title);
    } else {
      setDocumentTitle(fallbackTitle);
    }
  }, [pageType, pageSlug, fallbackTitle]);

  useEffect(() => {
    const fetchSEOData = async () => {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        abortControllerRef.current.abort();
      }

      const cacheKey = getCacheKey(pageType, pageSlug);
      if (seoCache.has(cacheKey) && isCacheValid(cacheKey)) {
        const cachedData = seoCache.get(cacheKey)!;
        setSeoData(cachedData);
        setDocumentTitle(cachedData.title);
        return;
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        if (!seoCache.has(cacheKey)) {
          setLoading(true);
        }
        setError(null);

        let query = supabaseServiceClient
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

        if (abortController.signal.aborted) {
          return;
        }

        if (fetchError) {
          setSeoData(null);
        } else {
          setSeoData(data);
          setDocumentTitle(data.title);

          seoCache.set(cacheKey, data);
          cacheExpiry.set(cacheKey, Date.now() + CACHE_DURATION);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setSeoData(null);
          setError(null);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }

        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      }
    };

    fetchSEOData();

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
    const sanitizeTitle = (rawTitle: string) => {
      if (!rawTitle) return rawTitle;
      let t = rawTitle.trim();
      t = t.replace(/\s*\|\s*AIMindset\s*#([a-f0-9-]+|\d+)\s*$/i, '');
      t = t.replace(/\s*\((id|uuid):\s*[a-f0-9-]+\)\s*$/i, '');
      t = t.replace(/\s*\|\s*AIMindset\s*$/i, '');
      t = `${t} | AIMindset`;
      const MAX = 60;
      if (t.length > MAX) {
        const base = t.replace(/\s*\|\s*AIMindset\s*$/i, '').trim();
        const suffix = ' | AIMindset';
        const limit = MAX - suffix.length;
        let truncated = base.slice(0, limit).trim();
        const lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > limit - 15) {
          truncated = truncated.slice(0, lastSpace);
        }
        t = `${truncated}${suffix}`;
      }
      return t;
    };

    const smartTruncate = (text: string, limit: number) => {
      if (!text) return text;
      if (text.length <= limit) return text;
      let truncated = text.slice(0, limit).trim();
      const lastSpace = truncated.lastIndexOf(' ');
      if (lastSpace > limit - 20) {
        truncated = truncated.slice(0, lastSpace);
      }
      return truncated.endsWith('.') ? truncated : `${truncated}...`;
    };

    if (seoData) {
      const sanitizedTitle = sanitizeTitle(seoData.title);
      const descLimit = pageType === 'article' ? 160 : pageType === 'category' ? 140 : 155;
      const sanitizedDescription = smartTruncate(seoData.description, descLimit);
      return {
        title: sanitizedTitle,
        description: sanitizedDescription,
        keywords: seoData.keywords,
        ogImage: seoData.og_image || fallbackImage,
        canonicalUrl: seoData.canonical_url,
        schemaData: seoData.schema_data,
        type: pageType === 'article' ? 'article' : 'webpage',
        breadcrumbs,
        language: 'pt-BR',
        robots: pageType === 'admin' ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
      };
    }

    let canonicalUrl = baseUrl;
    let title = fallbackTitle;
    let description = fallbackDescription;
    let keywords = [...fallbackKeywords];
    let ogImage = fallbackImage;
    let type: 'website' | 'article' | 'webpage' = 'website';
    let robots = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

    if (pageType === 'article' && pageSlug) {
      type = 'article';
      canonicalUrl = `${baseUrl}/artigo/${pageSlug}`;

      if (articleData) {
        title = sanitizeTitle(articleData.title.includes('|') ? articleData.title : `${articleData.title} | AIMindset`);
        if (articleData.content) {
          description = generateMetaDescription(articleData.content, articleData.title, 160);
        } else if (articleData.excerpt) {
          description = articleData.excerpt.length > 160
            ? articleData.excerpt.substring(0, 157) + '...'
            : articleData.excerpt;
        }
        if (articleData.content) {
          keywords = extractKeywords(articleData.content, articleData.title, articleData.category);
        } else if (articleData.tags) {
          keywords = [...articleData.tags.split(',').map(tag => tag.trim()), ...fallbackKeywords];
        }
        ogImage = articleData.image_url || `${baseUrl}/api/og?title=${encodeURIComponent(articleData.title)}&type=article`;
        description = smartTruncate(description || fallbackDescription, 160);
      }
    } else if (pageType === 'category' && pageSlug) {
      canonicalUrl = `${baseUrl}/categoria/${pageSlug}`;
      title = `Categoria ${pageSlug.charAt(0).toUpperCase() + pageSlug.slice(1)} | AIMindset`;
      description = `Explore artigos sobre ${pageSlug} no AIMindset. Conteúdo especializado em inteligência artificial e tecnologia.`;
      keywords = [pageSlug, 'categoria', 'artigos', ...fallbackKeywords];
    } else if (pageType === 'newsletter') {
      canonicalUrl = `${baseUrl}/newsletter`;
      title = 'Newsletter AIMindset - Receba Conteúdo Exclusivo sobre IA';
      description = 'Inscreva-se na newsletter da AIMindset e receba semanalmente conteúdo exclusivo sobre Inteligência Artificial, Machine Learning e tecnologia.';
      keywords = ['newsletter', 'inscrição', 'conteúdo exclusivo', ...fallbackKeywords];
    } else if (pageType === 'all_articles') {
      canonicalUrl = `${baseUrl}/artigos`;
      title = 'Todos os Artigos sobre IA e Machine Learning | AIMindset';
      description = 'Explore nossa biblioteca completa de artigos sobre Inteligência Artificial, Machine Learning, Deep Learning e tecnologia. Conteúdo atualizado regularmente.';
      keywords = ['artigos IA', 'machine learning', 'deep learning', 'biblioteca', ...fallbackKeywords];
    } else if (pageType === 'admin') {
      canonicalUrl = `${baseUrl}/admin`;
      title = 'Painel Administrativo - AIMindset';
      description = 'Área administrativa do AIMindset';
      keywords = ['admin', 'painel'];
      robots = 'noindex, nofollow';
    } else if (pageType === 'about') {
      canonicalUrl = `${baseUrl}/sobre`;
    } else if (pageType === 'contact') {
      canonicalUrl = `${baseUrl}/contato`;
    } else if (pageType === 'privacy') {
      canonicalUrl = `${baseUrl}/privacidade`;
    } else if (pageType === 'faq') {
      canonicalUrl = `${baseUrl}/faq`;
      title = 'FAQ - Perguntas Frequentes e Ajuda | AIMindset';
      description = 'Tire dúvidas sobre conteúdo, newsletter, privacidade e comentários sem conta. Suporte e contato direto.';
      keywords = ['faq', 'perguntas frequentes', 'suporte', 'contato', 'comentários sem conta', 'newsletter', 'privacidade', ...fallbackKeywords];
    }

    return {
      title: sanitizeTitle(title),
      description: pageType === 'article' ? smartTruncate(description, 160) : pageType === 'category' ? smartTruncate(description, 140) : smartTruncate(description, 155),
      keywords,
      ogImage,
      canonicalUrl,
      type,
      breadcrumbs,
      language: 'pt-BR',
      robots,
      ...(articleData?.created_at && { publishedTime: articleData.created_at }),
      ...(articleData?.updated_at && { modifiedTime: articleData.updated_at }),
      ...(articleData?.content && { readingTime: calculateReadingTime(articleData.content) })
    };
  };

  const updateSEOData = async (metadata: Partial<SEOData>) => {
    try {
      const { data, error } = await supabaseServiceClient
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

  const generateArticleSEO = async (articleData: any) => {
    const keywords = articleData.tags
      ? articleData.tags.split(',').map((tag: string) => tag.trim())
      : [];
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
        author: { '@type': 'Organization', name: 'AIMindset', url: 'https://aimindset.com.br' },
        publisher: {
          '@type': 'Organization',
          name: 'AIMindset',
          url: 'https://aimindset.com.br',
          logo: { '@type': 'ImageObject', url: 'https://aimindset.com.br/logo.png' }
        },
        datePublished: articleData.created_at,
        dateModified: articleData.updated_at || articleData.created_at,
        mainEntityOfPage: { '@type': 'WebPage', '@id': `https://aimindset.com.br/artigo/${articleData.slug}` },
        url: `https://aimindset.com.br/artigo/${articleData.slug}`
      }
    };

    return updateSEOData(metadata);
  };

  const generateCategorySEO = async (categoryData: any) => {
    const metadata = {
      title: `${categoryData.name} | AIMindset`,
      description: categoryData.description || `Artigos sobre ${categoryData.name}`,
      keywords: [categoryData.name, 'categoria', 'artigos', 'inteligência artificial'],
      canonical_url: `https://aimindset.com.br/categoria/${categoryData.slug}`,
      schema_data: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: categoryData.name,
        description: categoryData.description || '',
        url: `https://aimindset.com.br/categoria/${categoryData.slug}`,
        mainEntity: { '@type': 'ItemList', name: `Artigos sobre ${categoryData.name}`, description: categoryData.description || '' }
      }
    };

    return updateSEOData(metadata);
  };

  const preloadCategorySEO = async (categories: any[]) => {
    const promises = categories.map(async (category) => {
      const cacheKey = getCacheKey('category', category.slug);
      if (!seoCache.has(cacheKey) || !isCacheValid(cacheKey)) {
        try {
          const { data } = await supabaseServiceClient
            .from('seo_metadata')
            .select('*')
            .eq('page_type', 'category')
            .eq('page_slug', category.slug)
            .single();
          if (data) {
            seoCache.set(cacheKey, data);
            cacheExpiry.set(cacheKey, Date.now() + CACHE_DURATION);
          }
        } catch (error) { }
      }
    });
    await Promise.allSettled(promises);
  };

  const generateAIOptimizedSEO = async (context?: string) => {
    try {
      setLoading(true);
      const result = await generateGenericSEO(pageType, context || `Página do tipo ${pageType} no blog AIMindset sobre IA e tecnologia.`);
      if (result) {
        const metadata: Partial<SEOData> = {
          title: result.title,
          description: result.description,
          keywords: result.keywords,
          canonical_url: getMetadata().canonicalUrl
        };
        await updateSEOData(metadata);
        return result;
      }
      return null;
    } catch (err) {
      console.error('Erro ao gerar SEO com IA:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    seoData,
    loading,
    error,
    getMetadata,
    updateSEOData,
    generateArticleSEO,
    generateCategorySEO,
    preloadCategorySEO,
    generateAIOptimizedSEO
  };
};