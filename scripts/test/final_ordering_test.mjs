import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function finalOrderingTest() {
  console.log('🏁 TESTE FINAL DE ORDENAÇÃO - CRIANDO DADOS E VALIDANDO');
  console.log('=' .repeat(70));

  try {
    // 1. BUSCAR PRIMEIROS 3 ARTIGOS
    console.log('\n📊 1. BUSCANDO ARTIGOS PARA TESTE:');
    
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title')
      .eq('published', true)
      .limit(3);
    
    if (articlesError) {
      console.error('❌ ERRO ao buscar artigos:', articlesError);
      return;
    }
    
    console.log(`✅ ${articles.length} artigos selecionados:`);
    articles.forEach((article, index) => {
      console.log(`   ${index + 1}. ${article.title}`);
    });

    // 2. CRIAR FEEDBACKS COM DIFERENTES QUANTIDADES
    console.log('\n🎯 2. CRIANDO FEEDBACKS DE TESTE:');
    
    // Artigo 1: 7 feedbacks positivos (deve ficar em 1º lugar)
    console.log(`\n   Criando 7 feedbacks para: ${articles[0].title}`);
    for (let i = 0; i < 7; i++) {
      const { error } = await supabase.from('feedbacks').insert({
        article_id: articles[0].id,
        feedback_type: 'positive',
        user_id: `test-user-${Date.now()}-${i}`,
        created_at: new Date().toISOString()
      });
      if (error) console.error(`Erro ao criar feedback ${i + 1}:`, error);
    }
    
    // Artigo 2: 2 feedbacks positivos (deve ficar em 2º lugar)
    console.log(`   Criando 2 feedbacks para: ${articles[1].title}`);
    for (let i = 0; i < 2; i++) {
      const { error } = await supabase.from('feedbacks').insert({
        article_id: articles[1].id,
        feedback_type: 'positive',
        user_id: `test-user-${Date.now()}-${i + 10}`,
        created_at: new Date().toISOString()
      });
      if (error) console.error(`Erro ao criar feedback ${i + 1}:`, error);
    }
    
    // Artigo 3: 1 feedback positivo (deve ficar em 3º lugar)
    console.log(`   Criando 1 feedback para: ${articles[2].title}`);
    const { error } = await supabase.from('feedbacks').insert({
      article_id: articles[2].id,
      feedback_type: 'positive',
      user_id: `test-user-${Date.now()}-20`,
      created_at: new Date().toISOString()
    });
    if (error) console.error('Erro ao criar feedback:', error);

    // 3. AGUARDAR TRIGGERS PROCESSAREM
    console.log('\n⏳ 3. AGUARDANDO TRIGGERS PROCESSAREM...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 4. VERIFICAR CONTADORES ATUALIZADOS
    console.log('\n📊 4. VERIFICANDO CONTADORES APÓS TRIGGERS:');
    
    const { data: updatedArticles, error: updateError } = await supabase
      .from('articles')
      .select('id, title, positive_feedbacks, negative_feedbacks, comments_count, likes_count')
      .in('id', articles.map(a => a.id))
      .order('positive_feedbacks', { ascending: false });
    
    if (updateError) {
      console.error('❌ ERRO ao verificar contadores:', updateError);
      return;
    }
    
    console.log('\n✅ CONTADORES ATUALIZADOS:');
    updatedArticles.forEach((article, index) => {
      const score = (article.positive_feedbacks * 3.0) + (article.comments_count * 2.0) + (article.likes_count * 1.5) + (article.negative_feedbacks * -1.0);
      console.log(`\n   ${index + 1}. ${article.title}`);
      console.log(`      👍 Feedbacks+: ${article.positive_feedbacks}`);
      console.log(`      👎 Feedbacks-: ${article.negative_feedbacks}`);
      console.log(`      💬 Comentários: ${article.comments_count}`);
      console.log(`      ❤️ Likes: ${article.likes_count}`);
      console.log(`      🧮 Score Calculado: ${score.toFixed(2)}`);
    });

    // 5. TESTAR FUNÇÃO get_featured_articles()
    console.log('\n🎯 5. TESTANDO FUNÇÃO get_featured_articles():');
    
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

    // 6. VERIFICAÇÃO FINAL - ARTIGO COM 7 FEEDBACKS EM PRIMEIRO?
    console.log('\n🏆 6. VERIFICAÇÃO FINAL:');
    
    const articleWith7Feedbacks = updatedArticles.find(article => article.positive_feedbacks === 7);
    const topFeaturedArticle = featuredResult[0];
    
    if (articleWith7Feedbacks && topFeaturedArticle) {
      console.log(`\n   Artigo com 7 feedbacks: ${articleWith7Feedbacks.title}`);
      console.log(`   Primeiro na função: ${topFeaturedArticle.title}`);
      console.log(`   Score esperado: ${(articleWith7Feedbacks.positive_feedbacks * 3.0).toFixed(2)}`);
      console.log(`   Score da função: ${topFeaturedArticle.engagement_score}`);
      
      if (articleWith7Feedbacks.id === topFeaturedArticle.id) {
        console.log('\n   🎉 SUCESSO TOTAL! O sistema de ordenação está funcionando perfeitamente!');
        console.log('   ✅ Artigo com mais feedbacks está em primeiro lugar');
        console.log('   ✅ Função get_featured_articles() está ordenando corretamente');
        console.log('   ✅ Triggers estão atualizando contadores automaticamente');
      } else {
        console.log('\n   ❌ PROBLEMA: A ordenação ainda não está correta');
      }
    } else {
      console.log('\n   ❌ ERRO: Não foi possível encontrar os artigos para comparação');
    }

    // 7. TESTE ADICIONAL - VERIFICAR SE TODOS OS 3 ESTÃO NA ORDEM CORRETA
    console.log('\n📋 7. VERIFICAÇÃO COMPLETA DA ORDENAÇÃO:');
    
    const expectedOrder = updatedArticles.sort((a, b) => {
      const scoreA = (a.positive_feedbacks * 3.0) + (a.comments_count * 2.0) + (a.likes_count * 1.5) + (a.negative_feedbacks * -1.0);
      const scoreB = (b.positive_feedbacks * 3.0) + (b.comments_count * 2.0) + (b.likes_count * 1.5) + (b.negative_feedbacks * -1.0);
      return scoreB - scoreA;
    });
    
    console.log('\n   Ordem esperada (por score):');
    expectedOrder.forEach((article, index) => {
      const score = (article.positive_feedbacks * 3.0) + (article.comments_count * 2.0) + (article.likes_count * 1.5) + (article.negative_feedbacks * -1.0);
      console.log(`   ${index + 1}. ${article.title} (Score: ${score.toFixed(2)})`);
    });
    
    console.log('\n   Ordem real (função):');
    featuredResult.forEach((article, index) => {
      console.log(`   ${index + 1}. ${article.title} (Score: ${article.engagement_score})`);
    });
    
    // Verificar se as ordens coincidem
    let orderCorrect = true;
    for (let i = 0; i < Math.min(expectedOrder.length, featuredResult.length); i++) {
      if (expectedOrder[i].id !== featuredResult[i].id) {
        orderCorrect = false;
        break;
      }
    }
    
    if (orderCorrect) {
      console.log('\n   🎯 PERFEITO! A ordenação está 100% correta!');
    } else {
      console.log('\n   ⚠️ A ordenação não está completamente correta');
    }

  } catch (error) {
    console.error('❌ ERRO GERAL:', error);
  }
}

finalOrderingTest();