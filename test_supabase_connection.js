// Teste de conexão com Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

console.log('🔍 Testando conexão com Supabase...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? 'SET' : 'NOT SET');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('\n📊 Testando query simples...');
    
    // Teste 1: Verificar se consegue conectar
    const { data, error } = await supabase
      .from('articles')
      .select('id, title')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro na query:', error);
      return false;
    }
    
    console.log('✅ Conexão funcionando!');
    console.log('📄 Dados retornados:', data);
    
    // Teste 2: Verificar tabelas
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_names');
    
    if (tablesError) {
      console.log('⚠️  Não conseguiu listar tabelas, mas conexão básica funciona');
    } else {
      console.log('📋 Tabelas disponíveis:', tables);
    }
    
    return true;
    
  } catch (err) {
    console.error('💥 Erro de conexão:', err);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🎉 SUPABASE FUNCIONANDO PERFEITAMENTE!');
  } else {
    console.log('\n💔 PROBLEMA COM SUPABASE');
  }
  process.exit(success ? 0 : 1);
});