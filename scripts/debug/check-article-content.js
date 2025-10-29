import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkArticleContent() {
  console.log('🔍 Verificando conteúdo dos artigos problemáticos...\n');
  
  // Buscar os artigos específicos mencionados
  const targetTitles = [
    'Revolução na Educação: Tecnologias Emergentes Transformando o Aprendizado',
    'Estratégias de Negócios Digitais: Transformação e Crescimento Exponencial'
  ];
  
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, content, excerpt, slug')
    .in('title', targetTitles);
  
  if (error) {
    console.error('❌ Erro ao buscar artigos:', error);
    return;
  }
  
  if (!articles || articles.length === 0) {
    console.log('⚠️ Nenhum dos artigos especificados foi encontrado');
    return;
  }
  
  console.log(`✅ Encontrados ${articles.length} artigos para análise:\n`);
  
  for (const article of articles) {
    console.log(`📝 Analisando: "${article.title}"`);
    console.log(`ID: ${article.id}`);
    console.log(`Slug: ${article.slug}`);
    console.log('─'.repeat(80));
    
    // Verificar estrutura do conteúdo
    const content = article.content || '';
    
    // Contar cabeçalhos
    const h1Count = (content.match(/^# /gm) || []).length;
    const h2Count = (content.match(/^## /gm) || []).length;
    const h3Count = (content.match(/^### /gm) || []).length;
    const h4Count = (content.match(/^#### /gm) || []).length;
    
    console.log('📊 Estrutura de cabeçalhos:');
    console.log(`  H1 (#): ${h1Count}`);
    console.log(`  H2 (##): ${h2Count}`);
    console.log(`  H3 (###): ${h3Count}`);
    console.log(`  H4 (####): ${h4Count}`);
    console.log(`  Total de cabeçalhos: ${h1Count + h2Count + h3Count + h4Count}`);
    
    // Verificar se há problemas de formatação
    const hasProperMarkdown = content.includes('##') || content.includes('###');
    const hasLineBreaks = content.includes('\n');
    const hasSpecialChars = /[^\x00-\x7F]/.test(content);
    
    console.log('\n🔍 Análise de formatação:');
    console.log(`  Contém markdown adequado: ${hasProperMarkdown ? '✅' : '❌'}`);
    console.log(`  Contém quebras de linha: ${hasLineBreaks ? '✅' : '❌'}`);
    console.log(`  Contém caracteres especiais: ${hasSpecialChars ? '⚠️' : '✅'}`);
    
    // Mostrar primeiros 500 caracteres do conteúdo
    console.log('\n📄 Primeiros 500 caracteres do conteúdo:');
    console.log('─'.repeat(50));
    console.log(content.substring(0, 500));
    console.log('─'.repeat(50));
    
    // Verificar se há cabeçalhos mal formatados
    const potentialHeaders = content.match(/^[A-Z][^.!?]*$/gm) || [];
    if (potentialHeaders.length > 0) {
      console.log('\n⚠️ Possíveis cabeçalhos sem formatação markdown:');
      potentialHeaders.slice(0, 5).forEach((header, index) => {
        console.log(`  ${index + 1}. "${header}"`);
      });
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
  }
}

checkArticleContent();