const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSaveArticle() {
  console.log('🧪 TESTANDO SALVAMENTO DE ARTIGO...\n');

  try {
    // 1. Verificar categorias disponíveis
    console.log('1️⃣ Verificando categorias...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .limit(5);

    if (catError) {
      console.error('❌ Erro ao buscar categorias:', catError);
      return;
    }

    console.log('✅ Categorias encontradas:', categories?.length || 0);
    if (categories && categories.length > 0) {
      console.log('📋 Primeira categoria:', categories[0]);
    }

    // 2. Verificar usuários admin
    console.log('\n2️⃣ Verificando usuários admin...');
    const { data: users, error: userError } = await supabase
      .from('admin_users')
      .select('*')
      .limit(1);

    if (userError) {
      console.error('❌ Erro ao buscar usuários:', userError);
      return;
    }

    console.log('✅ Usuários admin encontrados:', users?.length || 0);
    if (users && users.length > 0) {
      console.log('👤 Primeiro usuário:', users[0]);
    }

    // 3. Tentar salvar um artigo de teste
    console.log('\n3️⃣ Tentando salvar artigo de teste...');
    
    const testArticle = {
      title: 'Artigo de Teste - ' + new Date().toISOString(),
      slug: 'artigo-teste-' + Date.now(),
      excerpt: 'Este é um artigo de teste para verificar o salvamento.',
      meta_description: 'Meta description do artigo de teste',
      content: '# Título do Artigo\n\nEste é o conteúdo do artigo de teste.\n\n## Subtítulo\n\nMais conteúdo aqui.',
      image_url: 'https://via.placeholder.com/800x400',
      category_id: categories && categories.length > 0 ? categories[0].id : null,
      author_id: users && users.length > 0 ? users[0].id : null,
      published: false
    };

    console.log('📝 Dados do artigo:', testArticle);

    const { data: savedArticle, error: saveError } = await supabase
      .from('articles')
      .insert([testArticle])
      .select()
      .single();

    if (saveError) {
      console.error('❌ ERRO AO SALVAR ARTIGO:', saveError);
      console.error('Detalhes do erro:', {
        message: saveError.message,
        details: saveError.details,
        hint: saveError.hint,
        code: saveError.code
      });
      return;
    }

    console.log('✅ ARTIGO SALVO COM SUCESSO!');
    console.log('🎉 ID do artigo:', savedArticle.id);
    console.log('📄 Artigo completo:', savedArticle);

    // 4. Verificar se o artigo foi realmente salvo
    console.log('\n4️⃣ Verificando se o artigo foi salvo...');
    const { data: verifyArticle, error: verifyError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', savedArticle.id)
      .single();

    if (verifyError) {
      console.error('❌ Erro ao verificar artigo:', verifyError);
      return;
    }

    console.log('✅ VERIFICAÇÃO CONFIRMADA - Artigo existe no banco!');
    console.log('📋 Título:', verifyArticle.title);
    console.log('🔗 Slug:', verifyArticle.slug);
    console.log('📅 Criado em:', verifyArticle.created_at);

  } catch (error) {
    console.error('💥 ERRO GERAL:', error);
  }
}

// Executar o teste
testSaveArticle();