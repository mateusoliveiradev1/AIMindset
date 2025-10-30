import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearAllFeedbacks() {
  console.log('🧹 Iniciando limpeza completa de feedbacks...');
  
  try {
    // 1. Deletar todos os registros da tabela 'feedbacks' (plural)
    console.log('📋 Deletando todos os registros da tabela "feedbacks" (plural)...');
    const { data: deletedFeedbacks, error: feedbacksError } = await supabase
      .from('feedbacks')
      .delete()
      .neq('id', 'never-match'); // Deleta todos os registros
    
    if (feedbacksError) {
      console.error('❌ Erro ao deletar feedbacks:', feedbacksError);
    } else {
      console.log('✅ Todos os registros da tabela "feedbacks" foram deletados');
    }

    // 2. Verificar e deletar da tabela 'feedback' (singular) se existir
    console.log('📋 Verificando tabela "feedback" (singular)...');
    const { data: feedbackSingular, error: feedbackSingularError } = await supabase
      .from('feedback')
      .select('*');
    
    if (feedbackSingularError) {
      console.log('ℹ️ Tabela "feedback" (singular) não existe ou não tem dados');
    } else if (feedbackSingular && feedbackSingular.length > 0) {
      console.log(`📋 Encontrados ${feedbackSingular.length} registros na tabela "feedback" (singular). Deletando...`);
      const { error: deleteFeedbackError } = await supabase
        .from('feedback')
        .delete()
        .neq('id', 'never-match');
      
      if (deleteFeedbackError) {
        console.error('❌ Erro ao deletar da tabela "feedback":', deleteFeedbackError);
      } else {
        console.log('✅ Todos os registros da tabela "feedback" foram deletados');
      }
    } else {
      console.log('ℹ️ Tabela "feedback" (singular) está vazia');
    }

    // 3. Resetar contadores nos artigos
    console.log('📊 Resetando contadores de feedback nos artigos...');
    const { data: updatedArticles, error: articlesError } = await supabase
      .from('articles')
      .update({
        positive_feedback: 0,
        negative_feedback: 0,
        approval_rate: 0
      })
      .neq('id', 'never-match'); // Atualiza todos os artigos
    
    if (articlesError) {
      console.error('❌ Erro ao resetar contadores dos artigos:', articlesError);
    } else {
      console.log('✅ Contadores de feedback dos artigos foram resetados');
    }

    // 4. Verificação final
    console.log('🔍 Verificação final...');
    
    const { data: remainingFeedbacks, error: checkError } = await supabase
      .from('feedbacks')
      .select('*');
    
    if (checkError) {
      console.error('❌ Erro na verificação final:', checkError);
    } else {
      console.log(`📊 Feedbacks restantes na tabela "feedbacks": ${remainingFeedbacks?.length || 0}`);
    }

    const { data: articles, error: articlesCheckError } = await supabase
      .from('articles')
      .select('id, title, positive_feedback, negative_feedback, approval_rate')
      .limit(5);
    
    if (articlesCheckError) {
      console.error('❌ Erro ao verificar artigos:', articlesCheckError);
    } else {
      console.log('📊 Primeiros 5 artigos após reset:');
      articles?.forEach(article => {
        console.log(`  - ${article.title}: +${article.positive_feedback} -${article.negative_feedback} (${article.approval_rate}%)`);
      });
    }

    console.log('🎉 Limpeza completa finalizada! Tudo zerado para testes com dados reais.');
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

clearAllFeedbacks();