import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Iniciando verificação de integridade do banco de dados...\n');

// Função para verificar integridade de uma tabela
async function checkTableIntegrity(tableName, description) {
  console.log(`📊 Verificando ${description} (${tableName})...`);
  
  try {
    // Contar registros
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log(`  ❌ Erro ao contar registros: ${countError.message}`);
      return false;
    }
    
    // Buscar alguns registros para verificar estrutura
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(3);
    
    if (error) {
      console.log(`  ❌ Erro ao buscar dados: ${error.message}`);
      return false;
    }
    
    console.log(`  ✅ ${count || 0} registros encontrados`);
    if (data && data.length > 0) {
      console.log(`  📋 Estrutura: ${Object.keys(data[0]).join(', ')}`);
    }
    
    return true;
  } catch (err) {
    console.log(`  ❌ Erro inesperado: ${err.message}`);
    return false;
  }
}

// Função para testar funções RPC
async function testRPCFunction(functionName, params = {}) {
  console.log(`🔧 Testando função RPC: ${functionName}...`);
  
  try {
    const { data, error } = await supabase.rpc(functionName, params);
    
    if (error) {
      console.log(`  ❌ Erro na função: ${error.message}`);
      return false;
    }
    
    console.log(`  ✅ Função executada com sucesso`);
    if (data !== null && data !== undefined) {
      console.log(`  📊 Resultado: ${typeof data === 'object' ? JSON.stringify(data).substring(0, 100) + '...' : data}`);
    }
    
    return true;
  } catch (err) {
    console.log(`  ❌ Erro inesperado: ${err.message}`);
    return false;
  }
}

// Função principal de verificação
async function runIntegrityCheck() {
  const results = {
    tables: {},
    functions: {},
    summary: { total: 0, passed: 0, failed: 0 }
  };
  
  console.log('='.repeat(60));
  console.log('📋 VERIFICAÇÃO DE TABELAS PRINCIPAIS');
  console.log('='.repeat(60));
  
  // Tabelas principais para verificar
  const mainTables = [
    { name: 'articles', description: 'Artigos' },
    { name: 'comments', description: 'Comentários' },
    { name: 'feedbacks', description: 'Feedbacks' },
    { name: 'contacts', description: 'Contatos' },
    { name: 'user_profiles', description: 'Perfis de Usuário' },
    { name: 'newsletter_subscribers', description: 'Assinantes Newsletter' },
    { name: 'newsletter_campaigns', description: 'Campanhas Newsletter' },
    { name: 'system_logs', description: 'Logs do Sistema' },
    { name: 'app_logs', description: 'Logs da Aplicação' },
    { name: 'backend_logs', description: 'Logs do Backend' },
    { name: 'alert_subscriptions', description: 'Assinaturas de Alerta' },
    { name: 'alert_subscribers', description: 'Assinantes de Alerta' }
  ];
  
  for (const table of mainTables) {
    const success = await checkTableIntegrity(table.name, table.description);
    results.tables[table.name] = success;
    results.summary.total++;
    if (success) results.summary.passed++;
    else results.summary.failed++;
    console.log('');
  }
  
  console.log('='.repeat(60));
  console.log('🔧 VERIFICAÇÃO DE FUNÇÕES RPC');
  console.log('='.repeat(60));
  
  // Funções RPC para testar
  const rpcFunctions = [
    { name: 'get_articles_with_stats', params: {} },
    { name: 'get_user_stats', params: {} },
    { name: 'cleanup_old_newsletter_logs', params: {} },
    { name: 'backup_all_data', params: {} },
    { name: 'get_backup_history', params: {} }
  ];
  
  for (const func of rpcFunctions) {
    const success = await testRPCFunction(func.name, func.params);
    results.functions[func.name] = success;
    results.summary.total++;
    if (success) results.summary.passed++;
    else results.summary.failed++;
    console.log('');
  }
  
  console.log('='.repeat(60));
  console.log('📊 RESUMO DA VERIFICAÇÃO');
  console.log('='.repeat(60));
  console.log(`Total de verificações: ${results.summary.total}`);
  console.log(`✅ Sucessos: ${results.summary.passed}`);
  console.log(`❌ Falhas: ${results.summary.failed}`);
  console.log(`📈 Taxa de sucesso: ${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%`);
  
  if (results.summary.failed > 0) {
    console.log('\n🚨 PROBLEMAS IDENTIFICADOS:');
    
    // Listar tabelas com problemas
    const failedTables = Object.entries(results.tables).filter(([_, success]) => !success);
    if (failedTables.length > 0) {
      console.log('\n📋 Tabelas com problemas:');
      failedTables.forEach(([table, _]) => console.log(`  - ${table}`));
    }
    
    // Listar funções com problemas
    const failedFunctions = Object.entries(results.functions).filter(([_, success]) => !success);
    if (failedFunctions.length > 0) {
      console.log('\n🔧 Funções RPC com problemas:');
      failedFunctions.forEach(([func, _]) => console.log(`  - ${func}`));
    }
  } else {
    console.log('\n🎉 Todas as verificações passaram! O banco de dados está íntegro.');
  }
  
  return results;
}

// Executar verificação
runIntegrityCheck()
  .then(() => {
    console.log('\n✅ Verificação de integridade concluída.');
  })
  .catch((error) => {
    console.error('\n❌ Erro durante a verificação:', error);
    process.exit(1);
  });