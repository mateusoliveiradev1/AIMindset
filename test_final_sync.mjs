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

console.log('🎯 TESTE FINAL DA SINCRONIZAÇÃO DOS DADOS');
console.log('='.repeat(60));

async function testarSincronizacaoFinal() {
  try {
    console.log('\n1. 🔍 Executando função get_featured_articles()...');
    
    const { data: featuredArticles, error: featuredError } = await supabase.rpc('get_featured_articles');
    
    if (featuredError) {
      console.error('❌ Erro na função get_featured_articles:', featuredError);
      return;
    }
    
    console.log(`✅ Função retornou ${featuredArticles.length} artigos`);
    
    console.log('\n2. 📊 ORDEM ATUAL DOS ARTIGOS EM DESTAQUE:');
    
    featuredArticles.forEach((article, index) => {
      console.log(`\n   ${index + 1}º lugar: "${article.title}"`);
      console.log(`      • Score Total: ${article.rank_score}`);
      console.log(`      • Feedbacks Positivos: ${article.positive_feedbacks}`);
      console.log(`      • Comentários: ${article.comments_count}`);
      console.log(`      • Likes: ${article.likes_count}`);
      console.log(`      • Cálculo: (${article.positive_feedbacks} × 3) + (${article.comments_count} × 2) + ${article.likes_count} = ${article.rank_score}`);
    });
    
    console.log('\n3. 🎯 VALIDAÇÃO COM DADOS REAIS DE PRODUÇÃO:');
    
    const dadosEsperados = {
      'Revolução na Educação: Tecnologias Emergentes Transformando o Aprendizado': {
        feedbacks: 2,
        comentarios: 2,
        likes: 1,
        scoreEsperado: (2 * 3) + (2 * 2) + 1 // = 11
      },
      'Produtividade Digital: Ferramentas e Estratégias para Maximizar Resultados': {
        feedbacks: 2,
        comentarios: 0,
        likes: 0,
        scoreEsperado: (2 * 3) + (0 * 2) + 0 // = 6
      },
      'IA & Tecnologia: A Convergência que Está Transformando o Mundo': {
        feedbacks: 1,
        comentarios: 0,
        likes: 0,
        scoreEsperado: (1 * 3) + (0 * 2) + 0 // = 3
      },
      'Computação Quântica: A Próxima Fronteira Tecnológica': {
        feedbacks: 0,
        comentarios: 1,
        likes: 0,
        scoreEsperado: (0 * 3) + (1 * 2) + 0 // = 2
      }
    };
    
    let validacaoCorreta = true;
    
    for (const [titulo, dadosEsperado] of Object.entries(dadosEsperados)) {
      console.log(`\n📄 "${titulo}"`);
      
      const artigo = featuredArticles.find(a => 
        a.title.toLowerCase().includes(titulo.toLowerCase().substring(0, 20)) ||
        titulo.toLowerCase().includes(a.title.toLowerCase().substring(0, 20))
      );
      
      if (!artigo) {
        console.log('   ❌ Artigo não encontrado na função');
        validacaoCorreta = false;
        continue;
      }
      
      const feedbacksCorretos = artigo.positive_feedbacks === dadosEsperado.feedbacks;
      const comentariosCorretos = artigo.comments_count === dadosEsperado.comentarios;
      const likesCorretos = artigo.likes_count === dadosEsperado.likes;
      const scoreCorreto = artigo.rank_score === dadosEsperado.scoreEsperado;
      
      console.log(`   📊 Feedbacks: ${artigo.positive_feedbacks} (esperado: ${dadosEsperado.feedbacks}) ${feedbacksCorretos ? '✅' : '❌'}`);
      console.log(`   💬 Comentários: ${artigo.comments_count} (esperado: ${dadosEsperado.comentarios}) ${comentariosCorretos ? '✅' : '❌'}`);
      console.log(`   👍 Likes: ${artigo.likes_count} (esperado: ${dadosEsperado.likes}) ${likesCorretos ? '✅' : '❌'}`);
      console.log(`   🎯 Score: ${artigo.rank_score} (esperado: ${dadosEsperado.scoreEsperado}) ${scoreCorreto ? '✅' : '❌'}`);
      
      if (!feedbacksCorretos || !comentariosCorretos || !likesCorretos || !scoreCorreto) {
        validacaoCorreta = false;
      }
    }
    
    console.log('\n4. 🏆 VERIFICAÇÃO DA ORDEM CORRETA:');
    
    const ordemEsperada = [
      'Revolução na Educação: Tecnologias Emergentes Transformando o Aprendizado', // Score 11
      'Produtividade Digital: Ferramentas e Estratégias para Maximizar Resultados', // Score 6
      'IA & Tecnologia: A Convergência que Está Transformando o Mundo', // Score 3
      'Computação Quântica: A Próxima Fronteira Tecnológica' // Score 2
    ];
    
    let ordemCorreta = true;
    
    ordemEsperada.forEach((tituloEsperado, index) => {
      if (index < featuredArticles.length) {
        const artigoAtual = featuredArticles[index];
        const tituloCorreto = artigoAtual.title.toLowerCase().includes(tituloEsperado.toLowerCase().substring(0, 20)) ||
                             tituloEsperado.toLowerCase().includes(artigoAtual.title.toLowerCase().substring(0, 20));
        
        console.log(`   ${index + 1}º: ${tituloCorreto ? '✅' : '❌'} "${artigoAtual.title}"`);
        
        if (!tituloCorreto) {
          ordemCorreta = false;
        }
      }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 RESULTADO FINAL DA SINCRONIZAÇÃO:');
    console.log(`   • Dados sincronizados corretamente: ${validacaoCorreta ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   • Ordem dos artigos correta: ${ordemCorreta ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   • Total de feedbacks positivos no sistema: ${featuredArticles.reduce((sum, a) => sum + a.positive_feedbacks, 0)}`);
    console.log(`   • Função get_featured_articles() funcionando: ✅`);
    
    if (validacaoCorreta && ordemCorreta) {
      console.log('\n🎉 SINCRONIZAÇÃO COMPLETA E CORRETA!');
      console.log('   • Todos os dados de produção estão refletidos corretamente');
      console.log('   • A ordem dos artigos está baseada no engajamento real');
      console.log('   • O sistema está pronto para uso em produção');
    } else {
      console.log('\n⚠️ AINDA HÁ PROBLEMAS DE SINCRONIZAÇÃO');
      console.log('   • Alguns dados não estão corretos');
      console.log('   • Verificação adicional necessária');
    }
    
  } catch (error) {
    console.error('❌ Erro durante teste final:', error);
  }
}

// Executar teste final
testarSincronizacaoFinal().then(() => {
  console.log('\n🏁 Teste final concluído');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});