// Script para testar salvamento de artigo grande
// Execute este script no console do navegador na página de admin

const testLargeArticle = () => {
  // Gerar conteúdo grande (aproximadamente 50KB)
  const largeContent = `
# Artigo de Teste para Payload Grande

Este é um artigo de teste criado especificamente para verificar se o sistema consegue salvar artigos com conteúdo extenso.

## Introdução

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## Seção 1: Conteúdo Extenso

${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100)}

## Seção 2: Mais Conteúdo

${'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. '.repeat(100)}

## Seção 3: Ainda Mais Conteúdo

${'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. '.repeat(100)}

## Seção 4: Conteúdo Adicional

${'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum. '.repeat(100)}

## Seção 5: Mais Texto

${'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui. '.repeat(100)}

## Conclusão

Este artigo contém aproximadamente ${Math.round(largeContent.length / 1024)}KB de conteúdo para testar os limites do sistema.

${'Texto adicional para aumentar o tamanho do payload. '.repeat(200)}
`.trim();

  console.log('📊 Tamanho do conteúdo gerado:', largeContent.length, 'caracteres');
  console.log('📊 Tamanho em KB:', Math.round(largeContent.length / 1024), 'KB');
  
  return {
    title: 'Teste de Artigo Grande - ' + new Date().toISOString(),
    content: largeContent,
    excerpt: 'Este é um artigo de teste para verificar o salvamento de conteúdo grande.',
    category: 'tecnologia',
    tags: 'teste, artigo-grande, payload, debug',
    published: true
  };
};

// Executar o teste
const articleData = testLargeArticle();
console.log('✅ Dados do artigo de teste gerados:', {
  title: articleData.title,
  contentLength: articleData.content.length,
  excerpt: articleData.excerpt,
  category: articleData.category,
  tags: articleData.tags
});

console.log('📋 Para testar:');
console.log('1. Vá para a página de admin');
console.log('2. Abra o editor de artigos');
console.log('3. Cole os dados gerados');
console.log('4. Tente salvar o artigo');
console.log('5. Monitore o console para logs detalhados');