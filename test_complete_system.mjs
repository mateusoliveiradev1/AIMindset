import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://ixqjqhqjqhqjqhqjqhqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxaHFqcWhxanFocWpxaHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAzOTU5NzAsImV4cCI6MjA0NTk3MTk3MH0.Ej5rJNGhDuFhQmGVSQVQQVQQVQQVQQVQQVQQVQQVQQVQ';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 Testando sistema completo de alertas...\n');

// Teste 1: Verificar se o servidor Node.js está rodando
async function testNodeServer() {
  try {
    console.log('1️⃣ Testando servidor Node.js...');
    const response = await fetch('http://localhost:3001/api/health');
    const data = await response.json();
    console.log('✅ Servidor Node.js:', data);
    return true;
  } catch (error) {
    console.log('❌ Servidor Node.js offline:', error.message);
    return false;
  }
}

// Teste 2: Testar função RPC send_alert_direct
async function testSendAlertDirect() {
  try {
    console.log('\n2️⃣ Testando função send_alert_direct...');
    const { data, error } = await supabase.rpc('send_alert_direct', {
      p_details: { test_id: 'complete_test_' + Date.now(), environment: 'production_test' },
      p_email: 'warface01031999@gmail.com',
      p_message: 'Teste completo do sistema de alertas - PRODUÇÃO',
      p_subject: 'Sistema de Alertas - Teste Final'
    });

    if (error) {
      console.log('❌ Erro na função RPC:', error);
      return false;
    }

    console.log('✅ Função RPC executada:', data);
    return true;
  } catch (error) {
    console.log('❌ Erro ao executar RPC:', error.message);
    return false;
  }
}

// Teste 3: Testar função test_alert_system
async function testAlertSystem() {
  try {
    console.log('\n3️⃣ Testando função test_alert_system...');
    const { data, error } = await supabase.rpc('test_alert_system');

    if (error) {
      console.log('❌ Erro na função test_alert_system:', error);
      return false;
    }

    console.log('✅ Função test_alert_system:', data);
    return true;
  } catch (error) {
    console.log('❌ Erro ao executar test_alert_system:', error.message);
    return false;
  }
}

// Teste 4: Testar endpoint Node.js diretamente
async function testEmailEndpoint() {
  try {
    console.log('\n4️⃣ Testando endpoint /api/send-alert-email...');
    const response = await fetch('http://localhost:3001/api/send-alert-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients: ['warface01031999@gmail.com'],
        alertData: {
          type: 'test_direct_endpoint',
          source: 'complete_system_test',
          message: 'Teste direto do endpoint Node.js - Sistema funcionando!',
          details: {
            test_id: 'endpoint_test_' + Date.now(),
            environment: 'production_test'
          },
          timestamp: new Date().toISOString()
        }
      })
    });

    const result = await response.json();
    console.log('✅ Endpoint Node.js:', result);
    return result.success;
  } catch (error) {
    console.log('❌ Erro no endpoint Node.js:', error.message);
    return false;
  }
}

// Executar todos os testes
async function runCompleteTest() {
  console.log('🚀 Iniciando teste completo do sistema de alertas...\n');
  
  const results = {
    nodeServer: await testNodeServer(),
    sendAlertDirect: await testSendAlertDirect(),
    alertSystem: await testAlertSystem(),
    emailEndpoint: await testEmailEndpoint()
  };

  console.log('\n📊 RESULTADOS FINAIS:');
  console.log('='.repeat(50));
  console.log(`Servidor Node.js: ${results.nodeServer ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`Função send_alert_direct: ${results.sendAlertDirect ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`Função test_alert_system: ${results.alertSystem ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`Endpoint /api/send-alert-email: ${results.emailEndpoint ? '✅ OK' : '❌ FALHOU'}`);
  
  const allPassed = Object.values(results).every(result => result);
  console.log('\n🎯 STATUS GERAL:', allPassed ? '✅ SISTEMA FUNCIONANDO' : '❌ SISTEMA COM PROBLEMAS');
  
  if (allPassed) {
    console.log('\n🎉 SUCESSO! O sistema de alertas está funcionando perfeitamente em produção!');
    console.log('📧 Verifique sua caixa de entrada para os emails de teste.');
  } else {
    console.log('\n⚠️ Alguns componentes falharam. Verifique os logs acima.');
  }
}

runCompleteTest().catch(console.error);