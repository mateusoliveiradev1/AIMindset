import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jywjqzhqynhnhetidzsa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ'
);

async function zerarTudo() {
  console.log('🚨 ZERANDO BANCO DE DADOS!');
  
  try {
    // Deletar feedbacks
    console.log('Deletando feedbacks...');
    await supabase.from('feedbacks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Deletar comentários
    console.log('Deletando comentários...');
    await supabase.from('comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Zerar contadores
    console.log('Zerando contadores...');
    await supabase.from('articles').update({
      positive_feedbacks: 0,
      negative_feedbacks: 0,
      comments_count: 0,
      likes_count: 0
    }).neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('✅ BANCO ZERADO COM SUCESSO!');
    
    // Verificar resultado
    const { data } = await supabase
      .from('articles')
      .select('title, positive_feedbacks, negative_feedbacks, comments_count, likes_count')
      .eq('published', true)
      .limit(3);
    
    console.log('\nVerificação:');
    data?.forEach(article => {
      console.log(`${article.title}: P=${article.positive_feedbacks}, N=${article.negative_feedbacks}, C=${article.comments_count}, L=${article.likes_count}`);
    });
    
  } catch (error) {
    console.error('❌ ERRO:', error);
  }
}

zerarTudo();