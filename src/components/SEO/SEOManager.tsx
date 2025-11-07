import React from 'react';
import { Helmet } from 'react-helmet-async';

export interface BreadcrumbItem {
  name: string;
  url: string;
  position: number;
}

export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  canonicalUrl: string;
  schemaData?: Record<string, any>;
  type?: 'website' | 'article' | 'profile' | 'webpage';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  breadcrumbs?: BreadcrumbItem[];
  readingTime?: number;
  wordCount?: number;
  language?: string;
  alternateLanguages?: { lang: string; url: string }[];
  robots?: string;
  priority?: number;
  changeFreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}

interface SEOManagerProps {
  metadata: SEOMetadata;
}

export const SEOManager: React.FC<SEOManagerProps> = ({ metadata }) => {
  const {
    title,
    description,
    keywords = [],
    ogImage,
    canonicalUrl,
    schemaData,
    type = 'website',
    publishedTime,
    modifiedTime,
    author,
    section,
    tags = [],
    breadcrumbs = [],
    readingTime,
    wordCount,
    language = 'pt-BR',
    alternateLanguages = [],
    robots = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
    priority,
    changeFreq
  } = metadata;

  // Gerar keywords como string
  const keywordsString = keywords.length > 0 ? keywords.join(', ') : '';

  // Gerar URL da imagem OG padrão se não fornecida
  const defaultOgImage = ogImage || `https://aimindset.com.br/api/og?title=${encodeURIComponent(title)}&type=${type}`;

  // Schema.org JSON-LD avançado
  const generateSchemaData = () => {
    if (schemaData) {
      return JSON.stringify(schemaData);
    }

    const schemas = [];

    // Website Schema
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'AIMindset',
      url: 'https://aimindset.com.br',
      description: 'Plataforma especializada em Inteligência Artificial, Machine Learning e tecnologia',
      publisher: {
        '@type': 'Organization',
        name: 'AIMindset',
        url: 'https://aimindset.com.br',
        logo: {
          '@type': 'ImageObject',
          url: 'https://aimindset.com.br/logo.png',
          width: 512,
          height: 512
        },
        sameAs: [
          'https://twitter.com/aimindset',
          'https://linkedin.com/company/aimindset'
        ]
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://aimindset.com.br/artigos?q={search_term_string}',
        'query-input': 'required name=search_term_string'
      }
    });

    // Breadcrumbs Schema
    if (breadcrumbs.length > 0) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((item) => ({
          '@type': 'ListItem',
          position: item.position,
          name: item.name,
          item: item.url
        }))
      });
    }

    // Page/Article Schema
    const pageSchema = {
      '@context': 'https://schema.org',
      '@type': type === 'article' ? 'BlogPosting' : 'WebPage',
      name: title,
      headline: title,
      description,
      url: canonicalUrl,
      image: {
        '@type': 'ImageObject',
        url: defaultOgImage,
        width: 1200,
        height: 630
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonicalUrl
      },
      inLanguage: language,
      isPartOf: {
        '@type': 'WebSite',
        '@id': 'https://aimindset.com.br'
      }
    };

    if (type === 'article' && publishedTime) {
      Object.assign(pageSchema, {
        '@type': 'BlogPosting',
        datePublished: publishedTime,
        dateModified: modifiedTime || publishedTime,
        author: {
          '@type': 'Organization',
          name: author || 'AIMindset Team',
          url: 'https://aimindset.com.br'
        },
        publisher: {
          '@type': 'Organization',
          name: 'AIMindset',
          url: 'https://aimindset.com.br',
          logo: {
            '@type': 'ImageObject',
            url: 'https://aimindset.com.br/logo.png',
            width: 512,
            height: 512
          }
        },
        keywords: keywordsString,
        articleSection: section,
        articleTag: tags,
        ...(readingTime && { timeRequired: `PT${readingTime}M` }),
        ...(wordCount && { wordCount })
      });
    }

    schemas.push(pageSchema);

    return JSON.stringify(schemas.length === 1 ? schemas[0] : schemas);
  };

  return (
    <Helmet>
      {/* Título da página */}
      <title>{title}</title>
      
      {/* Meta tags básicas */}
      <meta name="description" content={description} />
      {keywordsString && <meta name="keywords" content={keywordsString} />}
      <meta name="robots" content={robots} />
      <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content={language} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Hreflang para internacionalização */}
      {alternateLanguages.map((alt, index) => (
        <link key={index} rel="alternate" hrefLang={alt.lang} href={alt.url} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
      
      {/* Open Graph avançado */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="AIMindset" />
      <meta property="og:locale" content={language.replace('-', '_')} />
      <meta property="og:image" content={defaultOgImage} />
      <meta property="og:image:alt" content={`${title} - AIMindset`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content="image/png" />
      
      {/* Twitter Card avançado */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={defaultOgImage} />
      <meta name="twitter:image:alt" content={`${title} - AIMindset`} />
      <meta name="twitter:site" content="@aimindset" />
      <meta name="twitter:creator" content="@aimindset" />
      
      {/* Article specific meta tags */}
      {type === 'article' && publishedTime && (
        <>
          <meta property="article:published_time" content={publishedTime} />
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {author && <meta property="article:author" content={author} />}
          {section && <meta property="article:section" content={section} />}
          {tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Meta tags técnicas */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="AIMindset" />
      
      {/* Preconnect para performance */}
      {/* <link rel="preconnect" href="https://fonts.googleapis.com" /> */}
      {/* <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /> */}
      <link rel="preconnect" href="https://www.google-analytics.com" />
      <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
      
      {/* Carregamento das fontes Google Fonts - TEMPORARIAMENTE DESABILITADO PARA PREVIEW */}
      {/* <link 
        href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Montserrat:wght@400;600;700&family=Roboto:wght@300;400;500;700&display=swap" 
        rel="stylesheet" 
        crossOrigin="anonymous"
      /> */}
      
      {/* DNS Prefetch */}
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      <link rel="dns-prefetch" href="//images.unsplash.com" />
      {/* <link rel="dns-prefetch" href="//fonts.googleapis.com" /> */}
      {/* <link rel="dns-prefetch" href="//fonts.gstatic.com" /> */}
      
      {/* Schema.org JSON-LD */}
      <script type="application/ld+json">
        {generateSchemaData()}
      </script>
      
      {/* Favicon e ícones */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
      
      {/* Theme color */}
      <meta name="theme-color" content="#3B82F6" />
      <meta name="msapplication-TileColor" content="#3B82F6" />
      <meta name="msapplication-config" content="/browserconfig.xml" />
      
      {/* Sitemap hint */}
      <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
    </Helmet>
  );
};

export default SEOManager;