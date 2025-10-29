import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugMetrics() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DAS MÉTRICAS - VERSÃO CORRIGIDA');
  console.log('=====================================================');

  try {
    // 1. Verificar se a função get_article_metrics existe
    console.log('\n1️⃣ Testando função get_article_metrics...');
    
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title')
      .limit(3);

    if (articlesError) {
      console.error('❌ Erro ao buscar artigos:', articlesError);
      return;
    }

    console.log(`📚 Encontrados ${articles.length} artigos para teste`);

    for (const article of articles) {
      console.log(`\n🔍 Testando artigo: "${article.title}"`);
      console.log(`   ID: ${article.id}`);
      
      // Testar com a nova assinatura da função (apenas UUID)
      const { data: metrics, error: error } = await supabase
        .rpc('get_article_metrics', { target_article_id: article.id });

      if (error) {
        console.error(`❌ Erro com get_article_metrics:`, error);
      } else {
        console.log(`✅ Resultado:`, metrics);
      }
    }

    // 2. Verificar dados brutos nas tabelas
    console.log('\n2️⃣ Verificando dados brutos...');
    
    const { data: feedbacks, error: feedbackError } = await supabase
      .from('feedback')
      .select('*')
      .limit(5);

    if (feedbackError) {
      console.error('❌ Erro ao buscar feedbacks:', feedbackError);
    } else {
      console.log(`📊 Feedbacks encontrados: ${feedbacks.length}`);
      if (feedbacks.length > 0) {
        console.log('Exemplo de feedback:', feedbacks[0]);
      }
    }

    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .limit(5);

    if (commentsError) {
      console.error('❌ Erro ao buscar comentários:', commentsError);
    } else {
      console.log(`💬 Comentários encontrados: ${comments.length}`);
      if (comments.length > 0) {
        console.log('Exemplo de comentário:', comments[0]);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugMetrics();