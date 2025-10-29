import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function zerarTudoEmergencial() {
  console.log('🚨 LIMPEZA EMERGENCIAL - ZERANDO TUDO!\n');

  try {
    // 1. DELETAR TODOS OS FEEDBACKS
    console.log('1️⃣ DELETANDO FEEDBACKS...');
    const { error: deleteFeedbacksError } = await supabase
      .from('feedbacks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteFeedbacksError) {
      console.error('❌ Erro feedbacks:', deleteFeedbacksError);
    } else {
      console.log('✅ FEEDBACKS DELETADOS!');
    }

    // 2. DELETAR TODOS OS COMENTÁRIOS
    console.log('2️⃣ DELETANDO COMENTÁRIOS...');
    const { error: deleteCommentsError } = await supabase
      .from('comments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteCommentsError) {
      console.error('❌ Erro comentários:', deleteCommentsError);
    } else {
      console.log('✅ COMENTÁRIOS DELETADOS!');
    }

    // 3. ZERAR CONTADORES
    console.log('3️⃣ ZERANDO CONTADORES...');
    const { error: updateError } = await supabase
      .from('articles')
      .update({
        positive_feedbacks: 0,
        negative_feedbacks: 0,
        comments_count: 0,
        likes_count: 0
      })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (updateError) {
      console.error('❌ Erro contadores:', updateError);
    } else {
      console.log('✅ CONTADORES ZERADOS!');
    }

    // 4. VERIFICAR RESULTADO
    console.log('4️⃣ VERIFICANDO...');
    const { data: articles } = await supabase
      .from('articles')
      .select('title, positive_feedbacks, negative_feedbacks, comments_count, likes_count')
      .eq('published', true)
      .limit(5);

    if (articles) {
      console.log('\n📋 RESULTADO:');
      articles.forEach((article, i) => {
        console.log(`${i+1}. ${article.title}`);
        console.log(`   Pos: ${article.positive_feedbacks}, Neg: ${article.negative_feedbacks}, Com: ${article.comments_count}, Likes: ${article.likes_count}`);
      });
    }

    console.log('\n🎉 LIMPEZA CONCLUÍDA!');
    console.log('✅ Banco ZERADO');
    console.log('✅ Sistema pronto');

  } catch (error) {
    console.error('❌ ERRO:', error);
  }
}

zerarTudoEmergencial();