// Teste direto do Supabase no frontend
import { supabase } from './src/lib/supabase.js';

console.log('🚀 Iniciando teste do Supabase...');

// Teste 1: Verificar se o cliente foi criado
console.log('Cliente Supabase:', supabase);

// Teste 2: Testar conexão básica
async function testConnection() {
  try {
    console.log('🔍 Testando conexão...');
    const { data, error } = await supabase
      .from('articles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão:', error);
    } else {
      console.log('✅ Conexão OK!', data);
    }
  } catch (err) {
    console.error('💥 Erro crítico:', err);
  }
}

// Teste 3: Buscar artigos
async function testArticles() {
  try {
    console.log('📄 Testando artigos...');
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, slug, published')
      .limit(5);
    
    if (error) {
      console.error('❌ Erro nos artigos:', error);
    } else {
      console.log('✅ Artigos OK!', data);
    }
  } catch (err) {
    console.error('💥 Erro crítico:', err);
  }
}

// Executar testes
testConnection();
testArticles();