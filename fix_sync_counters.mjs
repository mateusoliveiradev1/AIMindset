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

console.log('🔧 CORREÇÃO DE CONTADORES DESSINCRONIZADOS');
console.log('='.repeat(60));

async function corrigirContadores() {
  try {
    console.log('\n1. 📊 Buscando dados atuais...');
    
    // Buscar todos os artigos
    const { data: artigos, error: artigosError } = await supabase
      .from('articles')
      .select('*');
    
    if (artigosError) {
      console.error('❌ Erro ao buscar artigos:', artigosError);
      return;
    }
    
    console.log(`✅ Encontrados ${artigos.length} artigos`);
    
    // Buscar todos os feedbacks
    const { data: feedbacks, error: feedbacksError } = await supabase
      .from('feedbacks')
      .select('*');
    
    if (feedbacksError) {
      console.error('❌ Erro ao buscar feedbacks:', feedbacksError);
      return;
    }
    
    console.log(`✅ Encontrados ${feedbacks.length} feedbacks`);
    
    // Buscar todos os comentários
    const { data: comentarios, error: comentariosError } = await supabase
      .from('comments')
      .select('*');
    
    if (comentariosError) {
      console.error('❌ Erro ao buscar comentários:', comentariosError);
      return;
    }
    
    console.log(`✅ Encontrados ${comentarios.length} comentários`);
    
    console.log('\n2. 🔄 Calculando contadores corretos...');
    
    // Calcular contadores por artigo
    const contadoresPorArtigo = {};
    
    // Inicializar contadores
    artigos.forEach(artigo => {
      contadoresPorArtigo[artigo.id] = {
        positive_feedbacks: 0,
        negative_feedbacks: 0,
        comments_count: 0,
        likes_count: 0
      };
    });
    
    // Contar feedbacks
    feedbacks.forEach(feedback => {
      if (contadoresPorArtigo[feedback.article_id]) {
        if (feedback.type === 'positive') {
          contadoresPorArtigo[feedback.article_id].positive_feedbacks++;
        } else if (feedback.type === 'negative') {
          contadoresPorArtigo[feedback.article_id].negative_feedbacks++;
        }
      }
    });
    
    // Contar comentários e likes
    comentarios.forEach(comentario => {
      if (contadoresPorArtigo[comentario.article_id]) {
        contadoresPorArtigo[comentario.article_id].comments_count++;
        contadoresPorArtigo[comentario.article_id].likes_count += comentario.likes_count || 0;
      }
    });
    
    console.log('\n3. 🔧 Atualizando contadores...');
    
    let artigosAtualizados = 0;
    let errosAtualizacao = 0;
    
    for (const artigo of artigos) {
      const contadores = contadoresPorArtigo[artigo.id];
      
      // Verificar se há diferenças
      const precisaAtualizar = 
        artigo.positive_feedbacks !== contadores.positive_feedbacks ||
        artigo.negative_feedbacks !== contadores.negative_feedbacks ||
        artigo.comments_count !== contadores.comments_count ||
        artigo.likes_count !== contadores.likes_count;
      
      if (precisaAtualizar) {
        console.log(`\n📄 Atualizando "${artigo.title.substring(0, 50)}..."`);
        console.log(`   Antes: +${artigo.positive_feedbacks} -${artigo.negative_feedbacks} 💬${artigo.comments_count} ❤️${artigo.likes_count}`);
        console.log(`   Depois: +${contadores.positive_feedbacks} -${contadores.negative_feedbacks} 💬${contadores.comments_count} ❤️${contadores.likes_count}`);
        
        const { error: updateError } = await supabase
          .from('articles')
          .update({
            positive_feedbacks: contadores.positive_feedbacks,
            negative_feedbacks: contadores.negative_feedbacks,
            comments_count: contadores.comments_count,
            likes_count: contadores.likes_count
          })
          .eq('id', artigo.id);
        
        if (updateError) {
          console.error(`   ❌ Erro ao atualizar: ${updateError.message}`);
          errosAtualizacao++;
        } else {
          console.log('   ✅ Atualizado com sucesso');
          artigosAtualizados++;
        }
      } else {
        console.log(`✅ "${artigo.title.substring(0, 50)}..." já está sincronizado`);
      }
    }
    
    console.log('\n4. 📈 Resumo da Correção:');
    console.log('='.repeat(40));
    console.log(`   Artigos verificados: ${artigos.length}`);
    console.log(`   Artigos atualizados: ${artigosAtualizados}`);
    console.log(`   Erros de atualização: ${errosAtualizacao}`);
    
    if (errosAtualizacao === 0) {
      console.log('   ✅ Todos os contadores foram sincronizados com sucesso!');
    } else {
      console.log('   ⚠️ Alguns erros ocorreram durante a atualização');
    }
    
    console.log('\n5. 🔍 Testando função get_featured_articles()...');
    
    const { data: featuredArticles, error: featuredError } = await supabase.rpc('get_featured_articles');
    
    if (featuredError) {
      console.error('❌ Erro na função get_featured_articles:', featuredError);
      return;
    }
    
    console.log('✅ Função executada com sucesso');
    console.log('\n📊 Artigos em destaque após correção:');
    
    featuredArticles.forEach((article, index) => {
      console.log(`\n   ${index + 1}. "${article.title}"`);
      console.log(`      • Score: ${article.rank_score}`);
      console.log(`      • Positive Feedbacks: ${article.positive_feedbacks}`);
      console.log(`      • Comments: ${article.comments_count}`);
      console.log(`      • Likes: ${article.likes_count}`);
    });
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  }
}

console.log('🚀 Iniciando correção de contadores...');
corrigirContadores().then(() => {
  console.log('\n🏁 Correção concluída');
});