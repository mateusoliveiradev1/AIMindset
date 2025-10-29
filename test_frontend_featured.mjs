import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TESTE DIRETO DA FUNÇÃO getFeaturedArticles()');
console.log('================================================');

async function testFrontendFunction() {
  try {
    console.log('1️⃣ Testando função SQL get_featured_articles() diretamente...');
    
    const { data: featuredArticles, error } = await supabase.rpc('get_featured_articles');
    
    if (error) {
      console.error('❌ Erro na função SQL:', error);
      return;
    }
    
    console.log('✅ Função SQL funcionando!');
    console.log(`📊 Retornou ${featuredArticles?.length || 0} artigos`);
    
    if (featuredArticles && featuredArticles.length > 0) {
      console.log('\n📋 Artigos retornados:');
      featuredArticles.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   - ID: ${article.id}`);
        console.log(`   - Is Featured: ${article.is_featured ? 'Sim' : 'Não'}`);
        console.log(`   - Score: ${article.rank_score || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('⚠️ Nenhum artigo retornado');
    }
    
    console.log('2️⃣ Testando busca de artigos publicados...');
    const { data: allArticles, error: allError } = await supabase
      .from('articles')
      .select('id, title, is_featured, published')
      .eq('published', true);
      
    if (allError) {
      console.error('❌ Erro ao buscar artigos:', allError);
      return;
    }
    
    console.log(`📊 Total de artigos publicados: ${allArticles?.length || 0}`);
    console.log(`📊 Artigos marcados como destaque: ${allArticles?.filter(a => a.is_featured).length || 0}`);
    
  } catch (err) {
    console.error('❌ Erro no teste:', err);
  }
}

testFrontendFunction();