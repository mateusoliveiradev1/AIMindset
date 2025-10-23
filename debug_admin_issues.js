import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAdminIssues() {
  console.log('🔍 INICIANDO DEBUG DOS PROBLEMAS DO ADMIN...\n');

  try {
    // 1. Testar acesso às tabelas problemáticas
    console.log('1️⃣ TESTANDO ACESSO ÀS TABELAS PROBLEMÁTICAS:');
    
    // Newsletter logs
    console.log('\n📧 Testando newsletter_logs...');
    try {
      const { data: newsletterLogs, error: nlError } = await supabase
        .from('newsletter_logs')
        .select('*')
        .limit(1);
      
      if (nlError) {
        console.error('❌ Erro newsletter_logs:', nlError);
      } else {
        console.log('✅ newsletter_logs OK:', newsletterLogs?.length || 0, 'registros');
      }
    } catch (err) {
      console.error('❌ Exceção newsletter_logs:', err);
    }

    // Newsletter subscribers
    console.log('\n👥 Testando newsletter_subscribers...');
    try {
      const { data: subscribers, error: nsError } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .limit(1);
      
      if (nsError) {
        console.error('❌ Erro newsletter_subscribers:', nsError);
      } else {
        console.log('✅ newsletter_subscribers OK:', subscribers?.length || 0, 'registros');
      }
    } catch (err) {
      console.error('❌ Exceção newsletter_subscribers:', err);
    }

    // Contacts
    console.log('\n📞 Testando contacts...');
    try {
      const { data: contacts, error: cError } = await supabase
        .from('contacts')
        .select('*')
        .limit(1);
      
      if (cError) {
        console.error('❌ Erro contacts:', cError);
      } else {
        console.log('✅ contacts OK:', contacts?.length || 0, 'registros');
      }
    } catch (err) {
      console.error('❌ Exceção contacts:', err);
    }

    // 2. Testar dados de feedback
    console.log('\n\n2️⃣ TESTANDO DADOS DE FEEDBACK:');
    
    console.log('\n👍 Testando tabela feedback...');
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('feedback')
      .select('*');
    
    if (feedbackError) {
      console.error('❌ Erro feedback:', feedbackError);
    } else {
      console.log('✅ feedback OK:', feedbackData?.length || 0, 'registros');
      console.log('📊 Dados feedback:', feedbackData);
    }

    console.log('\n💬 Testando tabela comments...');
    const { data: commentsData, error: commentsError } = await supabase
      .from('comments')
      .select('*');
    
    if (commentsError) {
      console.error('❌ Erro comments:', commentsError);
    } else {
      console.log('✅ comments OK:', commentsData?.length || 0, 'registros');
      console.log('📊 Dados comments:', commentsData);
    }

    // 3. Testar função get_article_metrics
    console.log('\n\n3️⃣ TESTANDO FUNÇÃO get_article_metrics:');
    
    // Primeiro, pegar alguns IDs de artigos
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title')
      .limit(3);
    
    if (articlesError) {
      console.error('❌ Erro ao buscar artigos:', articlesError);
    } else {
      console.log('✅ Artigos encontrados:', articles?.length || 0);
      
      // Testar a função para cada artigo
      for (const article of articles || []) {
        console.log(`\n🔍 Testando métricas para: ${article.title} (${article.id})`);
        
        try {
          const { data: metrics, error: metricsError } = await supabase
            .rpc('get_article_metrics', { target_article_id: article.id });
          
          if (metricsError) {
            console.error('❌ Erro get_article_metrics:', metricsError);
          } else {
            console.log('✅ Métricas:', metrics);
          }
        } catch (err) {
          console.error('❌ Exceção get_article_metrics:', err);
        }
      }
    }

    // 4. Testar queries diretas de feedback
    console.log('\n\n4️⃣ TESTANDO QUERIES DIRETAS DE FEEDBACK:');
    
    if (articles && articles.length > 0) {
      const testArticleId = articles[0].id;
      console.log(`\n🎯 Testando feedback direto para artigo: ${testArticleId}`);
      
      // Feedback positivo
      const { data: positiveFeedback, error: posError } = await supabase
        .from('feedback')
        .select('*')
        .eq('article_id', testArticleId)
        .eq('useful', true);
      
      if (posError) {
        console.error('❌ Erro feedback positivo:', posError);
      } else {
        console.log('👍 Feedback positivo:', positiveFeedback?.length || 0);
      }
      
      // Feedback negativo
      const { data: negativeFeedback, error: negError } = await supabase
        .from('feedback')
        .select('*')
        .eq('article_id', testArticleId)
        .eq('useful', false);
      
      if (negError) {
        console.error('❌ Erro feedback negativo:', negError);
      } else {
        console.log('👎 Feedback negativo:', negativeFeedback?.length || 0);
      }
      
      // Comentários
      const { data: articleComments, error: commError } = await supabase
        .from('comments')
        .select('*')
        .eq('article_id', testArticleId);
      
      if (commError) {
        console.error('❌ Erro comentários:', commError);
      } else {
        console.log('💬 Comentários:', articleComments?.length || 0);
      }
    }

  } catch (error) {
    console.error('❌ ERRO GERAL:', error);
  }
}

// Executar debug
debugAdminIssues();