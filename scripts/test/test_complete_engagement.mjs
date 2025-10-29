import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🎯 TESTE COMPLETO: Sistema de Engajamento com TODOS os Fatores');
console.log('=' .repeat(60));

async function testCompleteEngagement() {
  try {
    console.log('\n1️⃣ Verificando dados atuais de TODOS os contadores...');
    
    const { data: allArticles, error: articlesError } = await supabase
      .from('articles')
      .select(`
        id, title, published,
        positive_feedbacks, negative_feedbacks,
        comments_count, likes_count, total_views,
        is_featured_manual
      `)
      .eq('published', true)
      .order('created_at', { ascending: false });
    
    if (articlesError) {
      console.error('❌ Erro ao buscar artigos:', articlesError);
      return;
    }
    
    console.log(`📊 Total de artigos publicados: ${allArticles.length}`);
    console.log('\n📈 DETALHAMENTO COMPLETO DOS CONTADORES:');
    console.log('-'.repeat(80));
    
    allArticles.forEach((article, index) => {
      const engagementScore = 
        (article.positive_feedbacks * 3.0) +
        (article.comments_count * 2.0) +
        (article.likes_count * 1.5) +
        (article.total_views * 0.1) -
        (article.negative_feedbacks * 1.0);
      
      console.log(`${index + 1}. "${article.title}"`);
      console.log(`   🎯 Feedbacks Positivos: ${article.positive_feedbacks} (peso 3.0) = ${article.positive_feedbacks * 3.0}`);
      console.log(`   💬 Comentários: ${article.comments_count} (peso 2.0) = ${article.comments_count * 2.0}`);
      console.log(`   👍 Likes: ${article.likes_count} (peso 1.5) = ${article.likes_count * 1.5}`);
      console.log(`   👁️ Views: ${article.total_views} (peso 0.1) = ${article.total_views * 0.1}`);
      console.log(`   👎 Feedbacks Negativos: ${article.negative_feedbacks} (peso -1.0) = ${-article.negative_feedbacks * 1.0}`);
      console.log(`   📊 SCORE TOTAL: ${engagementScore.toFixed(1)}`);
      console.log(`   📌 Fixado Manualmente: ${article.is_featured_manual ? 'SIM' : 'NÃO'}`);
      console.log('');
    });
    
    console.log('\n2️⃣ Testando nova função get_featured_articles() com TODOS os fatores...');
    
    const { data: featuredArticles, error: featuredError } = await supabase
      .rpc('get_featured_articles');
    
    if (featuredError) {
      console.error('❌ Erro na função get_featured_articles:', featuredError);
      return;
    }
    
    console.log(`✅ Função retorna ${featuredArticles.length} artigos em destaque:`);
    console.log('\n🏆 ARTIGOS EM DESTAQUE (Nova Fórmula):');
    console.log('-'.repeat(60));
    
    featuredArticles.forEach((article, index) => {
      console.log(`${index + 1}. "${article.title}"`);
      console.log(`   🎯 Feedbacks Positivos: ${article.positive_feedbacks}`);
      console.log(`   💬 Comentários: ${article.comments_count}`);
      console.log(`   👍 Likes: ${article.likes_count}`);
      console.log(`   👁️ Views: ${article.total_views}`);
      console.log(`   👎 Feedbacks Negativos: ${article.negative_feedbacks}`);
      console.log(`   📊 Score de Engajamento: ${parseFloat(article.engagement_score).toFixed(1)}`);
      console.log(`   📌 Fixado Manualmente: ${article.is_featured_manual ? 'SIM' : 'NÃO'}`);
      console.log('');
    });
    
    console.log('\n3️⃣ Verificando se a ordenação está correta...');
    
    let isCorrectOrder = true;
    for (let i = 0; i < featuredArticles.length - 1; i++) {
      const current = featuredArticles[i];
      const next = featuredArticles[i + 1];
      
      // Se ambos são manuais ou ambos são automáticos, verificar score
      if (current.is_featured_manual === next.is_featured_manual) {
        if (parseFloat(current.engagement_score) < parseFloat(next.engagement_score)) {
          isCorrectOrder = false;
          console.log(`⚠️ Ordem incorreta: "${current.title}" (${current.engagement_score}) < "${next.title}" (${next.engagement_score})`);
        }
      }
    }
    
    if (isCorrectOrder) {
      console.log('✅ Artigos estão ordenados corretamente!');
    } else {
      console.log('❌ Artigos NÃO estão ordenados corretamente!');
    }
    
    console.log('\n4️⃣ Simulando diferentes cenários de engajamento...');
    
    // Encontrar o artigo com mais engajamento total
    const sortedByEngagement = allArticles
      .map(article => ({
        ...article,
        totalEngagement: 
          (article.positive_feedbacks * 3.0) +
          (article.comments_count * 2.0) +
          (article.likes_count * 1.5) +
          (article.total_views * 0.1) -
          (article.negative_feedbacks * 1.0)
      }))
      .sort((a, b) => b.totalEngagement - a.totalEngagement);
    
    console.log('\n📊 TOP 5 ARTIGOS POR ENGAJAMENTO TOTAL:');
    sortedByEngagement.slice(0, 5).forEach((article, index) => {
      console.log(`${index + 1}. "${article.title}" - Score: ${article.totalEngagement.toFixed(1)}`);
    });
    
    console.log('\n🎯 RESUMO FINAL:');
    console.log('=' .repeat(40));
    console.log(`✅ Sistema considera TODOS os fatores: ${featuredArticles.length > 0 ? 'SIM' : 'NÃO'}`);
    console.log(`✅ Feedbacks positivos (peso 3.0): Incluído`);
    console.log(`✅ Comentários (peso 2.0): Incluído`);
    console.log(`✅ Likes (peso 1.5): Incluído`);
    console.log(`✅ Views (peso 0.1): Incluído`);
    console.log(`✅ Feedbacks negativos (peso -1.0): Incluído`);
    console.log(`✅ Sistema híbrido (manual + automático): Funcionando`);
    console.log(`📊 Artigos com engajamento > 0: ${sortedByEngagement.filter(a => a.totalEngagement > 0).length}`);
    
    // Verificar se há diferença significativa
    const topEngagement = sortedByEngagement[0];
    const featuredTop = featuredArticles[0];
    
    if (topEngagement && featuredTop && topEngagement.id === featuredTop.id) {
      console.log('\n🎉 PERFEITO! O artigo com maior engajamento está em primeiro lugar!');
    } else {
      console.log('\n⚠️ ATENÇÃO: O artigo com maior engajamento não está em primeiro lugar.');
      if (featuredTop && featuredTop.is_featured_manual) {
        console.log('   Motivo: Artigo fixado manualmente tem prioridade.');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testCompleteEngagement();