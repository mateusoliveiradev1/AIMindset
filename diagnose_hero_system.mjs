import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseHeroSystem() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DO SISTEMA DE ARTIGOS EM DESTAQUE\n');

  try {
    // 1. Verificar estrutura da tabela articles
    console.log('1️⃣ Verificando estrutura da tabela articles...');
    const { data: sampleArticle } = await supabase
      .from('articles')
      .select('*')
      .limit(1)
      .single();
    
    if (sampleArticle) {
      console.log('✅ Campos disponíveis na tabela articles:');
      console.log(Object.keys(sampleArticle).join(', '));
      
      // Verificar se tem os campos necessários
      const requiredFields = ['positive_feedbacks', 'negative_feedbacks', 'comments_count', 'likes_count'];
      const missingFields = requiredFields.filter(field => !(field in sampleArticle));
      
      if (missingFields.length > 0) {
        console.log('❌ Campos ausentes:', missingFields.join(', '));
      } else {
        console.log('✅ Todos os campos de feedback estão presentes');
      }
    }

    // 2. Verificar dados atuais dos campos de feedback
    console.log('\n2️⃣ Verificando dados atuais dos campos de feedback...');
    const { data: articlesWithFeedback, error: feedbackError } = await supabase
      .from('articles')
      .select('id, title, positive_feedbacks, negative_feedbacks, comments_count, likes_count, created_at, published')
      .order('created_at', { ascending: false })
      .limit(10);

    if (feedbackError) {
      console.log('❌ Erro ao buscar artigos:', feedbackError.message);
    } else {
      console.log('✅ Últimos 10 artigos com dados de feedback:');
      let hasNonZeroFeedback = false;
      
      articlesWithFeedback.forEach(article => {
        const pos = article.positive_feedbacks || 0;
        const neg = article.negative_feedbacks || 0;
        const com = article.comments_count || 0;
        const lik = article.likes_count || 0;
        
        if (pos > 0 || neg > 0 || com > 0 || lik > 0) {
          hasNonZeroFeedback = true;
        }
        
        console.log(`- ${article.title} (${article.published ? 'Publicado' : 'Rascunho'})`);
        console.log(`  Positivos: ${pos}, Negativos: ${neg}, Comentários: ${com}, Likes: ${lik}`);
        console.log(`  ID: ${article.id}\n`);
      });
      
      if (!hasNonZeroFeedback) {
        console.log('⚠️  PROBLEMA: Nenhum artigo tem dados de feedback > 0');
      }
    }

    // 3. Verificar tabela feedbacks e relacionamento
    console.log('3️⃣ Verificando tabela feedbacks e relacionamento...');
    const { data: feedbacks, error: feedbacksError } = await supabase
      .from('feedbacks')
      .select('id, article_id, type, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (feedbacksError) {
      console.log('❌ Erro ao buscar feedbacks:', feedbacksError.message);
    } else {
      console.log(`✅ Total de feedbacks encontrados: ${feedbacks.length}`);
      if (feedbacks.length > 0) {
        console.log('Últimos feedbacks:');
        feedbacks.forEach(feedback => {
          console.log(`- Artigo ID: ${feedback.article_id}, Tipo: ${feedback.type}, Data: ${feedback.created_at}`);
        });
        
        // Verificar se os article_ids existem na tabela articles
        const articleIds = [...new Set(feedbacks.map(f => f.article_id))];
        const { data: existingArticles } = await supabase
          .from('articles')
          .select('id, title')
          .in('id', articleIds);
        
        console.log('\n📊 Verificação de relacionamento:');
        articleIds.forEach(id => {
          const article = existingArticles?.find(a => a.id === id);
          console.log(`- Artigo ID ${id}: ${article ? `✅ ${article.title}` : '❌ Não encontrado'}`);
        });
      } else {
        console.log('⚠️  PROBLEMA: Nenhum feedback encontrado na tabela');
      }
    }

    // 4. Testar query de ranking com nova fórmula
    console.log('\n4️⃣ Testando query de ranking com nova fórmula...');
    const { data: rankedArticles, error: rankingError } = await supabase
      .from('articles')
      .select(`
        id, title, slug, image_url, excerpt, content, created_at, category_id,
        positive_feedbacks, negative_feedbacks, comments_count, likes_count, published
      `)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (rankingError) {
      console.log('❌ Erro na query de ranking:', rankingError.message);
    } else {
      console.log('✅ Artigos publicados com score calculado:');
      const articlesWithScore = rankedArticles.map(article => ({
        ...article,
        rank_score: (article.positive_feedbacks || 0) * 3 + 
                   (article.comments_count || 0) * 2 + 
                   (article.likes_count || 0)
      })).sort((a, b) => b.rank_score - a.rank_score);
      
      articlesWithScore.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   Score: ${article.rank_score}`);
        console.log(`   Dados: P:${article.positive_feedbacks || 0} N:${article.negative_feedbacks || 0} C:${article.comments_count || 0} L:${article.likes_count || 0}`);
        console.log(`   ID: ${article.id}\n`);
      });
    }

    // 5. Verificar funções existentes
    console.log('5️⃣ Verificando funções relacionadas...');
    
    // Testar get_featured_articles
    const { data: featuredArticles, error: featuredError } = await supabase
      .rpc('get_featured_articles');

    if (featuredError) {
      console.log('❌ Função get_featured_articles:', featuredError.message);
    } else {
      console.log(`✅ Função get_featured_articles retornou ${featuredArticles?.length || 0} artigos`);
    }

    // Testar get_article_metrics
    const { data: metricsTest, error: metricsError } = await supabase
      .rpc('get_article_metrics', { article_id: articlesWithFeedback?.[0]?.id });

    if (metricsError) {
      console.log('❌ Função get_article_metrics:', metricsError.message);
    } else {
      console.log('✅ Função get_article_metrics funcionando');
    }

    // 6. Verificar se campo is_featured existe
    console.log('\n6️⃣ Verificando campo is_featured...');
    if (sampleArticle && 'is_featured' in sampleArticle) {
      console.log('✅ Campo is_featured já existe');
      
      const { data: featuredCount } = await supabase
        .from('articles')
        .select('id', { count: 'exact' })
        .eq('is_featured', true)
        .eq('published', true);
      
      console.log(`📊 Artigos marcados como destaque: ${featuredCount?.length || 0}`);
    } else {
      console.log('❌ Campo is_featured não existe - precisa ser criado');
    }

    console.log('\n🎯 RESUMO DO DIAGNÓSTICO:');
    console.log('================================');
    
  } catch (error) {
    console.error('❌ Erro geral no diagnóstico:', error);
  }
}

diagnoseHeroSystem();