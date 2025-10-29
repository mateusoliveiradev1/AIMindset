import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTriggers() {
  console.log('🔍 DEBUG DOS TRIGGERS E FEEDBACKS');
  console.log('=' .repeat(50));

  try {
    // 1. VERIFICAR FEEDBACKS EXISTENTES
    console.log('\n📊 1. VERIFICANDO FEEDBACKS EXISTENTES:');
    
    const { data: feedbacks, error: feedbacksError } = await supabase
      .from('feedbacks')
      .select('id, article_id, feedback_type, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (feedbacksError) {
      console.error('❌ ERRO ao buscar feedbacks:', feedbacksError);
      return;
    }
    
    console.log(`✅ ${feedbacks.length} feedbacks encontrados:`);
    feedbacks.forEach((feedback, index) => {
      console.log(`   ${index + 1}. Tipo: ${feedback.feedback_type}, Artigo: ${feedback.article_id.substring(0, 8)}..., User: ${feedback.user_id}`);
    });

    // 2. CONTAR FEEDBACKS POR ARTIGO
    console.log('\n📈 2. CONTANDO FEEDBACKS POR ARTIGO:');
    
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title, positive_feedbacks, negative_feedbacks')
      .eq('published', true)
      .limit(5);
    
    if (articlesError) {
      console.error('❌ ERRO ao buscar artigos:', articlesError);
      return;
    }
    
    for (const article of articles) {
      // Contar feedbacks reais na tabela feedbacks
      const { count: realPositive } = await supabase
        .from('feedbacks')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', article.id)
        .eq('feedback_type', 'positive');
      
      const { count: realNegative } = await supabase
        .from('feedbacks')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', article.id)
        .eq('feedback_type', 'negative');
      
      console.log(`\n   ${article.title.substring(0, 50)}...`);
      console.log(`      Contador na tabela articles: ${article.positive_feedbacks} pos, ${article.negative_feedbacks} neg`);
      console.log(`      Contagem real na tabela feedbacks: ${realPositive || 0} pos, ${realNegative || 0} neg`);
      
      if ((realPositive || 0) !== article.positive_feedbacks || (realNegative || 0) !== article.negative_feedbacks) {
        console.log(`      ❌ DESSINCRONIA DETECTADA!`);
      } else {
        console.log(`      ✅ Sincronizado`);
      }
    }

    // 3. CRIAR UM FEEDBACK DE TESTE E VERIFICAR SE TRIGGER FUNCIONA
    console.log('\n🧪 3. TESTE DE TRIGGER EM TEMPO REAL:');
    
    const testArticle = articles[0];
    console.log(`\n   Testando com artigo: ${testArticle.title.substring(0, 50)}...`);
    console.log(`   Contador atual: ${testArticle.positive_feedbacks} feedbacks positivos`);
    
    // Criar um feedback de teste
    const { data: newFeedback, error: createError } = await supabase
      .from('feedbacks')
      .insert({
        article_id: testArticle.id,
        feedback_type: 'positive',
        user_id: `trigger-test-${Date.now()}`,
        created_at: new Date().toISOString()
      })
      .select();
    
    if (createError) {
      console.error('❌ ERRO ao criar feedback de teste:', createError);
      return;
    }
    
    console.log('   ✅ Feedback de teste criado');
    
    // Aguardar um pouco e verificar se contador foi atualizado
    console.log('   ⏳ Aguardando trigger processar...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar contador atualizado
    const { data: updatedArticle, error: updateError } = await supabase
      .from('articles')
      .select('positive_feedbacks')
      .eq('id', testArticle.id)
      .single();
    
    if (updateError) {
      console.error('❌ ERRO ao verificar contador atualizado:', updateError);
      return;
    }
    
    console.log(`   Contador após trigger: ${updatedArticle.positive_feedbacks} feedbacks positivos`);
    
    if (updatedArticle.positive_feedbacks > testArticle.positive_feedbacks) {
      console.log('   ✅ TRIGGER FUNCIONANDO! Contador foi incrementado');
    } else {
      console.log('   ❌ TRIGGER NÃO FUNCIONANDO! Contador não foi atualizado');
    }

    // 4. ATUALIZAR CONTADORES MANUALMENTE PARA RESOLVER O PROBLEMA
    console.log('\n🔄 4. ATUALIZANDO CONTADORES MANUALMENTE:');
    
    for (const article of articles) {
      const { count: correctPositive } = await supabase
        .from('feedbacks')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', article.id)
        .eq('feedback_type', 'positive');
      
      const { count: correctNegative } = await supabase
        .from('feedbacks')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', article.id)
        .eq('feedback_type', 'negative');
      
      const { error: syncError } = await supabase
        .from('articles')
        .update({
          positive_feedbacks: correctPositive || 0,
          negative_feedbacks: correctNegative || 0
        })
        .eq('id', article.id);
      
      if (syncError) {
        console.error(`❌ ERRO ao sincronizar ${article.title}:`, syncError);
      } else {
        console.log(`   ✅ ${article.title.substring(0, 40)}... → ${correctPositive || 0} pos, ${correctNegative || 0} neg`);
      }
    }

    // 5. TESTAR FUNÇÃO get_featured_articles() APÓS SINCRONIZAÇÃO
    console.log('\n🎯 5. TESTANDO FUNÇÃO APÓS SINCRONIZAÇÃO:');
    
    const { data: featuredResult, error: featuredError } = await supabase
      .rpc('get_featured_articles');
    
    if (featuredError) {
      console.error('❌ ERRO na função get_featured_articles:', featuredError);
      return;
    }
    
    console.log(`\n✅ Função retornou ${featuredResult.length} artigos:`);
    featuredResult.forEach((article, index) => {
      console.log(`   ${index + 1}. ${article.title.substring(0, 50)}... (Score: ${article.engagement_score})`);
    });

  } catch (error) {
    console.error('❌ ERRO GERAL:', error);
  }
}

debugTriggers();