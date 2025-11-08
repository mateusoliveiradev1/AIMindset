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

console.log('📰 Testando Sistema de Artigos (Versão Corrigida)...\n');

async function getValidIds() {
  console.log('🔍 Buscando IDs válidos para teste...');
  
  // Buscar categoria válida
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .limit(1);
  
  // Buscar admin user válido
  const { data: adminUsers } = await supabase
    .from('admin_users')
    .select('id, name')
    .limit(1);
  
  console.log(`  📋 Categoria encontrada: ${categories?.[0]?.name || 'Nenhuma'}`);
  console.log(`  👤 Admin encontrado: ${adminUsers?.[0]?.name || 'Nenhum'}`);
  
  return {
    categoryId: categories?.[0]?.id || null,
    authorId: adminUsers?.[0]?.id || null
  };
}

async function testArticlesCRUD() {
  const results = {
    create: false,
    read: false,
    update: false,
    delete: false,
    list: false
  };
  
  let createdArticleId = null;
  
  try {
    // Obter IDs válidos
    const { categoryId, authorId } = await getValidIds();
    
    // Dados de teste corrigidos
    const testArticle = {
      title: 'Artigo de Teste - Verificação de Integridade',
      excerpt: 'Este é um artigo de teste para verificar a integridade do sistema.',
      content: 'Conteúdo completo do artigo de teste para verificação de funcionalidades.',
      published: true,
      slug: 'artigo-teste-integridade-' + Date.now(),
      category_id: categoryId,
      author_id: authorId,
      image_url: 'https://via.placeholder.com/800x400',
      tags: 'teste,integridade',
      is_featured: false
    };
    
    console.log('📝 Testando CRIAÇÃO de artigo...');
    
    // CREATE - Criar artigo
    const { data: createData, error: createError } = await supabase
      .from('articles')
      .insert([testArticle])
      .select()
      .single();
    
    if (createError) {
      console.log(`  ❌ Erro ao criar artigo: ${createError.message}`);
    } else {
      console.log(`  ✅ Artigo criado com sucesso! ID: ${createData.id}`);
      createdArticleId = createData.id;
      results.create = true;
    }
    
    if (createdArticleId) {
      console.log('\\n📖 Testando LEITURA de artigo...');
      
      // READ - Ler artigo específico
      const { data: readData, error: readError } = await supabase
        .from('articles')
        .select('*')
        .eq('id', createdArticleId)
        .single();
      
      if (readError) {
        console.log(`  ❌ Erro ao ler artigo: ${readError.message}`);
      } else {
        console.log(`  ✅ Artigo lido com sucesso! Título: ${readData.title}`);
        results.read = true;
      }
      
      console.log('\\n📝 Testando ATUALIZAÇÃO de artigo...');
      
      // UPDATE - Atualizar artigo
      const updatedTitle = 'Artigo de Teste - ATUALIZADO';
      const { data: updateData, error: updateError } = await supabase
        .from('articles')
        .update({ title: updatedTitle })
        .eq('id', createdArticleId)
        .select()
        .single();
      
      if (updateError) {
        console.log(`  ❌ Erro ao atualizar artigo: ${updateError.message}`);
      } else {
        console.log(`  ✅ Artigo atualizado com sucesso! Novo título: ${updateData.title}`);
        results.update = true;
      }
    }
    
    console.log('\\n📋 Testando LISTAGEM de artigos...');
    
    // LIST - Listar artigos
    const { data: listData, error: listError } = await supabase
      .from('articles')
      .select('id, title, excerpt, published, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (listError) {
      console.log(`  ❌ Erro ao listar artigos: ${listError.message}`);
    } else {
      console.log(`  ✅ Listagem realizada com sucesso! ${listData.length} artigos encontrados`);
      results.list = true;
    }
    
    if (createdArticleId) {
      console.log('\\n🗑️ Testando EXCLUSÃO de artigo...');
      
      // DELETE - Deletar artigo de teste
      const { error: deleteError } = await supabase
        .from('articles')
        .delete()
        .eq('id', createdArticleId);
      
      if (deleteError) {
        console.log(`  ❌ Erro ao deletar artigo: ${deleteError.message}`);
      } else {
        console.log(`  ✅ Artigo deletado com sucesso!`);
        results.delete = true;
      }
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado durante os testes:', error.message);
  }
  
  return results;
}

async function testArticleRelations() {
  console.log('\\n🔗 Testando RELACIONAMENTOS de artigos...');
  
  const results = {
    categories: false,
    authors: false,
    feedbacks: false,
    comments_manual: false,
    stats: false
  };
  
  try {
    // Buscar artigo com categoria
    console.log('📂 Testando relação com categorias...');
    const { data: articlesWithCategories, error: categoriesError } = await supabase
      .from('articles')
      .select(`
        id, title,
        categories (id, name)
      `)
      .limit(3);
    
    if (categoriesError) {
      console.log(`  ❌ Erro ao buscar artigos com categorias: ${categoriesError.message}`);
    } else {
      console.log(`  ✅ Relação com categorias funcionando! ${articlesWithCategories.length} artigos verificados`);
      results.categories = true;
    }
    
    // Buscar artigo com autor
    console.log('\\n👤 Testando relação com autores...');
    const { data: articlesWithAuthors, error: authorsError } = await supabase
      .from('articles')
      .select(`
        id, title,
        admin_users (id, name)
      `)
      .limit(3);
    
    if (authorsError) {
      console.log(`  ❌ Erro ao buscar artigos com autores: ${authorsError.message}`);
    } else {
      console.log(`  ✅ Relação com autores funcionando! ${articlesWithAuthors.length} artigos verificados`);
      results.authors = true;
    }
    
    // Buscar artigo com feedbacks
    console.log('\\n👍 Testando relação com feedbacks...');
    const { data: articlesWithFeedbacks, error: feedbacksError } = await supabase
      .from('articles')
      .select(`
        id, title,
        feedbacks (id, type, created_at)
      `)
      .limit(3);
    
    if (feedbacksError) {
      console.log(`  ❌ Erro ao buscar artigos com feedbacks: ${feedbacksError.message}`);
    } else {
      console.log(`  ✅ Relação com feedbacks funcionando! ${articlesWithFeedbacks.length} artigos verificados`);
      results.feedbacks = true;
    }
    
    // Testar comentários manualmente (sem foreign key direta)
    console.log('\\n💬 Testando comentários (busca manual)...');
    const { data: articles } = await supabase
      .from('articles')
      .select('id')
      .limit(1);
    
    if (articles && articles.length > 0) {
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('id, content, user_name')
        .eq('article_id', articles[0].id);
      
      if (commentsError) {
        console.log(`  ❌ Erro ao buscar comentários: ${commentsError.message}`);
      } else {
        console.log(`  ✅ Busca de comentários funcionando! ${comments.length} comentários encontrados`);
        results.comments_manual = true;
      }
    }
    
    // Testar estatísticas básicas
    console.log('\\n📊 Testando estatísticas de artigos...');
    const { count: totalArticles, error: countError } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true });
    
    const { count: publishedArticles, error: publishedError } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('published', true);
    
    if (countError || publishedError) {
      console.log(`  ❌ Erro ao calcular estatísticas`);
    } else {
      console.log(`  ✅ Estatísticas calculadas: ${totalArticles} total, ${publishedArticles} publicados`);
      results.stats = true;
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado ao testar relacionamentos:', error.message);
  }
  
  return results;
}

// Executar todos os testes
async function runArticleTests() {
  console.log('='.repeat(60));
  console.log('📰 TESTE COMPLETO DO SISTEMA DE ARTIGOS (CORRIGIDO)');
  console.log('='.repeat(60));
  
  const crudResults = await testArticlesCRUD();
  const relationResults = await testArticleRelations();
  
  console.log('\\n='.repeat(60));
  console.log('📊 RESUMO DOS TESTES DE ARTIGOS');
  console.log('='.repeat(60));
  
  const allResults = { ...crudResults, ...relationResults };
  const totalTests = Object.keys(allResults).length;
  const passedTests = Object.values(allResults).filter(Boolean).length;
  
  console.log(`\\n📋 Operações CRUD:`);
  console.log(`  Criar: ${crudResults.create ? '✅' : '❌'}`);
  console.log(`  Ler: ${crudResults.read ? '✅' : '❌'}`);
  console.log(`  Atualizar: ${crudResults.update ? '✅' : '❌'}`);
  console.log(`  Deletar: ${crudResults.delete ? '✅' : '❌'}`);
  console.log(`  Listar: ${crudResults.list ? '✅' : '❌'}`);
  
  console.log(`\\n🔗 Relacionamentos:`);
  console.log(`  Categorias: ${relationResults.categories ? '✅' : '❌'}`);
  console.log(`  Autores: ${relationResults.authors ? '✅' : '❌'}`);
  console.log(`  Feedbacks: ${relationResults.feedbacks ? '✅' : '❌'}`);
  console.log(`  Comentários: ${relationResults.comments_manual ? '✅' : '❌'}`);
  console.log(`  Estatísticas: ${relationResults.stats ? '✅' : '❌'}`);
  
  console.log(`\\n📈 Taxa de sucesso: ${((passedTests / totalTests) * 100).toFixed(1)}% (${passedTests}/${totalTests})`);
  
  if (passedTests === totalTests) {
    console.log('\\n🎉 Sistema de artigos está 100% funcional!');
  } else {
    console.log('\\n⚠️ Alguns problemas foram identificados no sistema de artigos.');
    
    // Listar problemas específicos
    const failedTests = Object.entries(allResults).filter(([_, success]) => !success);
    if (failedTests.length > 0) {
      console.log('\\n🚨 Testes que falharam:');
      failedTests.forEach(([test, _]) => console.log(`  - ${test}`));
    }
  }
  
  return allResults;
}

runArticleTests()
  .then(() => {
    console.log('\\n✅ Teste do sistema de artigos concluído.');
  })
  .catch((error) => {
    console.error('\\n❌ Erro durante o teste:', error);
    process.exit(1);
  });