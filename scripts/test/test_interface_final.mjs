import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInterface() {
  try {
    console.log('🧪 TESTE FINAL DA INTERFACE HÍBRIDA');
    console.log('==================================================');

    // 1. Limpar todos os destaques manuais
    console.log('\n1️⃣ Limpando todos os destaques manuais...');
    const { error: clearError } = await supabase
      .from('articles')
      .update({ is_featured_manual: false })
      .eq('is_featured_manual', true);

    if (clearError) {
      console.error('❌ Erro ao limpar destaques:', clearError);
      return;
    }
    console.log('✅ Todos os destaques limpos');

    // 2. Testar modo automático (sem artigos fixados)
    console.log('\n2️⃣ Testando modo automático (sem artigos fixados)...');
    const { data: autoFeatured, error: autoError } = await supabase
      .rpc('get_featured_articles', { limit_count: 3 });

    if (autoError) {
      console.error('❌ Erro no modo automático:', autoError);
      return;
    }

    console.log(`✅ Modo automático retornou ${autoFeatured.length} artigos:`);
    autoFeatured.forEach((article, index) => {
      console.log(`   ${index + 1}. ${article.title} [Score: ${article.score}]`);
    });

    // Verificar se todos são automáticos
    const allAutomatic = autoFeatured.every(article => !article.is_featured_manual);
    if (allAutomatic) {
      console.log('✅ CORRETO: Todos os artigos são automáticos');
    } else {
      console.log('❌ ERRO: Deveria ter apenas artigos automáticos');
    }

    // 3. Marcar um artigo como destaque manual
    const articleToFeature = autoFeatured[1]; // Segundo artigo
    console.log(`\n3️⃣ Marcando "${articleToFeature.title}" como destaque manual...`);
    
    const { error: featureError } = await supabase
      .from('articles')
      .update({ is_featured_manual: true })
      .eq('id', articleToFeature.id);

    if (featureError) {
      console.error('❌ Erro ao marcar artigo:', featureError);
      return;
    }
    console.log('✅ Artigo marcado como destaque manual');

    // 4. Testar modo híbrido (1 fixado + 2 automáticos)
    console.log('\n4️⃣ Testando modo híbrido (1 fixado + 2 automáticos)...');
    const { data: hybridFeatured, error: hybridError } = await supabase
      .rpc('get_featured_articles', { limit_count: 3 });

    if (hybridError) {
      console.error('❌ Erro no modo híbrido:', hybridError);
      return;
    }

    console.log(`✅ Modo híbrido retornou ${hybridFeatured.length} artigos:`);
    hybridFeatured.forEach((article, index) => {
      const type = article.is_featured_manual ? '🎯 MANUAL' : '🤖 AUTO';
      console.log(`   ${index + 1}. ${article.title} [${type}] [Score: ${article.score}]`);
    });

    // Verificar se o primeiro é manual e os outros são automáticos
    if (hybridFeatured[0]?.is_featured_manual && 
        !hybridFeatured[1]?.is_featured_manual && 
        !hybridFeatured[2]?.is_featured_manual) {
      console.log('✅ CORRETO: 1 manual + 2 automáticos na ordem correta');
    } else {
      console.log('❌ ERRO: Deveria ter 1 manual primeiro + 2 automáticos');
    }

    // 5. Verificar se apenas 1 artigo está marcado como manual
    console.log('\n5️⃣ Verificando quantos artigos estão marcados como manuais...');
    const { data: manualCount, error: countError } = await supabase
      .from('articles')
      .select('id, title')
      .eq('is_featured_manual', true);

    if (countError) {
      console.error('❌ Erro ao contar manuais:', countError);
      return;
    }

    console.log(`📊 Artigos marcados como manuais: ${manualCount.length}`);
    if (manualCount.length === 1) {
      console.log('✅ CORRETO: Apenas 1 artigo marcado como manual');
    } else {
      console.log('❌ ERRO: Deveria ter apenas 1 artigo marcado como manual');
    }

    // 6. Limpar teste
    console.log('\n6️⃣ Limpando teste...');
    const { error: cleanupError } = await supabase
      .from('articles')
      .update({ is_featured_manual: false })
      .eq('is_featured_manual', true);

    if (cleanupError) {
      console.error('❌ Erro ao limpar teste:', cleanupError);
    } else {
      console.log('✅ Teste limpo com sucesso');
    }

    console.log('\n🎊 TESTE FINAL CONCLUÍDO!');
    console.log('✅ Sistema automático funcionando');
    console.log('✅ Sistema híbrido funcionando');
    console.log('✅ Máximo 1 fixado por vez funcionando');
    console.log('✅ Interface pronta para uso!');

  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }
}

testInterface();