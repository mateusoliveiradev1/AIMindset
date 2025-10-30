import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function getArticleSlugs() {
  console.log('🔍 VERIFICANDO SLUGS DOS ARTIGOS...\n');
  
  try {
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, title, slug, published')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Erro:', error);
      return;
    }

    console.log('📄 ARTIGOS DISPONÍVEIS:');
    console.log('='.repeat(50));
    articles.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`);
      console.log(`   ID: ${article.id}`);
      console.log(`   Slug: ${article.slug}`);
      console.log(`   URL: /artigo/${article.slug}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Erro ao buscar artigos:', error);
  }
}

getArticleSlugs();