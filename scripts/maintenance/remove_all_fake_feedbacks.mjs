import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function removeAllFakeFeedbacks() {
  try {
    console.log('🧹 Removendo TODOS os feedbacks fake inseridos pelos testes...');
    
    // IDs específicos dos feedbacks fake que foram inseridos
    const fakeIds = [
      'e56a3e6a-5d80-4f85-9676-10587ddc3f99', // like fake 1
      '533d7f56-455a-4b6c-a5f2-6364f89fec98', // like fake 2  
      '012385f7-0c3d-41a3-85ed-fd194b772a4e', // like fake 3
      'd4240735-9c76-4755-aaf7-1e44523c440a'  // positive fake
    ];
    
    console.log(`🎯 Removendo ${fakeIds.length} feedbacks fake específicos...`);
    
    // Remover todos os feedbacks fake
    const { error: deleteError } = await supabase
      .from('feedbacks')
      .delete()
      .in('id', fakeIds);
    
    if (deleteError) {
      console.error('❌ Erro ao remover feedbacks fake:', deleteError);
      return;
    }
    
    console.log(`✅ ${fakeIds.length} feedbacks fake removidos com sucesso!`);
    
    // Verificar se ainda restam feedbacks
    const { data: remainingFeedbacks, error: countError } = await supabase
      .from('feedbacks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (countError) {
      console.error('❌ Erro ao verificar feedbacks restantes:', countError);
      return;
    }
    
    console.log(`📊 Feedbacks restantes no banco: ${remainingFeedbacks.length}`);
    
    if (remainingFeedbacks.length === 0) {
      console.log('🎉 Banco de feedbacks limpo! Agora só terá feedbacks reais dos usuários.');
    } else {
      console.log('📋 Feedbacks restantes (apenas reais):');
      remainingFeedbacks.forEach((feedback, index) => {
        console.log(`${index + 1}. ID: ${feedback.id} - Tipo: ${feedback.type} - Criado: ${feedback.created_at}`);
      });
    }
    
    console.log('\n✨ Limpeza concluída! O sistema agora está pronto para receber apenas feedbacks reais.');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  }
}

removeAllFakeFeedbacks();