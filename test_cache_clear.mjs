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

console.log('🧹 TESTE DE LIMPEZA DE CACHE - Verificação dos Artigos em Destaque');
console.log('='.repeat(70));

async function testCacheClear() {
  try {
    console.log('\n1. 🔄 Fazendo múltiplas chamadas para verificar consistência...');
    
    // Fazer 3 chamadas consecutivas para verificar se há cache interferindo
    const calls = [];
    for (let i = 0; i < 3; i++) {
      console.log(`   Chamada ${i + 1}...`);
      const { data, error } = await supabase.rpc('get_featured_articles');
      
      if (error) {
        console.error(`❌ Erro na chamada ${i + 1}:`, error);
        continue;
      }
      
      calls.push({
        call: i + 1,
        articles: data.map(article => ({
          title: article.title,
          score: article.rank_score,
          positive_feedbacks: article.positive_feedbacks,
          comments_count: article.comments_count,
          likes_count: article.likes_count
        }))
      });
      
      // Pequena pausa entre as chamadas
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n2. 📊 Comparando resultados das chamadas...');
    
    // Verificar se todas as chamadas retornaram os mesmos resultados
    let allConsistent = true;
    const firstCall = calls[0];
    
    for (let i = 1; i < calls.length; i++) {
      const currentCall = calls[i];
      
      if (JSON.stringify(firstCall.articles) !== JSON.stringify(currentCall.articles)) {
        allConsistent = false;
        console.log(`❌ Inconsistência entre chamada 1 e ${i + 1}`);
        break;
      }
    }
    
    if (allConsistent) {
      console.log('✅ CONSISTENTE: Todas as chamadas retornaram os mesmos resultados');
    } else {
      console.log('❌ INCONSISTENTE: Há diferenças entre as chamadas (possível problema de cache)');
    }
    
    console.log('\n3. 📋 Resultado atual dos artigos em destaque:');
    
    if (calls.length > 0) {
      const latestCall = calls[calls.length - 1];
      
      latestCall.articles.forEach((article, index) => {
        console.log(`\n   ${index + 1}. "${article.title}"`);
        console.log(`      • Score: ${article.score}`);
        console.log(`      • Positive Feedbacks: ${article.positive_feedbacks}`);
        console.log(`      • Comments: ${article.comments_count}`);
        console.log(`      • Likes: ${article.likes_count}`);
      });
      
      console.log('\n4. 🎯 Verificação da ordem esperada...');
      
      const expectedTitles = [
        'Computação Quântica: A Próxima Fronteira Tecnológica',
        'Metodologias Ativas de Aprendizagem: Como Transformar a Educação em 2025',
        'IA Generativa: O Futuro da Criatividade e Automação Inteligente'
      ];
      
      const actualTitles = latestCall.articles.map(a => a.title);
      const orderCorrect = JSON.stringify(expectedTitles) === JSON.stringify(actualTitles);
      
      console.log('   Ordem esperada:');
      expectedTitles.forEach((title, index) => {
        console.log(`      ${index + 1}. ${title}`);
      });
      
      console.log('\n   Ordem atual:');
      actualTitles.forEach((title, index) => {
        console.log(`      ${index + 1}. ${title}`);
      });
      
      if (orderCorrect) {
        console.log('\n✅ PERFEITO: A ordem está correta!');
      } else {
        console.log('\n❌ PROBLEMA: A ordem não está correta');
      }
      
      // Verificar se o primeiro artigo tem engajamento
      const firstArticle = latestCall.articles[0];
      const hasEngagement = firstArticle.score > 0;
      
      console.log('\n5. 🔍 Verificação do problema original...');
      console.log(`   Primeiro artigo: "${firstArticle.title}"`);
      console.log(`   Score: ${firstArticle.score}`);
      console.log(`   Tem engajamento: ${hasEngagement ? 'SIM' : 'NÃO'}`);
      
      if (hasEngagement) {
        console.log('   ✅ RESOLVIDO: O primeiro artigo tem engajamento!');
      } else {
        console.log('   ❌ AINDA PROBLEMÁTICO: O primeiro artigo não tem engajamento');
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('📋 RESUMO FINAL:');
    console.log(`   • Chamadas consistentes: ${allConsistent ? '✅' : '❌'}`);
    
    if (calls.length > 0) {
      const latestCall = calls[calls.length - 1];
      const firstArticle = latestCall.articles[0];
      const hasEngagement = firstArticle.score > 0;
      const expectedTitles = [
        'Computação Quântica: A Próxima Fronteira Tecnológica',
        'Metodologias Ativas de Aprendizagem: Como Transformar a Educação em 2025',
        'IA Generativa: O Futuro da Criatividade e Automação Inteligente'
      ];
      const actualTitles = latestCall.articles.map(a => a.title);
      const orderCorrect = JSON.stringify(expectedTitles) === JSON.stringify(actualTitles);
      
      console.log(`   • Primeiro artigo tem engajamento: ${hasEngagement ? '✅' : '❌'}`);
      console.log(`   • Ordem correta: ${orderCorrect ? '✅' : '❌'}`);
      
      if (allConsistent && hasEngagement && orderCorrect) {
        console.log('\n🎉 SUCESSO TOTAL: O problema foi completamente resolvido!');
        console.log('   • O cache não está interferindo');
        console.log('   • Os artigos estão na ordem correta');
        console.log('   • Artigos com engajamento aparecem primeiro');
      } else {
        console.log('\n⚠️ AINDA HÁ PROBLEMAS: Verificar implementação ou cache');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testCacheClear().then(() => {
  console.log('\n🏁 Teste de cache concluído');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});