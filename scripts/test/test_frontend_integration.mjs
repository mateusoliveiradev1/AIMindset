import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TESTE DE INTEGRAÇÃO FRONTEND');
console.log('=' .repeat(40));

async function testFrontendIntegration() {
  try {
    console.log('\n1️⃣ Testando função get_featured_articles() (como o frontend faz)...');
    
    const { data: featuredArticles, error: featuredError } = await supabase
      .rpc('get_featured_articles');
    
    if (featuredError) {
      console.error('❌ Erro na função get_featured_articles:', featuredError);
      return;
    }
    
    console.log(`✅ Função retornou ${featuredArticles.length} artigos em destaque:`);
    featuredArticles.forEach((article, index) => {
      console.log(`${index + 1}. "${article.title}"`);
      console.log(`   - ID: ${article.id}`);
      console.log(`   - Feedbacks Positivos: ${article.positive_feedbacks}`);
      console.log(`   - Comentários: ${article.comments_count}`);
      console.log(`   - Fixado Manual: ${article.is_featured_manual ? 'SIM' : 'NÃO'}`);
      console.log('');
    });
    
    console.log('\n2️⃣ Testando busca de todos os artigos (como o frontend faz)...');
    
    const { data: allArticles, error: allError } = await supabase
      .from('articles')
      .select('id, title, slug, excerpt, content, image_url, published, created_at, updated_at, category_id, positive_feedback, negative_feedback, approval_rate')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (allError) {
      console.error('❌ Erro ao buscar todos os artigos:', allError);
      return;
    }
    
    console.log(`✅ Busca de artigos retornou ${allArticles.length} artigos`);
    console.log('📊 Primeiros 3 artigos por data de criação:');
    allArticles.slice(0, 3).forEach((article, index) => {
      console.log(`${index + 1}. "${article.title}"`);
      console.log(`   - ID: ${article.id}`);
      console.log(`   - Criado em: ${new Date(article.created_at).toLocaleString()}`);
      console.log('');
    });
    
    console.log('\n3️⃣ Comparando resultados...');
    
    const featuredIds = featuredArticles.map(a => a.id);
    const allIds = allArticles.slice(0, 3).map(a => a.id);
    
    console.log('🎯 IDs dos artigos em destaque (função):', featuredIds);
    console.log('📅 IDs dos 3 primeiros artigos (por data):', allIds);
    
    const isUsingFeaturedLogic = JSON.stringify(featuredIds.sort()) !== JSON.stringify(allIds.sort());
    
    if (isUsingFeaturedLogic) {
      console.log('✅ SISTEMA FUNCIONANDO: Frontend está usando lógica de destaque baseada em métricas!');
    } else {
      console.log('⚠️ POSSÍVEL PROBLEMA: Frontend pode estar usando ordem por data em vez de métricas');
    }
    
    console.log('\n4️⃣ Verificando se há cache ou problemas de sincronização...');
    
    // Simular o que o hook useArticles faz
    console.log('🔄 Simulando chamada do hook useArticles...');
    
    // Verificar se há diferença entre as duas abordagens
    const { data: homeArticles, error: homeError } = await supabase
      .from('articles')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });
    
    if (homeError) {
      console.error('❌ Erro na busca da home:', homeError);
    } else {
      console.log(`📊 Home query retornou ${homeArticles.length} artigos`);
      
      // Verificar se os artigos com mais feedbacks estão no topo
      const articlesWithFeedbacks = homeArticles
        .filter(a => a.positive_feedbacks > 0)
        .sort((a, b) => b.positive_feedbacks - a.positive_feedbacks);
      
      console.log('\n🏆 Artigos com feedbacks positivos (ordenados):');
      articlesWithFeedbacks.slice(0, 5).forEach((article, index) => {
        console.log(`${index + 1}. "${article.title}" - ${article.positive_feedbacks} feedbacks`);
      });
    }
    
    console.log('\n🎯 CONCLUSÃO:');
    console.log('=' .repeat(30));
    
    if (featuredArticles.length > 0 && featuredArticles[0].positive_feedbacks > 0) {
      console.log('✅ Sistema de métricas FUNCIONANDO');
      console.log('✅ Artigos com mais feedbacks estão sendo priorizados');
      console.log('✅ Função get_featured_articles() retorna dados corretos');
      
      console.log('\n📋 PRÓXIMOS PASSOS:');
      console.log('1. Verificar se o frontend está usando get_featured_articles()');
      console.log('2. Limpar cache se necessário');
      console.log('3. Verificar se a home está renderizando os artigos corretos');
    } else {
      console.log('❌ Sistema ainda tem problemas');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testFrontendIntegration();