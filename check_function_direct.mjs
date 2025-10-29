import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFunction() {
  console.log('🔍 VERIFICANDO FUNÇÃO get_article_metrics');
  console.log('==========================================');

  try {
    // 1. Testar chamada direta da função com parâmetro nomeado
    console.log('\n1️⃣ Testando chamada direta da função...');
    const articleId = 'b365d243-b56a-4699-bace-8edd53a7cff5';
    
    try {
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('get_article_metrics', { target_article_id: articleId });
      
      if (metricsError) {
        console.log('❌ Erro ao chamar função:', metricsError);
      } else {
        console.log('✅ Função funcionou! Métricas:', metricsData);
      }
    } catch (error) {
      console.log('❌ Erro ao chamar função:', error);
    }

    // 1.1 Testar também com parâmetro posicional
    console.log('1️⃣.1 Testando com parâmetro posicional...');
    try {
      const { data: metricsData2, error: metricsError2 } = await supabase
        .rpc('get_article_metrics', [articleId]);
      
      if (metricsError2) {
        console.log('❌ Erro ao chamar função (posicional):', metricsError2);
      } else {
        console.log('✅ Função funcionou (posicional)! Métricas:', metricsData2);
      }
    } catch (error) {
      console.log('❌ Erro ao chamar função (posicional):', error);
    }

    // Verificar se existem dados nas tabelas
    console.log('\n2️⃣ Verificando dados nas tabelas...');
    
    const { data: feedbacks, error: feedbackError } = await supabase
      .from('feedback')
      .select('*')
      .eq('article_id', 'b365d243-b56a-4699-bace-8edd53a7cff5');

    if (feedbackError) {
      console.error('❌ Erro ao buscar feedbacks:', feedbackError);
    } else {
      console.log(`📊 Feedbacks para o artigo: ${feedbacks.length}`);
      console.log('Feedbacks:', feedbacks);
    }

    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .eq('article_id', 'b365d243-b56a-4699-bace-8edd53a7cff5');

    if (commentsError) {
      console.error('❌ Erro ao buscar comentários:', commentsError);
    } else {
      console.log(`💬 Comentários para o artigo: ${comments.length}`);
      console.log('Comentários:', comments);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkFunction();