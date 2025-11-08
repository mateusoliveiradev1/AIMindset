import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔧 Testando Sistema de Logs e Alertas - Versão Completa\n');

async function testLogsAndAlerts() {
  let passedTests = 0;
  let totalTests = 0;

  // Teste 1: Verificar conexão com tabelas de logs
  totalTests++;
  console.log('📊 Teste 1: Verificando conexão com tabelas de logs...');
  try {
    const { data: appLogs, error: appError } = await supabase
      .from('app_logs')
      .select('*')
      .limit(1);
    
    const { data: systemLogs, error: systemError } = await supabase
      .from('system_logs')
      .select('*')
      .limit(1);

    if (!appError && !systemError) {
      console.log('✅ Conexão com tabelas de logs OK');
      passedTests++;
    } else {
      console.log('❌ Erro na conexão:', appError?.message || systemError?.message);
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  // Teste 2: Criar log de aplicação
  totalTests++;
  console.log('\n📝 Teste 2: Criando log de aplicação...');
  try {
    const { data, error } = await supabase
      .from('app_logs')
      .insert({
        level: 'info',
        source: 'test_system',
        action: 'test_log_creation',
        details: { test: true, timestamp: new Date().toISOString() },
        user_id: 'test_user'
      })
      .select();

    if (!error && data && data.length > 0) {
      console.log('✅ Log de aplicação criado com sucesso');
      console.log('   ID:', data[0].id);
      passedTests++;
    } else {
      console.log('❌ Erro ao criar log:', error?.message);
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  // Teste 3: Criar log de sistema
  totalTests++;
  console.log('\n🔧 Teste 3: Criando log de sistema...');
  try {
    const { data, error } = await supabase
      .from('system_logs')
      .insert({
        type: 'test',
        message: 'Teste de criação de log de sistema',
        context: { test: true, source: 'automated_test' }
      })
      .select();

    if (!error && data && data.length > 0) {
      console.log('✅ Log de sistema criado com sucesso');
      console.log('   ID:', data[0].id);
      passedTests++;
    } else {
      console.log('❌ Erro ao criar log:', error?.message);
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  // Teste 4: Filtrar logs por nível
  totalTests++;
  console.log('\n🔍 Teste 4: Filtrando logs por nível...');
  try {
    const { data, error } = await supabase
      .from('app_logs')
      .select('*')
      .eq('level', 'info')
      .limit(5);

    if (!error && data) {
      console.log(`✅ Filtro por nível funcionando - ${data.length} logs encontrados`);
      passedTests++;
    } else {
      console.log('❌ Erro ao filtrar logs:', error?.message);
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  // Teste 5: Filtrar logs por tipo (sistema)
  totalTests++;
  console.log('\n🔧 Teste 5: Filtrando logs de sistema por tipo...');
  try {
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .eq('type', 'test')
      .limit(5);

    if (!error && data) {
      console.log(`✅ Filtro por tipo funcionando - ${data.length} logs encontrados`);
      passedTests++;
    } else {
      console.log('❌ Erro ao filtrar logs:', error?.message);
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  // Teste 6: Verificar logs recentes
  totalTests++;
  console.log('\n⏰ Teste 6: Verificando logs recentes...');
  try {
    const { data, error } = await supabase
      .from('app_logs')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      console.log(`✅ Consulta de logs recentes OK - ${data.length} logs nas últimas 24h`);
      passedTests++;
    } else {
      console.log('❌ Erro ao consultar logs recentes:', error?.message);
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  // Teste 7: Verificar estrutura de alertas
  totalTests++;
  console.log('\n🚨 Teste 7: Verificando sistema de alertas...');
  try {
    // Verificar se existem tabelas relacionadas a alertas
    const { data: alertSubs, error: alertError } = await supabase
      .from('alert_subscriptions')
      .select('*')
      .limit(1);

    if (!alertError) {
      console.log('✅ Sistema de alertas acessível');
      passedTests++;
    } else {
      console.log('❌ Erro no sistema de alertas:', alertError?.message);
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  // Teste 8: Testar logs com contexto JSON
  totalTests++;
  console.log('\n📋 Teste 8: Testando logs com contexto JSON...');
  try {
    const complexContext = {
      user: 'test_user',
      action: 'complex_test',
      metadata: {
        browser: 'test_browser',
        ip: '127.0.0.1',
        timestamp: new Date().toISOString()
      }
    };

    const { data, error } = await supabase
      .from('app_logs')
      .insert({
        level: 'info',
        source: 'json_test',
        action: 'context_test',
        details: complexContext
      })
      .select();

    if (!error && data && data.length > 0) {
      console.log('✅ Log com contexto JSON criado com sucesso');
      passedTests++;
    } else {
      console.log('❌ Erro ao criar log com JSON:', error?.message);
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  // Resultados finais
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESULTADOS DOS TESTES DE LOGS E ALERTAS');
  console.log('='.repeat(50));
  console.log(`✅ Testes aprovados: ${passedTests}/${totalTests}`);
  console.log(`📈 Taxa de sucesso: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 SISTEMA DE LOGS E ALERTAS 100% FUNCIONAL!');
  } else {
    console.log('⚠️  Sistema precisa de correções');
  }
  
  return { passedTests, totalTests };
}

testLogsAndAlerts().catch(console.error);