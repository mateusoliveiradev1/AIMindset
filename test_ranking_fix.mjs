import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 Testando função get_featured_articles() após correção...\n');

try {
  // Testar a função get_featured_articles
  const { data: featuredArticles, error } = await supabase.rpc('get_featured_articles');
  
  if (error) {
    console.error('❌ Erro ao chamar get_featured_articles:', error);
    process.exit(1);
  }

  console.log('✅ Função get_featured_articles() executada com sucesso!');
  console.log(`📊 Retornou ${featuredArticles.length} artigos:\n`);

  featuredArticles.forEach((article, index) => {
    console.log(`${index + 1}. ${article.title}`);
    console.log(`   Score: ${article.rank_score}`);
    console.log(`   Feedbacks: P:${article.positive_feedbacks} N:${article.negative_feedbacks}`);
    console.log(`   Comentários: ${article.comments_count}`);
    console.log(`   Likes: ${article.likes_count}`);
    console.log(`   Is Featured: ${article.is_featured}`);
    console.log(`   Data: ${article.created_at}`);
    console.log('');
  });

  // Verificar se está ordenado corretamente
  let isCorrectlyOrdered = true;
  for (let i = 0; i < featuredArticles.length - 1; i++) {
    const current = featuredArticles[i];
    const next = featuredArticles[i + 1];
    
    if (current.rank_score < next.rank_score) {
      isCorrectlyOrdered = false;
      console.log(`❌ Ordenação incorreta: ${current.title} (score: ${current.rank_score}) vem antes de ${next.title} (score: ${next.rank_score})`);
    }
  }

  if (isCorrectlyOrdered) {
    console.log('✅ Artigos estão corretamente ordenados por score!');
  } else {
    console.log('❌ Artigos NÃO estão corretamente ordenados por score!');
  }

  // Verificar se artigos com score 0 não estão em primeiro
  if (featuredArticles.length > 0 && featuredArticles[0].rank_score === 0) {
    console.log('❌ PROBLEMA: Artigo com score 0 está em primeiro lugar!');
  } else {
    console.log('✅ Artigo em primeiro lugar tem score > 0 ou não há artigos com score 0');
  }

} catch (error) {
  console.error('❌ Erro durante o teste:', error);
  process.exit(1);
}