import type { VercelRequest, VercelResponse } from '@vercel/node';
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

const generateSitemapXML = (urls: SitemapUrl[]): string => {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
  xml += ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

  urls.forEach(url => {
    xml += '  <url>\n';
    xml += `    <loc>${url.loc}</loc>\n`;
    
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
        xml += `      <image:loc>${image.loc}</image:loc>\n`;
        
        if (image.title) {
          xml += `      <image:title>${image.title}</image:title>\n`;
        }
        
        if (image.caption) {
          xml += `      <image:caption>${image.caption}</image:caption>\n`;
        }
        
        xml += '    </image:image>\n';
      });
    }
    
    xml += '  </url>\n';
  });

  xml += '</urlset>';
  return xml;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const baseUrl = process.env.VITE_SITE_URL || 'https://aimindset.com.br';
    const urls: SitemapUrl[] = [];

    // Buscar metadados SEO para melhorar lastmod e priorização
    const { data: seoData } = await supabase
      .from('seo_metadata')
      .select('page_type, page_slug, title, updated_at, canonical_url');

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

    // Adicionar páginas estáticas com lastmod via seo_metadata quando possível
    staticPages.forEach(page => {
      const seoMeta = seoData?.find(meta =>
        meta.page_type === page.type ||
        (page.type === 'all_articles' && meta.page_type === 'all_articles') ||
        meta.page_slug === page.loc.replace('/', '') ||
        (meta.canonical_url && meta.canonical_url.includes(`${baseUrl}${page.loc}`))
      );

      urls.push({
        loc: `${baseUrl}${page.loc}`,
        lastmod: seoMeta?.updated_at
          ? new Date(seoMeta.updated_at).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        changefreq: page.changefreq,
        priority: page.priority
      });
    });

    // Buscar artigos publicados
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('slug, title, excerpt, image_url, updated_at, created_at')
      .eq('published', true)
      .order('updated_at', { ascending: false })
      .limit(200);

    if (articlesError) {
      console.error('Erro ao buscar artigos:', articlesError);
    } else if (articles) {
      articles.forEach(article => {
        // Buscar metadados SEO do artigo para lastmod mais preciso
        const seoMeta = seoData?.find(meta => meta.page_type === 'article' && meta.page_slug === article.slug);

        const articleUrl: SitemapUrl = {
          loc: `${baseUrl}/artigo/${article.slug}`,
          lastmod: seoMeta?.updated_at
            ? new Date(seoMeta.updated_at).toISOString().split('T')[0]
            : new Date(article.updated_at || article.created_at).toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: 0.8
        };

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

    // Buscar categorias
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('slug, name, description, updated_at, created_at')
      .order('name');

    if (categoriesError) {
      console.error('Erro ao buscar categorias:', categoriesError);
    } else if (categories) {
      categories.forEach(category => {
        urls.push({
          loc: `${baseUrl}/categoria/${category.slug}`,
          lastmod: new Date(category.updated_at || category.created_at).toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: 0.7
        });
      });
    }

    // Ordenar URLs por prioridade (maior primeiro)
    urls.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Gerar XML do sitemap
    const sitemap = generateSitemapXML(urls);

    // Configurar headers otimizados
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=7200');
    res.setHeader('X-Robots-Tag', 'noindex');
    res.setHeader('Last-Modified', new Date().toUTCString());
    
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Erro ao gerar sitemap:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}