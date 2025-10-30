import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseUrl = 'https://ixqhqvdqjjqhqvdqjjqh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWhxdmRxampxaHF2ZHFqanFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MzE4NzQsImV4cCI6MjA1MTUwNzg3NH0.Ey6Ej6Ej6Ej6Ej6Ej6Ej6Ej6Ej6Ej6Ej6Ej6Ej6E';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRealFeedback() {
  try {
    console.log('🔍 Buscando artigos...');
    
    // Buscar um artigo real
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title')
      .eq('status', 'published')
      .limit(1);
    
    if (articlesError) {
      console.error('❌ Erro ao buscar artigos:', articlesError);
      return;
    }
    
    if (!articles || articles.length === 0) {
      console.log('❌ Nenhum artigo encontrado');
      return;
    }
    
    const article = articles[0];
    console.log('✅ Artigo encontrado:', article.title);
    
    // Inserir feedback real
    const feedbackData = {
      article_id: article.id,
      user_id: randomUUID(),
      type: 'positive',
      content: `Feedback real de teste - ${new Date().toLocaleString('pt-BR')}`,
      created_at: new Date().toISOString()
    };
    
    console.log('📝 Inserindo feedback real...');
    
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedbacks')
      .insert(feedbackData)
      .select()
      .single();
    
    if (feedbackError) {
      console.error('❌ Erro ao inserir feedback:', feedbackError);
      return;
    }
    
    console.log('✅ Feedback inserido com sucesso!');
    console.log('📊 ID do feedback:', feedback.id);
    console.log('📄 Artigo:', article.title);
    console.log('💬 Conteúdo:', feedback.content);
    console.log('');
    console.log('🔄 Agora verifique se o painel admin atualizou automaticamente:');
    console.log('   - Dashboard principal');
    console.log('   - Aba Feedback');
    console.