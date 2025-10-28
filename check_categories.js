import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCategories() {
  try {
    console.log('🔍 Verificando categorias atuais...');
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('❌ Erro ao buscar categorias:', error);
      return;
    }
    
    console.log('\n📋 CATEGORIAS ATUAIS:');
    console.log('='.repeat(80));
    
    categories.forEach((category, index) => {
      console.log(`\n${index + 1}. ${category.name}`);
      console.log(`   Slug: ${category.slug}`);
      console.log(`   Descrição atual: ${category.description || 'SEM DESCRIÇÃO'}`);
      console.log(`   ID: ${category.id}`);
      console.log('-'.repeat(60));
    });
    
    console.log(`\n✅ Total de categorias encontradas: ${categories.length}`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkCategories();