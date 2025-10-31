import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('📊 Teste Simples do Sistema de Logs\n');

async function testLogsSimple() {
  let passedTests = 0;
  let totalTests = 0;

  // Teste 1: Verificar acesso às tabelas
  totalTests++;
  console.log('🔍 Teste 1: Verificando acesso às tabelas de logs...');
  try {
    const { data: appLogs, error: appError } = await supabase
      .from('app_logs')
      .select('count(*)')
      .single();
    
    const { data: systemLogs, error: systemError } = await supabase
      .from('system_logs')
      .select('count(*)')
      .single();

    if (!appError && !systemError) {
      console.log('✅ Acesso às tabelas OK');
      console.log(`   App logs: ${appLogs?.count || 0} registros`);
      console.log(`   System logs: ${systemLogs?.count || 0} registros`);
      passedTests++;
    } else {
      console.log('❌ Erro no acesso:', appError?.message || systemError?.message);
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  // Teste 2: Criar um log simples
  totalTests++;
  console.log('\n📝 Teste 2: Criando log simples...');
  try {
    const { data, error } = await supabase
      .from('app_logs')
      .insert({
        level: 'info',
        source: 'simple_test',
        action: 'test_creation',
        details: { message: 'Teste simples de criação de log' }
      })
      .select();

    if (!error && data && data.length > 0) {
      console.log('✅ Log criado com sucesso');
      console.log(`   ID: ${data[0].id}`);
      passedTests++;
    } else {
      console.log('❌ Erro ao criar log:', error?.message);
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  // Teste 3: Ler logs recentes
  totalTests++;
  console.log('\n📖 Teste 3: Lendo logs recentes...');
  try {
    const { data, error } = await supabase
      .from('app_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    if (!error && data) {
      console.log(`✅ Leitura OK - ${data.length} logs encontrados`);
      if (data.length > 0) {
        console.log(`   Último log: ${data[0].action} (${data[0].level})`);
      }
      passedTests++;
    } else {
      console.log('❌ Erro na leitura:', error?.message);
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  // Teste 4: Filtrar por nível
  totalTests++;
  console.log('\n🔍 Teste 4: Filtrando por nível...');
  try {
    const { data, error } = await supabase
      .from('app_logs')
      .select('*')
      .eq('level', 'info')
      .limit(5);

    if (!error && data) {
      console.log(`✅ Filtro funcionando - ${data.length} logs 'info' encontrados`);
      passedTests++;
    } else {
      console.log('❌ Erro no filtro:', error?.message);
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  // Resultados
  console.log('\n' + '='.repeat(40));
  console.log('📊 RESULTADOS DO TESTE SIMPLES');
  console.log('='.repeat(40));
  console.log(`✅ Testes aprovados: ${passedTests}/${totalTests}`);
  console.log(`📈 Taxa de sucesso: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 TESTE SIMPLES PASSOU!');
  } else {
    console.log('⚠️  Alguns testes falharam');
  }
  
  return { passedTests, totalTests };
}

testLogsSimple().catch(console.error);