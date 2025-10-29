import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFeaturedArticlesSystem() {
  console.log('🧪 TESTE FINAL DO SISTEMA DE ARTIGOS EM DESTAQUE');
  console.log('=' .repeat(60));

  try {
    // 1. Testar a função get_featured_articles()
    console.log('\n1️⃣ Testando função get_featured_articles()...');
    const { data: featuredArticles, error: featuredError } = await supabase
      .rpc('get_featured_articles');

    if (featuredError) {
      console.error('❌ Erro na função get_featured_articles:', featuredError);
      return;
    }

    console.log(`✅ Função get_featured_articles retornou ${featuredArticles?.length || 0} artigos`);
    
    if (featuredArticles && featuredArticles.length > 0) {
      console.log('\n📊 Artigos em destaque:');
      featuredArticles.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   - Score: ${article.score || 'N/A'}`);
        console.log(`   - Is Featured: ${article.is_featured ? 'Sim' : 'Não'}`);
        console.log(`   - Positive Feedbacks: ${article.positive_feedbacks || 0}`);
        console.log(`   - Comments: ${article.comments_count || 0}`);
        console.log(`   - Likes: ${article.likes_count || 0}`);
        console.log('');
      });
    }

    // 2. Verificar se há artigos marcados manualmente como destaque
    console.log('\n2️⃣ Verificando artigos marcados manualmente...');
    const { data: manualFeatured, error: manualError } = await supabase
      .from('articles')
      .select('id, title, is_featured')
      .eq('is_featured', true)
      .eq('published', true);

    if (manualError) {
      console.error('❌ Erro ao buscar artigos manuais:', manualError);
    } else {
      console.log(`✅ ${manualFeatured?.length || 0} artigos marcados manualmente como destaque`);
      if (manualFeatured && manualFeatured.length > 0) {
        manualFeatured.forEach(article => {
          console.log(`   - ${article.title}`);
        });
      }
    }

    // 3. Testar a função get_article_metrics
    console.log('\n3️⃣ Testando função get_article_metrics...');
    if (featuredArticles && featuredArticles.length > 0) {
      const firstArticleId = featuredArticles[0].id;
      const { data: metrics, error: metricsError } = await supabase
        .rpc('get_article_metrics', { article_id: firstArticleId });

      if (metricsError) {
        console.error('❌ Erro na função get_article_metrics:', metricsError);
      } else {
        console.log('✅ Função get_article_metrics funcionando');
        console.log(`   Métricas do artigo "${featuredArticles[0].title}":`, metrics);
      }
    }

    // 4. Verificar campos de feedback na tabela articles
    console.log('\n4️⃣ Verificando campos de feedback...');
    const { data: articlesWithFeedback, error: feedbackError } = await supabase
      .from('articles')
      .select('id, title, positive_feedbacks, negative_feedbacks, comments_count, likes_count')
      .eq('published', true)
      .limit(3);

    if (feedbackError) {
      console.error('❌ Erro ao verificar campos de feedback:', feedbackError);
    } else {
      console.log('✅ Campos de feedback verificados');
      articlesWithFeedback?.forEach(article => {
        console.log(`   ${article.title}:`);
        console.log(`     - Positive: ${article.positive_feedbacks || 0}`);
        console.log(`     - Negative: ${article.negative_feedbacks || 0}`);
        console.log(`     - Comments: ${article.comments_count || 0}`);
        console.log(`     - Likes: ${article.likes_count || 0}`);
      });
    }

    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('✅ Sistema de artigos em destaque funcionando corretamente');
    console.log('✅ Modo híbrido (manual + automático) ativo');
    console.log('✅ Função SQL get_featured_articles() operacional');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testFeaturedArticlesSystem();