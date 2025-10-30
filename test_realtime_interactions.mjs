import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 Testando hook useRealTimeInteractions...\n');

async function testRealTimeInteractions() {
  try {
    // 1. Buscar artigos publicados
    console.log('📚 Buscando artigos publicados...');
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title')
      .eq('published', true)
      .limit(5);

    if (articlesError) {
      console.error('❌ Erro ao buscar artigos:', articlesError);
      return;
    }

    if (!articles || articles.length === 0) {
      console.log('⚠️ Nenhum artigo publicado encontrado');
      return;
    }

    console.log(`✅ Encontrados ${articles.length} artigos publicados`);
    
    const articleIds = articles.map(a => a.id);
    console.log('📋 IDs dos artigos:', articleIds);

    // 2. Testar busca de interações (feedbacks)
    console.log('\n📊 Testando busca de feedbacks...');
    const { data: feedbacks, error: feedbackError } = await supabase
      .from('feedbacks')
      .select('article_id, type, created_at')
      .in('article_id', articleIds)
      .order('created_at', { ascending: false })
      .limit(10);

    if (feedbackError) {
      console.error('❌ Erro ao buscar feedbacks:', feedbackError);
    } else {
      console.log(`✅ Encontrados ${feedbacks?.length || 0} feedbacks`);
      if (feedbacks && feedbacks.length > 0) {
        console.log('📝 Últimos feedbacks:');
        feedbacks.forEach((feedback, index) => {
          console.log(`  ${index + 1}. Artigo ${feedback.article_id}: ${feedback.type} (${new Date(feedback.created_at).toLocaleString()})`);
        });
      }
    }

    // 3. Testar busca de comentários
    console.log('\n💬 Testando busca de comentários...');
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('article_id, user_name, likes, created_at')
      .in('article_id', articleIds)
      .order('created_at', { ascending: false })
      .limit(10);

    if (commentsError) {
      console.error('❌ Erro ao buscar comentários:', commentsError);
    } else {
      console.log(`✅ Encontrados ${comments?.length || 0} comentários`);
      if (comments && comments.length > 0) {
        console.log('📝 Últimos comentários:');
        comments.forEach((comment, index) => {
          console.log(`  ${index + 1}. Artigo ${comment.article_id}: ${comment.user_name} (${comment.likes} likes) - ${new Date(comment.created_at).toLocaleString()}`);
        });
      }
    }

    // 4. Simular cálculo de totalInteractions
    console.log('\n🔢 Calculando total de interações...');
    const totalFeedbacks = feedbacks?.length || 0;
    const totalComments = comments?.length || 0;
    const totalInteractions = totalFeedbacks + totalComments;
    
    console.log(`📊 Total de interações: ${totalInteractions}`);
    console.log(`  - Feedbacks: ${totalFeedbacks}`);
    console.log(`  - Comentários: ${totalComments}`);

    // 5. Testar subscription (simulação)
    console.log('\n📡 Testando configuração de subscription...');
    
    try {
      const channel = supabase
        .channel('test_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'feedbacks',
            filter: `article_id=in.(${articleIds.join(',')})`
          },
          (payload) => {
            console.log('📨 Evento de feedback recebido:', payload);
          }
        );

      const subscriptionResult = await new Promise((resolve) => {
        channel.subscribe((status) => {
          console.log(`📡 Status da subscription: ${status}`);
          resolve(status);
        });
        
        // Timeout após 5 segundos
        setTimeout(() => {
          resolve('TIMEOUT');
        }, 5000);
      });

      if (subscriptionResult === 'SUBSCRIBED') {
        console.log('✅ Subscription configurada com sucesso');
      } else {
        console.log(`⚠️ Subscription não conectou: ${subscriptionResult}`);
      }

      // Limpar subscription
      supabase.removeChannel(channel);

    } catch (subError) {
      console.error('❌ Erro ao testar subscription:', subError);
    }

    // 6. Resumo final
    console.log('\n📋 RESUMO DO TESTE:');
    console.log(`✅ Artigos encontrados: ${articles.length}`);
    console.log(`✅ Feedbacks encontrados: ${totalFeedbacks}`);
    console.log(`✅ Comentários encontrados: ${totalComments}`);
    console.log(`✅ Total de interações: ${totalInteractions}`);
    
    if (totalInteractions === 0) {
      console.log('\n⚠️ PROBLEMA IDENTIFICADO: Nenhuma interação encontrada!');
      console.log('   Isso explica por que o componente mostra "0" interações.');
      console.log('   Possíveis causas:');
      console.log('   - Não há feedbacks ou comentários no banco de dados');
      console.log('   - Os artigos não têm interações');
      console.log('   - Problema na consulta ou filtros');
    } else {
      console.log('\n✅ Interações encontradas! O problema pode estar na integração do hook.');
    }

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar teste
testRealTimeInteractions().then(() => {
  console.log('\n🏁 Teste concluído');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});