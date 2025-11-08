import { Request, Response } from 'express';
import { supabase } from '../src/lib/supabase';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  images?: Array<{
    loc: string;
    title?: string;
    caption?: string;
  }>;
}

interface SeoMetadata {
  page_type: string;
  page_slug: string;
  title: string;
  description: string;
  canonical_url: string;
  updated_at: string;
}

export const generateSitemap = async (req: Request, res: Response) => {
  try {
    const baseUrl = process.env.VITE_SITE_URL || 'https://aimindset.com.br';
    const urls: SitemapUrl[] = [];

    // Buscar metadados SEO da tabela seo_metadata
    const { data: seoData, error: seoError } = await supabase
      .from('seo_metadata')
      .select('*')
      .order('updated_at', { ascending: false });

    if (seoError) {
      console.error('Erro ao buscar metadados SEO:', seoError);
    }

    // Páginas estáticas com prioridades otimizadas
    const staticPages = [
      { loc: '/', changefreq: 'daily' as const, priority: 1.0, type: 'home' },
      { loc: '/sobre', changefreq: 'monthly' as const, priority: 0.8, type: 'about' },
      { loc: '/contato', changefreq: 'monthly' as const, priority: 0.7, type: 'contact' },
      { loc: '/privacidade', changefreq: 'monthly' as const, priority: 0.6, type: 'privacy' },
      { loc: '/newsletter', changefreq: 'weekly' as const, priority: 0.6, type: 'newsletter' },
      // Usa page_type canonical 'all_articles' para página agregadora
      { loc: '/artigos', changefreq: 'daily' as const, priority: 0.9, type: 'all_articles' },
      { loc: '/categorias', changefreq: 'weekly' as const, priority: 0.8, type: 'categories' }
    ];

    staticPages.forEach(page => {
      // Buscar metadados SEO específicos se disponíveis
      const seoMeta = seoData?.find(meta => 
        meta.page_type === page.type ||
        (page.type === 'all_articles' && meta.page_type === 'all_articles') ||
        meta.page_slug === page.loc.replace('/', '') || 
        meta.canonical_url?.includes(page.loc)
      );

      urls.push({
        loc: `${baseUrl}${page.loc}`,
        lastmod: seoMeta?.updated_at ? 
          new Date(seoMeta.updated_at).toISOString().split('T')[0] : 
          new Date().toISOString().split('T')[0],
        changefreq: page.changefreq,
        priority: page.priority
      });
    });

    // Buscar artigos publicados com informações completas
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select(`
        slug, 
        title,
        excerpt,
        image_url,
        updated_at, 
        created_at,
        category_id,
        categories(slug, name)
      `)
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (articlesError) {
      console.error('Erro ao buscar artigos:', articlesError);
    } else if (articles) {
      articles.forEach(article => {
        // Buscar metadados SEO específicos do artigo
        const seoMeta = seoData?.find(meta => 
          meta.page_type === 'article' && meta.page_slug === article.slug
        );

        const articleUrl: SitemapUrl = {
          loc: `${baseUrl}/artigo/${article.slug}`,
          lastmod: seoMeta?.updated_at ? 
            new Date(seoMeta.updated_at).toISOString().split('T')[0] : 
            new Date(article.updated_at || article.created_at).toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: 0.8
        };

        // Adicionar imagens se disponíveis
        if (article.image_url) {
          articleUrl.images = [{
            loc: article.image_url,
            title: article.title,
            caption: article.excerpt || article.title
          }];
        }

        urls.push(articleUrl);
      });
    }

    // Buscar categorias com contagem de artigos
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select(`
        slug, 
        name,
        description,
        updated_at, 
        created_at,
        articles(count)
      `)
      .order('name');

    if (categoriesError) {
      console.error('Erro ao buscar categorias:', categoriesError);
    } else if (categories) {
      categories.forEach(category => {
        // Buscar metadados SEO específicos da categoria
        const seoMeta = seoData?.find(meta => 
          meta.page_type === 'category' && meta.page_slug === category.slug
        );

        // Prioridade baseada no número de artigos
        const articleCount = Array.isArray(category.articles) ? category.articles.length : 0;
        const priority = Math.min(0.9, 0.6 + (articleCount * 0.05));

        urls.push({
          loc: `${baseUrl}/categoria/${category.slug}`,
          lastmod: seoMeta?.updated_at ? 
            new Date(seoMeta.updated_at).toISOString().split('T')[0] : 
            new Date(category.updated_at || category.created_at).toISOString().split('T')[0],
          changefreq: articleCount > 5 ? 'daily' : 'weekly',
          priority: priority
        });
      });
    }

    // Ordenar URLs por prioridade (maior primeiro)
    urls.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Gerar XML do sitemap
    const sitemap = generateSitemapXML(urls);

    // Configurar headers otimizados
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=7200'); // Cache por 1h (2h no CDN)
    res.setHeader('X-Robots-Tag', 'noindex'); // Sitemap não deve ser indexado
    res.setHeader('Last-Modified', new Date().toUTCString());
    
    res.send(sitemap);
  } catch (error) {
    console.error('Erro ao gerar sitemap:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

const generateSitemapXML = (urls: SitemapUrl[]): string => {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
  xml += ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"';
  xml += ' xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n';

  urls.forEach(url => {
    xml += '  <url>\n';
    xml += `    <loc><![CDATA[${url.loc}]]></loc>\n`;
    
    if (url.lastmod) {
      xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    }
    
    if (url.changefreq) {
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    }
    
    if (url.priority !== undefined) {
      xml += `    <priority>${url.priority.toFixed(1)}</priority>\n`;
    }

    // Adicionar imagens se disponíveis
    if (url.images && url.images.length > 0) {
      url.images.forEach(image => {
        xml += '    <image:image>\n';
        xml += `      <image:loc><![CDATA[${image.loc}]]></image:loc>\n`;
        
        if (image.title) {
          xml += `      <image:title><![CDATA[${image.title}]]></image:title>\n`;
        }
        
        if (image.caption) {
          xml += `      <image:caption><![CDATA[${image.caption}]]></image:caption>\n`;
        }
        
        xml += '    </image:image>\n';
      });
    }
    
    xml += '  </url>\n';
  });

  xml += '</urlset>';
  return xml;
};

// Endpoint para robots.txt
export const generateRobotsTxt = (req: Request, res: Response) => {
  try {
    const baseUrl = process.env.VITE_SITE_URL || 'https://aimindset.com.br';
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    let robotsTxt = '';

    if (isDevelopment) {
      // Em desenvolvimento, bloquear todos os bots
      robotsTxt = `User-agent: *
Disallow: /

# Este é um ambiente de desenvolvimento
# Sitemap: ${baseUrl}/sitemap.xml`;
    } else {
      // Em produção, configuração otimizada
      robotsTxt = `# Robots.txt para AIMindset - Otimizado para SEO
# Gerado automaticamente em ${new Date().toISOString()}

# Permitir todos os bots principais
User-agent: *
Allow: /

# Configurações específicas para Google
User-agent: Googlebot
Allow: /
Crawl-delay: 1

# Configurações específicas para Bing
User-agent: Bingbot
Allow: /
Crawl-delay: 2

# Configurações para outros bots importantes
User-agent: Slurp
Allow: /
Crawl-delay: 2

User-agent: DuckDuckBot
Allow: /
Crawl-delay: 1

User-agent: Baiduspider
Allow: /
Crawl-delay: 3

# Bloquear diretórios administrativos e técnicos
Disallow: /api/
Disallow: /admin/
Disallow: /private/
Disallow: /temp/
Disallow: /cache/
Disallow: /.well-known/
Disallow: /node_modules/
Disallow: /dist/
Disallow: /build/

# Bloquear arquivos específicos
Disallow: /*.json$
Disallow: /*.xml$ 
Disallow: /*.log$
Disallow: /*.tmp$
Disallow: /*?utm_*
Disallow: /*?ref=*
Disallow: /*?source=*

# Permitir arquivos importantes para SEO e funcionamento
Allow: /robots.txt
Allow: /sitemap.xml
Allow: /favicon.ico
Allow: /manifest.json
Allow: /*.css$
Allow: /*.js$
Allow: /*.png$
Allow: /*.jpg$
Allow: /*.jpeg$
Allow: /*.gif$
Allow: /*.svg$
Allow: /*.webp$

# Bloquear bots maliciosos conhecidos
User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: MegaIndex
Disallow: /

# Sitemap principal
Sitemap: ${baseUrl}/sitemap.xml

# Host preferido (evita conteúdo duplicado)
Host: ${baseUrl.replace('https://', '').replace('http://', '')}`;
    }

    // Headers otimizados
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=172800'); // Cache 24h (48h no CDN)
    res.setHeader('Last-Modified', new Date().toUTCString());
    res.setHeader('X-Robots-Tag', 'noindex, nofollow'); // robots.txt não deve ser indexado
    
    res.send(robotsTxt);
  } catch (error) {
    console.error('Erro ao gerar robots.txt:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};