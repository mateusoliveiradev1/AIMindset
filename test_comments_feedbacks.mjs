import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('💬 Testando Sistema de Comentários e Feedbacks...\n');

async function getValidArticleId() {
  console.log('🔍 Buscando artigo válido para teste...');
  
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title')
    .eq('published', true)
    .limit(1);
  
  if (articles && articles.length > 0) {
    console.log(`  📰 Artigo encontrado: ${articles[0].title}`);
    return articles[0].id;
  }
  
  console.log('  ❌ Nenhum artigo publicado encontrado');
  return null;
}

async function testCommentsCRUD() {
  console.log('\\n💬 Testando Sistema de Comentários...');
  
  const results = {
    create: false,
    read: false,
    update: false,
    delete: false,
    list: false,
    replies: false
  };
  
  let createdCommentId = null;
  let createdReplyId = null;
  
  try {
    const articleId = await getValidArticleId();
    
    if (!articleId) {
      console.log('❌ Não é possível testar comentários sem artigos válidos');
      return results;
    }
    
    // Dados de teste para comentário
    const testComment = {
      article_id: articleId,
      user_name: 'Usuário Teste',
      content: 'Este é um comentário de teste para verificar a funcionalidade do sistema.'
    };
    
    console.log('\\n📝 Testando CRIAÇÃO de comentário...');
    
    // CREATE - Criar comentário
    const { data: createData, error: createError } = await supabase
      .from('comments')
      .insert([testComment])
      .select()
      .single();
    
    if (createError) {
      console.log(`  ❌ Erro ao criar comentário: ${createError.message}`);
    } else {
      console.log(`  ✅ Comentário criado com sucesso! ID: ${createData.id}`);
      createdCommentId = createData.id;
      results.create = true;
    }
    
    if (createdCommentId) {
      console.log('\\n📖 Testando LEITURA de comentário...');
      
      // READ - Ler comentário específico
      const { data: readData, error: readError } = await supabase
        .from('comments')
        .select('*')
        .eq('id', createdCommentId)
        .single();
      
      if (readError) {
        console.log(`  ❌ Erro ao ler comentário: ${readError.message}`);
      } else {
        console.log(`  ✅ Comentário lido com sucesso! Autor: ${readData.user_name}`);
        results.read = true;
      }
      
      console.log('\\n📝 Testando ATUALIZAÇÃO de comentário...');
      
      // UPDATE - Atualizar comentário (incrementar likes)
      const { data: updateData, error: updateError } = await supabase
        .from('comments')
        .update({ likes: 5 })
        .eq('id', createdCommentId)
        .select()
        .single();
      
      if (updateError) {
        console.log(`  ❌ Erro ao atualizar comentário: ${updateError.message}`);
      } else {
        console.log(`  ✅ Comentário atualizado com sucesso! Likes: ${updateData.likes}`);
        results.update = true;
      }
      
      // Testar resposta a comentário
      console.log('\\n💬 Testando RESPOSTA a comentário...');
      
      const testReply = {
        article_id: articleId,
        user_name: 'Usuário Resposta',
        content: 'Esta é uma resposta ao comentário de teste.',
        parent_id: createdCommentId
      };
      
      const { data: replyData, error: replyError } = await supabase
        .from('comments')
        .insert([testReply])
        .select()
        .single();
      
      if (replyError) {
        console.log(`  ❌ Erro ao criar resposta: ${replyError.message}`);
      } else {
        console.log(`  ✅ Resposta criada com sucesso! ID: ${replyData.id}`);
        createdReplyId = replyData.id;
        results.replies = true;
      }
    }
    
    console.log('\\n📋 Testando LISTAGEM de comentários...');
    
    // LIST - Listar comentários do artigo
    const { data: listData, error: listError } = await supabase
      .from('comments')
      .select('id, user_name, content, likes, parent_id, created_at')
      .eq('article_id', articleId)
      .order('created_at', { ascending: true });
    
    if (listError) {
      console.log(`  ❌ Erro ao listar comentários: ${listError.message}`);
    } else {
      console.log(`  ✅ Listagem realizada com sucesso! ${listData.length} comentários encontrados`);
      if (listData.length > 0) {
        console.log(`  📋 Comentários:`);
        listData.forEach((comment, index) => {
          const type = comment.parent_id ? '  └─ Resposta' : '📝 Comentário';
          console.log(`    ${type}: ${comment.user_name} - ${comment.content.substring(0, 50)}...`);
        });
      }
      results.list = true;
    }
    
    // Limpar dados de teste
    if (createdReplyId) {
      await supabase.from('comments').delete().eq('id', createdReplyId);
    }
    
    if (createdCommentId) {
      console.log('\\n🗑️ Testando EXCLUSÃO de comentário...');
      
      const { error: deleteError } = await supabase
        .from('comments')
        .delete()
        .eq('id', createdCommentId);
      
      if (deleteError) {
        console.log(`  ❌ Erro ao deletar comentário: ${deleteError.message}`);
      } else {
        console.log(`  ✅ Comentário deletado com sucesso!`);
        results.delete = true;
      }
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado durante os testes de comentários:', error.message);
  }
  
  return results;
}

async function testFeedbacksCRUD() {
  console.log('\\n👍 Testando Sistema de Feedbacks...');
  
  const results = {
    create: false,
    read: false,
    update: false,
    delete: false,
    list: false,
    stats: false
  };
  
  let createdFeedbackId = null;
  
  try {
    const articleId = await getValidArticleId();
    
    if (!articleId) {
      console.log('❌ Não é possível testar feedbacks sem artigos válidos');
      return results;
    }
    
    // Dados de teste para feedback
    const testFeedback = {
      article_id: articleId,
      type: 'positive',
      user_ip: '127.0.0.1'
    };
    
    console.log('\\n📝 Testando CRIAÇÃO de feedback...');
    
    // CREATE - Criar feedback
    const { data: createData, error: createError } = await supabase
      .from('feedbacks')
      .insert([testFeedback])
      .select()
      .single();
    
    if (createError) {
      console.log(`  ❌ Erro ao criar feedback: ${createError.message}`);
    } else {
      console.log(`  ✅ Feedback criado com sucesso! ID: ${createData.id}`);
      createdFeedbackId = createData.id;
      results.create = true;
    }
    
    if (createdFeedbackId) {
      console.log('\\n📖 Testando LEITURA de feedback...');
      
      // READ - Ler feedback específico
      const { data: readData, error: readError } = await supabase
        .from('feedbacks')
        .select('*')
        .eq('id', createdFeedbackId)
        .single();
      
      if (readError) {
        console.log(`  ❌ Erro ao ler feedback: ${readError.message}`);
      } else {
        console.log(`  ✅ Feedback lido com sucesso! Tipo: ${readData.type}`);
        results.read = true;
      }
      
      console.log('\\n📝 Testando ATUALIZAÇÃO de feedback...');
      
      // UPDATE - Atualizar feedback
      const { data: updateData, error: updateError } = await supabase
        .from('feedbacks')
        .update({ type: 'negative' })
        .eq('id', createdFeedbackId)
        .select()
        .single();
      
      if (updateError) {
        console.log(`  ❌ Erro ao atualizar feedback: ${updateError.message}`);
      } else {
        console.log(`  ✅ Feedback atualizado com sucesso! Novo tipo: ${updateData.type}`);
        results.update = true;
      }
    }
    
    console.log('\\n📋 Testando LISTAGEM de feedbacks...');
    
    // LIST - Listar feedbacks do artigo
    const { data: listData, error: listError } = await supabase
      .from('feedbacks')
      .select('id, type, user_ip, created_at')
      .eq('article_id', articleId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (listError) {
      console.log(`  ❌ Erro ao listar feedbacks: ${listError.message}`);
    } else {
      console.log(`  ✅ Listagem realizada com sucesso! ${listData.length} feedbacks encontrados`);
      results.list = true;
    }
    
    console.log('\\n📊 Testando ESTATÍSTICAS de feedbacks...');
    
    // STATS - Calcular estatísticas
    const { count: totalFeedbacks } = await supabase
      .from('feedbacks')
      .select('*', { count: 'exact', head: true })
      .eq('article_id', articleId);
    
    const { count: positiveFeedbacks } = await supabase
      .from('feedbacks')
      .select('*', { count: 'exact', head: true })
      .eq('article_id', articleId)
      .eq('type', 'positive');
    
    const { count: negativeFeedbacks } = await supabase
      .from('feedbacks')
      .select('*', { count: 'exact', head: true })
      .eq('article_id', articleId)
      .eq('type', 'negative');
    
    console.log(`  ✅ Estatísticas calculadas: ${totalFeedbacks} total, ${positiveFeedbacks} positivos, ${negativeFeedbacks} negativos`);
    results.stats = true;
    
    if (createdFeedbackId) {
      console.log('\\n🗑️ Testando EXCLUSÃO de feedback...');
      
      const { error: deleteError } = await supabase
        .from('feedbacks')
        .delete()
        .eq('id', createdFeedbackId);
      
      if (deleteError) {
        console.log(`  ❌ Erro ao deletar feedback: ${deleteError.message}`);
      } else {
        console.log(`  ✅ Feedback deletado com sucesso!`);
        results.delete = true;
      }
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado durante os testes de feedbacks:', error.message);
  }
  
  return results;
}

// Executar todos os testes
async function runCommentsAndFeedbacksTests() {
  console.log('='.repeat(60));
  console.log('💬 TESTE COMPLETO DE COMENTÁRIOS E FEEDBACKS');
  console.log('='.repeat(60));
  
  const commentsResults = await testCommentsCRUD();
  const feedbacksResults = await testFeedbacksCRUD();
  
  console.log('\\n='.repeat(60));
  console.log('📊 RESUMO DOS TESTES');
  console.log('='.repeat(60));
  
  const allResults = { ...commentsResults, ...feedbacksResults };
  const totalTests = Object.keys(allResults).length;
  const passedTests = Object.values(allResults).filter(Boolean).length;
  
  console.log(`\\n💬 Sistema de Comentários:`);
  console.log(`  Criar: ${commentsResults.create ? '✅' : '❌'}`);
  console.log(`  Ler: ${commentsResults.read ? '✅' : '❌'}`);
  console.log(`  Atualizar: ${commentsResults.update ? '✅' : '❌'}`);
  console.log(`  Deletar: ${commentsResults.delete ? '✅' : '❌'}`);
  console.log(`  Listar: ${commentsResults.list ? '✅' : '❌'}`);
  console.log(`  Respostas: ${commentsResults.replies ? '✅' : '❌'}`);
  
  console.log(`\\n👍 Sistema de Feedbacks:`);
  console.log(`  Criar: ${feedbacksResults.create ? '✅' : '❌'}`);
  console.log(`  Ler: ${feedbacksResults.read ? '✅' : '❌'}`);
  console.log(`  Atualizar: ${feedbacksResults.update ? '✅' : '❌'}`);
  console.log(`  Deletar: ${feedbacksResults.delete ? '✅' : '❌'}`);
  console.log(`  Listar: ${feedbacksResults.list ? '✅' : '❌'}`);
  console.log(`  Estatísticas: ${feedbacksResults.stats ? '✅' : '❌'}`);
  
  console.log(`\\n📈 Taxa de sucesso: ${((passedTests / totalTests) * 100).toFixed(1)}% (${passedTests}/${totalTests})`);
  
  if (passedTests === totalTests) {
    console.log('\\n🎉 Sistemas de comentários e feedbacks estão 100% funcionais!');
  } else {
    console.log('\\n⚠️ Alguns problemas foram identificados.');
    
    const failedTests = Object.entries(allResults).filter(([_, success]) => !success);
    if (failedTests.length > 0) {
      console.log('\\n🚨 Testes que falharam:');
      failedTests.forEach(([test, _]) => console.log(`  - ${test}`));
    }
  }
  
  return allResults;
}

runCommentsAndFeedbacksTests()
  .then(() => {
    console.log('\\n✅ Teste de comentários e feedbacks concluído.');
  })
  .catch((error) => {
    console.error('\\n❌ Erro durante o teste:', error);
    process.exit(1);
  });