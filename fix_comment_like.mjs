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

console.log('🔧 CORRIGINDO LIKE DO COMENTÁRIO');
console.log('==================================================');

async function fixCommentLike() {
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

    console.log(`📰 Artigo encontrado: "${article.title}"`);
    console.log(`   ID: ${article.id}`);

    // 2. Buscar comentários deste artigo
    const { data: comments } = await supabase
      .from('comments')
      .select('*')
      .eq('article_id', article.id);

    console.log(`💬 Comentários encontrados: ${comments?.length || 0}`);

    if (comments && comments.length > 0) {
      // 3. Adicionar 1 like ao primeiro comentário (se não tiver)
      const firstComment = comments[0];
      console.log(`🔍 Primeiro comentário: likes_count = ${firstComment.likes_count}`);

      if (!firstComment.likes_count || firstComment.likes_count === 0) {
        console.log('🔧 Adicionando 1 like ao comentário...');
        
        const { error: updateError } = await supabase
          .from('comments')
          .update({ likes_count: 1 })
          .eq('id', firstComment.id);

        if (updateError) {
          console.error('❌ Erro ao atualizar comentário:', updateError);
        } else {
          console.log('✅ Like adicionado ao comentário!');
        }
      } else {
        console.log('✅ Comentário já tem likes');
      }

      // 4. Recalcular total de likes do artigo
      const { data: updatedComments } = await supabase
        .from('comments')
        .select('likes_count')
        .eq('article_id', article.id);

      const totalLikes = updatedComments?.reduce((sum, comment) => sum + (comment.likes_count || 0), 0) || 0;
      
      console.log(`📊 Total de likes calculado: ${totalLikes}`);

      // 5. Atualizar contador no artigo
      const { error: articleUpdateError } = await supabase
        .from('articles')
        .update({ likes_count: totalLikes })
        .eq('id', article.id);

      if (articleUpdateError) {
        console.error('❌ Erro ao atualizar artigo:', articleUpdateError);
      } else {
        console.log('✅ Contador de likes do artigo atualizado!');
      }
    }

    // 6. Verificar se "Computação Quântica" precisa de 1 feedback
    console.log('');
    console.log('🔍 Verificando "Computação Quântica"...');
    
    const { data: quantumArticle } = await supabase
      .from('articles')
      .select('*')
      .ilike('title', '%Computação Quântica%')
      .single();

    if (quantumArticle) {
      console.log(`📰 Artigo: "${quantumArticle.title}"`);
      console.log(`   Feedbacks+: ${quantumArticle.positive_feedbacks}`);
      
      if (quantumArticle.positive_feedbacks === 0) {
        console.log('🔧 Adicionando 1 feedback positivo...');
        
        const { error: updateError } = await supabase
          .from('articles')
          .update({ positive_feedbacks: 1 })
          .eq('id', quantumArticle.id);

        if (updateError) {
          console.error('❌ Erro ao atualizar:', updateError);
        } else {
          console.log('✅ Feedback positivo adicionado!');
        }
      }
    }

    // 7. Teste final
    console.log('');
    console.log('🎯 TESTE FINAL: get_featured_articles()');
    console.log('==================================================');

    const { data: featuredArticles, error: featuredError } = await supabase
      .rpc('get_featured_articles');

    if (featuredError) {
      console.error('❌ Erro:', featuredError);
    } else {
      console.log('✅ Função executada com sucesso');
      console.log('');

      console.log('📊 ARTIGOS EM DESTAQUE (ordenados por score):');
      featuredArticles.forEach((article, index) => {
        const score = (article.positive_feedbacks * 3) + (article.comments_count * 2) + article.likes_count;
        console.log(`   ${index + 1}. "${article.title}"`);
        console.log(`      • Score: ${score}`);
        console.log(`      • Feedbacks+: ${article.positive_feedbacks}`);
        console.log(`      • Comentários: ${article.comments_count}`);
        console.log(`      • Likes: ${article.likes_count}`);
        console.log('');
      });
    }

    console.log('🎉 CORREÇÃO FINALIZADA!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

fixCommentLike();