// 🔍 TESTE DEFINITIVO - VERIFICAR SE A RPC REALMENTE ATUALIZA O BANCO
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ARTICLE_ID = 'ecbdb9c4-21df-4fa7-82bb-62708536076f';

async function testRpcUpdate() {
  console.log('🔍 TESTE DEFINITIVO - VERIFICAR ATUALIZAÇÃO REAL');
  console.log('=' .repeat(60));

  try {
    // 1. Verificar estado atual do artigo
    console.log('\n1️⃣ ESTADO ATUAL DO ARTIGO:');
    const { data: currentArticle, error: currentError } = await supabase
      .from('articles')
      .select('id, title, published')
      .eq('id', ARTICLE_ID)
      .single();

    if (currentError) {
      console.error('❌ Erro ao buscar artigo atual:', currentError);
      return;
    }

    console.log('📊 Estado atual:', {
      id: currentArticle.id,
      title: currentArticle.title,
      published: currentArticle.published,
      published_type: typeof currentArticle.published
    });

    const currentState = currentArticle.published;
    const newState = !currentState; // Inverter o estado
    const newStateString = newState ? 'true' : 'false';

    console.log(`\n🔄 Tentando alterar de ${currentState} para ${newState}`);

    // 2. Chamar a RPC
    console.log('\n2️⃣ CHAMANDO RPC emergency_update_published:');
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('emergency_update_published', {
        article_id: ARTICLE_ID,
        published_value: newStateString
      });

    console.log('📊 Resultado da RPC:', { data: rpcResult, error: rpcError });

    // 3. Verificar se realmente mudou no banco
    console.log('\n3️⃣ VERIFICANDO SE MUDOU NO BANCO:');
    const { data: updatedArticle, error: updatedError } = await supabase
      .from('articles')
      .select('id, title, published, updated_at')
      .eq('id', ARTICLE_ID)
      .single();

    if (updatedError) {
      console.error('❌ Erro ao buscar artigo atualizado:', updatedError);
      return;
    }

    console.log('📊 Estado após RPC:', {
      id: updatedArticle.id,
      title: updatedArticle.title,
      published: updatedArticle.published,
      published_type: typeof updatedArticle.published,
      updated_at: updatedArticle.updated_at
    });

    // 4. Comparar estados
    console.log('\n4️⃣ COMPARAÇÃO DE ESTADOS:');
    console.log(`Estado anterior: ${currentState} (${typeof currentState})`);
    console.log(`Estado esperado: ${newState} (${typeof newState})`);
    console.log(`Estado atual: ${updatedArticle.published} (${typeof updatedArticle.published})`);

    if (updatedArticle.published === newState) {
      console.log('✅ SUCESSO: O estado foi alterado corretamente!');
    } else {
      console.log('❌ FALHA: O estado NÃO foi alterado!');
      console.log('🔍 DIAGNÓSTICO: A RPC retorna TRUE mas não atualiza o banco');
    }

    // 5. Testar update direto (para comparação)
    console.log('\n5️⃣ TESTANDO UPDATE DIRETO (para comparação):');
    const directNewState = !updatedArticle.published;
    
    const { data: directResult, error: directError } = await supabase
      .from('articles')
      .update({ published: directNewState })
      .eq('id', ARTICLE_ID)
      .select();

    console.log('📊 Resultado update direto:', { data: directResult, error: directError });

    if (directError) {
      console.log('❌ Update direto falhou - problema de RLS ou permissões');
    } else {
      console.log('✅ Update direto funcionou - problema é na RPC');
    }

  } catch (error) {
    console.error('💥 ERRO GERAL:', error);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('🏁 TESTE CONCLUÍDO');
}

// Executar teste
testRpcUpdate()
  .then(() => {
    console.log('✅ Teste finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });