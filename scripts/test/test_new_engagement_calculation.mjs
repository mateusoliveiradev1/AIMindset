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

async function testNewEngagementCalculation() {
  try {
    console.log('🧮 Testando novo cálculo de engajamento médio...\n');

    // 1. Buscar todos os artigos
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title')
      .eq('published', true);

    if (articlesError) {
      console.error('❌ Erro ao buscar artigos:', articlesError);
      return;
    }

    console.log(`📚 Total de artigos publicados: ${articles.length}`);

    // 2. Buscar métricas para cada artigo usando a função RPC
    const metricsPromises = articles.map(async (article) => {
      const { data: metrics, error } = await supabase
        .rpc('get_article_metrics', { article_id: article.id });

      if (error) {
        console.error(`❌ Erro ao buscar métricas para artigo ${article.id}:`, error);
        return null;
      }

      return {
        article_id: article.id,
        title: article.title,
        ...metrics
      };
    });

    const allMetrics = (await Promise.all(metricsPromises)).filter(Boolean);
    console.log(`📊 Métricas obtidas para ${allMetrics.length} artigos\n`);

    // 3. Calcular estatísticas
    let totalLikes = 0;
    let totalReplies = 0;
    let articlesWithEngagement = 0;

    console.log('📋 Detalhes por artigo:');
    allMetrics.forEach((metric, index) => {
      const likes = metric.total_likes || 0;
      const replies = metric.total_replies || 0;
      const hasEngagement = likes > 0 || replies > 0;

      console.log(`${index + 1}. ${metric.title.substring(0, 50)}...`);
      console.log(`   Curtidas: ${likes}, Respostas: ${replies}, Tem engajamento: ${hasEngagement ? 'Sim' : 'Não'}`);

      totalLikes += likes;
      totalReplies += replies;
      
      if (hasEngagement) {
        articlesWithEngagement++;
      }
    });

    console.log('\n📈 Resumo das estatísticas:');
    console.log(`Total de curtidas: ${totalLikes}`);
    console.log(`Total de respostas: ${totalReplies}`);
    console.log(`Total de engajamento: ${totalLikes + totalReplies}`);
    console.log(`Artigos com engajamento: ${articlesWithEngagement}`);
    console.log(`Total de artigos: ${allMetrics.length}`);

    // 4. Calcular engajamento médio (método antigo vs novo)
    const oldCalculation = allMetrics.length > 0 
      ? Math.round((totalLikes + totalReplies) / allMetrics.length)
      : 0;

    const newCalculation = articlesWithEngagement > 0 
      ? Math.round((totalLikes + totalReplies) / articlesWithEngagement)
      : 0;

    console.log('\n🔄 Comparação dos cálculos:');
    console.log(`Método antigo (dividir por todos os artigos): ${oldCalculation}`);
    console.log(`Método novo (dividir apenas por artigos ativos): ${newCalculation}`);
    console.log(`Diferença: ${newCalculation - oldCalculation}`);

    // 5. Verificar se o novo cálculo faz sentido
    if (articlesWithEngagement > 0) {
      const averageEngagementPerActiveArticle = (totalLikes + totalReplies) / articlesWithEngagement;
      console.log(`\n✅ Engajamento médio por artigo ativo: ${averageEngagementPerActiveArticle.toFixed(2)}`);
      console.log(`✅ Valor arredondado (exibido no dashboard): ${newCalculation}`);
    } else {
      console.log('\n⚠️ Nenhum artigo tem engajamento (curtidas ou respostas)');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testNewEngagementCalculation();