const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFinalFunctionality() {
  console.log('🧪 TESTE FINAL DA FUNCIONALIDADE DE PUBLICAR/DESPUBLICAR');
  console.log('=' .repeat(60));
  
  try {
    // 1. Buscar um artigo existente
    console.log('1️⃣ Buscando artigos existentes...');
    const { data: articles, error: fetchError } = await supabase
      .from('articles')
      .select('id, title, published')
      .limit(1);
    
    if (fetchError) {
      console.error('❌ Erro ao buscar artigos:', fetchError);
      return;
    }
    
    if (!articles || articles.length === 0) {
      console.log('❌ Nenhum artigo encontrado para testar');
      return;
    }
    
    const article = articles[0];
    console.log('✅ Artigo encontrado:', {
      id: article.id,
      title: article.title,
      published: article.published
    });
    
    // 2. Testar mudança de estado
    const newPublishedState = !article.published;
    console.log(`\n2️⃣ Testando mudança de ${article.published} para ${newPublishedState}...`);
    
    // 3. Chamar a RPC
    console.log('3️⃣ Chamando RPC emergency_update_published...');
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('emergency_update_published', {
        article_id: article.id,
        published_value: newPublishedState
      });
    
    console.log('📊 Resultado da RPC:', { data: rpcResult, error: rpcError });
    
    if (rpcError) {
      console.error('❌ Erro na RPC:', rpcError);
      return;
    }
    
    // 4. Verificar se a atualização realmente aconteceu
    console.log('\n4️⃣ Verificando se a atualização foi aplicada...');
    const { data: updatedArticle, error: checkError } = await supabase
      .from('articles')
      .select('id, title, published')
      .eq('id', article.id)
      .single();
    
    if (checkError) {
      console.error('❌ Erro ao verificar atualização:', checkError);
      return;
    }
    
    console.log('📊 Estado do artigo após atualização:', {
      id: updatedArticle.id,
      title: updatedArticle.title,
      published: updatedArticle.published
    });
    
    // 5. Verificar se a mudança foi aplicada
    console.log('\n5️⃣ RESULTADO FINAL:');
    if (updatedArticle.published === newPublishedState) {
      console.log('✅ SUCESSO! A funcionalidade está funcionando corretamente!');
      console.log(`✅ Estado alterado de ${article.published} para ${updatedArticle.published}`);
      console.log('✅ RPC retornou:', rpcResult);
    } else {
      console.log('❌ FALHA! A funcionalidade NÃO está funcionando!');
      console.log(`❌ Estado esperado: ${newPublishedState}`);
      console.log(`❌ Estado atual: ${updatedArticle.published}`);
      console.log('❌ RPC retornou:', rpcResult);
    }
    
    // 6. Testar mudança de volta
    console.log('\n6️⃣ Testando mudança de volta...');
    const { data: rpcResult2, error: rpcError2 } = await supabase
      .rpc('emergency_update_published', {
        article_id: article.id,
        published_value: article.published // Voltar ao estado original
      });
    
    console.log('📊 Resultado da segunda RPC:', { data: rpcResult2, error: rpcError2 });
    
    if (!rpcError2) {
      const { data: finalArticle } = await supabase
        .from('articles')
        .select('published')
        .eq('id', article.id)
        .single();
      
      console.log(`✅ Estado final: ${finalArticle.published} (deveria ser ${article.published})`);
      
      if (finalArticle.published === article.published) {
        console.log('✅ PERFEITO! Funcionalidade 100% operacional!');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar o teste
testFinalFunctionality().then(() => {
  console.log('\n🏁 Teste finalizado!');
}).catch(console.error);