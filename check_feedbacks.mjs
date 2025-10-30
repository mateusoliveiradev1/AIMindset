import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAllFeedbacks() {
  try {
    console.log('🔍 Verificando todos os feedbacks no banco...');
    
    const { data: allFeedbacks, error: fetchError } = await supabase
      .from('feedbacks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Erro ao buscar feedbacks:', fetchError);
      return;
    }
    
    console.log(`📊 Total de feedbacks: ${allFeedbacks.length}\n`);
    
    allFeedbacks.forEach((feedback, index) => {
      console.log(`${index + 1}. ID: ${feedback.id}`);
      console.log(`   Conteúdo: "${feedback.content}"`);
      console.log(`   Tipo: ${feedback.type}`);
      console.log(`   User ID: ${feedback.user_id}`);
      console.log(`   Article ID: ${feedback.article_id}`);
      console.log(`   Criado em: ${feedback.created_at}`);
      console.log(`   Atualizado em: ${feedback.updated_at}`);
      console.log('   ---\n');
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkAllFeedbacks();