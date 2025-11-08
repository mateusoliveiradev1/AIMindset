// Teste final do sistema de alertas em produção
console.log('🚀 Testando sistema de alertas em PRODUÇÃO...\n');

async function testProductionAlert() {
  try {
    console.log('📧 Enviando email de teste via Node.js...');
    
    const response = await fetch('http://localhost:3001/api/send-alert-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients: ['warface01031999@gmail.com'],
        alertData: {
          type: 'production_test',
          source: 'manual_test',
          message: '🎉 SISTEMA DE ALERTAS FUNCIONANDO EM PRODUÇÃO! 🎉',
          details: {
            test_id: 'production_final_' + Date.now(),
            environment: 'production',
            status: 'working',
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('✅ SUCESSO! Email enviado:', result);
    console.log('\n🎯 RESULTADO:');
    console.log('='.repeat(50));
    console.log('✅ Sistema de alertas: FUNCIONANDO');
    console.log('✅ Servidor Node.js: ONLINE');
    console.log('✅ Envio de email: SUCESSO');
    console.log('✅ Message ID:', result.messageId);
    console.log('\n📧 Verifique sua caixa de entrada!');
    console.log('📧 Email enviado para: warface01031999@gmail.com');
    
    return true;
  } catch (error) {
    console.log('❌ ERRO:', error.message);
    return false;
  }
}

testProductionAlert();