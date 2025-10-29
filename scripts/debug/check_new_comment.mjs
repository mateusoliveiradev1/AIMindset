import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabase = createClient(supabaseUrl, supabaseKey);

// Comentários históricos conhecidos
const HISTORIC_COMMENTS = [
  "Excelente artigo! As dicas de produtividade realmente funcionam.",
  "Muito interessante a abordagem sobre tecnologias educacionais.",
  "Concordo plenamente com os pontos levantados sobre o futuro da educação.",
  "A IA realmente está mudando tudo. Artigo muito esclarecedor!",
  "Fascinante! Mal posso esperar para ver os avanços na computação quântica."
];

async function checkForNewComments() {
  try {
    console.log('🔍 VERIFICANDO COMENTÁRIOS NOVOS');
    console.log('==================================');

    // Buscar todos os comentários atuais
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('id, content, user_name, likes, created_at, article_id')
      .order('created_at', { ascending: false });

    // Buscar todos os artigos para fazer o match
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title');

    if (commentsError) {
      console.error('❌ Erro ao buscar comentários:', commentsError);
      return;
    }

    console.log(`📝 Total de comentários encontrados: ${comments.length}`);
    console.log('\n📋 TODOS OS COMENTÁRIOS:');
    
    let newCommentsFound = 0;
    
    for (const comment of comments) {
      try {
        const article = articles.find(a => a.id === comment.article_id);
        const articleTitle = article ? article.title : 'Artigo não encontrado';
        
        const isHistoric = HISTORIC_COMMENTS.includes(comment.content);
        const status = isHistoric ? '📚 HISTÓRICO' : '🆕 NOVO';
        
        console.log(`\n${status}`);
        console.log(`   Artigo: ${articleTitle}`);
        console.log(`   Comentário: "${comment.content}"`);
        console.log(`   Usuário: ${comment.user_name || 'N/A'}`);
        console.log(`   Likes: ${comment.likes || 0}`);
        console.log(`   Data: ${new Date(comment.created_at).toLocaleString('pt-BR')}`);
        
        if (!isHistoric) {
          newCommentsFound++;
          console.log(`   ⚠️ ESTE É UM COMENTÁRIO NOVO QUE PRECISA SER PRESERVADO!`);
        }
      } catch (err) {
        console.error(`   ❌ Erro ao processar comentário:`, err.message);
        console.log(`   Dados do comentário:`, comment);
      }
    }

    console.log(`\n📊 RESUMO:`);
    console.log(`   Total de comentários: ${comments.length}`);
    console.log(`   Comentários históricos: ${comments.length - newCommentsFound}`);
    console.log(`   Comentários novos: ${newCommentsFound}`);

    if (newCommentsFound > 0) {
      console.log(`\n🎯 AÇÃO NECESSÁRIA:`);
      console.log(`   Encontrados ${newCommentsFound} comentários novos que devem ser preservados!`);
      console.log(`   Estes comentários representam feedback real dos usuários.`);
    } else {
      console.log(`\n✅ SITUAÇÃO ATUAL:`);
      console.log(`   Todos os comentários são históricos conhecidos.`);
      console.log(`   Nenhum comentário novo foi identificado no momento.`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkForNewComments();