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

console.log('🎯 TESTE FINAL - Verificação da Correção dos Artigos em Destaque');
console.log('='.repeat(70));

async function testFinalCorrection() {
  try {
    console.log('\n1. 🔄 Testando função get_featured_articles() corrigida...');
    
    const { data: featuredArticles, error } = await supabase.rpc('get_featured_articles');
    
    if (error) {
      console.error('❌ Erro na função SQL:', error);
      return;
    }
    
    console.log('✅ Função executada com sucesso!');
    console.log(`📊 Retornou ${featuredArticles.length} artigos:`);
    
    featuredArticles.forEach((article, index) => {
      console.log(`\n   ${index + 1}. "${article.title}"`);
      console.log(`      • Score: ${article.rank_score}`);
      console.log(`      • Positive Feedbacks: ${article.positive_feedbacks}`);
      console.log(`      • Negative Feedbacks: ${article.negative_feedbacks}`);
      console.log(`      • Comments: ${article.comments_count}`);
      console.log(`      • Likes: ${article.likes_count}`);
      console.log(`      • Is Featured: ${article.is_featured}`);
    });
    
    console.log('\n2. 🔍 Verificando se a ordenação está correta...');
    
    // Verificar se está ordenado por score decrescente
    let isCorrectOrder = true;
    for (let i = 0; i < featuredArticles.length - 1; i++) {
      if (featuredArticles[i].rank_score < featuredArticles[i + 1].rank_score) {
        isCorrectOrder = false;
        break;
      }
    }
    
    if (isCorrectOrder) {
      console.log('✅ ORDENAÇÃO CORRETA: Artigos estão ordenados por score decrescente');
    } else {
      console.log('❌ ORDENAÇÃO INCORRETA: Artigos não estão na ordem esperada');
    }
    
    console.log('\n3. 🔍 Verificando se artigos sem feedback não estão em primeiro...');
    
    const firstArticle = featuredArticles[0];
    const hasEngagement = firstArticle.rank_score > 0;
    
    if (hasEngagement) {
      console.log('✅ CORRETO: O primeiro artigo tem engajamento (score > 0)');
    } else {
      console.log('❌ PROBLEMA: O primeiro artigo não tem engajamento (score = 0)');
    }
    
    console.log('\n4. 📊 Comparação com expectativa do usuário...');
    
    const expectedOrder = [
      'Computação Quântica: A Próxima Fronteira Tecnológica',
      'Metodologias Ativas de Aprendizagem: Como Transformar a Educação em 2025',
      'IA Generativa: O Futuro da Criatividade e Automação Inteligente'
    ];
    
    const actualOrder = featuredArticles.map(a => a.title);
    const orderMatches = JSON.stringify(expectedOrder) === JSON.stringify(actualOrder);
    
    if (orderMatches) {
      console.log('✅ PERFEITO: A ordem dos artigos corresponde à expectativa!');
    } else {
      console.log('⚠️ DIFERENÇA: A ordem não corresponde exatamente à expectativa');
      console.log('   Esperado:', expectedOrder);
      console.log('   Atual:', actualOrder);
    }
    
    console.log('\n5. 🎯 Simulando o que o frontend deveria mostrar...');
    
    console.log('📱 FRONTEND - Seção "Artigos em Destaque":');
    featuredArticles.forEach((article, index) => {
      const position = index + 1;
      const hasGoodEngagement = article.rank_score > 5;
      const engagementIcon = hasGoodEngagement ? '🔥' : '📝';
      
      console.log(`   ${position}. ${engagementIcon} "${article.title}"`);
      console.log(`      Score de Engajamento: ${article.rank_score}`);
      console.log(`      ${article.positive_feedbacks} feedbacks positivos, ${article.comments_count} comentários, ${article.likes_count} likes`);
    });
    
    console.log('\n' + '='.repeat(70));
    console.log('📋 RESUMO DA VERIFICAÇÃO:');
    console.log(`   • Função SQL funcionando: ✅`);
    console.log(`   • Ordenação por score: ${isCorrectOrder ? '✅' : '❌'}`);
    console.log(`   • Primeiro artigo tem engajamento: ${hasEngagement ? '✅' : '❌'}`);
    console.log(`   • Ordem corresponde à expectativa: ${orderMatches ? '✅' : '⚠️'}`);
    
    if (isCorrectOrder && hasEngagement) {
      console.log('\n🎉 SUCESSO: O problema foi resolvido!');
      console.log('   • Artigos com mais engajamento aparecem primeiro');
      console.log('   • Artigos sem feedback não aparecem em primeiro lugar');
      console.log('   • A ordenação por métricas está funcionando corretamente');
    } else {
      console.log('\n🚨 AINDA HÁ PROBLEMAS: Verificar implementação');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testFinalCorrection().then(() => {
  console.log('\n🏁 Teste final concluído');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});