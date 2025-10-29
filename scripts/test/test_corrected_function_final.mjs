import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCorrectedFunction() {
  console.log('🔧 TESTE DA FUNÇÃO get_featured_articles() CORRIGIDA');
  console.log('=' .repeat(60));

  try {
    // 1. VERIFICAR DADOS REAIS DOS ARTIGOS
    console.log('\n📊 1. DADOS REAIS DOS ARTIGOS NO BANCO:');
    
    const { data: allArticles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title, positive_feedbacks, negative_feedbacks, comments_count, likes_count, is_featured_manual, created_at')
      .eq('published', true)
      .order('positive_feedbacks', { ascending: false });
    
    if (articlesError) {
      console.error('❌ ERRO ao buscar artigos:', articlesError);
      return;
    }
    
    console.log(`\n✅ ${allArticles.length} artigos encontrados (ordenados por feedbacks+):`);
    allArticles.forEach((article, index) => {
      const score = (article.positive_feedbacks * 3.0) + (article.comments_count * 2.0) + (article.likes_count * 1.5) + (article.negative_feedbacks * -1.0);
      console.log(`\n   ${index + 1}. ${article.title}`);
      console.log(`      👍 Feedbacks+: ${article.positive_feedbacks}`);
      console.log(`      👎 Feedbacks-: ${article.negative_feedbacks}`);
      console.log(`      💬 Comentários: ${article.comments_count}`);
      console.log(`      ❤️ Likes: ${article.likes_count}`);
      console.log(`      📌 Fixo: ${article.is_featured_manual ? 'SIM' : 'NÃO'}`);
      console.log(`      🧮 Score Calculado: ${score.toFixed(2)}`);
      console.log(`      🆔 ID: ${article.id}`);
    });

    // 2. TESTAR FUNÇÃO get_featured_articles() CORRIGIDA
    console.log('\n🎯 2. TESTANDO FUNÇÃO get_featured_articles() CORRIGIDA:');
    
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
      console.log(`      🆔 ID: ${article.id}`);
    });

    // 3. VERIFICAR SE ORDENAÇÃO ESTÁ CORRETA
    console.log('\n⚖️ 3. VERIFICAÇÃO DA ORDENAÇÃO:');
    
    // Calcular scores esperados
    const articlesWithScores = allArticles.map(article => ({
      ...article,
      calculated_score: (article.positive_feedbacks * 3.0) + (article.comments_count * 2.0) + (article.likes_count * 1.5) + (article.negative_feedbacks * -1.0)
    })).sort((a, b) => b.calculated_score - a.calculated_score);
    
    console.log('\n🧮 ORDENAÇÃO ESPERADA (por score calculado):');
    articlesWithScores.slice(0, 3).forEach((article, index) => {
      console.log(`   ${index + 1}. ${article.title} (Score: ${article.calculated_score.toFixed(2)})`);
    });
    
    console.log('\n🎯 ORDENAÇÃO REAL (função get_featured_articles):');
    featuredResult.forEach((article, index) => {
      console.log(`   ${index + 1}. ${article.title} (Score: ${article.engagement_score})`);
    });

    // 4. VERIFICAR SE ARTIGO COM MAIS FEEDBACKS ESTÁ EM PRIMEIRO
    const topArticle = articlesWithScores[0];
    const functionTopArticle = featuredResult[0];
    
    console.log('\n🏆 4. VERIFICAÇÃO DO PRIMEIRO LUGAR:');
    console.log(`   Esperado: ${topArticle.title} (Score: ${topArticle.calculated_score.toFixed(2)})`);
    console.log(`   Real: ${functionTopArticle.title} (Score: ${functionTopArticle.engagement_score})`);
    
    if (topArticle.id === functionTopArticle.id) {
      console.log('   ✅ CORRETO! O artigo com maior score está em primeiro lugar!');
    } else {
      console.log('   ❌ ERRO! A ordenação ainda não está correta!');
    }

    // 5. BUSCAR ARTIGO COM 7 FEEDBACKS ESPECIFICAMENTE
    console.log('\n🔍 5. PROCURANDO ARTIGO COM 7 FEEDBACKS:');
    const articleWith7Feedbacks = allArticles.find(article => article.positive_feedbacks === 7);
    
    if (articleWith7Feedbacks) {
      console.log(`   ✅ Encontrado: ${articleWith7Feedbacks.title}`);
      console.log(`   📊 Score: ${((articleWith7Feedbacks.positive_feedbacks * 3.0) + (articleWith7Feedbacks.comments_count * 2.0) + (articleWith7Feedbacks.likes_count * 1.5) + (articleWith7Feedbacks.negative_feedbacks * -1.0)).toFixed(2)}`);
      
      const positionInFunction = featuredResult.findIndex(article => article.id === articleWith7Feedbacks.id);
      if (positionInFunction !== -1) {
        console.log(`   🎯 Posição na função: ${positionInFunction + 1}º lugar`);
      } else {
        console.log('   ❌ NÃO APARECE na função get_featured_articles!');
      }
    } else {
      console.log('   ❌ Nenhum artigo com 7 feedbacks encontrado!');
    }

  } catch (error) {
    console.error('❌ ERRO GERAL:', error);
  }
}

testCorrectedFunction();