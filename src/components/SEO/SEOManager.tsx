import React from 'react';
import { Helmet } from 'react-helmet-async';

export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  canonicalUrl: string;
  schemaData?: Record<string, any>;
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
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
    tags = []
  } = metadata;

  // Gerar keywords como string
  const keywordsString = keywords.length > 0 ? keywords.join(', ') : '';

  // Schema.org JSON-LD
  const generateSchemaData = () => {
    if (schemaData) {
      return JSON.stringify(schemaData);
    }

    // Schema padrão baseado no tipo
    const baseSchema = {
      '@context': 'https://schema.org',
      '@type': type === 'article' ? 'BlogPosting' : 'WebPage',
      name: title,
      description,
      url: canonicalUrl,
    };

    if (type === 'article' && publishedTime) {
      return JSON.stringify({
        ...baseSchema,
        '@type': 'BlogPosting',
        headline: title,
        datePublished: publishedTime,
        dateModified: modifiedTime || publishedTime,
        author: {
          '@type': 'Organization',
          name: author || 'AIMindset',
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
        image: ogImage,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalUrl
        },
        keywords: keywords.join(', '),
        articleSection: section,
        articleTag: tags
      });
    }

    return JSON.stringify(baseSchema);
  };

  return (
    <Helmet>
      {/* Título da página */}
      <title>{title}</title>
      
      {/* Meta tags básicas */}
      <meta name="description" content={description} />
      {keywordsString && <meta name="keywords" content={keywordsString} />}
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="AIMindset" />
      <meta property="og:locale" content="pt_BR" />
      {ogImage && <meta property="og:image" content={ogImage} />}
      {ogImage && <meta property="og:image:alt" content={title} />}
      {ogImage && <meta property="og:image:width" content="1200" />}
      {ogImage && <meta property="og:image:height" content="630" />}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
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
      
      {/* Preconnect para performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* Carregamento das fontes Google Fonts */}
      <link 
        href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Montserrat:wght@400;600;700&family=Roboto:wght@300;400;500;700&display=swap" 
        rel="stylesheet" 
        crossOrigin="anonymous"
      />
      
      {/* DNS Prefetch */}
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      
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
    </Helmet>
  );
};

export default SEOManager;