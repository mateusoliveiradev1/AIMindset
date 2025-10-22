const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  try {
    console.log('🔐 Testando login admin...');
    
    // Test login
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'warface01031999@gmail.com',
      password: 'admin123456789'
    });

    if (loginError) {
      console.error('❌ Erro no login:', loginError);
      return;
    }

    console.log('✅ Login realizado com sucesso!');
    console.log('   Email:', loginData.user?.email);
    console.log('   ID:', loginData.user?.id);

    // Test admin user query after login
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', 'warface01031999@gmail.com')
      .single();

    if (adminError) {
      console.error('❌ Erro ao buscar admin user:', adminError);
    } else {
      console.log('✅ Admin user encontrado:', adminUser);
    }

    // Test other tables with authenticated user
    console.log('\n📊 Testando acesso às tabelas como usuário autenticado:');

    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*');
    
    console.log(catError ? '❌ Categories error:' : '✅ Categories:', catError || `${categories?.length} registros`);

    const { data: articles, error: artError } = await supabase
      .from('articles')
      .select('*');
    
    console.log(artError ? '❌ Articles error:' : '✅ Articles:', artError || `${articles?.length} registros`);

    // Test logout
    await supabase.auth.signOut();
    console.log('\n✅ Logout realizado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

testLogin();