import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Buscando categorias disponíveis...\n');

try {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .limit(10);

  if (error) {
    console.error('❌ Erro ao buscar categorias:', error.message);
  } else {
    console.log('✅ Categorias encontradas:');
    categories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (${cat.slug}) - ID: ${cat.id}`);
    });
    
    if (categories.length > 0) {
      console.log(`\n🎯 Primeira categoria para usar nos testes: ${categories[0].id}`);
    }
  }
} catch (error) {
  console.error('💥 Erro:', error.message);
}