import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabase = createClient(
  'https://jywjqzhqynhnhetidzsa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0'
);

console.log('🧪 Testando feedback em tempo real...');

// Buscar um artigo
const { data: articles, error: articlesError } = await supabase
  .from('articles')
  .select('id, title')
  .limit(1);

if (articlesError) {
  console.error('❌ Erro ao buscar artigos:', articlesError);
  process.exit(1);
}

if (!articles || articles.length === 0) {
  console.log('❌ Nenhum artigo encontrado');
  process.exit(1);
}

const article = articles[0];
console.log('📝 Artigo:', article.title);

// Inserir feedback com UUID válido
const { data: feedback, error } = await supabase
  .from('feedbacks')
  .insert([{
    article_id: article.id,
    type: 'like',
    user_id: randomUUID()
  }])
  .select();

if (error) {
  console.error('❌ Erro ao inserir feedback:', error);
} else {
  console.log('✅ Feedback inserido:', feedback[0].id);
  console.log('🔄 Verifique o painel admin para ver a atualização!');
}