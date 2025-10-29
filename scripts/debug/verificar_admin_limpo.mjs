import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verificarAdminLimpo() {
  console.log('🔍 VERIFICANDO SE PAINEL ADMIN ESTÁ LIMPO\n');

  try {
    // 1. Contar feedbacks totais
    const { data: feedbacks, error: feedbackError } = await supabase
      .from('feedbacks')
      .select('id');

    console.log(`📊 Total de feedbacks: ${feedbacks?.length || 0}`);

    // 2. Contar comentários totais
    const { data: comments, error: commentError } = await supabase
      .from('comments')
      .select('id');

    console.log(`💬 Total de comentários: ${comments?.length || 0}`);

    // 3. Verificar contadores dos artigos
    const { data: articles, error: articleError } = await supabase
      .from('articles')
      .select('id, title, positive_feedbacks, negative_feedbacks, comments_count, likes_count')
      .eq('published', true);

    if (articles) {
      const totalPositive = articles.reduce((sum, a) => sum + (a.positive_feedbacks || 0), 0);
      const totalNegative = articles.reduce((sum, a) => sum + (a.negative_feedbacks || 0), 0);
      const totalComments = articles.reduce((sum, a) => sum + (a.comments_count || 0), 0);
      const totalLikes = articles.reduce((sum, a) => sum + (a.likes_count || 0), 0);

      console.log(`\n📈 CONTADORES TOTAIS:`);
      console.log(`   Feedbacks positivos: ${totalPositive}`);
      console.log(`   Feedbacks negativos: ${totalNegative}`);
      console.log(`   Comentários: ${totalComments}`);
      console.log(`   Likes: ${totalLikes}`);

      // Verificar se está tudo zerado
      const isClean = (feedbacks?.length || 0) === 0 && 
                     (comments?.length || 0) === 0 && 
                     totalPositive === 0 && 
                     totalNegative === 0 && 
                     totalComments === 0 && 
                     totalLikes === 0;

      if (isClean) {
        console.log('\n🎉 PAINEL ADMIN COMPLETAMENTE LIMPO!');
        console.log('✅ 0 feedbacks');
        console.log('✅ 0 comentários');
        console.log('✅ Todos os contadores em 0');
        console.log('✅ Sistema pronto para uso');
      } else {
        console.log('\n⚠️ AINDA HÁ DADOS NO SISTEMA');
        console.log('❌ Limpeza não foi completa');
      }
    }

  } catch (error) {
    console.error('❌ ERRO:', error);
  }
}

verificarAdminLimpo();