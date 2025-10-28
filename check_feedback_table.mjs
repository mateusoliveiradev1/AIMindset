import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFeedbackTable() {
  console.log('🔍 VERIFICANDO TABELA FEEDBACK:');
  console.log('==================================================');
  
  try {
    // Verificar se a tabela feedback existe e quantos registros tem
    const { data: feedbackData, error: feedbackError, count } = await supabase
      .from('feedback')
      .select('*', { count: 'exact' });
    
    if (feedbackError) {
      console.error('❌ Erro ao consultar tabela feedback:', feedbackError);
      return;
    }
    
    console.log(`📊 Total de registros na tabela feedback: ${count}`);
    
    if (feedbackData && feedbackData.length > 0) {
      console.log('\n📝 REGISTROS ENCONTRADOS:');
      feedbackData.forEach((feedback, index) => {
        console.log(`${index + 1}. ID: ${feedback.id}`);
        console.log(`   Article ID: ${feedback.article_id}`);
        console.log(`   Útil: ${feedback.useful}`);
        console.log(`   Criado em: ${feedback.created_at}`);
        console.log('   ---');
      });
    } else {
      console.log('✅ Tabela feedback está vazia - limpeza bem-sucedida!');
    }
    
    // Verificar também os contadores nos artigos
    console.log('\n🔍 VERIFICANDO CONTADORES NOS ARTIGOS:');
    console.log('==================================================');
    
    const { data: articlesData, error: articlesError } = await supabase
      .from('articles')
      .select('title, positive_feedback, negative_feedback, approval_rate')
      .eq('published', true)
      .order('created_at', { ascending: false });
    
    if (articlesError) {
      console.error('❌ Erro ao consultar artigos:', articlesError);
      return;
    }
    
    articlesData.forEach((article, index) => {
      const total = article.positive_feedback + article.negative_feedback;
      console.log(`${index + 1}. ${article.title}`);
      console.log(`   Positivo: ${article.positive_feedback} | Negativo: ${article.negative_feedback} | Total: ${total}`);
      console.log(`   Approval Rate: ${article.approval_rate}%`);
      console.log('   ---');
    });
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkFeedbackTable();