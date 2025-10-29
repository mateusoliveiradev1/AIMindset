import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 CREDENCIAIS:');
console.log('URL:', supabaseUrl);
console.log('KEY:', supabaseServiceKey ? 'EXISTE' : 'NÃO EXISTE');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function limpezaBrutalManual() {
  console.log('🚨 LIMPEZA BRUTAL MANUAL - SALVANDO O PROJETO!\n');

  try {
    // 1. TESTAR CONEXÃO
    console.log('1️⃣ TESTANDO CONEXÃO...');
    const { data: testConnection, error: connectionError } = await supabase
      .from('articles')
      .select('id')
      .limit(1);

    if (connectionError) {
      console.error('❌ ERRO DE CONEXÃO:', connectionError);
      return;
    }
    console.log('✅ CONEXÃO OK');

    // 2. VERIFICAR TABELAS EXISTENTES
    console.log('\n2️⃣ VERIFICANDO TABELAS...');
    
    // Verificar tabela feedbacks
    const { data: feedbacksTest, error: feedbacksError } = await supabase
      .from('feedbacks')
      .select('id')
      .limit(1);
    
    if (feedbacksError) {
      console.error('❌ Tabela feedbacks:', feedbacksError.message);
    } else {
      console.log('✅ Tabela feedbacks OK');
    }

    // Verificar tabela comments
    const { data: commentsTest, error: commentsError } = await supabase
      .from('comments')
      .select('id')
      .limit(1);
    
    if (commentsError) {
      console.error('❌ Tabela comments:', commentsError.message);
    } else {
      console.log('✅ Tabela comments OK');
    }

    // 3. LIMPEZA BRUTAL - MÚLTIPLAS TENTATIVAS
    console.log('\n3️⃣ LIMPEZA BRUTAL - TENTATIVA 1...');
    
    // Deletar feedbacks - Tentativa 1
    const { error: deleteFeedbacks1 } = await supabase
      .from('feedbacks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteFeedbacks1) {
      console.error('❌ Erro delete feedbacks 1:', deleteFeedbacks1);
    } else {
      console.log('✅ Feedbacks deletados - Tentativa 1');
    }

    // Deletar comentários - Tentativa 1
    const { error: deleteComments1 } = await supabase
      .from('comments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteComments1) {
      console.error('❌ Erro delete comments 1:', deleteComments1);
    } else {
      console.log('✅ Comentários deletados - Tentativa 1');
    }

    // 4. LIMPEZA BRUTAL - TENTATIVA 2 (DIFERENTE)
    console.log('\n4️⃣ LIMPEZA BRUTAL - TENTATIVA 2...');
    
    // Usar abordagem diferente - deletar por lotes
    const { data: allFeedbacks } = await supabase
      .from('feedbacks')
      .select('id');

    if (allFeedbacks && allFeedbacks.length > 0) {
      console.log(`Encontrados ${allFeedbacks.length} feedbacks para deletar`);
      
      for (const feedback of allFeedbacks) {
        const { error } = await supabase
          .from('feedbacks')
          .delete()
          .eq('id', feedback.id);
        
        if (error) {
          console.error(`❌ Erro ao deletar feedback ${feedback.id}:`, error);
        }
      }
    }

    const { data: allComments } = await supabase
      .from('comments')
      .select('id');

    if (allComments && allComments.length > 0) {
      console.log(`Encontrados ${allComments.length} comentários para deletar`);
      
      for (const comment of allComments) {
        const { error } = await supabase
          .from('comments')
          .delete()
          .eq('id', comment.id);
        
        if (error) {
          console.error(`❌ Erro ao deletar comment ${comment.id}:`, error);
        }
      }
    }

    // 5. ZERAR CONTADORES - MÚLTIPLAS TENTATIVAS
    console.log('\n5️⃣ ZERANDO CONTADORES...');
    
    // Buscar todos os artigos primeiro
    const { data: allArticles } = await supabase
      .from('articles')
      .select('id, title');

    if (allArticles) {
      console.log(`Encontrados ${allArticles.length} artigos para zerar`);
      
      for (const article of allArticles) {
        const { error } = await supabase
          .from('articles')
          .update({
            positive_feedbacks: 0,
            negative_feedbacks: 0,
            comments_count: 0,
            likes_count: 0
          })
          .eq('id', article.id);
        
        if (error) {
          console.error(`❌ Erro ao zerar ${article.title}:`, error);
        } else {
          console.log(`✅ Zerado: ${article.title}`);
        }
      }
    }

    // 6. VERIFICAÇÃO FINAL
    console.log('\n6️⃣ VERIFICAÇÃO FINAL...');
    
    const { data: finalFeedbacks } = await supabase
      .from('feedbacks')
      .select('id');
    
    const { data: finalComments } = await supabase
      .from('comments')
      .select('id');
    
    const { data: finalArticles } = await supabase
      .from('articles')
      .select('title, positive_feedbacks, negative_feedbacks, comments_count, likes_count')
      .eq('published', true);

    console.log(`📊 Feedbacks restantes: ${finalFeedbacks?.length || 0}`);
    console.log(`💬 Comentários restantes: ${finalComments?.length || 0}`);

    if (finalArticles) {
      console.log('\n📋 ESTADO FINAL DOS ARTIGOS:');
      let allZeroed = true;
      
      finalArticles.forEach((article, index) => {
        const pos = article.positive_feedbacks || 0;
        const neg = article.negative_feedbacks || 0;
        const com = article.comments_count || 0;
        const likes = article.likes_count || 0;
        
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   Pos: ${pos}, Neg: ${neg}, Com: ${com}, Likes: ${likes}`);
        
        if (pos > 0 || neg > 0 || com > 0 || likes > 0) {
          allZeroed = false;
          console.log('   ⚠️ AINDA TEM DADOS!');
        }
      });

      if (allZeroed && (finalFeedbacks?.length || 0) === 0 && (finalComments?.length || 0) === 0) {
        console.log('\n🎉 PROJETO SALVO! LIMPEZA BRUTAL CONCLUÍDA!');
        console.log('✅ Todos os feedbacks removidos');
        console.log('✅ Todos os comentários removidos');
        console.log('✅ Todos os contadores zerados');
        console.log('✅ Sistema pronto para funcionar');
      } else {
        console.log('\n⚠️ AINDA HÁ PROBLEMAS - PRECISA INVESTIGAR MAIS');
      }
    }

  } catch (error) {
    console.error('❌ ERRO CRÍTICO NA LIMPEZA BRUTAL:', error);
  }
}

limpezaBrutalManual();