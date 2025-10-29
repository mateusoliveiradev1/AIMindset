import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 CORRIGINDO SISTEMA DE ARTIGOS EM DESTAQUE');
console.log('=' .repeat(50));

async function fixHeroSystem() {
  try {
    console.log('\n1️⃣ SINCRONIZANDO CONTADORES...');
    
    // Buscar todos os artigos
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title');
    
    if (articlesError) {
      console.error('❌ Erro ao buscar artigos:', articlesError);
      return;
    }
    
    console.log(`📊 Encontrados ${articles.length} artigos para sincronizar`);
    
    // Sincronizar contadores para cada artigo
    for (const article of articles) {
      console.log(`🔄 Sincronizando "${article.title}"...`);
      
      // Contar feedbacks reais
      const { data: feedbacks, error: feedbacksError } = await supabase
        .from('feedbacks')
        .select('type')
        .eq('article_id', article.id);
      
      if (feedbacksError) {
        console.error(`❌ Erro ao buscar feedbacks do artigo ${article.id}:`, feedbacksError);
        continue;
      }
      
      const positiveFeedbacks = feedbacks?.filter(f => f.type === 'positive').length || 0;
      const negativeFeedbacks = feedbacks?.filter(f => f.type === 'negative').length || 0;
      
      // Contar comentários reais
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('id')
        .eq('article_id', article.id);
      
      if (commentsError) {
        console.error(`❌ Erro ao buscar comentários do artigo ${article.id}:`, commentsError);
        continue;
      }
      
      const commentsCount = comments?.length || 0;
      
      // Atualizar contadores na tabela articles
      const { error: updateError } = await supabase
        .from('articles')
        .update({
          positive_feedbacks: positiveFeedbacks,
          negative_feedbacks: negativeFeedbacks,
          comments_count: commentsCount
        })
        .eq('id', article.id);
      
      if (updateError) {
        console.error(`❌ Erro ao atualizar contadores do artigo ${article.id}:`, updateError);
      } else {
        console.log(`   ✅ Sincronizado: P:${positiveFeedbacks} N:${negativeFeedbacks} C:${commentsCount}`);
      }
    }
    
    console.log('\n2️⃣ TESTANDO FUNÇÃO get_featured_articles()...');
    
    // Testar a função após sincronização
    const { data: featuredArticles, error: featuredError } = await supabase
      .rpc('get_featured_articles');
    
    if (featuredError) {
      console.error('❌ Erro ao executar get_featured_articles():', featuredError);
    } else {
      console.log(`✅ Função retornou ${featuredArticles.length} artigos:`);
      featuredArticles.forEach((article, index) => {
        const score = (article.positive_feedbacks * 2) + article.comments_count + (article.total_views * 0.1);
        console.log(`${index + 1}. "${article.title}"`);
        console.log(`   - Score calculado: ${score.toFixed(2)}`);
        console.log(`   - Feedbacks Positivos: ${article.positive_feedbacks}`);
        console.log(`   - Comentários: ${article.comments_count}`);
        console.log(`   - Views: ${article.total_views || 0}`);
        console.log(`   - Fixado Manual: ${article.is_featured_manual ? 'SIM' : 'NÃO'}`);
        console.log('');
      });
    }
    
    console.log('\n3️⃣ VERIFICANDO ARTIGOS COM MAIS ENGAJAMENTO...');
    
    // Buscar artigos ordenados por engajamento real
    const { data: topArticles, error: topError } = await supabase
      .from('articles')
      .select('id, title, positive_feedbacks, negative_feedbacks, comments_count, total_views, is_featured_manual')
      .eq('published', true)
      .order('positive_feedbacks', { ascending: false });
    
    if (topError) {
      console.error('❌ Erro ao buscar top artigos:', topError);
    } else {
      console.log('🏆 Top 5 artigos por feedbacks positivos:');
      topArticles.slice(0, 5).forEach((article, index) => {
        const score = (article.positive_feedbacks * 2) + article.comments_count + ((article.total_views || 0) * 0.1);
        console.log(`${index + 1}. "${article.title}"`);
        console.log(`   - Score: ${score.toFixed(2)}`);
        console.log(`   - Feedbacks: P:${article.positive_feedbacks} N:${article.negative_feedbacks}`);
        console.log(`   - Comentários: ${article.comments_count}`);
        console.log(`   - Views: ${article.total_views || 0}`);
        console.log(`   - Fixado: ${article.is_featured_manual ? 'SIM' : 'NÃO'}`);
        console.log('');
      });
    }
    
    console.log('\n🎯 SISTEMA CORRIGIDO!');
    console.log('✅ Contadores sincronizados');
    console.log('✅ Função get_featured_articles() testada');
    console.log('✅ Artigos com mais engajamento identificados');
    
  } catch (error) {
    console.error('❌ Erro durante correção:', error);
  }
}

// Executar correção
fixHeroSystem();