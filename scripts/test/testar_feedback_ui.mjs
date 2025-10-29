import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testarSistemaFeedback() {
  console.log('🧪 TESTANDO SISTEMA DE FEEDBACK COMPLETO\n');

  try {
    // 1. Verificar se banco está limpo
    console.log('1️⃣ Verificando se banco está limpo...');
    
    const { data: feedbacks } = await supabase
      .from('feedbacks')
      .select('id');
    
    const { data: comments } = await supabase
      .from('comments')
      .select('id');
    
    console.log(`📊 Feedbacks no banco: ${feedbacks?.length || 0}`);
    console.log(`💬 Comentários no banco: ${comments?.length || 0}`);

    // 2. Verificar contadores dos artigos
    console.log('\n2️⃣ Verificando contadores dos artigos...');
    
    const { data: articles } = await supabase
      .from('articles')
      .select('id, title, positive_feedbacks, negative_feedbacks, comments_count, likes_count')
      .eq('published', true)
      .limit(3);

    if (articles) {
      articles.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   - Pos: ${article.positive_feedbacks}, Neg: ${article.negative_feedbacks}, Com: ${article.comments_count}, Likes: ${article.likes_count}`);
      });
    }

    // 3. Testar inserção de feedback
    console.log('\n3️⃣ Testando inserção de feedback...');
    
    if (articles && articles.length > 0) {
      const testArticle = articles[0];
      
      // Inserir feedback positivo
      const { data: newFeedback, error: insertError } = await supabase
        .from('feedbacks')
        .insert({
          article_id: testArticle.id,
          type: 'positive',
          user_id: null
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao inserir feedback:', insertError);
        return;
      }

      console.log('✅ Feedback inserido com sucesso:', newFeedback);

      // 4. Verificar se feedback foi inserido
      console.log('\n4️⃣ Verificando se feedback foi inserido...');
      
      const { data: feedbacksAfter } = await supabase
        .from('feedbacks')
        .select('id, article_id, type')
        .eq('article_id', testArticle.id);

      console.log(`📊 Feedbacks para o artigo "${testArticle.title}": ${feedbacksAfter?.length || 0}`);
      
      if (feedbacksAfter && feedbacksAfter.length > 0) {
        feedbacksAfter.forEach((fb, index) => {
          console.log(`   ${index + 1}. Tipo: ${fb.type}, ID: ${fb.id}`);
        });
      }

      // 5. Limpar feedback de teste
      console.log('\n5️⃣ Limpando feedback de teste...');
      
      const { error: deleteError } = await supabase
        .from('feedbacks')
        .delete()
        .eq('id', newFeedback.id);

      if (deleteError) {
        console.error('❌ Erro ao deletar feedback de teste:', deleteError);
      } else {
        console.log('✅ Feedback de teste removido com sucesso');
      }

      // 6. Verificar limpeza
      console.log('\n6️⃣ Verificando limpeza final...');
      
      const { data: finalFeedbacks } = await supabase
        .from('feedbacks')
        .select('id');

      console.log(`📊 Feedbacks restantes: ${finalFeedbacks?.length || 0}`);