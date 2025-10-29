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

console.log('🔍 INVESTIGAÇÃO DETALHADA DOS LIKES DE COMENTÁRIOS');
console.log('==================================================');

async function investigateLikes() {
  try {
    // 1. Buscar todos os comentários com likes
    console.log('📊 1. Buscando TODOS os comentários...');
    
    const { data: allComments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false });

    if (commentsError) {
      console.error('❌ Erro ao buscar comentários:', commentsError);
      return;
    }

    console.log(`✅ Encontrados ${allComments.length} comentários`);
    console.log('');

    // 2. Analisar comentários com likes
    const commentsWithLikes = allComments.filter(comment => comment.likes_count > 0);
    
    console.log(`💖 Comentários com likes: ${commentsWithLikes.length}`);
    console.log('');

    if (commentsWithLikes.length > 0) {
      console.log('📝 DETALHES DOS COMENTÁRIOS COM LIKES:');
      
      for (const comment of commentsWithLikes) {
        console.log(`   💬 Comentário ID: ${comment.id}`);
        console.log(`   📄 Artigo ID: ${comment.article_id}`);
        console.log(`   💖 Likes: ${comment.likes_count}`);
        console.log(`   📅 Criado em: ${comment.created_at}`);
        console.log(`   ✍️ Conteúdo: ${comment.content.substring(0, 100)}...`);
        
        // Buscar o artigo correspondente
        const { data: article } = await supabase
          .from('articles')
          .select('title, likes_count')
          .eq('id', comment.article_id)
          .single();

        if (article) {
          console.log(`   📰 Artigo: "${article.title}"`);
          console.log(`   📊 Likes no artigo: ${article.likes_count}`);
        }
        
        console.log('');
      }
    }

    // 3. Verificar artigos e seus comentários
    console.log('🔍 VERIFICAÇÃO POR ARTIGO:');
    console.log('');

    const { data: articles } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    for (const article of articles) {
      const articleComments = allComments.filter(c => c.article_id === article.id);
      const totalLikes = articleComments.reduce((sum, comment) => sum + (comment.likes_count || 0), 0);
      
      if (articleComments.length > 0 || totalLikes > 0) {
        console.log(`📰 "${article.title}"`);
        console.log(`   💬 Comentários: ${articleComments.length}`);
        console.log(`   💖 Total de likes calculado: ${totalLikes}`);
        console.log(`   📊 Likes no banco (artigo): ${article.likes_count}`);
        
        if (totalLikes !== article.likes_count) {
          console.log(`   ⚠️  DISCREPÂNCIA! Calculado: ${totalLikes}, Banco: ${article.likes_count}`);
        } else {
          console.log(`   ✅ Sincronizado`);
        }
        
        if (articleComments.length > 0) {
          console.log(`   📝 Comentários detalhados:`);
          articleComments.forEach((comment, index) => {
            console.log(`      ${index + 1}. Likes: ${comment.likes_count} | "${comment.content.substring(0, 50)}..."`);
          });
        }
        
        console.log('');
      }
    }

    // 4. Buscar feedbacks para verificar se ainda existem
    console.log('🔍 VERIFICAÇÃO DE FEEDBACKS:');
    console.log('');

    const { data: allFeedbacks } = await supabase
      .from('feedbacks')
      .select('*');

    console.log(`📊 Total de feedbacks no banco: ${allFeedbacks?.length || 0}`);
    
    if (allFeedbacks && allFeedbacks.length > 0) {
      const positiveFeedbacks = allFeedbacks.filter(f => f.is_positive);
      const negativeFeedbacks = allFeedbacks.filter(f => !f.is_positive);
      
      console.log(`   ✅ Feedbacks positivos: ${positiveFeedbacks.length}`);
      console.log(`   ❌ Feedbacks negativos: ${negativeFeedbacks.length}`);
      
      // Agrupar por artigo
      const feedbacksByArticle = {};
      allFeedbacks.forEach(feedback => {
        if (!feedbacksByArticle[feedback.article_id]) {
          feedbacksByArticle[feedback.article_id] = { positive: 0, negative: 0 };
        }
        if (feedback.is_positive) {
          feedbacksByArticle[feedback.article_id].positive++;
        } else {
          feedbacksByArticle[feedback.article_id].negative++;
        }
      });
      
      console.log('');
      console.log('📊 Feedbacks por artigo:');
      for (const [articleId, counts] of Object.entries(feedbacksByArticle)) {
        const { data: article } = await supabase
          .from('articles')
          .select('title')
          .eq('id', articleId)
          .single();
        
        if (article) {
          console.log(`   📰 "${article.title}": +${counts.positive} / -${counts.negative}`);
        }
      }
    }

    console.log('');
    console.log('🎯 INVESTIGAÇÃO CONCLUÍDA!');
    
  } catch (error) {
    console.error('❌ Erro durante a investigação:', error);
  }
}

// Executar investigação
investigateLikes();