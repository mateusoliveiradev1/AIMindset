import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Testando Funções de Logging do Supabase...\n');

// Teste 1: Verificar função insert_app_log
async function testAppLogFunction() {
  console.log('📱 Testando função insert_app_log...');
  
  try {
    const { data, error } = await supabase.rpc('insert_app_log', {
      p_level: 'info',
      p_source: 'test_script',
      p_action: 'function_test',
      p_details: { test: true, timestamp: new Date().toISOString() },
      p_user_id: null
    });

    if (error) {
      console.log('❌ Erro na função insert_app_log:', error.message);
      return false;
    }

    console.log('✅ Função insert_app_log funcionando corretamente');
    return true;
  } catch (error) {
    console.log('❌ Erro ao testar insert_app_log:', error.message);
    return false;
  }
}

// Teste 2: Verificar função insert_system_log
async function testSystemLogFunction() {
  console.log('🖥️  Testando função insert_system_log...');
  
  try {
    const { data, error } = await supabase.rpc('insert_system_log', {
      p_type: 'test',
      p_message: 'Teste de função - insert_system_log funcionando',
      p_context: { test: true, timestamp: new Date().toISOString() }
    });

    if (error) {
      console.log('❌ Erro na função insert_system_log:', error.message);
      return false;
    }

    console.log('✅ Função insert_system_log funcionando corretamente');
    return true;
  } catch (error) {
    console.log('❌ Erro ao testar insert_system_log:', error.message);
    return false;
  }
}

// Teste 3: Verificar função insert_backend_log
async function testBackendLogFunction() {
  console.log('⚙️  Testando função insert_backend_log...');
  
  try {
    const { data, error } = await supabase.rpc('insert_backend_log', {
      p_table_name: 'test_table',
      p_action: 'INSERT',
      p_record_id: null,
      p_old_data: null,
      p_new_data: { test: true, timestamp: new Date().toISOString() },
      p_performed_by: 'test_script'
    });

    if (error) {
      console.log('❌ Erro na função insert_backend_log:', error.message);
      return false;
    }

    console.log('✅ Função insert_backend_log funcionando corretamente');
    return true;
  } catch (error) {
    console.log('❌ Erro ao testar insert_backend_log:', error.message);
    return false;
  }
}

// Teste 4: Verificar conectividade geral
async function testConnection() {
  console.log('🔗 Testando conectividade com Supabase...');
  
  try {
    const { data, error } = await supabase
      .from('app_logs')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Erro de conectividade:', error.message);
      return false;
    }

    console.log('✅ Conectividade com Supabase funcionando');
    return true;
  } catch (error) {
    console.log('❌ Erro de conectividade:', error.message);
    return false;
  }
}

// Executar todos os testes
async function runAllTests() {
  console.log('🚀 Iniciando testes das funções de logging...\n');
  
  const results = {
    connection: await testConnection(),
    appLog: await testAppLogFunction(),
    systemLog: await testSystemLogFunction(),
    backendLog: await testBackendLogFunction()
  };

  console.log('\n📊 RESUMO DOS TESTES:');
  console.log('='.repeat(40));
  console.log(`🔗 Conectividade: ${results.connection ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`📱 App Logs: ${results.appLog ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`🖥️  System Logs: ${results.systemLog ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`⚙️  Backend Logs: ${results.backendLog ? '✅ OK' : '❌ FALHOU'}`);
  
  const allPassed = Object.values(results).every(result => result === true);
  
  console.log('\n🎯 RESULTADO FINAL:');
  if (allPassed) {
    console.log('✅ Todas as funções de logging estão funcionando corretamente!');
    console.log('🎉 Sistema de logs está operacional e pronto para uso.');
  } else {
    console.log('❌ Algumas funções apresentaram problemas.');
    console.log('🔧 Verifique as configurações do Supabase e as funções RPC.');
  }
  
  return allPassed;
}

// Executar testes
runAllTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Erro fatal durante os testes:', error);
    process.exit(1);
  });