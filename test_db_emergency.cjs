// Teste EMERGENCIAL de conexão com Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

console.log('🚨 TESTE EMERGENCIAL DE CONEXÃO COM SUPABASE');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? 'SET ✅' : 'NOT SET ❌');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEmergency() {
  try {
    console.log('\n🔍 Testando conexão básica...');
    
    // Teste mais simples possível
    const { data, error } = await supabase
      .from('articles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ ERRO NA QUERY:', error.message);
      console.error('📋 Detalhes:', error);
      
      // Tentar uma query ainda mais simples
      console.log('\n🔄 Tentando query alternativa...');
      const { data: data2, error: error2 } = await supabase
        .from('articles')
        .select('*')
        .limit(1);
        
      if (error2) {
        console.error('❌ ERRO ALTERNATIVO:', error2.message);
        return false;
      } else {
        console.log('✅ QUERY ALTERNATIVA FUNCIONOU!');
        console.log('📄 Dados:', data2);
        return true;
      }
    }
    
    console.log('✅ CONEXÃO FUNCIONANDO PERFEITAMENTE!');
    console.log('📄 Dados retornados:', data);
    return true;
    
  } catch (err) {
    console.error('💥 ERRO CRÍTICO:', err.message);
    console.error('🔍 Stack:', err.stack);
    return false;
  }
}

testEmergency().then(success => {
  if (success) {
    console.log('\n🎉 ✅ BANCO DE DADOS FUNCIONANDO!');
    console.log('🚀 O problema não é a conexão com Supabase!');
  } else {
    console.log('\n💔 ❌ PROBLEMA CONFIRMADO COM SUPABASE');
    console.log('🔧 Precisa verificar configurações!');
  }
  process.exit(success ? 0 : 1);
});