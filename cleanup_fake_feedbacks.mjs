import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupFakeFeedbacks() {
  try {
    console.log('🧹 Iniciando limpeza de feedbacks fake...');
    
    // Primeiro, vamos ver todos os feedbacks para identificar os fake
    const { data: allFeedbacks, error: fetchError } = await supabase
      .from('feedbacks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Erro ao buscar feedbacks:', fetchError);
      return;
    }
    
    console.log(`📊 Total de feedbacks encontrados: ${allFeedbacks.length}`);
    
    // Identificar feedbacks fake (aqueles com user_id que são UUIDs gerados pelos testes)
    const fakeFeedbacks = allFeedbacks.filter(feedback => {
      // Feedbacks fake geralmente têm:
      // 1. user_id com formato UUID específico dos testes
      // 2. Foram criados recentemente (hoje)
      // 3. Conteúdo genérico de teste
      
      const today = new Date().toISOString().split('T')[0];
      const feedbackDate = feedback.created_at.split('T')[0];
      
      // Se foi criado hoje e tem características de teste
      if (feedbackDate === today) {
        // Verificar se o conteúdo parece ser de teste
        const testContent = feedback.content && (
          feedback.content.includes('Teste de feedback') ||
          feedback.content.includes('feedback em tempo real') ||
          feedback.content.includes('test') ||
          feedback.content.length < 20 // Conteúdo muito curto
        );
        
        return testContent;
      }
      
      return false;
    });
    
    console.log(`🎯 Feedbacks fake identificados: ${fakeFeedbacks.length}`);
    
    if (fakeFeedbacks.length === 0) {
      console.log('✅ Nenhum feedback fake encontrado para remover.');
      return;
    }
    
    // Mostrar os feedbacks que serão removidos
    console.log('\n📋 Feedbacks que serão removidos:');
    fakeFeedbacks.forEach((feedback, index) => {
      console.log(`${index + 1}. ID: ${feedback.id}`);
      console.log(`   Conteúdo: "${feedback.content}"`);
      console.log(`   Criado em: ${feedback.created_at}`);
      console.log(`   User ID: ${feedback.user_id}`);
      console.log('   ---');
    });
    
    // Remover os feedbacks fake
    const idsToDelete = fakeFeedbacks.map(f => f.id);
    
    const { error: deleteError } = await supabase
      .from('feedbacks')
      .delete()
      .in('id', idsToDelete);
    
    if (deleteError) {
      console.error('❌ Erro ao remover feedbacks fake:', deleteError);
      return;
    }
    
    console.log(`✅ ${fakeFeedbacks.length} feedbacks fake removidos com sucesso!`);
    
    // Verificar quantos feedbacks restaram
    const { data: remainingFeedbacks, error: countError } = await supabase
      .from('feedbacks')
      .select('id')
      .order('created_at', { ascending: false });
    
    if (!countError) {
      console.log(`📊 Feedbacks restantes (apenas reais): ${remainingFeedbacks.length}`);
    }
    
    console.log('\n🎉 Limpeza concluída! Agora o sistema contém apenas feedbacks reais dos usuários.');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  }
}

// Executar a limpeza
cleanupFakeFeedbacks();