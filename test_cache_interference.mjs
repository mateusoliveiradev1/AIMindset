import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 TESTE DE INTERFERÊNCIA DE CACHE - Artigos em Destaque');
console.log('='.repeat(60));

async function testCacheInterference() {
  try {
    console.log('\n1. 🔄 Testando função get_featured_articles() diretamente (sem cache)...');
    
    // Primeira chamada
    const { data: firstCall, error: firstError } = await supabase.rpc('get_featured_articles');
    
    if (firstError) {
      console.error('❌ Erro na primeira chamada:', firstError);
      return;
    }
    
    console.log('✅ Primeira chamada - Artigos retornados:', firstCall.length);
    firstCall.forEach((article, index) => {
      const score = (article.positive_feedbacks || 0) * 3 + (article.comments_count || 0) * 2 + (article.likes_count || 0);
      console.log(`   ${index + 1}. "${article.title}" - Score: ${score} (P:${article.positive_feedbacks || 0}, C:${article.comments_count || 0}, L:${article.likes_count || 0})`);
    });
    
    console.log('\n2. 🔄 Aguardando 2 segundos e fazendo segunda chamada...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Segunda chamada
    const { data: secondCall, error: secondError } = await supabase.rpc('get_featured_articles');
    
    if (secondError) {
      console.error('❌ Erro na segunda chamada:', secondError);
      return;
    }
    
    console.log('✅ Segunda chamada - Artigos retornados:', secondCall.length);
    secondCall.forEach((article, index) => {
      const score = (article.positive_feedbacks || 0) * 3 + (article.comments_count || 0) * 2 + (article.likes_count || 0);
      console.log(`   ${index + 1}. "${article.title}" - Score: ${score} (P:${article.positive_feedbacks || 0}, C:${article.comments_count || 0}, L:${article.likes_count || 0})`);
    });
    
    console.log('\n3. 🔍 Comparando resultados...');
    
    // Verificar se as ordens são idênticas
    const firstOrder = firstCall.map(a => a.title);
    const secondOrder = secondCall.map(a => a.title);
    
    const ordersMatch = JSON.stringify(firstOrder) === JSON.stringify(secondOrder);
    
    if (ordersMatch) {
      console.log('✅ CONSISTÊNCIA: As duas chamadas retornaram a mesma ordem');
    } else {
      console.log('❌ INCONSISTÊNCIA: As chamadas retornaram ordens diferentes!');
      console.log('   Primeira ordem:', firstOrder);
      console.log('   Segunda ordem:', secondOrder);
    }
    
    console.log('\n4. 🔄 Testando query direta na tabela articles...');
    
    // Query direta para comparar
    const { data: directQuery, error: directError } = await supabase
      .from('articles')
      .select(`
        id, title, slug, excerpt, image_url, published, created_at, updated_at, category_id,
        positive_feedback, negative_feedback, approval_rate, likes_count, comments_count
      `)
      .eq('published', true)
      .eq('is_featured', true);
    
    if (directError) {
      console.error('❌ Erro na query direta:', directError);
      return;
    }
    
    console.log('✅ Query direta - Artigos is_featured=true:', directQuery.length);
    
    // Calcular scores manualmente e ordenar
    const articlesWithScores = directQuery.map(article => ({
      ...article,
      calculated_score: (article.positive_feedback || 0) * 3 + (article.comments_count || 0) * 2 + (article.likes_count || 0)
    })).sort((a, b) => b.calculated_score - a.calculated_score);
    
    console.log('📊 Artigos ordenados por score calculado manualmente:');
    articlesWithScores.forEach((article, index) => {
      console.log(`   ${index + 1}. "${article.title}" - Score: ${article.calculated_score} (P:${article.positive_feedback || 0}, C:${article.comments_count || 0}, L:${article.likes_count || 0})`);
    });
    
    console.log('\n5. 🔍 Verificando se a função SQL está retornando a ordem correta...');
    
    const functionOrder = firstCall.map(a => a.title);
    const manualOrder = articlesWithScores.map(a => a.title);
    
    const functionsMatch = JSON.stringify(functionOrder) === JSON.stringify(manualOrder);
    
    if (functionsMatch) {
      console.log('✅ CORRETO: A função SQL está retornando a ordem correta');
    } else {
      console.log('❌ PROBLEMA: A função SQL não está retornando a ordem esperada!');
      console.log('   Função SQL:', functionOrder);
      console.log('   Ordem manual:', manualOrder);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 RESUMO DO TESTE:');
    console.log(`   • Consistência entre chamadas: ${ordersMatch ? '✅' : '❌'}`);
    console.log(`   • Função SQL vs cálculo manual: ${functionsMatch ? '✅' : '❌'}`);
    console.log(`   • Artigos em destaque encontrados: ${directQuery.length}`);
    console.log(`   • Função retorna: ${firstCall.length} artigos`);
    
    if (!ordersMatch || !functionsMatch) {
      console.log('\n🚨 PROBLEMA IDENTIFICADO: Há inconsistências na ordenação!');
    } else {
      console.log('\n✅ TUDO OK: A função SQL está funcionando corretamente');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testCacheInterference().then(() => {
  console.log('\n🏁 Teste de interferência de cache concluído');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});