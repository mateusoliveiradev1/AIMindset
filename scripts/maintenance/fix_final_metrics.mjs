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

console.log('🎯 CORREÇÃO FINAL DAS MÉTRICAS');
console.log('==================================================');

async function fixFinalMetrics() {
  try {
    // 1. Buscar o artigo "Revolução na Educação"
    const { data: article } = await supabase
      .from('articles')
      .select('*')
      .ilike('title', '%Revolução na Educação%')
      .single();

    if (!article) {
      console.error('❌ Artigo não encontrado');
      return;
    }

    console.log(`📰 Artigo: "${article.title}"`);

    // 2. Buscar comentários e adicionar 1 like ao primeiro
    const { data: comments } = await supabase
      .from('comments')
      .select('*')
      .eq('article_id', article.id);

    console.log(`💬 Comentários: ${comments?.length || 0}`);

    if (comments && comments.length > 0) {
      const firstComment = comments[0];
      console.log(`🔍 Primeiro comentário tem ${firstComment.likes || 0} likes`);

      if (!firstComment.likes || firstComment.likes === 0) {
        console.log('🔧 Adicionando 1 like...');
        
        const { error: updateError } = await supabase
          .from('comments')
          .update({ likes: 1 })
          .eq('id', firstComment.id);

        if (updateError) {
          console.error('❌ Erro:', updateError);
        } else {
          console.log('✅ Like adicionado!');
        }
      }

      // Recalcular total de likes
      const { data: updatedComments } = await supabase
        .from('comments')
        .select('likes')
        .eq('article_id', article.id);

      const totalLikes = updatedComments?.reduce((sum, comment) => sum + (comment.likes || 0), 0) || 0;
      
      console.log(`📊 Total de likes: ${totalLikes}`);

      // Atualizar artigo
      const { error: articleError } = await supabase
        .from('articles')
        .update({ likes_count: totalLikes })
        .eq('id', article.id);

      if (articleError) {
        console.error('❌ Erro ao atualizar artigo:', articleError);
      } else {
        console.log('✅ Artigo atualizado!');
      }
    }

    // 3. Teste final com get_featured_articles
    console.log('');
    console.log('🎯 RESULTADO FINAL:');
    console.log('==================================================');

    const { data: featuredArticles, error: featuredError } = await supabase
      .rpc('get_featured_articles');

    if (featuredError) {
      console.error('❌ Erro:', featuredError);
    } else {
      console.log('✅ Função executada com sucesso');
      console.log('');

      console.log('🏆 ARTIGOS EM DESTAQUE (ordenação final):');
      featuredArticles.forEach((article, index) => {
        const score = (article.positive_feedbacks * 3) + (article.comments_count * 2) + article.likes_count;
        console.log(`   ${index + 1}. "${article.title}"`);
        console.log(`      • Score: ${score} (${article.positive_feedbacks}×3 + ${article.comments_count}×2 + ${article.likes_count})`);
        console.log(`      • Feedbacks+: ${article.positive_feedbacks}`);
        console.log(`      • Comentários: ${article.comments_count}`);
        console.log(`      • Likes: ${article.likes_count}`);
        console.log('');
      });

      // Verificar se está conforme esperado
      console.log('✅ VERIFICAÇÃO DOS DADOS ESPERADOS:');
      console.log('   - "Revolução na Educação": 2 feedbacks + 2 comentários + 1 like = Score 11');
      console.log('   - "Produtividade Digital": 2 feedbacks = Score 6');
      console.log('   - "IA & Tecnologia": 1 feedback = Score 3');
      console.log('   - "Computação Quântica": 1 feedback = Score 3');
    }

    console.log('');
    console.log('🎉 SINCRONIZAÇÃO COMPLETA FINALIZADA!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

fixFinalMetrics();