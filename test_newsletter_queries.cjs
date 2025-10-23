const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Lista das 9 consultas que estavam falhando
const queries = [
  {
    id: 1,
    description: 'newsletter_subscribers?select=*',
    query: () => supabase.from('newsletter_subscribers').select('*')
  },
  {
    id: 2,
    description: 'newsletter_subscribers?select=*&status=eq.active',
    query: () => supabase.from('newsletter_subscribers').select('*').eq('status', 'active')
  },
  {
    id: 3,
    description: 'newsletter_subscribers?select=*&status=eq.inactive',
    query: () => supabase.from('newsletter_subscribers').select('*').eq('status', 'inactive')
  },
  {
    id: 4,
    description: 'newsletter_subscribers?select=*&subscribed_at=gte.2025-10-23T03:00:00.000Z',
    query: () => supabase.from('newsletter_subscribers').select('*').gte('subscribed_at', '2025-10-23T03:00:00.000Z')
  },
  {
    id: 5,
    description: 'newsletter_subscribers?select=*&subscribed_at=gte.2025-10-16T03:00:00.000Z',
    query: () => supabase.from('newsletter_subscribers').select('*').gte('subscribed_at', '2025-10-16T03:00:00.000Z')
  },
  {
    id: 6,
    description: 'newsletter_subscribers?select=*&subscribed_at=gte.2025-10-01T03:00:00.000Z',
    query: () => supabase.from('newsletter_subscribers').select('*').gte('subscribed_at', '2025-10-01T03:00:00.000Z')
  },
  {
    id: 7,
    description: 'newsletter_subscribers?select=*&subscribed_at=gte.2025-09-01T03:00:00.000Z&subscribed_at=lt.2025-10-01T03:00:00.000Z',
    query: () => supabase.from('newsletter_subscribers').select('*').gte('subscribed_at', '2025-09-01T03:00:00.000Z').lt('subscribed_at', '2025-10-01T03:00:00.000Z')
  },
  {
    id: 8,
    description: 'newsletter_campaigns?select=*',
    query: () => supabase.from('newsletter_campaigns').select('*')
  },
  {
    id: 9,
    description: 'newsletter_campaigns?select=*&created_at=gte.2025-10-01T03:00:00.000Z',
    query: () => supabase.from('newsletter_campaigns').select('*').gte('created_at', '2025-10-01T03:00:00.000Z')
  }
];

async function testQuery(queryConfig, delay = 500) {
  try {
    console.log(`🧪 [Teste ${queryConfig.id}] Testando: ${queryConfig.description}`);
    
    const startTime = Date.now();
    const { data, error, count } = await queryConfig.query();
    const endTime = Date.now();
    
    if (error) {
      console.error(`❌ [Teste ${queryConfig.id}] ERRO:`, {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return false;
    }
    
    console.log(`✅ [Teste ${queryConfig.id}] SUCESSO:`, {
      registros: data?.length || 0,
      tempo: `${endTime - startTime}ms`,
      count: count || 'N/A'
    });
    
    // Delay entre consultas para evitar conflitos
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    return true;
    
  } catch (err) {
    console.error(`💥 [Teste ${queryConfig.id}] ERRO GERAL:`, {
      message: err.message,
      name: err.name,
      stack: err.stack?.split('\n')[0]
    });
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando teste das 9 consultas da Newsletter...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const queryConfig of queries) {
    const success = await testQuery(queryConfig);
    
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    
    console.log(''); // Linha em branco para separar testes
  }
  
  console.log('📊 RESULTADO FINAL:');
  console.log(`✅ Sucessos: ${successCount}/9`);
  console.log(`❌ Falhas: ${failCount}/9`);
  
  if (failCount === 0) {
    console.log('🎉 TODOS OS TESTES PASSARAM! Nenhum erro ERR_ABORTED encontrado.');
  } else {
    console.log('⚠️  Ainda existem consultas falhando. Verifique os erros acima.');
  }
  
  return failCount === 0;
}

// Executar testes
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('💥 Erro fatal durante os testes:', err);
    process.exit(1);
  });