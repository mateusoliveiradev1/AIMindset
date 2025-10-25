// Teste simples de carregamento usando fetch
import fetch from 'node-fetch';

async function testSimpleLoading() {
  console.log('🚀 Testando carregamento simples da aplicação...');
  
  try {
    // Teste 1: Verificar se o servidor está rodando
    console.log('📡 Testando conexão com o servidor local...');
    const response = await fetch('http://localhost:5173/', {
      timeout: 10000
    });
    
    if (response.ok) {
      console.log('✅ Servidor local respondendo:', response.status);
      const html = await response.text();
      
      // Verificar se contém elementos esperados
      if (html.includes('AIMindset') || html.includes('root')) {
        console.log('✅ HTML contém elementos esperados da aplicação');
      } else {
        console.log('⚠️ HTML não contém elementos esperados');
      }
      
      if (html.includes('skeleton') || html.includes('loading')) {
        console.log('📊 HTML contém elementos de loading/skeleton');
      }
      
    } else {
      console.log('❌ Servidor retornou erro:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('💥 Erro ao testar servidor local:', error.message);
  }
  
  // Teste 2: Simular múltiplas requisições rápidas
  console.log('\n🔄 Testando múltiplas requisições rápidas...');
  
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(
      fetch('http://localhost:5173/', { timeout: 5000 })
        .then(res => ({ attempt: i + 1, status: res.status, ok: res.ok }))
        .catch(err => ({ attempt: i + 1, error: err.message }))
    );
  }
  
  const results = await Promise.all(promises);
  
  results.forEach(result => {
    if (result.error) {
      console.log(`❌ Tentativa ${result.attempt}: Erro - ${result.error}`);
    } else {
      console.log(`✅ Tentativa ${result.attempt}: Status ${result.status} - ${result.ok ? 'OK' : 'Erro'}`);
    }
  });
  
  // Teste 3: Verificar tempo de resposta
  console.log('\n⏱️ Testando tempo de resposta...');
  
  const startTime = Date.now();
  try {
    const response = await fetch('http://localhost:5173/', { timeout: 10000 });
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`📊 Tempo de resposta: ${responseTime}ms`);
    
    if (responseTime < 1000) {
      console.log('✅ Tempo de resposta excelente (< 1s)');
    } else if (responseTime < 3000) {
      console.log('⚠️ Tempo de resposta aceitável (1-3s)');
    } else {
      console.log('❌ Tempo de resposta lento (> 3s)');
    }
    
  } catch (error) {
    console.error('💥 Erro no teste de tempo:', error.message);
  }
  
  console.log('\n✅ Teste simples concluído!');
}

testSimpleLoading();