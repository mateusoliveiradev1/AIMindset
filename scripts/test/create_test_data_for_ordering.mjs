import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestDataForOrdering() {
  console.log('🧪 CRIANDO DADOS DE TESTE PARA VALIDAR ORDENAÇÃO');
  console.log('=' .repeat(60));

  try {
    // 1. BUSCAR ARTIGOS EXISTENTES
    console.log('\n📊 1. BUSCANDO ARTIGOS EXISTENTES:');
    
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title')
      .eq('published', true)
      .limit(5);
    
    if (articlesError) {
      console.error('❌ ERRO ao buscar artigos:', articlesError);
      return;
    }
    
    console.log(`✅ ${articles.length} artigos encontrados:`);
    articles.forEach((article, index) => {
      console.log(`   ${index + 1}. ${article.title} (ID: ${article.id})`);
    });

    // 2. CRIAR FEEDBACKS DE TESTE COM DIFERENTES SCORES
    console.log('\n🎯 2. CRIANDO FEEDBACKS DE TESTE:');
    
    if (articles.length >= 3) {
      // Artigo 1: 7 feedbacks positivos (score alto)
      console.log(`\n   Criando 7 feedbacks positivos para: ${articles[0].title}`);
      for (let i = 0; i < 7; i++) {
        await supabase.from('feedbacks').insert({
          article_id: articles[0].id,
          feedback_type: 'positive',
          user_id: `test-user-${i + 1}`,
          created_at: new Date().toISOString()
        });
      }
      
      // Artigo 2: 2 feedbacks positivos (score médio)
      console.log(`   Criando 2 feedbacks positivos para: ${articles[1].title}`);
      for (let i = 0; i < 2; i++) {
        await supabase.from('feedbacks').insert({
          article_id: articles[1].id,
          feedback_type: 'positive',
          user_id: `test-user-${i + 8}`,
          created_at: new Date().toISOString()
        });
      }
      
      // Artigo 3: 1 feedback positivo (score baixo)
      console.log(`   Criando 1 feedback positivo para: ${articles[2].title}`);
      await supabase.from('feedbacks').insert({
        article_id: articles[2].id,
        feedback_type: 'positive',
        user_id: 'test-user-10',
        created_at: new Date().toISOString()
      });
    }

    // 3. AGUARDAR TRIGGERS ATUALIZAREM CONTADORES
    console.log('\n⏳ 3. AGUARDANDO TRIGGERS ATUALIZAREM CONTADORES...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. VERIFICAR SE CONTADORES FORAM ATUALIZADOS
    console.log('\n📊 4. VERIFICANDO CONTADORES ATUALIZADOS:');
    
    const { data: updatedArticles, error: updateError } = await supabase
      .from('articles')
      .select('id, title, positive_feedbacks, negative_feedbacks, comments_count, likes_count')
      .eq('published', true)
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

    // 5. TESTAR FUNÇÃO get_featured_articles() COM DADOS REAIS
    console.log('\n🎯 5. TESTANDO FUNÇÃO COM DADOS REAIS:');
    
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

    // 6. VERIFICAR SE ARTIGO COM 7 FEEDBACKS ESTÁ EM PRIMEIRO
    console.log('\n🏆 6. VERIFICAÇÃO FINAL:');
    const articleWith7Feedbacks = updatedArticles.find(article => article.positive_feedbacks === 7);
    const topFeaturedArticle = featuredResult[0];
    
    if (articleWith7Feedbacks && topFeaturedArticle && articleWith7Feedbacks.id === topFeaturedArticle.id) {
      console.log('✅ SUCESSO! O artigo com 7 feedbacks está em primeiro lugar!');
      console.log(`   Artigo: ${articleWith7Feedbacks.title}`);
      console.log(`   Score: ${topFeaturedArticle.engagement_score}`);
    } else {
      console.log('❌ PROBLEMA! A ordenação ainda não está funcionando corretamente.');
      if (articleWith7Feedbacks) {
        console.log(`   Artigo com 7 feedbacks: ${articleWith7Feedbacks.title}`);
      }
      if (topFeaturedArticle) {
        console.log(`   Primeiro na função: ${topFeaturedArticle.title}`);
      }
    }

  } catch (error) {
    console.error('❌ ERRO GERAL:', error);
  }
}

createTestDataForOrdering();