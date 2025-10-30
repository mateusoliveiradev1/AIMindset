import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testAllArticlesMetrics() {
  console.log('🧪 Testando métricas de todos os artigos...');
  
  // Pegar todos os artigos
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title')
    .limit(10);
  
  if (!articles || articles.length === 0) {
    console.log('❌ Nenhum artigo encontrado');
    return;
  }
  
  console.log('📄 Artigos encontrados:', articles.length);
  
  let totalLikes = 0;
  let totalReplies = 0;
  let articlesWithMetrics = 0;
  
  for (const article of articles) {
    try {
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_article_metrics', { target_article_id: article.id });
      
      if (!rpcError && rpcData) {
        const likes = Number(rpcData.total_likes) || 0;
        const replies = Number(rpcData.total_replies) || 0;
        
        totalLikes += likes;
        totalReplies += replies;
        
        if (likes > 0 || replies > 0 || rpcData.positive_feedback > 0 || rpcData.negative_feedback > 0) {
          articlesWithMetrics++;
        }
        
        console.log(`📊 ${article.title.substring(0, 30)}... - Likes: ${likes}, Replies: ${replies}`);
      }
    } catch (e) {
      console.log('❌ Erro ao processar artigo:', article.id);
    }
  }
  
  const avgEngagement = articlesWithMetrics > 0 ? (totalLikes + totalReplies) / articlesWithMetrics : 0;
  
  console.log('\n📈 RESUMO FINAL:');
  console.log('  - Total de curtidas:', totalLikes);
  console.log('  - Total de respostas:', totalReplies);
  console.log('  - Artigos com métricas:', articlesWithMetrics);
  console.log('  - Engajamento médio:', avgEngagement.toFixed(2));
}

testAllArticlesMetrics();