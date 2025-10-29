import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncCountersManually() {
  console.log('🔄 SINCRONIZANDO CONTADORES MANUALMENTE');
  console.log('=' .repeat(60));

  try {
    // 1. BUSCAR TODOS OS ARTIGOS
    console.log('\n📊 1. BUSCANDO ARTIGOS:');
    
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title')
      .eq('published', true);
    
    if (articlesError) {
      console.error('❌ ERRO ao buscar artigos:', articlesError);
      return;
    }
    
    console.log(`✅ ${articles.length} artigos encontrados`);

    // 2. CONTAR FEEDBACKS POR ARTIGO E ATUALIZAR
    console.log('\n🔄 2. SINCRONIZANDO CONTADORES:');
    
    for (const article of articles) {
      // Contar feedbacks positivos
      const { count: positiveFeedbacks } = await supabase
        .from('feedbacks')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', article.id)
        .eq('feedback_type', 'positive');
      
      // Contar feedbacks negativos
      const { count: negativeFeedbacks } = await supabase
        .from('feedbacks')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', article.id)
        .eq('feedback_type', 'negative');
      
      // Contar comentários
      const { count: commentsCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', article.id);
      
      // Atualizar contadores no artigo
      const { error: updateError } = await supabase
        .from('articles')
        .update({
          positive_feedbacks: positiveFeedbacks || 0,
          negative_feedbacks: negativeFeedbacks || 0,
          comments_count: commentsCount || 0
        })
        .eq('id', article.id);
      
      if (updateError) {
        console.error(`❌ ERRO ao atualizar ${article.title}:`, updateError);
      } else {
        const score = ((positiveFeedbacks || 0) * 3.0) + ((commentsCount || 0) * 2.0) + ((negativeFeedbacks || 0) * -1.0);
        console.log(`   ✅ ${article.title}`);
        console.log(`      👍 Feedbacks+: ${positiveFeedbacks || 0}`);
        console.log(`      👎 Feedbacks-: ${negativeFeedbacks || 0}`);
        console.log(`      💬 Comentários: ${commentsCount || 0}`);
        console.log(`      🧮 Score: ${score.toFixed(2)}`);
      }
    }

    // 3. TESTAR FUNÇÃO get_featured_articles() APÓS SINCRONIZAÇÃO
    console.log('\n🎯 3. TESTANDO FUNÇÃO APÓS SINCRONIZAÇÃO:');
    
    const { data: featuredResult, error: featuredError } = await supabase
      .rpc('get_featured_articles');
    
    if (featuredError) {
      console.error('❌ ERRO na função get_featured_articles:', featuredError);
      return;
    }
    
    console.log(`\n✅ Função retornou ${featuredResult.length} artigos:`);
    featuredResult.forEach((article, index) => {
      console.log(`\n   ${index + 1}. ${article.title}`);
      console.log(`      📊 Score da Função: ${article.engagement_score}`);
    });

    // 4. VERIFICAR SE ARTIGO COM MAIS FEEDBACKS ESTÁ EM PRIMEIRO
    console.log('\n🏆 4. VERIFICAÇÃO FINAL DA ORDENAÇÃO:');
    
    const { data: topArticles, error: topError } = await supabase
      .from('articles')
      .select('id, title, positive_feedbacks, negative_feedbacks, comments_count, likes_count')
      .eq('published', true)
      .order('positive_feedbacks', { ascending: false })
      .limit(3);
    
    if (topError) {
      console.error('❌ ERRO ao buscar top artigos:', topError);
      return;
    }
    
    const topByFeedbacks = topArticles[0];
    const topByFunction = featuredResult[0];
    
    console.log(`\n   Artigo com mais feedbacks: ${topByFeedbacks.title} (${topByFeedbacks.positive_feedbacks} feedbacks+)`);
    console.log(`   Primeiro na função: ${topByFunction.title} (Score: ${topByFunction.engagement_score})`);
    
    if (topByFeedbacks.id === topByFunction.id) {
      console.log('   ✅ PERFEITO! A ordenação está funcionando corretamente!');
    } else {
      console.log('   ⚠️ ATENÇÃO: Pode haver diferença devido ao sistema híbrido ou outros fatores.');
    }

  } catch (error) {
    console.error('❌ ERRO GERAL:', error);
  }
}

syncCountersManually();