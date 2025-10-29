import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test1Fixed2Auto() {
  console.log('🧪 TESTE: 1 ARTIGO FIXADO + 2 AUTOMÁTICOS\n');

  try {
    // 1. Garantir que não há artigos fixados
    console.log('1️⃣ Limpando artigos fixados...');
    await supabase
      .from('articles')
      .update({ is_featured_manual: false })
      .eq('is_featured_manual', true);
    console.log('✅ Todos os artigos desmarcados\n');

    // 2. Testar modo automático (3 artigos)
    console.log('2️⃣ Testando modo automático (3 artigos)...');
    const { data: autoMode, error: autoError } = await supabase
      .rpc('get_featured_articles');

    if (autoError) {
      console.error('❌ Erro no modo automático:', autoError);
      return;
    }

    console.log(`✅ Modo automático retornou ${autoMode.length} artigos:`);
    autoMode.forEach((article, index) => {
      console.log(`   ${index + 1}. ${article.title}`);
      console.log(`      Score: ${article.score || 0} | Manual: ${article.is_featured_manual}`);
    });
    console.log('');

    // 3. Fixar 1 artigo
    const articleToFix = autoMode[1]; // Pegar o segundo artigo
    console.log(`3️⃣ Fixando artigo: "${articleToFix.title}"...`);
    
    const { error: fixError } = await supabase
      .from('articles')
      .update({ is_featured_manual: true })
      .eq('id', articleToFix.id);

    if (fixError) {
      console.error('❌ Erro ao fixar artigo:', fixError);
      return;
    }
    console.log('✅ Artigo fixado com sucesso!\n');

    // 4. Testar modo híbrido (1 fixado + 2 automáticos)
    console.log('4️⃣ Testando modo híbrido (1 fixado + 2 automáticos)...');
    const { data: hybridMode, error: hybridError } = await supabase
      .rpc('get_featured_articles');

    if (hybridError) {
      console.error('❌ Erro no modo híbrido:', hybridError);
      return;
    }

    console.log(`✅ Modo híbrido retornou ${hybridMode.length} artigos:`);
    hybridMode.forEach((article, index) => {
      const type = article.is_featured_manual ? '[🎯 FIXADO]' : '[🤖 AUTO]';
      console.log(`   ${index + 1}. ${article.title} ${type}`);
      console.log(`      Score: ${article.score || 0} | Manual: ${article.is_featured_manual}`);
    });
    console.log('');

    // 5. Validar resultados
    console.log('5️⃣ Validando resultados...');
    
    const fixedArticles = hybridMode.filter(a => a.is_featured_manual);
    const autoArticles = hybridMode.filter(a => !a.is_featured_manual);
    
    console.log(`📊 Artigos fixados: ${fixedArticles.length}`);
    console.log(`📊 Artigos automáticos: ${autoArticles.length}`);
    
    const isValid = fixedArticles.length === 1 && autoArticles.length === 2 && hybridMode.length === 3;
    const firstIsFixed = hybridMode[0].is_featured_manual === true;
    
    console.log(`✅ Total de artigos: ${hybridMode.length === 3 ? 'CORRETO (3)' : 'INCORRETO'}`);
    console.log(`✅ Artigos fixados: ${fixedArticles.length === 1 ? 'CORRETO (1)' : 'INCORRETO'}`);
    console.log(`✅ Artigos automáticos: ${autoArticles.length === 2 ? 'CORRETO (2)' : 'INCORRETO'}`);
    console.log(`✅ Primeiro é fixado: ${firstIsFixed ? 'CORRETO' : 'INCORRETO'}`);
    
    // 6. Testar limite de 1 artigo fixado
    console.log('\n6️⃣ Testando limite de 1 artigo fixado...');
    const anotherArticle = autoArticles[0];
    
    console.log(`Tentando fixar outro artigo: "${anotherArticle.title}"...`);
    const { error: limitError } = await supabase
      .from('articles')
      .update({ is_featured_manual: true })
      .eq('id', anotherArticle.id);

    if (limitError) {
      console.log('✅ Limite funcionando - erro esperado:', limitError.message);
    } else {
      // Verificar se realmente há apenas 1 fixado
      const { data: checkLimit } = await supabase
        .from('articles')
        .select('id, title, is_featured_manual')
        .eq('is_featured_manual', true);
      
      console.log(`📊 Artigos fixados após tentativa: ${checkLimit.length}`);
      if (checkLimit.length > 1) {
        console.log('❌ PROBLEMA: Mais de 1 artigo fixado!');
        checkLimit.forEach(article => {
          console.log(`   - ${article.title}`);
        });
      } else {
        console.log('✅ Limite respeitado - apenas 1 artigo fixado');
      }
    }

    // 7. Limpeza final
    console.log('\n7️⃣ Limpeza final...');
    await supabase
      .from('articles')
      .update({ is_featured_manual: false })
      .eq('is_featured_manual', true);
    console.log('✅ Todos os artigos desmarcados');

    // 8. Resultado final
    console.log('\n🎉 RESULTADO FINAL:');
    if (isValid && firstIsFixed) {
      console.log('✅ TESTE PASSOU! Sistema 1 fixado + 2 automáticos funcionando perfeitamente!');
      console.log('✅ Artigo fixado aparece primeiro');
      console.log('✅ Exatamente 2 artigos automáticos complementam');
      console.log('✅ Total de 3 artigos retornados');
    } else {
      console.log('❌ TESTE FALHOU! Verificar implementação do sistema híbrido');
    }

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
  }
}

// Executar teste
test1Fixed2Auto();