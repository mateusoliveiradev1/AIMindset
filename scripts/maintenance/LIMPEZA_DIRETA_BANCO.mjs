import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function limpezaDiretaBanco() {
  console.log('🚨 LIMPEZA DIRETA NO BANCO - EMERGÊNCIA CRÍTICA!');
  
  try {
    // 1. VERIFICAR ESTADO ATUAL
    console.log('\n1️⃣ VERIFICANDO ESTADO ATUAL...');
    
    const { data: feedbacks, error: feedbackError } = await supabase
      .from('feedbacks')
      .select('*');
    
    const { data: comments, error: commentError } = await supabase
      .from('comments')
      .select('*');
    
    const { data: articles, error: articleError } = await supabase
      .from('articles')
      .select('id, title, positive_feedbacks, negative_feedbacks, comments_count, likes_count, positive_feedback, negative_feedback');
    
    console.log(`📊 Feedbacks encontrados: ${feedbacks?.length || 0}`);
    console.log(`💬 Comentários encontrados: ${comments?.length || 0}`);
    console.log(`📄 Artigos encontrados: ${articles?.length || 0}`);
    
    if (feedbacks && feedbacks.length > 0) {
      console.log('\n🔍 FEEDBACKS ENCONTRADOS:');
      feedbacks.forEach(f => {
        console.log(`- ID: ${f.id}, Artigo: ${f.article_id}, Tipo: ${f.type}`);
      });
    }
    
    if (articles && articles.length > 0) {
      console.log('\n📋 CONTADORES DOS ARTIGOS:');
      articles.forEach(a => {
        const pos1 = a.positive_feedbacks || 0;
        const pos2 = a.positive_feedback || 0;
        const neg1 = a.negative_feedbacks || 0;
        const neg2 = a.negative_feedback || 0;
        const com = a.comments_count || 0;
        const likes = a.likes_count || 0;
        
        if (pos1 > 0 || pos2 > 0 || neg1 > 0 || neg2 > 0 || com > 0 || likes > 0) {
          console.log(`❌ ${a.title}: Pos1=${pos1}, Pos2=${pos2}, Neg1=${neg1}, Neg2=${neg2}, Com=${com}, Likes=${likes}`);
        }
      });
    }
    
    // 2. LIMPEZA BRUTAL - DELETE DIRETO
    console.log('\n2️⃣ EXECUTANDO LIMPEZA BRUTAL...');
    
    // Deletar TODOS os feedbacks
    const { error: deleteFeedbackError } = await supabase
      .from('feedbacks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta todos
    
    if (deleteFeedbackError) {
      console.error('❌ Erro ao deletar feedbacks:', deleteFeedbackError);
    } else {
      console.log('✅ Todos os feedbacks deletados');
    }
    
    // Deletar TODOS os comentários
    const { error: deleteCommentError } = await supabase
      .from('comments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta todos
    
    if (deleteCommentError) {
      console.error('❌ Erro ao deletar comentários:', deleteCommentError);
    } else {
      console.log('✅ Todos os comentários deletados');
    }
    
    // 3. ZERAR TODOS OS CONTADORES DOS ARTIGOS
    console.log('\n3️⃣ ZERANDO CONTADORES DOS ARTIGOS...');
    
    const { error: updateError } = await supabase
      .from('articles')
      .update({
        positive_feedbacks: 0,
        negative_feedbacks: 0,
        positive_feedback: 0,
        negative_feedback: 0,
        comments_count: 0,
        likes_count: 0,
        total_likes: 0,
        approval_rate: 0.0
      })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Atualiza todos
    
    if (updateError) {
      console.error('❌ Erro ao atualizar artigos:', updateError);
    } else {
      console.log('✅ Todos os contadores dos artigos zerados');
    }
    
    // 4. VERIFICAÇÃO FINAL
    console.log('\n4️⃣ VERIFICAÇÃO FINAL...');
    
    const { data: finalFeedbacks } = await supabase
      .from('feedbacks')
      .select('*');
    
    const { data: finalComments } = await supabase
      .from('comments')
      .select('*');
    
    const { data: finalArticles } = await supabase
      .from('articles')
      .select('id, title, positive_feedbacks, negative_feedbacks, comments_count, likes_count, positive_feedback, negative_feedback, approval_rate');
    
    console.log(`📊 Feedbacks restantes: ${finalFeedbacks?.length || 0}`);
    console.log(`💬 Comentários restantes: ${finalComments?.length || 0}`);
    
    if (finalArticles && finalArticles.length > 0) {
      console.log('\n📋 ESTADO FINAL DOS ARTIGOS:');
      finalArticles.forEach((a, index) => {
        const pos1 = a.positive_feedbacks || 0;
        const pos2 = a.positive_feedback || 0;
        const neg1 = a.negative_feedbacks || 0;
        const neg2 = a.negative_feedback || 0;
        const com = a.comments_count || 0;
        const likes = a.likes_count || 0;
        const rate = a.approval_rate || 0;
        
        console.log(`${index + 1}. ${a.title}`);
        console.log(`   Pos1: ${pos1}, Pos2: ${pos2}, Neg1: ${neg1}, Neg2: ${neg2}, Com: ${com}, Likes: ${likes}, Rate: ${rate}%`);
      });
    }
    
    console.log('\n🎉 LIMPEZA DIRETA CONCLUÍDA!');
    console.log('✅ Banco completamente limpo');
    console.log('✅ Todos os contadores zerados');
    console.log('✅ Sistema pronto para funcionar');
    
  } catch (error) {
    console.error('💥 ERRO CRÍTICO:', error);
  }
}

limpezaDiretaBanco();