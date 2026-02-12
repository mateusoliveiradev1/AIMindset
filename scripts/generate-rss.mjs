import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Carregar variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const SITE_URL = 'https://aimindset.com.br';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const escapeXml = (unsafe) => {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
};

async function generateRSS() {
  console.log('🚀 Iniciando geração do feed RSS...');

  try {
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, title, slug, excerpt, content, published, created_at, image_url, category_id')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`📄 ${articles.length} artigos encontrados.`);

    const items = articles.map(article => {
      const link = `${SITE_URL}/artigo/${article.slug}`;
      const pubDate = new Date(article.created_at).toUTCString();
      const description = escapeXml(article.excerpt || article.content?.substring(0, 160) + '...');
      
      return `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
      ${article.image_url ? `<enclosure url="${article.image_url}" type="image/jpeg" />` : ''}
    </item>`;
    }).join('');

    const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AIMindset</title>
    <link>${SITE_URL}</link>
    <description>Insights sobre Inteligência Artificial, Tecnologia e Produtividade.</description>
    <language>pt-br</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

    const outputPath = path.join(__dirname, '../../public/feed.xml');
    fs.writeFileSync(outputPath, rss);

    console.log(`✅ Feed RSS gerado com sucesso em: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Erro ao gerar RSS:', error);
    process.exit(1);
  }
}

generateRSS();
