// 🚨 DIAGNÓSTICO DE EMERGÊNCIA - SALVAR O PROJETO!
// Verificar se o artigo específico existe e testar a RPC

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

async function emergencyDiagnosis() {
  console.log('🚨 INICIANDO DIAGNÓSTICO DE EMERGÊNCIA');
  console.log('🔍 Artigo ID:', ARTICLE_ID);
  console.log('=' .repeat(60));

  try {
    // 1. Verificar se o artigo existe
    console.log('\n1️⃣ VERIFICANDO SE O ARTIGO EXISTS...');
    const { data: article, error: selectError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', ARTICLE_ID)
      .single();

    if (selectError) {
      console.error('❌ Erro ao buscar artigo:', selectError);
      if (selectError.code === 'PGRST116') {
        console.log('🔍 DIAGNÓSTICO: Artigo NÃO EXISTE no banco!');
        
        // Listar todos os artigos para ver quais existem
        console.log('\n📋 LISTANDO TODOS OS ARTIGOS DISPONÍVEIS:');
        const { data: allArticles, error: listError } = await supabase
          .from('articles')
          .select('id, title, published')
          .limit(10);
        
        if (listError) {
          console.error('❌ Erro ao listar artigos:', listError);
        } else {
          console.log('📊 Artigos encontrados:', allArticles?.length || 0);
          allArticles?.forEach((art, index) => {
            console.log(`${index + 1}. ID: ${art.id} | Título: ${art.title} | Published: ${art.published}`);
          });
        }
        return;
      }
    } else {
      console.log('✅ ARTIGO ENCONTRADO!');
      console.log('📊 Dados do artigo:', {
        id: article.id,
        title: article.title,
        published: article.published,
        published_type: typeof article.published
      });
    }

    // 2. Testar a RPC diretamente
    console.log('\n2️⃣ TESTANDO RPC emergency_update_published...');
    
    // Teste 1: Tentar publicar (true)
    console.log('🧪 Teste 1: Publicar artigo (true)');
    const { data: rpcResult1, error: rpcError1 } = await supabase
      .rpc('emergency_update_published', {
        article_id: ARTICLE_ID,
        published_value: 'true'
      });

    console.log('📊 Resultado RPC (publicar):', { data: rpcResult1, error: rpcError1 });

    // Teste 2: Tentar despublicar (false)
    console.log('🧪 Teste 2: Despublicar artigo (false)');
    const { data: rpcResult2, error: rpcError2 } = await supabase
      .rpc('emergency_update_published', {
        article_id: ARTICLE_ID,
        published_value: 'false'
      });

    console.log('📊 Resultado RPC (despublicar):', { data: rpcResult2, error: rpcError2 });

    // 3. Verificar se a RPC existe (teste simples)
    console.log('\n3️⃣ VERIFICANDO SE A RPC EXISTS...');
    try {
      const { data: testRpc, error: testError } = await supabase
        .rpc('emergency_update_published', {
          article_id: '00000000-0000-0000-0000-000000000000', // ID fake para testar
          published_value: 'true'
        });
      
      if (testError && testError.code === '42883') {
        console.log('🔍 DIAGNÓSTICO: RPC emergency_update_published NÃO EXISTE!');
      } else {
        console.log('✅ RPC emergency_update_published EXISTE!');
        console.log('📊 Teste com ID fake:', { data: testRpc, error: testError });
      }
    } catch (error) {
      console.error('❌ Erro ao testar RPC:', error);
    }

    // 4. Testar update direto (sem RPC)
    console.log('\n4️⃣ TESTANDO UPDATE DIRETO...');
    const { data: updateResult, error: updateError } = await supabase
      .from('articles')
      .update({ published: true })
      .eq('id', ARTICLE_ID)
      .select();

    console.log('📊 Resultado update direto:', { data: updateResult, error: updateError });

  } catch (error) {
    console.error('💥 ERRO GERAL:', error);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('🏁 DIAGNÓSTICO CONCLUÍDO');
}

// Executar diagnóstico
emergencyDiagnosis()
  .then(() => {
    console.log('✅ Diagnóstico finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });