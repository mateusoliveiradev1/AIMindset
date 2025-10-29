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

console.log('🎯 TESTE FINAL DE SINCRONIZAÇÃO');
console.log('='.repeat(50));

async function testeFinal() {
  try {
    console.log('\n1. 🔍 Testando função get_featured_articles()...');
    
    const { data: featuredArticles, error: featuredError } = await supabase.rpc('get_featured_articles');
    
    if (featuredError) {
      console.error('❌ Erro na função get_featured_articles:', featuredError);
      return;
    }
    
    console.log('✅ Função executada com sucesso');
    console.log(`✅ Retornou ${featuredArticles.length} artigos em destaque`);
    
    console.log('\n📊 Artigos em destaque (ordenados por score):');
    featuredArticles.forEach((article, index) => {
      console.log(`\n   ${index + 1}. "${article.title}"`);
      console.log(`      • Score: ${article.rank_score}`);
      console.log(`      • Positive Feedbacks: ${article.positive_feedbacks}`);
      console.log(`      • Comments: ${article.comments_count}`);
      console.log(`      • Likes: ${article.likes_count}`);
      console.log(`      • Is Featured: ${article.is_featured}`);
    });
    
    console.log('\n2. ✅ Verificando consistência dos dados...');
    
    // Verificar se os scores estão corretos
    let scoresCorretos = true;
    featuredArticles.forEach(article => {
      const scoreCalculado = (article.positive_feedbacks * 3) + (article.comments_count * 2) + article.likes_count;
      if (scoreCalculado !== article.rank_score) {
        console.log(`❌ Score incorreto para "${article.title}": esperado ${scoreCalculado}, obtido ${article.rank_score}`);
        scoresCorretos = false;
      }
    });
    
    if (scoresCorretos) {
      console.log('✅ Todos os scores estão corretos');
    }
    
    // Verificar ordenação
    let ordenacaoCorreta = true;
    for (let i = 1; i < featuredArticles.length; i++) {
      if (featuredArticles[i-1].rank_score < featuredArticles[i].rank_score) {
        console.log('❌ Ordenação incorreta detectada');
        ordenacaoCorreta = false;
        break;
      }
    }
    
    if (ordenacaoCorreta) {
      console.log('✅ Ordenação por score está correta');
    }
    
    console.log('\n3. 🎯 Resultado Final:');
    console.log('='.repeat(30));
    
    if (featuredArticles.length > 0 && scoresCorretos && ordenacaoCorreta) {
      console.log('🎉 SUCESSO! Sistema de artigos em destaque está funcionando perfeitamente!');
      console.log('✅ Sincronização de dados: OK');
      console.log('✅ Cálculo de scores: OK');
      console.log('✅ Ordenação: OK');
      console.log('✅ Função get_featured_articles(): OK');
    } else {
      console.log('⚠️ Ainda há problemas que precisam ser resolvidos');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

console.log('🚀 Iniciando teste final...');
testeFinal().then(() => {
  console.log('\n🏁 Teste concluído');
});