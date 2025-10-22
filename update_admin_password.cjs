const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Atualizando senha do usuário admin...\n');

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateAdminPassword() {
  try {
    const email = 'warface01031999@gmail.com';
    const newPassword = '46257688884@Mateus';
    
    console.log('1. Atualizando senha no Supabase Auth...');
    
    // Update password in Supabase Auth
    const { data, error } = await supabase.auth.admin.updateUserById(
      'c978a2ba-36a0-4817-bbe8-86a1605a9dee', // User ID from previous tests
      { password: newPassword }
    );

    if (error) {
      console.error('❌ Erro ao atualizar senha:', error.message);
      return;
    }

    console.log('✅ Senha atualizada no Supabase Auth!');
    
    console.log('\n2. Testando login com nova senha...');
    
    // Test login with new password using anon key
    const testClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    const { data: loginData, error: loginError } = await testClient.auth.signInWithPassword({
      email: email,
      password: newPassword
    });

    if (loginError) {
      console.error('❌ Erro no teste de login:', loginError.message);
      return;
    }

    console.log('✅ Login funcionando com nova senha!');
    console.log(`   Usuário: ${loginData.user.email}`);
    
    // Test admin user verification
    console.log('\n3. Verificando dados do admin...');
    const { data: adminUser, error: adminError } = await testClient
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (adminError) {
      console.error('❌ Erro ao verificar admin:', adminError.message);
    } else {
      console.log('✅ Admin verificado:', adminUser);
    }
    
    await testClient.auth.signOut();
    
    console.log('\n🎯 Senha atualizada com sucesso!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Nova senha: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

updateAdminPassword().then(() => {
  console.log('\n✨ Processo concluído!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});