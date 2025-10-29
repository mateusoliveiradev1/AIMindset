import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verificacaoFinalAdmin() {
  console.log('🔍 VERIFICAÇÃO FINAL DO PAINEL ADMIN\n');

  try {
    // 1. Verificar feedbacks
    const { data: feedbacks } = await supabase
      .from('feedbacks')
      .select('*');

    console.log(`📊 Total de feedbacks no banco: ${feedbacks?.length || 0}`);

    // 2. Verificar comentários
    const { data: comments } = await supabase
      .from('comments')
      .select('*');

    console.log(`💬 Total de comentários no banco: ${comments?.length || 0}`);

    // 3. Verificar contadores dos artigos (TODOS os artigos)
    const { data: articles } = await supabase
      .from('articles')
      .select('title, positive_feedbacks, negative_feedbacks, comments_count, likes_count')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (articles) {
      console.log(`\n📋 TODOS OS ARTIGOS (${articles.length} total):`);
      
      let hasAnyFeedback = false;
      
      articles.forEach((article, index) => {
        const pos = article.positive_feedbacks || 0;
        const neg = article.negative_feedbacks || 0;
        const com = article.comments_count || 0;
        const likes = article.likes_count || 0;
        
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   Pos: ${pos}, Neg: ${neg}, Com: ${com}, Likes: ${likes}`);
        
        if (pos > 0 || neg > 0 || com > 0 || likes > 0) {
          hasAnyFeedback = true;
          console.log(`   ⚠️ AINDA TEM DADOS!`);
        }
      });

      if (!hasAnyFeedback && (feedbacks?.length || 0) === 0 && (comments?.length || 0) === 0) {
        console.log('\n🎉 PAINEL ADMIN COMPLETAMENTE LIMPO!');
        console.log('✅ Todos os artigos com 0 feedbacks');
        console.log('✅ Todos os artigos com 0 comentários');
        console.log('✅ Banco de dados zerado');
        console.log('✅ Sistema pronto para uso');
      } else {
        console.log('\n❌ AINDA HÁ DADOS NO SISTEMA!');
        console.log('⚠️ Precisa executar limpeza novamente');
      }
    }

  } catch (error) {
    console.error('❌ ERRO:', error);
  }
}

verificacaoFinalAdmin();