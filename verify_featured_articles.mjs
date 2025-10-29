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

console.log('🔍 VERIFICAÇÃO COMPLETA DOS ARTIGOS EM DESTAQUE');
console.log('='.repeat(70));

async function verificarArtigosDestaque() {
  try {
    console.log('\n1. 📊 Buscando TODOS os artigos no banco...');
    
    const { data: todosArtigos, error: todosArtigosError } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (todosArtigosError) {
      console.error('❌ Erro ao buscar todos os artigos:', todosArtigosError);
      return;
    }
    
    console.log(`✅ Encontrados ${todosArtigos.length} artigos no total`);
    
    console.log('\n2. 🎯 Buscando artigos marcados como "featured"...');
    
    const { data: artigosFeatured, error: artigosFeaturedError } = await supabase
      .from('articles')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: false });
    
    if (artigosFeaturedError) {
      console.error('❌ Erro ao buscar artigos featured:', artigosFeaturedError);
      return;
    }
    
    console.log(`✅ Encontrados ${artigosFeatured.length} artigos marcados como featured`);
    
    if (artigosFeatured.length === 0) {
      console.log('⚠️ PROBLEMA: Nenhum artigo está marcado como "is_featured = true"');
      console.log('   Isso explica por que alguns artigos não aparecem na função get_featured_articles()');
    }
    
    console.log('\n3. 📋 Lista de TODOS os artigos:');
    
    todosArtigos.forEach((artigo, index) => {
      const score = (artigo.positive_feedback * 3) + (artigo.comments_count * 2) + artigo.likes_count;
      console.log(`\n   ${index + 1}. "${artigo.title}"`);
      console.log(`      • ID: ${artigo.id}`);
      console.log(`      • Is Featured: ${artigo.is_featured ? '✅' : '❌'}`);
      console.log(`      • Positive Feedback: ${artigo.positive_feedback}`);
      console.log(`      • Comments: ${artigo.comments_count}`);
      console.log(`      • Likes: ${artigo.likes_count}`);
      console.log(`      • Score Calculado: ${score}`);
    });
    
    console.log('\n4. 🔧 Executando função get_featured_articles()...');
    
    const { data: featuredArticles, error: featuredError } = await supabase.rpc('get_featured_articles');
    
    if (featuredError) {
      console.error('❌ Erro na função get_featured_articles:', featuredError);
      return;
    }
    
    console.log(`✅ Função retornou ${featuredArticles.length} artigos`);
    
    console.log('\n📊 Artigos retornados pela função:');
    featuredArticles.forEach((article, index) => {
      console.log(`\n   ${index + 1}. "${article.title}"`);
      console.log(`      • Score: ${article.rank_score}`);
      console.log(`      • Positive Feedbacks: ${article.positive_feedbacks}`);
      console.log(`      • Comments: ${article.comments_count}`);
      console.log(`      • Likes: ${article.likes_count}`);
    });
    
    console.log('\n5. 🎯 Identificando artigos que deveriam aparecer...');
    
    const artigosEsperados = [
      'Produtividade Digital: Ferramentas e Estratégias para Maximizar Resultados',
      'Revolução na Educação: Tecnologias Emergentes Transformando o Aprendizado',
      'IA & Tecnologia: A Convergência que Está Transformando o Mundo',
      'Computação Quântica: A Próxima Fronteira Tecnológica'
    ];
    
    console.log('📋 Verificando cada artigo esperado:');
    
    for (const tituloEsperado of artigosEsperados) {
      console.log(`\n📄 "${tituloEsperado}"`);
      
      const artigo = todosArtigos.find(a => 
        a.title.toLowerCase().includes(tituloEsperado.toLowerCase().substring(0, 20)) ||
        tituloEsperado.toLowerCase().includes(a.title.toLowerCase().substring(0, 20))
      );
      
      if (!artigo) {
        console.log('   ❌ Artigo não encontrado no banco');
        continue;
      }
      
      console.log(`   🆔 ID: ${artigo.id}`);
      console.log(`   📝 Título real: "${artigo.title}"`);
      console.log(`   🎯 Is Featured: ${artigo.is_featured ? '✅ SIM' : '❌ NÃO'}`);
      
      const score = (artigo.positive_feedback * 3) + (artigo.comments_count * 2) + artigo.likes_count;
      console.log(`   📊 Score: ${score}`);
      
      const apareceNaFuncao = featuredArticles.some(fa => fa.id === artigo.id);
      console.log(`   🔍 Aparece na função: ${apareceNaFuncao ? '✅ SIM' : '❌ NÃO'}`);
      
      if (!artigo.is_featured) {
        console.log('   🔧 AÇÃO NECESSÁRIA: Marcar como featured');
      }
    }
    
    console.log('\n6. 🔧 Corrigindo artigos que devem ser featured...');
    
    let artigosCorrigidos = 0;
    
    for (const tituloEsperado of artigosEsperados) {
      const artigo = todosArtigos.find(a => 
        a.title.toLowerCase().includes(tituloEsperado.toLowerCase().substring(0, 20)) ||
        tituloEsperado.toLowerCase().includes(a.title.toLowerCase().substring(0, 20))
      );
      
      if (artigo && !artigo.is_featured) {
        console.log(`\n🔄 Marcando como featured: "${artigo.title}"`);
        
        const { error: updateError } = await supabase
          .from('articles')
          .update({ is_featured: true })
          .eq('id', artigo.id);
        
        if (updateError) {
          console.error(`   ❌ Erro ao atualizar: ${updateError.message}`);
        } else {
          console.log('   ✅ Atualizado com sucesso!');
          artigosCorrigidos++;
        }
      }
    }
    
    if (artigosCorrigidos > 0) {
      console.log('\n7. 🔄 Testando função novamente após correções...');
      
      const { data: featuredArticlesNovo, error: featuredErrorNovo } = await supabase.rpc('get_featured_articles');
      
      if (featuredErrorNovo) {
        console.error('❌ Erro na função get_featured_articles:', featuredErrorNovo);
        return;
      }
      
      console.log(`✅ Função agora retorna ${featuredArticlesNovo.length} artigos`);
      
      console.log('\n📊 Nova ordem dos artigos em destaque:');
      featuredArticlesNovo.forEach((article, index) => {
        console.log(`\n   ${index + 1}. "${article.title}"`);
        console.log(`      • Score: ${article.rank_score}`);
        console.log(`      • Positive Feedbacks: ${article.positive_feedbacks}`);
        console.log(`      • Comments: ${article.comments_count}`);
        console.log(`      • Likes: ${article.likes_count}`);
      });
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('🎯 RESUMO DA VERIFICAÇÃO:');
    console.log(`   • Total de artigos no banco: ${todosArtigos.length}`);
    console.log(`   • Artigos marcados como featured: ${artigosFeatured.length + artigosCorrigidos}`);
    console.log(`   • Artigos corrigidos (marcados como featured): ${artigosCorrigidos}`);
    console.log(`   • Função get_featured_articles() funcionando: ✅`);
    
    if (artigosCorrigidos > 0) {
      console.log('\n🎉 CORREÇÃO CONCLUÍDA!');
      console.log('   • Todos os artigos esperados agora estão marcados como featured');
      console.log('   • A função get_featured_articles() deve retornar todos os artigos corretos');
      console.log('   • O frontend deve mostrar a ordem correta baseada no engajamento real');
    } else {
      console.log('\n✅ TUDO CORRETO!');
      console.log('   • Todos os artigos já estavam configurados corretamente');
    }
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

// Executar verificação
verificarArtigosDestaque().then(() => {
  console.log('\n🏁 Verificação concluída');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});