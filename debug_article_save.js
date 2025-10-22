// 🔥 SCRIPT DE DEBUG EXTREMO PARA ARTIGOS GRANDES
// Execute este script no console do navegador na página de admin

console.log('🚀 INICIANDO DEBUG EXTREMO DE ARTIGOS GRANDES');

// Função para gerar artigo de teste com tamanho específico
function generateTestArticle(sizeKB = 50) {
  const targetSize = sizeKB * 1024; // Converter KB para bytes
  let content = `# Artigo de Teste - ${sizeKB}KB\n\n`;
  
  // Adicionar conteúdo até atingir o tamanho desejado
  const baseText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ';
  
  while (content.length < targetSize) {
    content += baseText;
    if (content.length % 5000 === 0) {
      content += '\n\n## Seção ' + Math.floor(content.length / 5000) + '\n\n';
    }
  }
  
  return {
    title: `Teste Artigo ${sizeKB}KB - ${new Date().toISOString()}`,
    content: content.substring(0, targetSize),
    excerpt: `Artigo de teste com ${sizeKB}KB para debug do sistema de salvamento.`,
    category: 'tecnologia',
    tags: 'teste, debug, artigo-grande',
    published: true
  };
}

// Função para testar salvamento com logs detalhados
async function testArticleSave(sizeKB = 10) {
  console.log(`\n🔥 TESTANDO ARTIGO DE ${sizeKB}KB`);
  console.log('=' .repeat(50));
  
  const articleData = generateTestArticle(sizeKB);
  
  console.log('📊 DADOS DO ARTIGO:');
  console.log('- Título:', articleData.title);
  console.log('- Tamanho do conteúdo:', articleData.content.length, 'caracteres');
  console.log('- Tamanho em bytes:', new Blob([articleData.content]).size);
  console.log('- Tamanho em KB:', Math.round(new Blob([articleData.content]).size / 1024));
  
  try {
    console.log('🚀 INICIANDO SALVAMENTO...');
    const startTime = Date.now();
    
    // Simular o que acontece no useArticles
    const response = await fetch('/api/articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(articleData)
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ SUCESSO!');
      console.log('- Tempo de salvamento:', duration, 'ms');
      console.log('- Resultado:', result);
      return true;
    } else {
      console.error('❌ ERRO HTTP:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('- Resposta:', errorText);
      return false;
    }
    
  } catch (error) {
    console.error('❌ ERRO NO SALVAMENTO:');
    console.error('- Tipo:', error.constructor.name);
    console.error('- Mensagem:', error.message);
    console.error('- Stack:', error.stack);
    
    return false;
  }
}

// Função para teste incremental
async function testIncremental() {
  console.log('\n🔬 INICIANDO TESTE INCREMENTAL');
  console.log('=' .repeat(50));
  
  const sizes = [1, 5, 10, 20, 30, 50, 100]; // KB
  
  for (const size of sizes) {
    console.log(`\n📈 Testando ${size}KB...`);
    
    const success = await testArticleSave(size);
    
    if (!success) {
      console.error(`💥 FALHOU EM ${size}KB - LIMITE ENCONTRADO!`);
      break;
    }
    
    console.log(`✅ ${size}KB funcionou!`);
    
    // Aguardar um pouco entre os testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Função para monitorar network requests
function monitorNetworkRequests() {
  console.log('\n📡 MONITORANDO REQUISIÇÕES DE REDE');
  console.log('=' .repeat(50));
  
  // Interceptar fetch
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;
    
    if (url.includes('supabase') || url.includes('articles')) {
      console.log('🌐 REQUISIÇÃO INTERCEPTADA:');
      console.log('- URL:', url);
      console.log('- Method:', options?.method || 'GET');
      
      if (options?.body) {
        const bodySize = new Blob([options.body]).size;
        console.log('- Body size:', bodySize, 'bytes');
        console.log('- Body size KB:', Math.round(bodySize / 1024));
        
        try {
          const bodyData = JSON.parse(options.body);
          if (bodyData.content) {
            console.log('- Content length:', bodyData.content.length);
          }
        } catch (e) {
          console.log('- Body não é JSON válido');
        }
      }
      
      const startTime = Date.now();
      
      try {
        const response = await originalFetch.apply(this, args);
        const endTime = Date.now();
        
        console.log('✅ RESPOSTA RECEBIDA:');
        console.log('- Status:', response.status);
        console.log('- Tempo:', endTime - startTime, 'ms');
        
        return response;
        
      } catch (error) {
        const endTime = Date.now();
        
        console.error('❌ ERRO NA REQUISIÇÃO:');
        console.error('- Erro:', error.message);
        console.error('- Tempo até erro:', endTime - startTime, 'ms');
        
        throw error;
      }
    }
    
    return originalFetch.apply(this, args);
  };
  
  console.log('✅ Monitor de rede ativado!');
}

// Função principal de debug
async function debugArticleSave() {
  console.clear();
  console.log('🔥🔥🔥 DEBUG EXTREMO DE ARTIGOS GRANDES 🔥🔥🔥');
  console.log('=' .repeat(60));
  
  // Ativar monitoramento de rede
  monitorNetworkRequests();
  
  // Aguardar um pouco
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Fazer teste incremental
  await testIncremental();
  
  console.log('\n🏁 DEBUG CONCLUÍDO!');
}

// Expor funções globalmente para uso manual
window.debugArticleSave = debugArticleSave;
window.testArticleSave = testArticleSave;
window.generateTestArticle = generateTestArticle;
window.monitorNetworkRequests = monitorNetworkRequests;

console.log('🛠️ FUNÇÕES DE DEBUG CARREGADAS:');
console.log('- debugArticleSave() - Executa debug completo');
console.log('- testArticleSave(sizeKB) - Testa artigo de tamanho específico');
console.log('- generateTestArticle(sizeKB) - Gera artigo de teste');
console.log('- monitorNetworkRequests() - Monitora requisições');

console.log('\n🚀 EXECUTE: debugArticleSave() para iniciar o debug completo!');