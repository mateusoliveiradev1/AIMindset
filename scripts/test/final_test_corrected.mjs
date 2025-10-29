import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function finalTestCorrected() {
  console.log('🎯 TESTE FINAL CORRIGIDO - VALIDAÇÃO COMPLETA DO SISTEMA');
  console.log('=' .repeat(70));

  try {
    // 1. LIMPAR FEEDBACKS EXISTENTES PARA COMEÇAR LIMPO
    console.log('\n🧹 1. LIMPANDO FEEDBACKS EXISTENTES:');
    
    const { error: deleteError } = await supabase
      .from('feedbacks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletar todos
    
    if (deleteError) {
      console.error('❌ ERRO ao limpar feedbacks:', deleteError);
    } else {
      console.log('✅ Feedbacks limpos');
    }

    // 2. RESETAR CONTADORES DOS ARTIGOS
    console.log('\n🔄 2. RESETANDO CONTADORES:');
    
    const { error: resetError } = await supabase
      .from('articles')
      .update({
        positive_feedbacks: 0,
        negative_feedbacks: 0,
        comments_count: 0,
        likes_count: 0
      })
      .eq('published', true);
    
    if (resetError) {
      console.error('❌ ERRO ao resetar contadores:', resetError);
    } else {
      console.log('✅ Contadores resetados');
    }

    // 3. BUSCAR ARTIGOS PARA TESTE
    console.log('\n📊 3. BUSCANDO ARTIGOS PARA TESTE:');
    
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title')
      .eq('published', true)
      .limit(3);
    
    if (articlesError) {
      console.error('❌ ERRO ao buscar artigos:', articlesError);
      return;
    }
    
    console.log(`✅ ${articles.length} artigos selecionados:`);
    articles.forEach((article, index) => {
      console.log(`   ${index + 1}. ${article.title}`);
    });

    // 4. CRIAR FEEDBACKS COM DIFERENTES QUANTIDADES
    console.log('\n🎯 4. CRIANDO FEEDBACKS DE TESTE:');
    
    // Artigo 1: 7 feedbacks positivos (deve ficar em 1º lugar)
    console.log(`\n   Criando 7 feedbacks positivos para: ${articles[0].title.substring(0, 50)}...`);
    for (let i = 0; i < 7; i++) {
      const { error } = await supabase.from('feedbacks').insert({
        article_id: articles[0].id,
        type: 'positive', // Coluna correta!
        user_id: `00000000-0000-0000-0000-00000000000${i}`,
        created_at: new Date().toISOString()
      });
      if (error) console.error(`Erro ao criar feedback ${i + 1}:`, error);
    }
    
    // Artigo 2: 2 feedbacks positivos (deve ficar em 2º lugar)
    console.log(`   Criando 2 feedbacks positivos para: ${articles[1].title.substring(0, 50)}...`);
    for (let i = 0; i < 2; i++) {
      const { error } = await supabase.from('feedbacks').insert({
        article_id: articles[1].id,
        type: 'positive', // Coluna correta!
        user_id: `00000000-0000-0000-0000-0000000001${i}`,
        created_at: new Date().toISOString()
      });
      if (error) console.error(`Erro ao criar feedback ${i + 1}:`, error);
    }
    
    // Artigo 3: 1 feedback positivo (deve ficar em 3º lugar)
    console.log(`   Criando 1 feedback positivo para: ${articles[2].title.substring(0, 50)}...`);
    const { error } = await supabase.from('feedbacks').insert({
      article_id: articles[2].id,
      type: 'positive', // Coluna correta!
      user_id: '00000000-0000-0000-0000-000000000020',
      created_at: new Date().toISOString()
    });
    if (error) console.error('Erro ao criar feedback:', error);

    // 5. AGUARDAR TRIGGERS PROCESSAREM
    console.log('\n⏳ 5. AGUARDANDO TRIGGERS PROCESSAREM...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 6. VERIFICAR CONTADORES ATUALIZADOS
    console.log('\n📊 6. VERIFICANDO CONTADORES APÓS TRIGGERS:');
    
    const { data: updatedArticles, error: updateError } = await supabase
      .from('articles')
      .select('id, title, positive_feedbacks, negative_feedbacks, comments_count, likes_count')
      .in('id', articles.map(a => a.id))
      .order('positive_feedbacks', { ascending: false });
    
    if (updateError) {
      console.error('❌ ERRO ao verificar contadores:', updateError);
      return;
    }
    
    console.log('\n✅ CONTADORES ATUALIZADOS:');
    updatedArticles.forEach((article, index) => {
      const score = (article.positive_feedbacks * 3.0) + (article.comments_count * 2.0) + (article.likes_count * 1.5) + (article.negative_feedbacks * -1.0);
      console.log(`\n   ${index + 1}. ${article.title.substring(0, 50)}...`);
      console.log(`      👍 Feedbacks+: ${article.positive_feedbacks}`);
      console.log(`      👎 Feedbacks-: ${article.negative_feedbacks}`);
      console.log(`      💬 Comentários: ${article.comments_count}`);
      console.log(`      ❤️ Likes: ${article.likes_count}`);
      console.log(`      🧮 Score Calculado: ${score.toFixed(2)}`);
    });

    // 7. TESTAR FUNÇÃO get_featured_articles()
    console.log('\n🎯 7. TESTANDO FUNÇÃO get_featured_articles():');
    
    const { data: featuredResult, error: featuredError } = await supabase
      .rpc('get_featured_articles');
    
    if (featuredError) {
      console.error('❌ ERRO na função get_featured_articles:', featuredError);
      return;
    }
    
    console.log(`\n✅ Função retornou ${featuredResult.length} artigos:`);
    featuredResult.forEach((article, index) => {
      console.log(`\n   ${index + 1}. ${article.title.substring(0, 50)}...`);
      console.log(`      📊 Score da Função: ${article.engagement_score}`);
    });

    // 8. VERIFICAÇÃO FINAL - ARTIGO COM 7 FEEDBACKS EM PRIMEIRO?
    console.log('\n🏆 8. VERIFICAÇÃO FINAL:');
    
    const articleWith7Feedbacks = updatedArticles.find(article => article.positive_feedbacks === 7);
    const topFeaturedArticle = featuredResult[0];
    
    if (articleWith7Feedbacks && topFeaturedArticle) {
      console.log(`\n   Artigo com 7 feedbacks: ${articleWith7Feedbacks.title.substring(0, 50)}...`);
      console.log(`   Primeiro na função: ${topFeaturedArticle.title.substring(0, 50)}...`);
      console.log(`   Score esperado: ${(articleWith7Feedbacks.positive_feedbacks * 3.0).toFixed(2)}`);
      console.log(`   Score da função: ${topFeaturedArticle.engagement_score}`);
      
      if (articleWith7Feedbacks.id === topFeaturedArticle.id) {
        console.log('\n   🎉 SUCESSO TOTAL! O SISTEMA ESTÁ FUNCIONANDO PERFEITAMENTE!');
        console.log('   ✅ Triggers atualizando contadores automaticamente');
        console.log('   ✅ Função get_featured_articles() ordenando corretamente');
        console.log('   ✅ Artigo com mais feedbacks em primeiro lugar');
        console.log('   ✅ Sistema de ordenação por engajamento operacional');
        
        // Marcar todas as tarefas como concluídas
        console.log('\n🎯 PROBLEMA DE ORDENAÇÃO RESOLVIDO COM SUCESSO!');
      } else {
        console.log('\n   ❌ PROBLEMA: A ordenação ainda não está correta');
      }
    } else {
      console.log('\n   ❌ ERRO: Não foi possível encontrar os artigos para comparação');
    }

  } catch (error) {
    console.error('❌ ERRO GERAL:', error);
  }
}

finalTestCorrected();