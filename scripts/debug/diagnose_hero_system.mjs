import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚨 DIAGNÓSTICO COMPLETO DO SISTEMA DE ARTIGOS EM DESTAQUE');
console.log('=' .repeat(60));

async function diagnosticarSistema() {
  try {
    console.log('\n📊 1. VERIFICANDO DADOS ATUAIS DOS ARTIGOS...');
    
    // Verificar artigos e seus contadores
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title, positive_feedbacks, negative_feedbacks, comments_count, total_views, is_featured_manual, created_at')
      .order('positive_feedbacks', { ascending: false });
    
    if (articlesError) {
      console.error('❌ Erro ao buscar artigos:', articlesError);
      return;
    }
    
    console.log(`\n📝 Encontrados ${articles.length} artigos:`);
    articles.forEach((article, index) => {
      console.log(`${index + 1}. "${article.title}"`);
      console.log(`   - ID: ${article.id}`);
      console.log(`   - Feedbacks Positivos: ${article.positive_feedbacks}`);
      console.log(`   - Feedbacks Negativos: ${article.negative_feedbacks}`);
      console.log(`   - Comentários: ${article.comments_count}`);
      console.log(`   - Views: ${article.total_views}`);
      console.log(`   - Fixado Manual: ${article.is_featured_manual ? 'SIM' : 'NÃO'}`);
      console.log(`   - Criado em: ${new Date(article.created_at).toLocaleString()}`);
      console.log('');
    });

    console.log('\n📊 2. VERIFICANDO FEEDBACKS REAIS NA BASE...');
    
    // Verificar feedbacks reais
    const { data: feedbacks, error: feedbacksError } = await supabase
      .from('feedbacks')
      .select('article_id, type');
    
    if (feedbacksError) {
      console.error('❌ Erro ao buscar feedbacks:', feedbacksError);
      return;
    }
    
    // Contar feedbacks por artigo
    const feedbackCounts = {};
    feedbacks.forEach(feedback => {
      if (!feedbackCounts[feedback.article_id]) {
        feedbackCounts[feedback.article_id] = { positive: 0, negative: 0 };
      }
      feedbackCounts[feedback.article_id][feedback.type]++;
    });
    
    console.log('\n📈 Contadores REAIS de feedbacks:');
    Object.entries(feedbackCounts).forEach(([articleId, counts]) => {
      const article = articles.find(a => a.id == articleId);
      console.log(`Artigo ${articleId} (${article?.title || 'Título não encontrado'}):`);
      console.log(`   - Positivos REAIS: ${counts.positive}`);
      console.log(`   - Positivos na TABELA: ${article?.positive_feedbacks || 0}`);
      console.log(`   - Negativos REAIS: ${counts.negative}`);
      console.log(`   - Negativos na TABELA: ${article?.negative_feedbacks || 0}`);
      
      // Verificar se há dessincronização
      if (counts.positive !== article?.positive_feedbacks || counts.negative !== article?.negative_feedbacks) {
        console.log('   ⚠️  DESSINCRONIZADO!');
      } else {
        console.log('   ✅ Sincronizado');
      }
      console.log('');
    });

    console.log('\n📊 3. TESTANDO FUNÇÃO get_featured_articles()...');
    
    // Testar a função diretamente
    const { data: featuredArticles, error: featuredError } = await supabase
      .rpc('get_featured_articles');
    
    if (featuredError) {
      console.error('❌ Erro ao executar get_featured_articles():', featuredError);
    } else {
      console.log(`\n🎯 Função retornou ${featuredArticles.length} artigos:`);
      featuredArticles.forEach((article, index) => {
        console.log(`${index + 1}. "${article.title}"`);
        console.log(`   - ID: ${article.id}`);
        console.log(`   - Feedbacks Positivos: ${article.positive_feedbacks}`);
        console.log(`   - Comentários: ${article.comments_count}`);
        console.log(`   - Views: ${article.total_views}`);
        console.log(`   - Fixado Manual: ${article.is_featured_manual ? 'SIM' : 'NÃO'}`);
        console.log('');
      });
    }

    console.log('\n📊 4. VERIFICANDO COMENTÁRIOS REAIS...');
    
    // Verificar comentários reais
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('article_id');
    
    if (commentsError) {
      console.error('❌ Erro ao buscar comentários:', commentsError);
    } else {
      const commentCounts = {};
      comments.forEach(comment => {
        commentCounts[comment.article_id] = (commentCounts[comment.article_id] || 0) + 1;
      });
      
      console.log('\n💬 Contadores REAIS de comentários:');
      Object.entries(commentCounts).forEach(([articleId, count]) => {
        const article = articles.find(a => a.id == articleId);
        console.log(`Artigo ${articleId} (${article?.title || 'Título não encontrado'}):`);
        console.log(`   - Comentários REAIS: ${count}`);
        console.log(`   - Comentários na TABELA: ${article?.comments_count || 0}`);
        
        if (count !== article?.comments_count) {
          console.log('   ⚠️  DESSINCRONIZADO!');
        } else {
          console.log('   ✅ Sincronizado');
        }
        console.log('');
      });
    }

    console.log('\n📊 5. ANÁLISE FINAL...');
    
    // Verificar se há artigos fixados manualmente
    const manuallyFeatured = articles.filter(a => a.is_featured_manual);
    console.log(`\n🔧 Artigos fixados manualmente: ${manuallyFeatured.length}`);
    
    if (manuallyFeatured.length > 0) {
      console.log('Artigos fixados:');
      manuallyFeatured.forEach(article => {
        console.log(`   - "${article.title}" (ID: ${article.id})`);
      });
    }
    
    // Verificar artigos com mais engajamento
    const sortedByEngagement = articles
      .filter(a => !a.is_featured_manual)
      .sort((a, b) => {
        const scoreA = (a.positive_feedbacks * 2) + a.comments_count + (a.total_views * 0.1);
        const scoreB = (b.positive_feedbacks * 2) + b.comments_count + (b.total_views * 0.1);
        return scoreB - scoreA;
      });
    
    console.log('\n🏆 Top 3 artigos por engajamento (sem fixados):');
    sortedByEngagement.slice(0, 3).forEach((article, index) => {
      const score = (article.positive_feedbacks * 2) + article.comments_count + (article.total_views * 0.1);
      console.log(`${index + 1}. "${article.title}"`);
      console.log(`   - Score calculado: ${score.toFixed(2)}`);
      console.log(`   - Feedbacks Positivos: ${article.positive_feedbacks}`);
      console.log(`   - Comentários: ${article.comments_count}`);
      console.log(`   - Views: ${article.total_views}`);
      console.log('');
    });

    console.log('\n🎯 CONCLUSÃO:');
    console.log('=' .repeat(40));
    
    if (featuredArticles && featuredArticles.length > 0) {
      console.log('✅ Função get_featured_articles() está funcionando');
      
      // Comparar se os resultados fazem sentido
      const expectedTop3 = [...manuallyFeatured, ...sortedByEngagement].slice(0, 3);
      const actualIds = featuredArticles.map(a => a.id).sort();
      const expectedIds = expectedTop3.map(a => a.id).sort();
      
      if (JSON.stringify(actualIds) === JSON.stringify(expectedIds)) {
        console.log('✅ Resultados da função estão corretos');
      } else {
        console.log('❌ Resultados da função estão INCORRETOS');
        console.log('   Esperado:', expectedIds);
        console.log('   Atual:', actualIds);
      }
    } else {
      console.log('❌ Função get_featured_articles() NÃO está funcionando');
    }
    
    // Verificar dessincronização
    let hasDessync = false;
    articles.forEach(article => {
      const realPositive = feedbackCounts[article.id]?.positive || 0;
      const realNegative = feedbackCounts[article.id]?.negative || 0;
      
      if (realPositive !== article.positive_feedbacks || realNegative !== article.negative_feedbacks) {
        hasDessync = true;
      }
    });
    
    if (hasDessync) {
      console.log('⚠️  CONTADORES DESSINCRONIZADOS - Triggers podem estar quebrados');
    } else {
      console.log('✅ Contadores sincronizados');
    }

  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error);
  }
}

// Executar diagnóstico
diagnosticarSistema();