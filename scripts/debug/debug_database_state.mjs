import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function zerarTudoAgora() {
  console.log('🚨 ZERANDO TUDO DO BANCO DE DADOS AGORA!\n');

  try {
    // 1. DELETAR TODOS OS FEEDBACKS
    console.log('1️⃣ DELETANDO TODOS OS FEEDBACKS...');
    const { error: deleteFeedbacksError } = await supabase
      .from('feedbacks')
      .delete()
      .gte('created_at', '2000-01-01'); // Delete all records

    if (deleteFeedbacksError) {
      console.error('❌ Erro ao deletar feedbacks:', deleteFeedbacksError);
    } else {
      console.log('✅ TODOS OS FEEDBACKS DELETADOS!');
    }

    // 2. DELETAR TODOS OS COMENTÁRIOS
    console.log('2️⃣ DELETANDO TODOS OS COMENTÁRIOS...');
    const { error: deleteCommentsError } = await supabase
      .from('comments')
      .delete()
      .gte('created_at', '2000-01-01'); // Delete all records

    if (deleteCommentsError) {
      console.error('❌ Erro ao deletar comentários:', deleteCommentsError);
    } else {
      console.log('✅ TODOS OS COMENTÁRIOS DELETADOS!');
    }

    // 3. ZERAR TODOS OS CONTADORES
    console.log('3️⃣ ZERANDO TODOS OS CONTADORES...');
    const { error: updateError } = await supabase
      .from('articles')
      .update({
        positive_feedbacks: 0,
        negative_feedbacks: 0,
        comments_count: 0,
        likes_count: 0
      })
      .eq('published', true);

    if (updateError) {
      console.error('❌ Erro ao zerar contadores:', updateError);
    } else {
      console.log('✅ TODOS OS CONTADORES ZERADOS!');
    }

    // 4. VERIFICAR RESULTADO
    console.log('\n4️⃣ VERIFICANDO RESULTADO...');
    
    // Contar feedbacks restantes
    const { data: feedbacksRemaining } = await supabase
      .from('feedbacks')
      .select('id');
    
    console.log(`📊 Feedbacks restantes: ${feedbacksRemaining?.length || 0}`);

    // Contar comentários restantes
    const { data: commentsRemaining } = await supabase
      .from('comments')
      .select('id');
    
    console.log(`📊 Comentários restantes: ${commentsRemaining?.length || 0}`);

    // Verificar contadores dos artigos
    const { data: articles } = await supabase
      .from('articles')
      .select('title, positive_feedbacks, negative_feedbacks, comments_count, likes_count')
      .eq('published', true)
      .limit(5);

    if (articles) {
      console.log('\n📋 ESTADO FINAL DOS ARTIGOS:');
      articles.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   - Pos: ${article.positive_feedbacks}, Neg: ${article.negative_feedbacks}, Com: ${article.comments_count}, Likes: ${article.likes_count}`);
      });

      const allZeroed = articles.every(a => 
        a.positive_feedbacks === 0 && 
        a.negative_feedbacks === 0 && 
        a.comments_count === 0 && 
        a.likes_count === 0
      );

      if (allZeroed && (feedbacksRemaining?.length || 0) === 0 && (commentsRemaining?.length || 0) === 0) {
        console.log('\n🎉 SUCESSO TOTAL! BANCO COMPLETAMENTE ZERADO!');
        console.log('✅ 0 feedbacks');
        console.log('✅ 0 comentários');
        console.log('✅ Todos os contadores em 0');
      } else {
        console.log('\n⚠️ Ainda há dados para limpar');
      }
    }

  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
  }
}

zerarTudoAgora();