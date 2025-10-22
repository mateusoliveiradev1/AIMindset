const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (usando as credenciais corretas do .env.local)
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('🔍 Testando estrutura do banco de dados...\n');

  try {
    // 1. Testar tabela admin_users
    console.log('1. Testando tabela admin_users:');
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('*');
    
    if (adminError) {
      console.error('❌ Erro ao consultar admin_users:', adminError.message);
    } else {
      console.log(`✅ admin_users: ${adminUsers.length} registros encontrados`);
      if (adminUsers.length > 0) {
        console.log('   Primeiro registro:', adminUsers[0]);
      }
    }

    // 2. Testar tabela categories
    console.log('\n2. Testando tabela categories:');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*');
    
    if (categoriesError) {
      console.error('❌ Erro ao consultar categories:', categoriesError.message);
    } else {
      console.log(`✅ categories: ${categories.length} registros encontrados`);
    }

    // 3. Testar tabela articles
    console.log('\n3. Testando tabela articles:');
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('*');
    
    if (articlesError) {
      console.error('❌ Erro ao consultar articles:', articlesError.message);
    } else {
      console.log(`✅ articles: ${articles.length} registros encontrados`);
    }

    // 4. Testar tabela newsletter_subscribers
    console.log('\n4. Testando tabela newsletter_subscribers:');
    const { data: subscribers, error: subscribersError } = await supabase
      .from('newsletter_subscribers')
      .select('*');
    
    if (subscribersError) {
      console.error('❌ Erro ao consultar newsletter_subscribers:', subscribersError.message);
    } else {
      console.log(`✅ newsletter_subscribers: ${subscribers.length} registros encontrados`);
    }

    // 5. Testar tabela contacts
    console.log('\n5. Testando tabela contacts:');
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*');
    
    if (contactsError) {
      console.error('❌ Erro ao consultar contacts:', contactsError.message);
    } else {
      console.log(`✅ contacts: ${contacts.length} registros encontrados`);
    }

    // 6. Testar tabela newsletter_logs
    console.log('\n6. Testando tabela newsletter_logs:');
    const { data: logs, error: logsError } = await supabase
      .from('newsletter_logs')
      .select('*');
    
    if (logsError) {
      console.error('❌ Erro ao consultar newsletter_logs:', logsError.message);
    } else {
      console.log(`✅ newsletter_logs: ${logs.length} registros encontrados`);
    }

    // 7. Testar autenticação
    console.log('\n7. Testando autenticação:');
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erro ao obter sessão:', sessionError.message);
    } else {
      console.log('✅ Sessão obtida com sucesso');
      console.log('   Usuário logado:', session.session ? 'Sim' : 'Não');
    }

    // 8. Verificar usuário admin específico
    console.log('\n8. Verificando usuário admin específico:');
    const { data: specificAdmin, error: specificAdminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', 'warface01031999@gmail.com')
      .single();
    
    if (specificAdminError) {
      console.error('❌ Erro ao consultar admin específico:', specificAdminError.message);
    } else {
      console.log('✅ Admin encontrado:', specificAdmin);
    }

    // 9. Testar inserção de dados de teste
    console.log('\n9. Testando inserção de dados de teste:');
    
    // Inserir categoria de teste
    const { data: testCategory, error: categoryInsertError } = await supabase
      .from('categories')
      .insert([{
        name: 'Teste',
        slug: 'teste',
        description: 'Categoria de teste'
      }])
      .select()
      .single();
    
    if (categoryInsertError) {
      console.error('❌ Erro ao inserir categoria de teste:', categoryInsertError.message);
    } else {
      console.log('✅ Categoria de teste inserida:', testCategory);
    }

    console.log('\n🎉 Teste de banco de dados concluído!');

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar teste
testDatabase();