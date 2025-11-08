import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🧪 Inserindo dados de teste para interações...\n');

async function insertTestInteractions() {
  try {
    // 1. Buscar artigos publicados
    console.log('📚 Buscando artigos publicados...');
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title')
      .eq('published', true)
      .limit(3);

    if (articlesError) {
      console.error('❌ Erro ao buscar artigos:', articlesError);
      return;
    }

    if (!articles || articles.length === 0) {
      console.log('⚠️ Nenhum artigo publicado encontrado');
      return;
    }

    console.log(`✅ Encontrados ${articles.length} artigos publicados`);
    
    // 2. Inserir feedbacks de teste
    console.log('\n📊 Inserindo feedbacks de teste...');
    
    const feedbacksToInsert = [];
    
    articles.forEach((article, index) => {
      // Inserir 2-3 feedbacks por artigo
      const feedbackCount = 2 + (index % 2); // 2 ou 3 feedbacks
      
      for (let i = 0; i < feedbackCount; i++) {
        feedbacksToInsert.push({
          article_id: article.id,
          type: i % 3 === 0 ? 'negative' : 'positive', // Mais positivos que negativos
          user_email: `teste${index}${i}@example.com`,
          created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() // Últimos 7 dias
        });
      }
    });

    const { data: insertedFeedbacks, error: feedbackError } = await supabase
      .from('feedbacks')
      .insert(feedbacksToInsert)
      .select();

    if (feedbackError) {
      console.error('❌ Erro ao inserir feedbacks:', feedbackError);
    } else {
      console.log(`✅ Inseridos ${insertedFeedbacks?.length || 0} feedbacks`);
      
      // Mostrar resumo dos feedbacks inseridos
      const positiveCount = insertedFeedbacks?.filter(f => f.type === 'positive').length || 0;
      const negativeCount = insertedFeedbacks?.filter(f => f.type === 'negative').length || 0;
      console.log(`  - Positivos: ${positiveCount}`);
      console.log(`  - Negativos: ${negativeCount}`);
    }

    // 3. Inserir comentários de teste
    console.log('\n💬 Inserindo comentários de teste...');
    
    const commentsToInsert = [];
    
    articles.forEach((article, index) => {
      // Inserir 3-5 comentários por artigo
      const commentCount = 3 + (index % 3); // 3, 4 ou 5 comentários
      
      for (let i = 0; i < commentCount; i++) {
        commentsToInsert.push({
          article_id: article.id,
          user_name: `Usuário Teste ${index + 1}.${i + 1}`,
          user_email: `comentario${index}${i}@example.com`,
          content: `Este é um comentário de teste ${i + 1} para o artigo "${article.title}". Muito interessante!`,
          likes: Math.floor(Math.random() * 10), // 0-9 likes aleatórios
          created_at: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString() // Últimos 5 dias
        });
      }
    });

    const { data: insertedComments, error: commentError } = await supabase
      .from('comments')
      .insert(commentsToInsert)
      .select();

    if (commentError) {
      console.error('❌ Erro ao inserir comentários:', commentError);
    } else {
      console.log(`✅ Inseridos ${insertedComments?.length || 0} comentários`);
      
      // Mostrar resumo dos comentários inseridos
      const totalLikes = insertedComments?.reduce((sum, c) => sum + (c.likes || 0), 0) || 0;
      const avgLikes = insertedComments?.length ? (totalLikes / insertedComments.length).toFixed(1) : 0;
      console.log(`  - Total de likes: ${totalLikes}`);
      console.log(`  - Média de likes por comentário: ${avgLikes}`);
    }

    // 4. Inserir algumas respostas (comentários com parent_id)
    if (insertedComments && insertedComments.length > 0) {
      console.log('\n💬 Inserindo respostas de teste...');
      
      const repliesToInsert = [];
      
      // Inserir 1-2 respostas para alguns comentários
      const commentsToReply = insertedComments.slice(0, Math.min(3, insertedComments.length));
      
      commentsToReply.forEach((comment, index) => {
        repliesToInsert.push({
          article_id: comment.article_id,
          parent_id: comment.id,
          user_name: `Resposta Teste ${index + 1}`,
          user_email: `resposta${index}@example.com`,
          content: `Esta é uma resposta ao comentário de ${comment.user_name}. Concordo totalmente!`,
          likes: Math.floor(Math.random() * 5), // 0-4 likes aleatórios
          created_at: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString() // Últimos 2 dias
        });
      });

      const { data: insertedReplies, error: replyError } = await supabase
        .from('comments')
        .insert(repliesToInsert)
        .select();

      if (replyError) {
        console.error('❌ Erro ao inserir respostas:', replyError);
      } else {
        console.log(`✅ Inseridas ${insertedReplies?.length || 0} respostas`);
      }
    }

    // 5. Verificar totais finais
    console.log('\n🔢 Verificando totais finais...');
    
    const { data: finalFeedbacks } = await supabase
      .from('feedbacks')
      .select('type')
      .in('article_id', articles.map(a => a.id));

    const { data: finalComments } = await supabase
      .from('comments')
      .select('id, likes, parent_id')
      .in('article_id', articles.map(a => a.id));

    const totalFeedbacks = finalFeedbacks?.length || 0;
    const totalComments = finalComments?.length || 0;
    const totalReplies = finalComments?.filter(c => c.parent_id !== null).length || 0;
    const totalLikes = finalComments?.reduce((sum, c) => sum + (c.likes || 0), 0) || 0;
    const totalInteractions = totalFeedbacks + totalComments;

    console.log('\n📋 RESUMO FINAL:');
    console.log(`✅ Total de feedbacks: ${totalFeedbacks}`);
    console.log(`✅ Total de comentários: ${totalComments}`);
    console.log(`✅ Total de respostas: ${totalReplies}`);
    console.log(`✅ Total de likes: ${totalLikes}`);
    console.log(`✅ TOTAL DE INTERAÇÕES: ${totalInteractions}`);
    
    console.log('\n🎉 Dados de teste inseridos com sucesso!');
    console.log('   Agora o componente de status em tempo real deve mostrar as interações.');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar inserção
insertTestInteractions().then(() => {
  console.log('\n🏁 Inserção concluída');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});