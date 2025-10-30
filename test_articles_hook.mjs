import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testArticlesHook() {
  console.log('🔍 TESTE: Simulando hook useArticles');
  console.log('==========================================');

  try {
    // 1. Buscar artigos como o hook faz
    console.log('\n1. Buscando artigos com categorias...');
    const articlesResult = await supabase
      .from('articles')
      .select(`
        *,
        category:categories (
          id,
          name,
          slug,
          description
        )
      `)
      .order('created_at', { ascending: false });

    if (articlesResult.error) {
      console.error('❌ Erro ao buscar artigos:', articlesResult.error);
      return;
    }

    console.log(`✅ Encontrados ${articlesResult.data?.length || 0} artigos`);

    // 2. Buscar métricas para cada artigo
    console.log('\n2. Buscando métricas para cada artigo...');
    
    const articlesWithMetrics = await Promise.all(
      articlesResult.data.map(async (article) => {
        try {
          console.log(`🎯 Buscando métricas para: ${article.title}`);
          
          const { data: metrics, error: metricsError } = await supabase
            .rpc('get_article_metrics', { target_article_id: article.id });

          if (metricsError) {
            console.error(`❌ Erro ao buscar métricas para ${article.title}:`, metricsError);
            return {
              ...article,
              positive_feedbacks: 0,
              negative_feedbacks: 0,
              likes_count: 0,
              comments_count: 0,
              approval_rate: 0
            };
          }
          
          if (metrics) {
            console.log(`✅ Métricas para ${article.title}:`, metrics);
            return {
              ...article,
              positive_feedbacks: metrics.positive_feedback || 0,
              negative_feedbacks: metrics.negative_feedback || 0,
              likes_count: metrics.total_likes || 0,
              comments_count: metrics.total_comments || 0,
              approval_rate: metrics.approval_rate || 0
            };
          }
          
          // Se não há métricas, usar valores padrão
          console.log(`⚠️ Sem métricas para ${article.title}, usando valores padrão`);
          return {
            ...article,
            positive_feedbacks: 0,
            negative_feedbacks: 0,
            likes_count: 0,
            comments_count: 0,
            approval_rate: 0
          };
        } catch (error) {
          console.warn(`⚠️ Métricas não disponíveis para "${article.title}":`, error);
          return {
            ...article,
            positive_feedbacks: 0,
            negative_feedbacks: 0,
            likes_count: 0,
            comments_count: 0,
            approval_rate: 0
          };
        }
      })
    );

    console.log('\n3. Resultado final dos artigos com métricas:');
    articlesWithMetrics.forEach(article => {
      console.log(`📊 ${article.title}:`);
      console.log(`   - Feedback Positivo: ${article.positive_feedbacks}`);
      console.log(`   - Feedback Negativo: ${article.negative_feedbacks}`);
      console.log(`   - Taxa de Aprovação: ${article.approval_rate}%`);
      console.log(`   - Comentários: ${article.comments_count}`);
      console.log(`   - Curtidas: ${article.likes_count}`);
      console.log('');
    });

    // 4. Verificar especificamente o artigo com feedback
    console.log('\n4. Verificando artigo "Revolução na Educação":');
    const revolutionArticle = articlesWithMetrics.find(a => 
      a.title.includes('Revolução na Educação')
    );
    
    if (revolutionArticle) {
      console.log('✅ Artigo encontrado:', {
        title: revolutionArticle.title,
        id: revolutionArticle.id,
        positive_feedbacks: revolutionArticle.positive_feedbacks,
        negative_feedbacks: revolutionArticle.negative_feedbacks,
        approval_rate: revolutionArticle.approval_rate,
        comments_count: revolutionArticle.comments_count,
        likes_count: revolutionArticle.likes_count
      });
    } else {
      console.log('❌ Artigo "Revolução na Educação" não encontrado');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testArticlesHook();