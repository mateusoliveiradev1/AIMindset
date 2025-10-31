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

console.log('👍 Testando Sistema de Feedbacks (Corrigido)...\n');

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
    
    // Dados de teste para feedback (estrutura correta)
    const testFeedback = {
      article_id: articleId,
      type: 'positive',
      content: 'Feedback de teste para verificar funcionalidade'
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
        .update({ 
          type: 'negative',
          content: 'Feedback atualizado para teste'
        })
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
      .select('id, type, content, created_at')
      .eq('article_id', articleId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (listError) {
      console.log(`  ❌ Erro ao listar feedbacks: ${listError.message}`);
    } else {
      console.log(`  ✅ Listagem realizada com sucesso! ${listData.length} feedbacks encontrados`);
      if (listData.length > 0) {
        console.log(`  📋 Feedbacks:`);
        listData.forEach((feedback, index) => {
          console.log(`    ${index + 1}. ${feedback.type} - ${feedback.content?.substring(0, 50) || 'Sem conteúdo'}...`);
        });
      }
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
    
    const { count: likeFeedbacks } = await supabase
      .from('feedbacks')
      .select('*', { count: 'exact', head: true })
      .eq('article_id', articleId)
      .eq('type', 'like');
    
    console.log(`  ✅ Estatísticas calculadas:`);
    console.log(`    Total: ${totalFeedbacks}`);
    console.log(`    Positivos: ${positiveFeedbacks}`);
    console.log(`    Negativos: ${negativeFeedbacks}`);
    console.log(`    Likes: ${likeFeedbacks}`);
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

async function testFeedbackTypes() {
  console.log('\\n🎯 Testando TIPOS de feedback permitidos...');
  
  const results = {
    positive: false,
    negative: false,
    like: false,
    comment: false
  };
  
  const articleId = await getValidArticleId();
  if (!articleId) return results;
  
  const feedbackTypes = ['positive', 'negative', 'like', 'comment'];
  const createdIds = [];
  
  for (const type of feedbackTypes) {
    try {
      console.log(`\\n  Testando tipo: ${type}...`);
      
      const testFeedback = {
        article_id: articleId,
        type: type,
        content: `Feedback de teste do tipo ${type}`
      };
      
      const { data, error } = await supabase
        .from('feedbacks')
        .insert([testFeedback])
        .select()
        .single();
      
      if (error) {
        console.log(`    ❌ Erro: ${error.message}`);
      } else {
        console.log(`    ✅ Tipo ${type} aceito com sucesso!`);
        results[type] = true;
        createdIds.push(data.id);
      }
    } catch (err) {
      console.log(`    ❌ Erro inesperado: ${err.message}`);
    }
  }
  
  // Limpar dados de teste
  for (const id of createdIds) {
    await supabase.from('feedbacks').delete().eq('id', id);
  }
  
  return results;
}

// Executar todos os testes
async function runFeedbacksTests() {
  console.log('='.repeat(60));
  console.log('👍 TESTE COMPLETO DO SISTEMA DE FEEDBACKS');
  console.log('='.repeat(60));
  
  const crudResults = await testFeedbacksCRUD();
  const typesResults = await testFeedbackTypes();
  
  console.log('\\n='.repeat(60));
  console.log('📊 RESUMO DOS TESTES DE FEEDBACKS');
  console.log('='.repeat(60));
  
  const allResults = { ...crudResults, ...typesResults };
  const totalTests = Object.keys(allResults).length;
  const passedTests = Object.values(allResults).filter(Boolean).length;
  
  console.log(`\\n📋 Operações CRUD:`);
  console.log(`  Criar: ${crudResults.create ? '✅' : '❌'}`);
  console.log(`  Ler: ${crudResults.read ? '✅' : '❌'}`);
  console.log(`  Atualizar: ${crudResults.update ? '✅' : '❌'}`);
  console.log(`  Deletar: ${crudResults.delete ? '✅' : '❌'}`);
  console.log(`  Listar: ${crudResults.list ? '✅' : '❌'}`);
  console.log(`  Estatísticas: ${crudResults.stats ? '✅' : '❌'}`);
  
  console.log(`\\n🎯 Tipos de Feedback:`);
  console.log(`  Positive: ${typesResults.positive ? '✅' : '❌'}`);
  console.log(`  Negative: ${typesResults.negative ? '✅' : '❌'}`);
  console.log(`  Like: ${typesResults.like ? '✅' : '❌'}`);
  console.log(`  Comment: ${typesResults.comment ? '✅' : '❌'}`);
  
  console.log(`\\n📈 Taxa de sucesso: ${((passedTests / totalTests) * 100).toFixed(1)}% (${passedTests}/${totalTests})`);
  
  if (passedTests === totalTests) {
    console.log('\\n🎉 Sistema de feedbacks está 100% funcional!');
  } else {
    console.log('\\n⚠️ Alguns problemas foram identificados no sistema de feedbacks.');
    
    const failedTests = Object.entries(allResults).filter(([_, success]) => !success);
    if (failedTests.length > 0) {
      console.log('\\n🚨 Testes que falharam:');
      failedTests.forEach(([test, _]) => console.log(`  - ${test}`));
    }
  }
  
  return allResults;
}

runFeedbacksTests()
  .then(() => {
    console.log('\\n✅ Teste do sistema de feedbacks concluído.');
  })
  .catch((error) => {
    console.error('\\n❌ Erro durante o teste:', error);
    process.exit(1);
  });