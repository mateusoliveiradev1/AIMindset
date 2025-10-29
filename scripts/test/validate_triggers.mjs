import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function validateTriggers() {
  console.log('⚡ VALIDANDO TRIGGERS EM TEMPO REAL...\n');

  try {
    // Pegar o primeiro artigo para teste
    const { data: articles } = await supabase
      .from('articles')
      .select('id, title, positive_feedbacks, negative_feedbacks, comments_count, likes_count')
      .limit(1);

    if (!articles || articles.length === 0) {
      console.log('❌ Nenhum artigo encontrado para teste');
      return;
    }

    const testArticle = articles[0];
    console.log(`🎯 Testando com artigo: "${testArticle.title}"`);
    console.log(`📊 Estado inicial:`);
    console.log(`  👍 Feedbacks positivos: ${testArticle.positive_feedbacks}`);
    console.log(`  👎 Feedbacks negativos: ${testArticle.negative_feedbacks}`);
    console.log(`  💬 Comentários: ${testArticle.comments_count}`);
    console.log(`  ❤️ Likes: ${testArticle.likes_count}\n`);

    // 1. TESTE: Adicionar feedback positivo
    console.log('1️⃣ TESTE: Adicionando feedback positivo...');
    const { error: feedbackError } = await supabase
      .from('feedbacks')
      .insert({
        article_id: testArticle.id,
        type: 'positive',
        content: 'Teste de feedback positivo'
      });

    if (feedbackError) {
      console.error('❌ Erro ao adicionar feedback:', feedbackError);
    } else {
      console.log('✅ Feedback positivo adicionado!');
    }

    // Aguardar um pouco para o trigger processar
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verificar se o contador foi atualizado
    const { data: afterFeedback } = await supabase
      .from('articles')
      .select('positive_feedbacks, negative_feedbacks, comments_count, likes_count')
      .eq('id', testArticle.id)
      .single();

    console.log(`📊 Após feedback positivo:`);
    console.log(`  👍 Feedbacks positivos: ${afterFeedback.positive_feedbacks} (esperado: ${testArticle.positive_feedbacks + 1})`);
    console.log(`  👎 Feedbacks negativos: ${afterFeedback.negative_feedbacks}`);
    console.log(`  💬 Comentários: ${afterFeedback.comments_count}`);
    console.log(`  ❤️ Likes: ${afterFeedback.likes_count}\n`);

    // 2. TESTE: Adicionar comentário
    console.log('2️⃣ TESTE: Adicionando comentário...');
    const { data: newComment, error: commentError } = await supabase
      .from('comments')
      .insert({
        article_id: testArticle.id,
        user_name: 'Teste User',
        content: 'Este é um comentário de teste para validar os triggers'
      })
      .select()
      .single();

    if (commentError) {
      console.error('❌ Erro ao adicionar comentário:', commentError);
    } else {
      console.log('✅ Comentário adicionado!');
    }

    // Aguardar um pouco para o trigger processar
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verificar se o contador foi atualizado
    const { data: afterComment } = await supabase
      .from('articles')
      .select('positive_feedbacks, negative_feedbacks, comments_count, likes_count')
      .eq('id', testArticle.id)
      .single();

    console.log(`📊 Após comentário:`);
    console.log(`  👍 Feedbacks positivos: ${afterComment.positive_feedbacks}`);
    console.log(`  👎 Feedbacks negativos: ${afterComment.negative_feedbacks}`);
    console.log(`  💬 Comentários: ${afterComment.comments_count} (esperado: ${afterFeedback.comments_count + 1})`);
    console.log(`  ❤️ Likes: ${afterComment.likes_count}\n`);

    // 3. TESTE: Adicionar like no comentário
    if (newComment) {
      console.log('3️⃣ TESTE: Adicionando like no comentário...');
      const { error: likeError } = await supabase
        .from('comments')
        .update({ likes: 1 })
        .eq('id', newComment.id);

      if (likeError) {
        console.error('❌ Erro ao adicionar like:', likeError);
      } else {
        console.log('✅ Like adicionado no comentário!');
      }

      // Aguardar um pouco para o trigger processar
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verificar se o contador foi atualizado
      const { data: afterLike } = await supabase
        .from('articles')
        .select('positive_feedbacks, negative_feedbacks, comments_count, likes_count')
        .eq('id', testArticle.id)
        .single();

      console.log(`📊 Após like no comentário:`);
      console.log(`  👍 Feedbacks positivos: ${afterLike.positive_feedbacks}`);
      console.log(`  👎 Feedbacks negativos: ${afterLike.negative_feedbacks}`);
      console.log(`  💬 Comentários: ${afterLike.comments_count}`);
      console.log(`  ❤️ Likes: ${afterLike.likes_count} (esperado: ${afterComment.likes_count + 1})\n`);
    }

    // 4. TESTE: Remover dados de teste
    console.log('4️⃣ LIMPEZA: Removendo dados de teste...');
    
    // Remover feedback de teste
    await supabase
      .from('feedbacks')
      .delete()
      .eq('article_id', testArticle.id);

    // Remover comentário de teste
    if (newComment) {
      await supabase
        .from('comments')
        .delete()
        .eq('id', newComment.id);
    }

    // Aguardar um pouco para os triggers processarem
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verificar estado final
    const { data: finalState } = await supabase
      .from('articles')
      .select('positive_feedbacks, negative_feedbacks, comments_count, likes_count')
      .eq('id', testArticle.id)
      .single();

    console.log(`📊 Estado final (após limpeza):`);
    console.log(`  👍 Feedbacks positivos: ${finalState.positive_feedbacks} (esperado: 0)`);
    console.log(`  👎 Feedbacks negativos: ${finalState.negative_feedbacks} (esperado: 0)`);
    console.log(`  💬 Comentários: ${finalState.comments_count} (esperado: 0)`);
    console.log(`  ❤️ Likes: ${finalState.likes_count} (esperado: 0)\n`);

    // Análise dos resultados
    console.log('🔍 ANÁLISE DOS TRIGGERS:');
    
    const feedbackTriggerWorking = afterFeedback.positive_feedbacks === (testArticle.positive_feedbacks + 1);
    const commentTriggerWorking = afterComment.comments_count === (afterFeedback.comments_count + 1);
    const cleanupWorking = finalState.positive_feedbacks === 0 && finalState.comments_count === 0 && finalState.likes_count === 0;

    console.log(`✅ Trigger de Feedback: ${feedbackTriggerWorking ? 'FUNCIONANDO' : 'FALHOU'}`);
    console.log(`✅ Trigger de Comentário: ${commentTriggerWorking ? 'FUNCIONANDO' : 'FALHOU'}`);
    console.log(`✅ Triggers de Limpeza: ${cleanupWorking ? 'FUNCIONANDO' : 'FALHOU'}`);

    const allTriggersWorking = feedbackTriggerWorking && commentTriggerWorking && cleanupWorking;
    
    console.log(`\n🎉 RESULTADO GERAL: ${allTriggersWorking ? 'TODOS OS TRIGGERS FUNCIONANDO!' : 'ALGUNS TRIGGERS FALHARAM!'}`);
    
    if (allTriggersWorking) {
      console.log('✅ Sistema de tempo real está 100% operacional!');
    } else {
      console.log('❌ Alguns triggers precisam ser verificados/criados.');
    }

  } catch (error) {
    console.error('❌ Erro durante validação dos triggers:', error);
  }
}

// Executar validação
validateTriggers();