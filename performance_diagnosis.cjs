const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnosePerformance() {
  console.log('🔍 DIAGNÓSTICO DE PERFORMANCE - AIMindset');
  console.log('=' .repeat(50));

  // 1. Testar velocidade das queries principais
  console.log('\n📊 TESTANDO VELOCIDADE DAS QUERIES:');
  
  const queries = [
    {
      name: 'Articles (sem join)',
      query: () => supabase.from('articles').select('*').limit(10)
    },
    {
      name: 'Articles (com categoria)',
      query: () => supabase.from('articles').select('*, category:categories(*)').limit(10)
    },
    {
      name: 'Categories',
      query: () => supabase.from('categories').select('*')
    },
    {
      name: 'SEO Metadata',
      query: () => supabase.from('seo_metadata').select('*').limit(10)
    },
    {
      name: 'Articles publicados',
      query: () => supabase.from('articles').select('*').eq('published', true).limit(10)
    }
  ];

  for (const { name, query } of queries) {
    const startTime = Date.now();
    try {
      const { data, error } = await query();
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (error) {
        console.log(`❌ ${name}: ERRO - ${error.message}`);
      } else {
        console.log(`${duration > 1000 ? '🐌' : duration > 500 ? '⚠️' : '✅'} ${name}: ${duration}ms (${data?.length || 0} registros)`);
      }
    } catch (err) {
      console.log(`❌ ${name}: ERRO - ${err.message}`);
    }
  }

  // 2. Verificar tamanho dos dados
  console.log('\n📦 ANÁLISE DE TAMANHO DOS DADOS:');
  
  try {
    const { data: articles } = await supabase.from('articles').select('*');
    const { data: categories } = await supabase.from('categories').select('*');
    const { data: seoData } = await supabase.from('seo_metadata').select('*');

    console.log(`📄 Articles: ${articles?.length || 0} registros`);
    console.log(`📁 Categories: ${categories?.length || 0} registros`);
    console.log(`🔍 SEO Metadata: ${seoData?.length || 0} registros`);

    // Calcular tamanho médio do conteúdo
    if (articles && articles.length > 0) {
      const avgContentLength = articles.reduce((sum, article) => sum + (article.content?.length || 0), 0) / articles.length;
      const avgExcerptLength = articles.reduce((sum, article) => sum + (article.excerpt?.length || 0), 0) / articles.length;
      
      console.log(`📝 Tamanho médio do conteúdo: ${Math.round(avgContentLength)} caracteres`);
      console.log(`📋 Tamanho médio do excerpt: ${Math.round(avgExcerptLength)} caracteres`);
      
      // Identificar artigos muito grandes
      const largeArticles = articles.filter(article => (article.content?.length || 0) > 10000);
      if (largeArticles.length > 0) {
        console.log(`⚠️ Artigos grandes (>10k chars): ${largeArticles.length}`);
        largeArticles.forEach(article => {
          console.log(`   - ${article.title}: ${article.content?.length || 0} chars`);
        });
      }
    }
  } catch (err) {
    console.log(`❌ Erro ao analisar dados: ${err.message}`);
  }

  // 3. Testar queries com filtros comuns
  console.log('\n🔍 TESTANDO QUERIES COM FILTROS:');
  
  const filterQueries = [
    {
      name: 'Busca por categoria',
      query: () => supabase.from('articles').select('*').eq('category_id', 1).limit(5)
    },
    {
      name: 'Artigos recentes',
      query: () => supabase.from('articles').select('*').order('created_at', { ascending: false }).limit(5)
    },
    {
      name: 'Busca por texto (título)',
      query: () => supabase.from('articles').select('*').ilike('title', '%IA%').limit(5)
    }
  ];

  for (const { name, query } of filterQueries) {
    const startTime = Date.now();
    try {
      const { data, error } = await query();
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (error) {
        console.log(`❌ ${name}: ERRO - ${error.message}`);
      } else {
        console.log(`${duration > 1000 ? '🐌' : duration > 500 ? '⚠️' : '✅'} ${name}: ${duration}ms (${data?.length || 0} registros)`);
      }
    } catch (err) {
      console.log(`❌ ${name}: ERRO - ${err.message}`);
    }
  }

  // 4. Recomendações
  console.log('\n💡 RECOMENDAÇÕES DE OTIMIZAÇÃO:');
  console.log('1. 🗂️ Adicionar índices nas colunas mais consultadas');
  console.log('2. 📄 Implementar paginação para queries grandes');
  console.log('3. 🚀 Cache agressivo para dados que mudam pouco');
  console.log('4. 🔄 Lazy loading para conteúdo não crítico');
  console.log('5. 📦 Compressão de dados grandes');
  
  console.log('\n✅ Diagnóstico concluído!');
}

diagnosePerformance().catch(console.error);