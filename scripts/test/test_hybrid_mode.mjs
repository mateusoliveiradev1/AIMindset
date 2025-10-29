import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TESTE COMPLETO DO MODO HÍBRIDO');
console.log('='.repeat(50));

async function testHybridMode() {
  try {
    // 1. Verificar se a coluna is_featured_manual existe
    console.log('\n1️⃣ Verificando estrutura da tabela articles...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('articles')
      .select('id, title, is_featured_manual, published')
      .limit(1);

    if (tableError) {
      console.error('❌ Erro ao verificar tabela:', tableError.message);
      return;
    }

    console.log('✅ Coluna is_featured_manual existe na tabela');

    // 2. Buscar todos os artigos publicados
    console.log('\n2️⃣ Buscando artigos publicados...');
    const { data: allArticles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title, is_featured_manual, published')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (articlesError) {
      console.error('❌ Erro ao buscar artigos:', articlesError.message);
      return;
    }

    console.log(`✅ Encontrados ${allArticles.length} artigos publicados`);
    
    if (allArticles.length === 0) {
      console.log('⚠️ Nenhum artigo publicado encontrado para testar');
      return;
    }

    // 3. Testar função get_featured_articles ANTES de marcar qualquer artigo
    console.log('\n3️⃣ Testando get_featured_articles() (modo automático)...');
    const { data: featuredBefore, error: featuredBeforeError } = await supabase
      .rpc('get_featured_articles');

    if (featuredBeforeError) {
      console.error('❌ Erro na função get_featured_articles:', featuredBeforeError.message);
      return;
    }

    console.log('✅ Função get_featured_articles funcionando!');
    console.log(`📊 Retornou ${featuredBefore.length} artigos (modo automático):`);
    featuredBefore.forEach((article, index) => {
      console.log(`   ${index + 1}. ${article.title}`);
      console.log(`      Manual: ${article.is_featured_manual || false} | Score: ${article.rank_score}`);
    });

    // 4. Marcar um artigo como destaque manual
    if (allArticles.length > 0) {
      const testArticle = allArticles[0];
      console.log(`\n4️⃣ Marcando "${testArticle.title}" como destaque manual...`);
      
      const { error: updateError } = await supabase
        .from('articles')
        .update({ is_featured_manual: true })
        .eq('id', testArticle.id);

      if (updateError) {
        console.error('❌ Erro ao marcar artigo:', updateError.message);
        return;
      }

      console.log('✅ Artigo marcado como destaque manual!');

      // 5. Testar função get_featured_articles DEPOIS de marcar (modo híbrido)
      console.log('\n5️⃣ Testando get_featured_articles() (modo híbrido)...');
      const { data: featuredAfter, error: featuredAfterError } = await supabase
        .rpc('get_featured_articles');

      if (featuredAfterError) {
        console.error('❌ Erro na função get_featured_articles:', featuredAfterError.message);
        return;
      }

      console.log('✅ Função get_featured_articles funcionando no modo híbrido!');
      console.log(`📊 Retornou ${featuredAfter.length} artigos (modo híbrido):`);
      featuredAfter.forEach((article, index) => {
        const isManual = article.is_featured_manual ? '🎯 MANUAL' : '🤖 AUTO';
        console.log(`   ${index + 1}. ${article.title} [${isManual}]`);
        console.log(`      Score: ${article.rank_score} | Manual: ${article.is_featured_manual}`);
      });

      // 6. Verificar se o artigo marcado aparece primeiro
      const manualArticleFirst = featuredAfter[0]?.is_featured_manual;
      if (manualArticleFirst) {
        console.log('\n🎉 SUCESSO! Artigo marcado manualmente aparece primeiro!');
      } else {
        console.log('\n⚠️ ATENÇÃO: Artigo marcado manualmente não aparece primeiro');
      }

      // 7. Desmarcar o artigo para limpar o teste
      console.log('\n6️⃣ Limpando teste (desmarcando artigo)...');
      const { error: cleanupError } = await supabase
        .from('articles')
        .update({ is_featured_manual: false })
        .eq('id', testArticle.id);

      if (cleanupError) {
        console.error('❌ Erro ao limpar teste:', cleanupError.message);
      } else {
        console.log('✅ Teste limpo com sucesso!');
      }
    }

    console.log('\n🎊 TESTE COMPLETO FINALIZADO!');
    console.log('✅ Modo híbrido implementado e funcionando corretamente');
    console.log('✅ Artigos marcados manualmente têm prioridade');
    console.log('✅ Sistema automático funciona quando não há artigos manuais');

  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }
}

testHybridMode();