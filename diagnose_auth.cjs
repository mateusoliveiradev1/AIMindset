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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env.local');
  console.log('URL:', supabaseUrl ? 'OK' : 'MISSING');
  console.log('Service Key:', supabaseServiceKey ? 'OK' : 'MISSING');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function diagnoseAuth() {
  console.log('🔍 Diagnosticando autenticação do Supabase...\n');

  try {
    // 1. Test basic connection
    console.log('1. Testando conexão básica com Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('admin_users')
      .select('count', { count: 'exact', head: true });
    
    if (testError) {
      console.error('❌ Erro na conexão:', testError.message);
      return;
    }
    console.log('✅ Conexão com Supabase OK\n');

    // 2. Check if user exists in auth.users
    console.log('2. Verificando usuário no Supabase Auth...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao listar usuários auth:', authError.message);
      return;
    }

    console.log(`   Total de usuários no Auth: ${authUsers.users.length}`);
    const adminAuthUser = authUsers.users.find(user => user.email === 'warface01031999@gmail.com');
    
    if (adminAuthUser) {
      console.log('✅ Usuário encontrado no Supabase Auth:');
      console.log(`   ID: ${adminAuthUser.id}`);
      console.log(`   Email: ${adminAuthUser.email}`);
      console.log(`   Confirmado: ${adminAuthUser.email_confirmed_at ? 'Sim' : 'Não'}`);
      console.log(`   Criado em: ${adminAuthUser.created_at}`);
      console.log(`   Último login: ${adminAuthUser.last_sign_in_at || 'Nunca'}\n`);
    } else {
      console.log('❌ Usuário NÃO encontrado no Supabase Auth');
      console.log('   Usuários existentes:');
      authUsers.users.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id})`);
      });
      console.log();
    }

    // 3. Check if user exists in admin_users table
    console.log('3. Verificando usuário na tabela admin_users...');
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', 'warface01031999@gmail.com')
      .single();

    if (adminError && adminError.code !== 'PGRST116') {
      console.error('❌ Erro ao consultar admin_users:', adminError.message);
    } else if (adminUser) {
      console.log('✅ Usuário encontrado na tabela admin_users:');
      console.log(`   ID: ${adminUser.id}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Nome: ${adminUser.name}`);
      console.log(`   Role: ${adminUser.role}\n`);
    } else {
      console.log('❌ Usuário NÃO encontrado na tabela admin_users\n');
    }

    // 4. Test authentication with known credentials
    console.log('4. Testando autenticação com credenciais...');
    
    // Create a regular client for auth testing
    const authClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
      email: 'warface01031999@gmail.com',
      password: 'admin123456789'
    });

    if (signInError) {
      console.error('❌ Erro no login:', signInError.message);
      console.error('   Código:', signInError.status);
      
      // Try different passwords
      console.log('\n5. Testando senhas alternativas...');
      const passwords = ['admin123456', 'admin123', 'password', '123456789', 'Admin123456789'];
      
      for (const pwd of passwords) {
        console.log(`   Testando senha: ${pwd}`);
        const { error } = await authClient.auth.signInWithPassword({
          email: 'warface01031999@gmail.com',
          password: pwd
        });
        
        if (!error) {
          console.log(`✅ Login bem-sucedido com senha: ${pwd}`);
          await authClient.auth.signOut();
          return;
        } else {
          console.log(`   ❌ Falhou: ${error.message}`);
        }
      }
    } else {
      console.log('✅ Login bem-sucedido!');
      console.log(`   Usuário: ${signInData.user.email}`);
      console.log(`   ID: ${signInData.user.id}`);
      await authClient.auth.signOut();
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

diagnoseAuth().then(() => {
  console.log('\n🎯 Diagnóstico concluído!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});