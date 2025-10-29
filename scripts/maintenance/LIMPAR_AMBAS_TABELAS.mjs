import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

console.log('🧹 LIMPEZA BRUTAL - AMBAS AS TABELAS DE FEEDBACK!');
console.log('================================================');

try {
  // 1. VERIFICAR ESTADO INICIAL
  console.log('\n1️⃣ ESTADO INICIAL...');
  
  const { data: feedbackSingular } = await supabase.from('feedback').select('*');
  const { data: feedbackPlural } = await supabase.from('feedbacks').select('*');
  const { data: comments } = await supabase.from('comments').select('*');
  
  console.log(`📊 Feedback (singular): ${feedbackSingular?.length || 0} registros`);
  console.log(`📊 Feedbacks (plural): ${feedbackPlural?.length || 0} registros`);
  console.log(`💬 Comments: ${comments?.length || 0} registros`);

  // 2. LIMPAR TABELA FEEDBACK (SINGULAR)
  console.log('\n2️⃣ LIMPANDO TABELA FEEDBACK (singular)...');
  const { error: deleteFeedbackError } = await supabase
    .from('feedback')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
  if (deleteFeedbackError) {
    console.log('❌ Erro ao limpar feedback:', deleteFeedbackError.message);
  } else {
    console.log('✅ Tabela FEEDBACK (singular) limpa!');
  }

  // 3. LIMPAR TABELA FEEDBACKS (PLURAL)
  console.log('\n3️⃣ LIMPANDO TABELA FEEDBACKS (plural)...');
  const { error: deleteFeedbacksError } = await supabase
    .from('feedbacks')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
  if (deleteFeedbacksError) {
    console.log('❌ Erro ao limpar feedbacks:', deleteFeedbacksError.message);
  } else {
    console.log('✅ Tabela FEEDBACKS (plural) limpa!');
  }

  // 4. LIMPAR TABELA COMMENTS
  console.log('\n4️⃣ LIMPANDO TABELA COMMENTS...');
  const { error: deleteCommentsError } = await supabase
    .from('comments')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
  if (deleteCommentsError) {
    console.log('❌ Erro ao limpar comments:', deleteCommentsError.message);
  } else {
    console.log('✅ Tabela COMMENTS limpa!');
  }

  // 5. ZERAR CONTADORES DOS ARTIGOS
  console.log('\n5️⃣ ZERANDO CONTADORES DOS ARTIGOS...');
  const { error: updateArticlesError } = await supabase
    .from('articles')
    .update({
      positive_feedbacks: 0,
      negative_feedbacks: 0,
      comments_count: 0,
      likes_count: 0,
      total_likes: 0,
      approval_rate: 0
    })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all
    
  if (updateArticlesError) {
    console.log('❌ Erro ao zerar contadores:', updateArticlesError.message);
  } else {
    console.log('✅ Contadores dos artigos zerados!');
  }

  // 6. VERIFICAÇÃO FINAL
  console.log('\n6️⃣ VERIFICAÇÃO FINAL...');
  
  const { data: finalFeedback } = await supabase.from('feedback').select('*');
  const { data: finalFeedbacks } = await supabase.from('feedbacks').select('*');
  const { data: finalComments } = await supabase.from('comments').select('*');
  const { data: finalArticles } = await supabase
    .from('articles')
    .select('id, title, positive_feedbacks, negative_feedbacks, comments_count, likes_count');
  
  console.log(`📊 Feedback (singular): ${finalFeedback?.length || 0} registros`);
  console.log(`📊 Feedbacks (plural): ${finalFeedbacks?.length || 0} registros`);
  console.log(`💬 Comments: ${finalComments?.length || 0} registros`);
  
  console.log('\n📋 CONTADORES DOS ARTIGOS:');
  finalArticles?.forEach((article, i) => {
    const pos = article.positive_feedbacks || 0;
    const neg = article.negative_feedbacks || 0;
    const com = article.comments_count || 0;
    const likes = article.likes_count || 0;
    console.log(`${i+1}. ${article.title.substring(0, 50)}...`);
    console.log(`   Pos: ${pos}, Neg: ${neg}, Com: ${com}, Likes: ${likes}`);
  });

  console.log('\n🎉 LIMPEZA BRUTAL CONCLUÍDA!');
  console.log('✅ Ambas as tabelas de feedback limpas');
  console.log('✅ Tabela de comentários limpa');
  console.log('✅ Contadores dos artigos zerados');
  console.log('\n🔄 AGORA RECARREGUE O PAINEL ADMIN!');

} catch (error) {
  console.error('❌ ERRO GERAL:', error.message);
  process.exit(1);
}