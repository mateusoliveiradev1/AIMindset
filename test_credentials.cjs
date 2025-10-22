const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCredentials() {
  console.log('🔐 Testando diferentes credenciais...\n');

  const testCases = [
    {
      email: 'warface01031999@gmail.com',
      password: 'admin123456789',
      description: 'Nova senha atualizada'
    },
    {
      email: 'warface01031999@gmail.com', 
      password: '46257688884@Mateus',
      description: 'Senha original'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📧 Testando: ${testCase.description}`);
    console.log(`   Email: ${testCase.email}`);
    console.log(`   Senha: ${testCase.password}`);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testCase.email,
        password: testCase.password
      });

      if (error) {
        console.log(`   ❌ ERRO: ${error.message}`);
      } else if (data.user) {
        console.log(`   ✅ LOGIN SUCESSO!`);
        console.log(`   👤 User ID: ${data.user.id}`);
        console.log(`   📧 Email: ${data.user.email}`);
        
        // Fazer logout
        await supabase.auth.signOut();
        console.log(`   🚪 Logout realizado`);
        
        return { success: true, credentials: testCase };
      }
    } catch (error) {
      console.log(`   💥 ERRO GERAL: ${error.message}`);
    }
  }
  
  return { success: false };
}

testCredentials().then(result => {
  if (result.success) {
    console.log(`\n🎉 CREDENCIAIS CORRETAS ENCONTRADAS!`);
    console.log(`📧 Email: ${result.credentials.email}`);
    console.log(`🔑 Senha: ${result.credentials.password}`);
  } else {
    console.log(`\n❌ NENHUMA CREDENCIAL FUNCIONOU!`);
  }
});