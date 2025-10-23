const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testAdminPanel() {
  console.log('🧪 TESTANDO PAINEL ADMINISTRATIVO...\n');

  try {
    // 1. Testar busca de artigos
    console.log('📰 Testando busca de artigos...');
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('*')
      .limit(5);
    
    if (articlesError) {
      console.log('❌ Erro ao buscar artigos:', articlesError.message);
    } else {
      console.log(`✅ Artigos encontrados: ${articles.length}`);
    }

    // 2. Testar busca de categorias
    console.log('\n📂 Testando busca de categorias...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*');
    
    if (categoriesError) {
      console.log('❌ Erro ao buscar categorias:', categoriesError.message);
    } else {
      console.log(`✅ Categorias encontradas: ${categories.length}`);
    }

    // 3. Testar login de admin
    console.log('\n🔐 Testando login de admin...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'warface01031999@gmail.com',
      password: 'admin123456789'
    });

    if (loginError) {
      console.log('❌ Erro no login:', loginError.message);
    } else {
      console.log('✅ Login realizado com sucesso');
      
      // 4. Testar busca de usuários com service role
      console.log('\n👥 Testando busca de usuários (admin)...');
      const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (usersError) {
        console.log('❌ Erro ao buscar usuários:', usersError.message);
      } else {
        console.log(`✅ Usuários encontrados: ${users.users.length}`);
      }

      // 5. Testar busca de contatos
      console.log('\n📧 Testando busca de contatos...');
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .limit(5);
      
      if (contactsError) {
        console.log('❌ Erro ao buscar contatos:', contactsError.message);
      } else {
        console.log(`✅ Contatos encontrados: ${contacts.length}`);
      }

      // 6. Testar busca de newsletter
      console.log('\n📬 Testando busca de newsletter...');
      const { data: newsletter, error: newsletterError } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .limit(5);
      
      if (newsletterError) {
        console.log('❌ Erro ao buscar newsletter:', newsletterError.message);
      } else {
        console.log(`✅ Inscritos na newsletter: ${newsletter.length}`);
      }

      // Logout
      await supabase.auth.signOut();
      console.log('\n🚪 Logout realizado');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }

  console.log('\n🎉 TESTE DO PAINEL ADMINISTRATIVO CONCLUÍDO!');
}

testAdminPanel();