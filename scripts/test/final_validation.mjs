import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🎯 VALIDAÇÃO FINAL DA SINCRONIZAÇÃO');
console.log('='.repeat(50));

async function validacaoFinal() {
  try {
    console.log('\n1. 🔍 Executando função get_featured_articles()...');
    
    const { data: featuredArticles, error: featuredError } = await supabase.rpc('get_featured_articles');
    
    if (featuredError) {
      console.error('❌ Erro na função:', featuredError);
      return;
    }
    
    console.log(`✅ Função retorna ${featuredArticles.length} artigos`);
    
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
    
    // Dados esperados conforme relatado pelo usuário
    const dadosReaisProducao = {
      totalFeedbacksPositivos: 6,
      artigos: {
        'Produtividade Digital': { feedbacks: 2, comentarios: 0, likes: 0 },
        'Revolução na Educação': { feedbacks: 2, comentarios: 2, likes: 1 },
        'IA & Tecnologia': { feedbacks: 1, comentarios: 0, likes: 0 },
        'Computação Quântica': { feedbacks: 0, comentarios: 1, likes: 0 }
      }
    };
    
    let totalFeedbacksEncontrados = 0;
    let artigosValidados = 0;
    let artigosComProblemas = [];
    
    for (const [nomeArtigo, dadosEsperados] of Object.entries(dadosReaisProducao.artigos)) {
      console.log(`\n📄 Validando "${nomeArtigo}":`);
      
      const artigo = featuredArticles.find(a => {
        const titulo = a.title.toLowerCase();
        const nome = nomeArtigo.toLowerCase();
        return titulo.includes(nome.split(' ')[0]) && titulo.includes(nome.split(' ')[1]);
      });
      
      if (!artigo) {
        console.log('   ❌ Artigo não encontrado na função get_featured_articles()');
        artigosComProblemas.push(`${nomeArtigo} - não encontrado`);
        continue;
      }
      
      const feedbacksCorretos = artigo.positive_feedbacks === dadosEsperados.feedbacks;
      const comentariosCorretos = artigo.comments_count === dadosEsperados.comentarios;
      const likesCorretos = artigo.likes_count === dadosEsperados.likes;
      
      console.log(`   📊 Feedbacks: ${artigo.positive_feedbacks}/${dadosEsperados.feedbacks} ${feedbacksCorretos ? '✅' : '❌'}`);
      console.log(`   💬 Comentários: ${artigo.comments_count}/${dadosEsperados.comentarios} ${comentariosCorretos ? '✅' : '❌'}`);
      console.log(`   👍 Likes: ${artigo.likes_count}/${dadosEsperados.likes} ${likesCorretos ? '✅' : '❌'}`);
      
      totalFeedbacksEncontrados += artigo.positive_feedbacks;
      
      if (feedbacksCorretos && comentariosCorretos && likesCorretos) {
        artigosValidados++;
        console.log('   ✅ ARTIGO VALIDADO CORRETAMENTE');
      } else {
        artigosComProblemas.push(`${nomeArtigo} - dados incorretos`);
        console.log('   ❌ ARTIGO COM PROBLEMAS');
      }
    }
    
    console.log('\n4. 📈 RESUMO DA VALIDAÇÃO:');
    
    const totalFeedbacksCorreto = totalFeedbacksEncontrados >= dadosReaisProducao.totalFeedbacksPositivos;
    const todosArtigosValidados = artigosValidados === Object.keys(dadosReaisProducao.artigos).length;
    const semProblemas = artigosComProblemas.length === 0;
    
    console.log(`   📊 Total de feedbacks positivos: ${totalFeedbacksEncontrados}/${dadosReaisProducao.totalFeedbacksPositivos} ${totalFeedbacksCorreto ? '✅' : '❌'}`);
    console.log(`   📄 Artigos validados: ${artigosValidados}/${Object.keys(dadosReaisProducao.artigos).length} ${todosArtigosValidados ? '✅' : '❌'}`);
    console.log(`   🎯 Sem problemas: ${semProblemas ? '✅' : '❌'}`);
    
    if (artigosComProblemas.length > 0) {
      console.log('\n⚠️ PROBLEMAS ENCONTRADOS:');
      artigosComProblemas.forEach(problema => {
        console.log(`   • ${problema}`);
      });
    }
    
    console.log('\n5. 🏆 VERIFICAÇÃO DA ORDEM POR ENGAJAMENTO:');
    
    // Verificar se os artigos estão ordenados corretamente por score
    let ordemCorreta = true;
    for (let i = 0; i < featuredArticles.length - 1; i++) {
      if (featuredArticles[i].rank_score < featuredArticles[i + 1].rank_score) {
        ordemCorreta = false;
        console.log(`   ❌ Ordem incorreta: "${featuredArticles[i].title}" (${featuredArticles[i].rank_score}) deveria vir depois de "${featuredArticles[i + 1].title}" (${featuredArticles[i + 1].rank_score})`);
      }
    }
    
    if (ordemCorreta) {
      console.log('   ✅ Artigos estão ordenados corretamente por engajamento');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 RESULTADO FINAL:');
    
    const sincronizacaoCompleta = totalFeedbacksCorreto && semProblemas && ordemCorreta;
    
    console.log(`   • Sincronização completa: ${sincronizacaoCompleta ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   • Dados de produção refletidos: ${totalFeedbacksCorreto ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   • Ordem por engajamento: ${ordemCorreta ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   • Sistema pronto para produção: ${sincronizacaoCompleta ? '✅ SIM' : '❌ NÃO'}`);
    
    if (sincronizacaoCompleta) {
      console.log('\n🎉 SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO!');
      console.log('   • Todos os dados de feedback estão sincronizados');
      console.log('   • Os artigos estão ordenados por engajamento real');
      console.log('   • O sistema reflete corretamente os dados de produção');
      console.log('   • O frontend deve mostrar a ordem correta');
    } else {
      console.log('\n⚠️ SINCRONIZAÇÃO AINDA PRECISA DE AJUSTES');
      console.log('   • Alguns dados não estão corretos');
      console.log('   • Verificação adicional necessária');
    }
    
  } catch (error) {
    console.error('❌ Erro durante validação:', error);
  }
}

validacaoFinal().then(() => {
  console.log('\n🏁 Validação final concluída');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});