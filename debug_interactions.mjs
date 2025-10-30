import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugInteractions() {
  console.log('🔍 Verificando dados no banco...\n');

  // 1. Verificar artigos publicados
  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('id, title, published')
    .eq('published', true);

  if (articlesError) {
    console.error('❌ Erro ao buscar artigos:', articlesError);
    return;
  }

  console.log(`📚 Artigos publicados encontrados: ${articles?.length || 0}`);
  if (articles && articles.length > 0) {
    console.log('Artigos:', articles.map(a => `${a.id} - ${a.title}`));
    
    const articleIds = articles.map(a => a.id);
    
    // 2. Verificar feedbacks
    const { data: feedbacks, error: feedbacksError } = await supabase
      .from('feedbacks')
      .select('*')
      .in('article_id', articleIds);

    console.log(`\n👍 Feedbacks encontrados: ${feedbacks?.length || 0}`);
    if (feedbacks && feedbacks.length > 0) {
      console.log('Feedbacks por tipo:');
      const positive = feedbacks.filter(f => f.type === 'positive').length;
      const negative = feedbacks.filter(f => f.type === 'negative').length;
      console.log(`  - Positivos: ${positive}`);
      console.log(`  - Negativos: ${negative}`);
    }

    // 3. Verificar comentários
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .in('article_id', articleIds);

    console.log(`\n💬 Comentários encontrados: ${comments?.length || 0}`);
    if (comments && comments.length > 0) {
      const totalLikes = comments.reduce((sum, c) => sum + (c.likes || 0), 0);
      console.log(`  - Total de likes: ${totalLikes}`);
    }

    // 4. Calcular total de interações
    const totalInteractions = (feedbacks?.length || 0) + (comments?.length || 0);
    console.log(`\n🔢 Total de interações: ${totalInteractions}`);

  } else {
    console.log('⚠️ Nenhum artigo publicado encontrado');
  }
}

debugInteractions().catch(console.error);