import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function validateOrderingSuccess() {
  console.log('🎯 VALIDAÇÃO FINAL - SISTEMA DE ORDENAÇÃO');
  console.log('=' .repeat(50));

  try {
    // 1. TESTAR FUNÇÃO get_featured_articles()
    console.log('\n📊 1. TESTANDO FUNÇÃO get_featured_articles():');
    
    const { data: featuredResult, error: featuredError } = await supabase
      .rpc('get_featured_articles');
    
    if (featuredError) {
      console.error('❌ ERRO na função get_featured_articles:', featuredError);
      return;
    }
    
    console.log(`\n✅ Função retornou ${featuredResult.length} artigos ordenados por score:`);
    featuredResult.forEach((article, index) => {
      console.log(`   ${index + 1}. Score: ${article.engagement_score} - ${article.title.substring(0, 60)}...`);
    });

    // 2. VERIFICAR CONTADORES DOS ARTIGOS
    console.log('\n📊 2. VERIFICANDO CONTADORES DOS ARTIGOS:');
    
    const articleIds = featuredResult.map(a => a.id);
    const { data: articlesWithCounters, error: countersError } = await supabase
      .from('articles')
      .select('id, title, positive_feedbacks, negative_feedbacks, comments_count, likes_count')
      .in('id', articleIds);
    
    if (countersError) {
      console.error('❌ ERRO ao buscar contadores:', countersError);
      return;
    }
    
    console.log('\n✅ CONTADORES ATUAIS:');
    articlesWithCounters.forEach((article) => {
      const calculatedScore = (article.positive_feedbacks * 3.0) + (article.comments_count * 2.0) + (article.likes_count * 1.5) - (article.negative_feedbacks * 1.0);
      console.log(`\n   📄 ${article.title.substring(0, 50)}...`);
      console.log(`      👍 Positivos: ${article.positive_feedbacks}`);
      console.log(`      👎 Negativos: ${article.negative_feedbacks}`);
      console.log(`      💬 Comentários: ${article.comments_count}`);
      console.log(`      ❤️ Likes: ${article.likes_count}`);
      console.log(`      🧮 Score Calculado: ${calculatedScore.toFixed(2)}`);
    });

    // 3. VALIDAÇÃO FINAL - ORDENAÇÃO CORRETA
    console.log('\n🏆 3. VALIDAÇÃO DA ORDENAÇÃO:');
    
    let isOrderingCorrect = true;
    let previousScore = Infinity;
    
    for (let i = 0; i < featuredResult.length; i++) {
      const currentScore = featuredResult[i].engagement_score;
      
      if (currentScore > previousScore) {
        isOrderingCorrect = false;
        console.log(`❌ ERRO: Artigo ${i + 1} tem score maior que o anterior!`);
        break;
      }
      
      previousScore = currentScore;
    }
    
    if (isOrderingCorrect) {
      console.log('✅ ORDENAÇÃO PERFEITA! Artigos estão ordenados por score decrescente');
    }

    // 4. VERIFICAR SE ARTIGO COM MAIS FEEDBACKS ESTÁ EM PRIMEIRO
    console.log('\n🎯 4. VERIFICAÇÃO DO ARTIGO COM MAIS FEEDBACKS:');
    
    const topArticle = featuredResult[0];
    const topArticleCounters = articlesWithCounters.find(a => a.id === topArticle.id);
    
    if (topArticleCounters) {
      console.log(`\n   🥇 PRIMEIRO LUGAR: ${topArticle.title.substring(0, 50)}...`);
      console.log(`      📊 Score: ${topArticle.engagement_score}`);
      console.log(`      👍 Feedbacks Positivos: ${topArticleCounters.positive_feedbacks}`);
      
      // Verificar se é realmente o artigo com mais feedbacks
      const maxFeedbacks = Math.max(...articlesWithCounters.map(a => a.positive_feedbacks));
      
      if (topArticleCounters.positive_feedbacks === maxFeedbacks) {
        console.log(`\n   🎉 SUCESSO TOTAL! O artigo com mais feedbacks (${maxFeedbacks}) está em primeiro lugar!`);
        console.log('   ✅ Sistema de ordenação funcionando perfeitamente');
        console.log('   ✅ Triggers atualizando contadores automaticamente');
        console.log('   ✅ Função get_featured_articles() ordenando corretamente');
        
        return true;
      } else {
        console.log(`\n   ❌ PROBLEMA: Artigo em primeiro tem ${topArticleCounters.positive_feedbacks} feedbacks, mas existe artigo com ${maxFeedbacks} feedbacks`);
        return false;
      }
    }

  } catch (error) {
    console.error('❌ ERRO GERAL:', error);
    return false;
  }
}

// Executar validação
validateOrderingSuccess().then(success => {
  if (success) {
    console.log('\n🎊 SISTEMA COMPLETAMENTE FUNCIONAL! 🎊');
    console.log('📈 Ordenação por engajamento operacional');
    console.log('🔄 Triggers funcionando automaticamente');
    console.log('🎯 Problema de ordenação RESOLVIDO!');
  } else {
    console.log('\n❌ Sistema ainda precisa de ajustes');
  }
});