import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getCategories() {
  try {
    console.log('🔍 Buscando todas as categorias existentes...');
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, created_at')
      .order('name');

    if (error) {
      console.error('❌ Erro ao buscar categorias:', error);
      return;
    }

    console.log(`✅ Encontradas ${categories.length} categorias:`);
    console.log('');
    
    categories.forEach((category, index) => {
      console.log(`${index + 1}. 📂 ${category.name}`);
      console.log(`   🔗 Slug: ${category.slug}`);
      console.log(`   📝 Descrição: ${category.description || 'Sem descrição'}`);
      console.log(`   📅 Criada em: ${new Date(category.created_at).toLocaleDateString('pt-BR')}`);
      console.log('');
    });

    // Contar artigos por categoria
    console.log('📊 Contando artigos por categoria...');
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('category_id');

    if (!articlesError && articles) {
      const categoryCount = {};
      articles.forEach(article => {
        if (article.category_id) {
          categoryCount[article.category_id] = (categoryCount[article.category_id] || 0) + 1;
        }
      });

      console.log('');
      console.log('📈 ESTATÍSTICAS POR CATEGORIA:');
      categories.forEach(category => {
        const count = categoryCount[category.id] || 0;
        console.log(`   ${category.name}: ${count} artigo(s)`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar busca
getCategories();