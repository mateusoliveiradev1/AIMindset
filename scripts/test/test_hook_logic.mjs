import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testHookLogic() {
  console.log('🧪 Testando lógica do hook useRealTimeInteractions...\n');

  // 1. Buscar todos os artigos publicados (como o FeedbackDashboard faz)
  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('id, title, published')
    .eq('published', true);

  if (articlesError) {
    console.error('❌ Erro ao buscar artigos:', articlesError);
    return;
  }

  console.log(`📚 Artigos publicados: ${articles?.length || 0}`);
  
  // 2. Extrair articleIds (como o FeedbackDashboard faz)
  const articleIds = articles.map(article => article.id.toString());
  console.log('📋 ArticleIds:', articleIds);

  // 3. Replicar a lógica do loadInitialStats
  console.log('\n🔄 Executando loadInitialStats...');
  
  if (articleIds.length === 0) {
    console.log('⚠️ No articleIds provided to loadInitialStats');
    return;
  }

  console.log('📊 Loading initial stats for articles:', articleIds);

  try {
    const { data: feedbackData } = await supabase
      .from('feedbacks')
      .select('article_id, type')
      .in('article_id', articleIds);

    const { data: commentData } = await supabase
      .from('comments')
      .select('article_id, likes')
      .in('article_id', articleIds);

    console.log('📊 Loaded feedback data:', feedbackData);
    console.log('📊 Loaded comment data:', commentData);

    const initialStats = {};
    
    articleIds.forEach(articleId => {
      const articleFeedbacks = feedbackData?.filter(f => f.article_id === articleId) || [];
      const articleComments = commentData?.filter(c => c.article_id === articleId) || [];
      
      const positiveFeedbacks = articleFeedbacks.filter(f => f.type === 'positive').length;
      const negativeFeedbacks = articleFeedbacks.filter(f => f.type === 'negative').length;
      const totalComments = articleComments.length;
      const totalLikes = articleComments.reduce((sum, c) => sum + (c.likes || 0), 0);

      initialStats[articleId] = {
        totalFeedbacks: positiveFeedbacks + negativeFeedbacks,
        positiveFeedbacks,
        negativeFeedbacks,
        totalComments,
        totalLikes,
        lastUpdate: new Date()
      };
    });

    console.log('📊 Calculated initial stats:', initialStats);

    // 4. Calcular totalInteractions (como o hook faz)
    const totalInteractions = Object.values(initialStats).reduce((total, articleStats) => {
      return total + articleStats.totalFeedbacks + articleStats.totalComments;
    }, 0);

    console.log('🔢 Total interactions calculated:', totalInteractions);

  } catch (err) {
    console.error('❌ Erro ao carregar stats iniciais:', err);
  }
}

testHookLogic().catch(console.error);