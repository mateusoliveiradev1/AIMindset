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

async function debugFeedbackMetrics() {
  console.log('🔍 DEBUGANDO MÉTRICAS DE FEEDBACK...\n');

  try {
    // 1. Verificar se há feedbacks na tabela
    console.log('1️⃣ Verificando feedbacks na tabela...');
    const { data: feedbacks, error: feedbackError } = await supabase
      .from('feedbacks')
      .select('*')
      .limit(10);

    if (feedbackError) {
      console.error('❌ Erro ao buscar feedbacks:', feedbackError);
    } else {
      console.log(`✅ Total de feedbacks encontrados: ${feedbacks?.length || 0}`);
      if (feedbacks && feedbacks.length > 0) {
        console.log('📋 Primeiros feedbacks:');
        feedbacks.forEach((feedback, index) => {
          console.log(`   ${index + 1}. ID: ${feedback.id}, Article: ${feedback.article_id}, Type: ${feedback.type}, Created: ${feedback.created_at}`);
        });
      }
    }

    // 2. Verificar artigos disponíveis
    console.log('\n2️⃣ Verificando artigos disponíveis...');
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title, slug')
      .limit(5);

    if (articlesError) {
      console.error('❌ Erro ao buscar artigos:', articlesError);
    } else {
      console.log(`✅ Total de artigos encontrados: ${articles?.length || 0}`);
      if (articles && articles.length > 0) {
        console.log('📋 Primeiros artigos:');
        articles.forEach((article, index) => {
          console.log(`   ${index + 1}. ID: ${article.id}, Title: ${article.title}`);
        });
      }
    }

    // 3. Testar função get_article_metrics para cada artigo
    if (articles && articles.length > 0) {
      console.log('\n3️⃣ Testando função get_article_metrics...');
      
      for (const article of articles.slice(0, 3)) {
        console.log(`\n🔍 Testando métricas para artigo: ${article.title}`);
        
        const { data: metrics, error: metricsError } = await supabase
          .rpc('get_article_metrics', { target_article_id: article.id });

        if (metricsError) {
          console.error(`❌ Erro ao buscar métricas para ${article.title}:`, metricsError);
        } else {
          console.log(`✅ Métricas para ${article.title}:`, JSON.stringify(metrics, null, 2));
        }
      }
    }

    // 4. Verificar contagem manual de feedbacks por artigo
    if (articles && articles.length > 0) {
      console.log('\n4️⃣ Verificação manual de feedbacks por artigo...');
      
      for (const article of articles.slice(0, 3)) {
        const { data: articleFeedbacks, error } = await supabase
          .from('feedbacks')
          .select('type')
          .eq('article_id', article.id);

        if (!error && articleFeedbacks) {
          const positive = articleFeedbacks.filter(f => f.type === 'positive').length;
          const negative = articleFeedbacks.filter(f => f.type === 'negative').length;
          console.log(`📊 ${article.title}: ${positive} positivos, ${negative} negativos`);
        }
      }
    }

    // 5. Verificar se a função RPC existe
    console.log('\n5️⃣ Verificando se função get_article_metrics existe...');
    const { data: functions, error: funcError } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'get_article_metrics');

    if (funcError) {
      console.log('⚠️ Não foi possível verificar funções (normal em alguns casos)');
    } else {
      console.log(`✅ Função get_article_metrics encontrada: ${functions?.length > 0 ? 'SIM' : 'NÃO'}`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugFeedbackMetrics();