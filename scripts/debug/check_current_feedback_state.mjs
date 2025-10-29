import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCurrentState() {
  try {
    console.log('🔍 VERIFICANDO ESTADO ATUAL DOS DADOS');
    console.log('==================================================');

    // 1. Verificar artigos e seus contadores
    console.log('\n1️⃣ Verificando artigos e contadores...');
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title, feedback_count, comment_count, like_count')
      .eq('published', true)
      .order('title');

    if (articlesError) {
      console.error('❌ Erro ao buscar artigos:', articlesError);
      return;
    }

    console.log(`✅ Encontrados ${articles.length} artigos publicados:`);
    articles.forEach(article => {
      console.log(`   📄 ${article.title}`);
      console.log(`      Feedbacks: ${article.feedback_count || 0} | Comentários: ${article.comment_count || 0} | Likes: ${article.like_count || 0}`);
    });

    // 2. Verificar feedbacks reais
    console.log('\n2️⃣ Verificando feedbacks reais...');
    const { data: feedbacks, error: feedbacksError } = await supabase
      .from('feedbacks')
      .select(`
        id, 
        article_id, 
        type, 
        created_at,
        articles!inner(title)
      `)
      .order('created_at', { ascending: false });

    if (feedbacksError) {
      console.error('❌ Erro ao buscar feedbacks:', feedbacksError);
      return;
    }

    console.log(`✅ Encontrados ${feedbacks.length} feedbacks:`);
    const feedbacksByArticle = {};
    feedbacks.forEach(feedback => {
      const title = feedback.articles.title;
      if (!feedbacksByArticle[title]) {
        feedbacksByArticle[title] = { positive: 0, negative: 0 };
      }
      feedbacksByArticle[title][feedback.type]++;
    });

    Object.entries(feedbacksByArticle).forEach(([title, counts]) => {
      console.log(`   👍 ${title}: ${counts.positive} positivos, ${counts.negative} negativos`);
    });

    // 3. Verificar comentários reais
    console.log('\n3️⃣ Verificando comentários reais...');
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select(`
        id, 
        article_id, 
        content, 
        like_count,
        created_at,
        articles!inner(title)
      `)
      .order('created_at', { ascending: false });

    if (commentsError) {
      console.error('❌ Erro ao buscar comentários:', commentsError);
      return;
    }

    console.log(`✅ Encontrados ${comments.length} comentários:`);
    const commentsByArticle = {};
    comments.forEach(comment => {
      const title = comment.articles.title;
      if (!commentsByArticle[title]) {
        commentsByArticle[title] = [];
      }
      commentsByArticle[title].push({
        content: comment.content.substring(0, 50) + '...',
        likes: comment.like_count || 0,
        date: new Date(comment.created_at).toLocaleDateString('pt-BR')
      });
    });

    Object.entries(commentsByArticle).forEach(([title, comments]) => {
      console.log(`   💬 ${title}: ${comments.length} comentários`);
      comments.forEach((comment, index) => {
        console.log(`      ${index + 1}. "${comment.content}" (${comment.likes} likes) - ${comment.date}`);
      });
    });

    // 4. Verificar comment_likes
    console.log('\n4️⃣ Verificando likes em comentários...');
    const { data: commentLikes, error: likesError } = await supabase
      .from('comment_likes')
      .select(`
        id,
        comment_id,
        created_at,
        comments!inner(
          content,
          articles!inner(title)
        )
      `)
      .order('created_at', { ascending: false });

    if (likesError) {
      console.error('❌ Erro ao buscar likes:', likesError);
      return;
    }

    console.log(`✅ Encontrados ${commentLikes.length} likes em comentários:`);
    commentLikes.forEach(like => {
      const title = like.comments.articles.title;
      const content = like.comments.content.substring(0, 30) + '...';
      const date = new Date(like.created_at).toLocaleDateString('pt-BR');
      console.log(`   ❤️ Like em "${content}" do artigo "${title}" - ${date}`);
    });

    // 5. Resumo por artigo
    console.log('\n5️⃣ RESUMO COMPLETO POR ARTIGO:');
    console.log('==================================================');
    
    for (const article of articles) {
      const articleFeedbacks = feedbacks.filter(f => f.article_id === article.id);
      const articleComments = comments.filter(c => c.article_id === article.id);
      const articleLikes = commentLikes.filter(l => 
        articleComments.some(c => c.id === l.comment_id)
      );

      console.log(`\n📄 ${article.title}`);
      console.log(`   Contadores na tabela: F:${article.feedback_count || 0} C:${article.comment_count || 0} L:${article.like_count || 0}`);
      console.log(`   Dados reais: F:${articleFeedbacks.length} C:${articleComments.length} L:${articleLikes.length}`);
      
      if (articleFeedbacks.length > 0) {
        const positive = articleFeedbacks.filter(f => f.type === 'positive').length;
        const negative = articleFeedbacks.filter(f => f.type === 'negative').length;
        console.log(`   Feedbacks: ${positive} positivos, ${negative} negativos`);
      }
      
      if (articleComments.length > 0) {
        console.log(`   Comentários:`);
        articleComments.forEach((comment, index) => {
          const likes = commentLikes.filter(l => l.comment_id === comment.id).length;
          console.log(`      ${index + 1}. "${comment.content.substring(0, 40)}..." (${likes} likes)`);
        });
      }
    }

    console.log('\n🎊 VERIFICAÇÃO COMPLETA!');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkCurrentState();