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

console.log('🔍 VERIFICAÇÃO COMPLETA DE TODOS OS ARTIGOS');
console.log('='.repeat(60));

async function verificarTodosArtigos() {
  try {
    console.log('\n1. 📋 Listando TODOS os artigos no banco...');
    
    const { data: todosArtigos, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar artigos:', error);
      return;
    }
    
    console.log(`✅ Total de artigos encontrados: ${todosArtigos.length}`);
    
    console.log('\n2. 📄 Lista completa de artigos:');
    
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
    
    console.log('\n3. 🎯 Identificando artigos que devem ser featured...');
    
    const artigosEsperados = [
      'Produtividade Digital',
      'Revolução na Educação',
      'IA',
      'Computação Quântica'
    ];
    
    const artigosParaCorrigir = [];
    
    artigosEsperados.forEach(palavraChave => {
      console.log(`\n🔍 Procurando artigos com "${palavraChave}":`);
      
      const artigosEncontrados = todosArtigos.filter(artigo => 
        artigo.title.toLowerCase().includes(palavraChave.toLowerCase())
      );
      
      artigosEncontrados.forEach(artigo => {
        console.log(`   📄 "${artigo.title}" (Featured: ${artigo.is_featured ? '✅' : '❌'})`);
        
        if (!artigo.is_featured) {
          artigosParaCorrigir.push(artigo);
        }
      });
    });
    
    console.log(`\n4. 🔧 Corrigindo ${artigosParaCorrigir.length} artigos que devem ser featured...`);
    
    for (const artigo of artigosParaCorrigir) {
      console.log(`\n🔄 Marcando como featured: "${artigo.title}"`);
      
      const { error: updateError } = await supabase
        .from('articles')
        .update({ is_featured: true })
        .eq('id', artigo.id);
      
      if (updateError) {
        console.error(`   ❌ Erro: ${updateError.message}`);
      } else {
        console.log('   ✅ Sucesso!');
      }
    }
    
    console.log('\n5. 🔄 Testando função get_featured_articles() após correções...');
    
    const { data: featuredArticles, error: featuredError } = await supabase.rpc('get_featured_articles');
    
    if (featuredError) {
      console.error('❌ Erro na função:', featuredError);
      return;
    }
    
    console.log(`✅ Função retorna ${featuredArticles.length} artigos`);
    
    console.log('\n📊 Ordem final dos artigos em destaque:');
    featuredArticles.forEach((article, index) => {
      console.log(`\n   ${index + 1}º lugar: "${article.title}"`);
      console.log(`      • Score: ${article.rank_score}`);
      console.log(`      • Feedbacks: ${article.positive_feedbacks}`);
      console.log(`      • Comentários: ${article.comments_count}`);
      console.log(`      • Likes: ${article.likes_count}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 VERIFICAÇÃO CONCLUÍDA!');
    console.log(`   • Total de artigos: ${todosArtigos.length}`);
    console.log(`   • Artigos em destaque: ${featuredArticles.length}`);
    console.log(`   • Artigos corrigidos: ${artigosParaCorrigir.length}`);
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

verificarTodosArtigos().then(() => {
  console.log('\n🏁 Verificação concluída');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});