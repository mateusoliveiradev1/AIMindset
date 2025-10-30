import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSpecificArticle() {
  const articleId = 'e7c74735-11e5-496a-b8f7-2460c09739a6';
  
  console.log(`🔍 Verificando artigo específico: ${articleId}\n`);

  // 1. Buscar o artigo
  const { data: article, error: articleError } = await supabase
    .from('articles')
    .select('*')
    .eq('id', articleId)
    .single();

  if (articleError) {
    console.error('❌ Erro ao buscar artigo:', articleError);
    return;
  }

  console.log('📄 Artigo encontrado:');
  console.log(`   Título: ${article.title}`);
  console.log(`   Slug: ${article.slug}`);
  console.log(`   ID: ${article.id}\n`);

  // 2. Buscar feedbacks para este artigo
  const { data: feedbacks, error: feedbackError } = await supabase
    .from('feedbacks')
    .select('*')
    .eq('article_id', articleId);

  if (feedbackError) {
    console.error('❌ Erro ao buscar feedbacks:', feedbackError);
  } else {
    console.log(`✅ Feedbacks encontrados: ${feedbacks.length}`);
    feedbacks.forEach((feedback, index) => {
      console.log(`   ${index + 1}. Type: ${feedback.type}, Created: ${feedback.created_at}`);
    });
  }

  // 3. Testar função get_article_metrics para este artigo específico
  console.log('\n🧪 Testando get_article_metrics para este artigo...');
  const { data: metrics, error: metricsError } = await supabase
    .rpc('get_article_metrics', { target_article_id: articleId });

  if (metricsError) {
    console.error('❌ Erro na função get_article_metrics:', metricsError);
  } else {
    console.log('✅ Métricas retornadas:', JSON.stringify(metrics, null, 2));
  }
}

checkSpecificArticle();