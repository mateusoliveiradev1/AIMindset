import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGetArticleMetrics() {
  console.log('🔍 TESTANDO FUNÇÃO get_article_metrics:');
  console.log('==================================================');

  try {
    // Primeiro, buscar alguns artigos para testar
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title')
      .limit(3);

    if (articlesError) {
      console.error('❌ Erro ao buscar artigos:', articlesError);
      return;
    }

    console.log(`📚 Testando com ${articles.length} artigos:`);
    
    for (const article of articles) {
      console.log(`\n🔍 Testando artigo: "${article.title}"`);
      console.log(`   ID: ${article.id}`);
      
      // Testar a função get_article_metrics
      const { data: metrics, error: metricsError } = await supabase
        .rpc('get_article_metrics', { target_article_id: article.id });

      if (metricsError) {
        console.error(`❌ Erro na função get_article_metrics:`, metricsError);
        continue;
      }

      if (metrics && metrics.length > 0) {
        const metric = metrics[0];
        console.log(`✅ Métricas encontradas:`);
        console.log(`   Positive Feedback: ${metric.positive_feedback}`);
        console.log(`   Negative Feedback: ${metric.negative_feedback}`);
        console.log(`   Total Comments: ${metric.total_comments}`);
        console.log(`   Approval Rate: ${metric.approval_rate}%`);
      } else {
        console.log(`⚠️ Nenhuma métrica retornada`);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testGetArticleMetrics();