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
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testando autenticação como no frontend...\n');

// Create client exactly like in the frontend
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

async function testFrontendAuth() {
  try {
    console.log('1. Testando login com configuração do frontend...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'warface01031999@gmail.com',
      password: 'admin123456789'
    });

    if (error) {
      console.error('❌ Erro no login:', error.message);
      console.error('   Código:', error.status);
      console.error('   Detalhes:', error);
      
      // Test with different configurations
      console.log('\n2. Testando com configurações diferentes...');
      
      const testClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      });
      
      const { data: testData, error: testError } = await testClient.auth.signInWithPassword({
        email: 'warface01031999@gmail.com',
        password: 'admin123456789'
      });
      
      if (testError) {
        console.error('❌ Erro também com configuração simples:', testError.message);
      } else {
        console.log('✅ Login funcionou com configuração simples!');
        await testClient.auth.signOut();
      }
      
    } else {
      console.log('✅ Login bem-sucedido!');
      console.log(`   Usuário: ${data.user.email}`);
      console.log(`   ID: ${data.user.id}`);
      
      // Test admin user check
      console.log('\n3. Testando verificação de admin...');
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', data.user.email)
        .single();
      
      if (adminError) {
        console.error('❌ Erro ao verificar admin:', adminError.message);
      } else {
        console.log('✅ Admin encontrado:', adminUser);
      }
      
      await supabase.auth.signOut();
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testFrontendAuth().then(() => {
  console.log('\n🎯 Teste concluído!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});