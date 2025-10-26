// Script para executar no console do navegador
console.log('🔍 Verificando cabeçalhos no DOM...');

const headings = document.querySelectorAll('h1[id^="heading-"], h2[id^="heading-"], h3[id^="heading-"], h4[id^="heading-"], h5[id^="heading-"], h6[id^="heading-"]');

console.log(`📊 Total de cabeçalhos encontrados: ${headings.length}`);

headings.forEach((heading, index) => {
  console.log(`${index + 1}. ${heading.tagName} - ID: "${heading.id}" - Texto: "${heading.textContent}"`);
});

// Verificar se há duplicatas
const ids = Array.from(headings).map(h => h.id);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

if (duplicates.length > 0) {
  console.warn('⚠️ IDs duplicados encontrados:', [...new Set(duplicates)]);
} else {
  console.log('✅ Nenhum ID duplicado encontrado');
}