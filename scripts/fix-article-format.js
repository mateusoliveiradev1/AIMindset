import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Função para converter HTML para Markdown
function htmlToMarkdown(html) {
  if (!html) return '';
  
  let markdown = html;
  
  // Converter tags HTML básicas para Markdown
  markdown = markdown
    // Headers
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
    
    // Parágrafos
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    
    // Quebras de linha
    .replace(/<br\s*\/?>/gi, '\n')
    
    // Texto em negrito
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    
    // Texto em itálico
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    
    // Links
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    
    // Listas não ordenadas
    .replace(/<ul[^>]*>/gi, '')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    
    // Listas ordenadas
    .replace(/<ol[^>]*>/gi, '')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '1. $1\n')
    
    // Código inline
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    
    // Blocos de código
    .replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```\n\n')
    .replace(/<pre[^>]*>(.*?)<\/pre>/gis, '```\n$1\n```\n\n')
    
    // Citações
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '> $1\n\n')
    
    // Imagens
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)')
    .replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*>/gi, '![$1]($2)')
    .replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![]($1)')
    
    // Remover outras tags HTML
    .replace(/<[^>]+>/g, '')
    
    // Limpar espaços extras
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .trim();
  
  return markdown;
}

// Função para verificar se o conteúdo está em HTML
function isHtmlContent(content) {
  if (!content) return false;
  
  // Verificar se contém tags HTML comuns
  const htmlTags = /<\/?[a-z][\s\S]*>/i;
  return htmlTags.test(content);
}

async function fixArticleFormat() {
  try {
    console.log('🔍 Buscando artigos com problemas de formatação...\n');
    
    // Buscar os artigos específicos mencionados
    const targetTitles = [
      'Revolução na Educação: Tecnologias Emergentes Transformando o Aprendizado',
      'Estratégias de Negócios Digitais: Transformação e Crescimento Exponencial'
    ];
    
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, title, content, excerpt')
      .in('title', targetTitles);
    
    if (error) {
      console.error('❌ Erro ao buscar artigos:', error);
      return;
    }
    
    if (!articles || articles.length === 0) {
      console.log('⚠️ Nenhum dos artigos especificados foi encontrado');
      
      // Buscar todos os artigos para verificar títulos similares
      const { data: allArticles, error: allError } = await supabase
        .from('articles')
        .select('id, title')
        .order('created_at', { ascending: false });
      
      if (!allError && allArticles) {
        console.log('\n📋 Artigos disponíveis no banco:');
        allArticles.forEach((article, index) => {
          console.log(`${index + 1}. ${article.title}`);
        });
      }
      return;
    }
    
    console.log(`✅ Encontrados ${articles.length} artigos para correção:\n`);
    
    let updatedCount = 0;
    
    for (const article of articles) {
      console.log(`📝 Processando: "${article.title}"`);
      console.log(`ID: ${article.id}`);
      
      // Verificar se o conteúdo está em HTML
      const isHtml = isHtmlContent(article.content);
      const isExcerptHtml = isHtmlContent(article.excerpt);
      
      console.log(`Conteúdo em HTML: ${isHtml ? 'Sim' : 'Não'}`);
      console.log(`Excerpt em HTML: ${isExcerptHtml ? 'Sim' : 'Não'}`);
      
      if (isHtml || isExcerptHtml) {
        let updatedContent = article.content;
        let updatedExcerpt = article.excerpt;
        
        if (isHtml) {
          console.log('🔄 Convertendo conteúdo de HTML para Markdown...');
          updatedContent = htmlToMarkdown(article.content);
        }
        
        if (isExcerptHtml) {
          console.log('🔄 Convertendo excerpt de HTML para Markdown...');
          updatedExcerpt = htmlToMarkdown(article.excerpt);
        }
        
        // Atualizar o artigo no banco
        const { error: updateError } = await supabase
          .from('articles')
          .update({
            content: updatedContent,
            excerpt: updatedExcerpt,
            updated_at: new Date().toISOString()
          })
          .eq('id', article.id);
        
        if (updateError) {
          console.error(`❌ Erro ao atualizar artigo "${article.title}":`, updateError);
        } else {
          console.log(`✅ Artigo "${article.title}" atualizado com sucesso!`);
          updatedCount++;
        }
      } else {
        console.log('ℹ️ Artigo já está em formato adequado');
      }
      
      console.log('─'.repeat(50));
    }
    
    console.log(`\n🎉 Processo concluído! ${updatedCount} artigos foram atualizados.`);
    
    // Verificar outros artigos com possíveis problemas de formatação
    console.log('\n🔍 Verificando outros artigos com possíveis problemas...');
    
    const { data: allArticles, error: allError } = await supabase
      .from('articles')
      .select('id, title, content, excerpt')
      .limit(20);
    
    if (!allError && allArticles) {
      const problematicArticles = allArticles.filter(article => 
        isHtmlContent(article.content) || isHtmlContent(article.excerpt)
      );
      
      if (problematicArticles.length > 0) {
        console.log(`\n⚠️ Encontrados ${problematicArticles.length} outros artigos com possíveis problemas de formatação:`);
        problematicArticles.forEach((article, index) => {
          console.log(`${index + 1}. ${article.title}`);
        });
      } else {
        console.log('\n✅ Nenhum outro artigo com problemas de formatação encontrado');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o script
fixArticleFormat();