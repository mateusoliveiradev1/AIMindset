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

async function debugHookMetrics() {
  console.log('🔍 DEBUG: Testando hook useRealTimeMetrics');
  console.log('==========================================');

  try {
    // 1. Buscar todos os artigos
    console.log('\n1. Buscando artigos...');
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title, published')
      .eq('published', true);

    if (articlesError) {
      console.error('❌ Erro ao buscar artigos:', articlesError);
      return;
    }

    console.log(`✅ Encontrados ${articles?.length || 0} artigos publicados`);
    articles?.forEach(article => {
      console.log(`   - ${article.title} (${article.id})`);
    });

    if (!articles || articles.length === 0) {
      console.log('⚠️ Nenhum artigo publicado encontrado');
      return;
    }

    // 2. Testar a função get_article_metrics para cada artigo
    console.log('\n2. Testando função get_article_metrics...');
    
    for (const article of articles) {
      console.log(`\n🎯 Testando artigo: ${article.title}`);
      console.log(`   ID: ${article.id}`);
      
      // Testar função RPC
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_article_metrics', { target_article_id: article.id });

      if (rpcError) {
        console.error(`❌ Erro RPC para ${article.id}:`, rpcError);
      } else {
        console.log(`✅ Dados RPC para ${article.id}:`, rpcData);
      }

      // Verificar feedbacks manualmente
      const { data: feedbacks, error: feedbackError } = await supabase
        .from('feedbacks')
        .select('type')
        .eq('article_id', article.id);

      if (feedbackError) {
        console.error(`❌ Erro ao buscar feedbacks para ${article.id}:`, feedbackError);
      } else {
        const positive = feedbacks?.filter(f => f.type === 'positive').length || 0;
        const negative = feedbacks?.filter(f => f.type === 'negative').length || 0;
        console.log(`📊 Feedbacks manuais para ${article.id}:`, {
          positive,
          negative,
          total: positive + negative
        });
      }

      // Verificar comentários
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('id, likes, parent_id')
        .eq('article_id', article.id);

      if (commentsError) {
        console.error(`❌ Erro ao buscar comentários para ${article.id}:`, commentsError);
      } else {
        const totalLikes = comments?.reduce((sum, comment) => sum + (Number(comment.likes) || 0), 0) || 0;
        const totalReplies = comments?.filter(comment => comment.parent_id !== null).length || 0;
        console.log(`💬 Comentários para ${article.id}:`, {
          total: comments?.length || 0,
          totalLikes,
          totalReplies
        });
      }
    }

    // 3. Simular o que o hook faria
    console.log('\n3. Simulando processamento do hook...');
    
    const mockMetrics = {};
    
    for (const article of articles) {
      // Buscar dados como o hook faz
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_article_metrics', { target_article_id: article.id });

      if (!rpcError && rpcData) {
        mockMetrics[article.id] = {
          articleId: article.id,
          positiveFeedback: Number(rpcData.positive_feedback) || 0,
          negativeFeedback: Number(rpcData.negative_feedback) || 0,
          comments: Number(rpcData.total_comments) || 0,
          approvalRate: Number(rpcData.approval_rate) || 0,
          total_likes: Number(rpcData.total_likes) || 0,
          total_replies: Number(rpcData.total_replies) || 0,
          engagement_rate: Number(rpcData.engagement_rate) || 0
        };
      }
    }

    console.log('\n📈 Métricas simuladas do hook:');
    console.log(JSON.stringify(mockMetrics, null, 2));

    // 4. Verificar como o FeedbackDashboard processaria
    console.log('\n4. Simulando processamento do FeedbackDashboard...');
    
    const formatted = Object.entries(mockMetrics).map(([articleId, metric]) => {
      const positiveFeedback = Number(metric.positiveFeedback) || 0;
      const negativeFeedback = Number(metric.negativeFeedback) || 0;
      const totalComments = Number(metric.comments) || 0;
      const approvalRate = Number(metric.approvalRate) || 0;
      
      return {
        article_id: articleId,
        positive_feedback: positiveFeedback,
        negative_feedback: negativeFeedback,
        total_comments: totalComments,
        approval_rate: isNaN(approvalRate) ? 0 : approvalRate,
        total_likes: metric.total_likes || 0,
        total_replies: metric.total_replies || 0,
        engagement_rate: metric.engagement_rate || 0
      };
    });

    console.log('\n📊 Dados formatados para o dashboard:');
    console.log(JSON.stringify(formatted, null, 2));

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugHookMetrics();