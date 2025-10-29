import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function forcarAtualizacaoUI() {
  console.log('🔄 FORÇANDO ATUALIZAÇÃO COMPLETA DA UI\n');

  try {
    // 1. Verificar estado atual do banco
    console.log('1️⃣ Verificando estado atual do banco...');
    
    const { data: feedbacks } = await supabase
      .from('feedbacks')
      .select('id');
    
    const { data: comments } = await supabase
      .from('comments')
      .select('id');
    
    const { data: articles } = await supabase
      .from('articles')
      .select('id, title, positive_feedbacks, negative_feedbacks, comments_count, likes_count')
      .eq('published', true);

    console.log(`📊 Feedbacks no banco: ${feedbacks?.length || 0}`);
    console.log(`💬 Comentários no banco: ${comments?.length || 0}`);
    console.log(`📄 Artigos publicados: ${articles?.length || 0}`);

    // 2. Verificar se há inconsistências
    let hasInconsistencies = false;
    
    if (articles) {
      console.log('\n2️⃣ Verificando inconsistências...');
      
      articles.forEach((article, index) => {
        const pos = article.positive_feedbacks || 0;
        const neg = article.negative_feedbacks || 0;
        const com = article.comments_count || 0;
        const likes = article.likes_count || 0;
        
        if (pos > 0 || neg > 0 || com > 0 || likes > 0) {
          hasInconsistencies = true;
          console.log(`❌ ${article.title}: Pos:${pos}, Neg:${neg}, Com:${com}, Likes:${likes}`);
        }
      });
      
      if (!hasInconsistencies) {
        console.log('✅ Todos os contadores estão zerados');
      }
    }

    // 3. Se há inconsistências, forçar correção
    if (hasInconsistencies || (feedbacks?.length || 0) > 0 || (comments?.length || 0) > 0) {
      console.log('\n3️⃣ FORÇANDO CORREÇÃO FINAL...');
      
      // Deletar qualquer feedback restante
      if (feedbacks && feedbacks.length > 0) {
        console.log('🗑️ Deletando feedbacks restantes...');
        const { error: deleteFeedbacksError } = await supabase
          .from('feedbacks')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (deleteFeedbacksError) {
          console.error('❌ Erro ao deletar feedbacks:', deleteFeedbacksError);
        } else {
          console.log('✅ Feedbacks deletados');
        }
      }
      
      // Deletar qualquer comentário restante
      if (comments && comments.length > 0) {
        console.log('🗑️ Deletando comentários restantes...');
        const { error: deleteCommentsError } = await supabase
          .from('comments')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (deleteCommentsError) {
          console.error('❌ Erro ao deletar comentários:', deleteCommentsError);
        } else {
          console.log('✅ Comentários deletados');
        }
      }
      
      // Forçar zero em todos os contadores
      if (articles) {
        console.log('🔄 Forçando zero em todos os contadores...');
        
        for (const article of articles) {
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
          }
        }
        
        console.log('✅ Todos os contadores forçados para zero');
      }
    }

    // 4. Verificação final
    console.log('\n4️⃣ VERIFICAÇÃO FINAL...');
    
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

    console.log(`📊 Feedbacks finais: ${finalFeedbacks?.length || 0}`);
    console.log(`💬 Comentários finais: ${finalComments?.length || 0}`);

    let allClean = true;
    
    if (finalArticles) {
      finalArticles.forEach((article) => {
        const pos = article.positive_feedbacks || 0;
        const neg = article.negative_feedbacks || 0;
        const com = article.comments_count || 0;
        const likes = article.likes_count || 0;
        
        if (pos > 0 || neg > 0 || com > 0 || likes > 0) {
          allClean = false;
          console.log(`❌ ${article.title}: AINDA TEM DADOS!`);
        }
      });
    }

    if (allClean && (finalFeedbacks?.length || 0) === 0 && (finalComments?.length || 0) === 0) {
      console.log('\n🎉 UI DEVE ESTAR ATUALIZADA AGORA!');
      console.log('✅ Banco completamente limpo');
      console.log('✅ Todos os contadores zerados');
      console.log('✅ Sistema sincronizado');
      console.log('\n💡 INSTRUÇÕES PARA O USUÁRIO:');
      console.log('1. Recarregue a página do admin (F5 ou Ctrl+R)');
      console.log('2. Limpe o cache do navegador (Ctrl+Shift+R)');
      console.log('3. Se ainda houver problemas, feche e abra o navegador');
    } else {
      console.log('\n❌ AINDA HÁ PROBLEMAS NO BANCO!');
      console.log('⚠️ A UI pode não refletir os dados corretos');
    }

  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
  }
}

forcarAtualizacaoUI();