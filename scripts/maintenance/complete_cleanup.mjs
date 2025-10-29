import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function completeCleanup() {
  console.log('🧹 INICIANDO LIMPEZA COMPLETA DOS DADOS...\n');

  try {
    // 1. Limpar TODOS os feedbacks
    console.log('1️⃣ Removendo TODOS os feedbacks...');
    const { error: feedbackError } = await supabase
      .from('feedbacks')
      .delete()
      .neq('id', 0); // Remove todos os registros
    
    if (feedbackError) {
      console.error('❌ Erro ao remover feedbacks:', feedbackError);
    } else {
      console.log('✅ Todos os feedbacks removidos com sucesso!');
    }

    // 2. Limpar TODOS os comentários
    console.log('\n2️⃣ Removendo TODOS os comentários...');
    const { error: commentsError } = await supabase
      .from('comments')
      .delete()
      .gte('created_at', '1900-01-01'); // Remove todos os registros
    
    if (commentsError) {
      console.error('❌ Erro ao remover comentários:', commentsError);
    } else {
      console.log('✅ Todos os comentários removidos com sucesso!');
    }

    // 3. Resetar contadores na tabela articles
    console.log('\n3️⃣ Resetando contadores na tabela articles...');
    const { error: articlesError } = await supabase
      .from('articles')
      .update({
        positive_feedbacks: 0,
        negative_feedbacks: 0,
        comments_count: 0,
        likes_count: 0,
        positive_feedback: 0,
        negative_feedback: 0,
        total_likes: 0
      })
      .gte('created_at', '1900-01-01'); // Atualiza todos os artigos
    
    if (articlesError) {
      console.error('❌ Erro ao resetar contadores:', articlesError);
    } else {
      console.log('✅ Contadores resetados com sucesso!');
    }

    // 4. Verificar estado final
    console.log('\n4️⃣ Verificando estado final...');
    
    // Contar feedbacks restantes
    const { count: feedbackCount } = await supabase
      .from('feedbacks')
      .select('*', { count: 'exact', head: true });
    
    // Contar comentários restantes
    const { count: commentsCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true });
    
    // Verificar artigos
    const { data: articles } = await supabase
      .from('articles')
      .select('id, title, positive_feedbacks, negative_feedbacks, comments_count, likes_count, is_featured_manual')
      .order('id');

    console.log('\n📊 ESTADO FINAL:');
    console.log(`📝 Feedbacks restantes: ${feedbackCount || 0}`);
    console.log(`💬 Comentários restantes: ${commentsCount || 0}`);
    console.log('\n📚 ARTIGOS:');
    
    if (articles) {
      articles.forEach(article => {
        console.log(`- ${article.title}`);
        console.log(`  👍 Feedback positivo: ${article.positive_feedbacks}`);
        console.log(`  👎 Feedback negativo: ${article.negative_feedbacks}`);
        console.log(`  💬 Comentários: ${article.comments_count}`);
        console.log(`  ❤️ Likes: ${article.likes_count}`);
        console.log(`  ⭐ Fixado manualmente: ${article.is_featured_manual ? 'SIM' : 'NÃO'}`);
        console.log('');
      });
    }

    console.log('🎉 LIMPEZA COMPLETA FINALIZADA!');
    console.log('✅ Sistema limpo e pronto para funcionar em tempo real!');

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  }
}

// Executar limpeza
completeCleanup();