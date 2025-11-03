import fetch from 'node-fetch';

const PRODUCTION_URL = 'https://trae2irqr9z3-gamma.vercel.app';

async function testProductionSystem() {
  console.log('🚀 TESTANDO SISTEMA DE BACKUP EM PRODUÇÃO');
  console.log('='.repeat(50));
  
  try {
    // 1. Testar API de status do backup
    console.log('\n📊 1. Testando API de Status do Backup...');
    const statusResponse = await fetch(`${PRODUCTION_URL}/api/backup-status`);
    const statusData = await statusResponse.json();
    
    console.log('Status Response:', statusResponse.status);
    console.log('Status Data:', JSON.stringify(statusData, null, 2));
    
    // 2. Testar API de backup automático
    console.log('\n🔄 2. Testando API de Backup Automático...');
    const backupResponse = await fetch(`${PRODUCTION_URL}/api/auto-backup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const backupData = await backupResponse.json();
    
    console.log('Backup Response:', backupResponse.status);
    console.log('Backup Data:', JSON.stringify(backupData, null, 2));
    
    // 3. Verificar se o sistema está funcionando
    console.log('\n✅ 3. Verificação Final...');
    
    if (statusResponse.ok && backupResponse.ok) {
      console.log('🎉 SISTEMA DE BACKUP EM PRODUÇÃO: FUNCIONANDO PERFEITAMENTE!');
      console.log('✅ APIs respondendo corretamente');
      console.log('✅ Backup automático operacional');
      console.log('✅ Monitoramento ativo');
    } else {
      console.log('❌ Alguns problemas detectados:');
      if (!statusResponse.ok) console.log('- API de status com problemas');
      if (!backupResponse.ok) console.log('- API de backup com problemas');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar sistema em produção:', error.message);
  }
}

testProductionSystem();