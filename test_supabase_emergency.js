import { createClient } from '@supabase/supabase-js';

console.log('🚨 TESTE EMERGENCIAL DE CONEXÃO SUPABASE');
console.log('==========================================');

const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('🔍 Testando conexão básica...');
    const { data, error } = await supabase.from('articles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão:', error.message);
      return false;
    }
    
    console.log('✅ Conexão OK!');
    return true;
  } catch (err) {
    console.error('💥 Erro crítico:', err.message);
    return false;
  }
}

async function testFeaturedArticles() {
  try {
    console.log('🎯 Testando artigos em destaque...');
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, slug, published, created_at')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (error) {
      console.error('❌ Erro nos artigos:', error.message);
      return [];
    }
    
    console.log('✅ Artigos encontrados:', data.length);
    data.forEach((article, index) => {
      console.log(`  ${index + 1}. ${article.title} (published: ${article.published})`);
    });
    
    return data;
  } catch (err) {
    console.error('💥 Erro crítico:', err.message);
    return [];
  }
}

async function runTests() {
  const connectionOk = await testConnection();
  if (connectionOk) {
    await testFeaturedArticles();
  }
  
  console.log('==========================================');
  console.log('🏁 Teste concluído');
}

runTests();