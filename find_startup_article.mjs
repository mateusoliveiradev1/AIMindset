import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findStartupArticle() {
  console.log('🔍 Buscando artigo "Inovação Disruptiva: Como Startups Estão Mudando o Mundo"...\n');

  try {
    // Primeira tentativa - busca específica
    console.log('📋 Tentativa 1: Busca específica por título...');
    let { data: articles, error } = await supabase
      .from('articles')
      .select('id, title, content, excerpt, slug, created_at')
      .or(`title.ilike.%Inovação Disruptiva%,title.ilike.%Startups%Mudando%Mundo%,slug.ilike.%inovacao%disruptiva%,slug.ilike.%startups%mudando%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro na primeira busca:', error);
    }

    if (!articles || articles.length === 0) {
      console.log('⚠️  Nenhum resultado na busca específica. Tentando busca mais ampla...\n');
      
      // Segunda tentativa - busca mais ampla
      console.log('📋 Tentativa 2: Busca ampla por palavras-chave...');
      const { data: broadArticles, error: broadError } = await supabase
        .from('articles')
        .select('id, title, content, excerpt, slug, created_at')
        .or(`title.ilike.%startup%,title.ilike.%inovação%,content.ilike.%disruptiva%,content.ilike.%startup%`)
        .order('created_at', { ascending: false });

      if (broadError) {
        console.error('❌ Erro na segunda busca:', broadError);
        return;
      }

      articles = broadArticles;
    }

    if (!articles || articles.length === 0) {
      console.log('❌ Nenhum artigo encontrado com os critérios de busca.');
      
      // Terceira tentativa - listar todos os artigos para debug
      console.log('\n📋 Tentativa 3: Listando todos os artigos disponíveis...');
      const { data: allArticles, error: allError } = await supabase
        .from('articles')
        .select('id, title, slug, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (allError) {
        console.error('❌ Erro ao listar artigos:', allError);
        return;
      }

      console.log('\n📚 Artigos disponíveis:');
      allArticles?.forEach((article, index) => {
        console.log(`${index + 1}. "${article.title}" (slug: ${article.slug})`);
      });
      
      return;
    }

    console.log(`\n✅ Encontrados ${articles.length} artigo(s):\n`);

    articles.forEach((article, index) => {
      console.log(`--- ARTIGO ${index + 1} ---`);
      console.log(`📝 Título: ${article.title}`);
      console.log(`🔗 Slug: ${article.slug}`);
      console.log(`📅 Criado em: ${new Date(article.created_at).toLocaleDateString('pt-BR')}`);
      console.log(`📄 Excerpt: ${article.excerpt?.substring(0, 150)}...`);
      
      if (article.content) {
        console.log(`\n📖 CONTEÚDO ATUAL:`);
        console.log('=' .repeat(80));
        console.log(article.content);
        console.log('=' .repeat(80));
        
        // Análise do formato atual
        console.log(`\n🔍 ANÁLISE DO FORMATO:`);
        const hasMarkdownHeaders = /^#{1,6}\s/.test(article.content);
        const hasHtmlTags = /<[^>]+>/.test(article.content);
        const hasMarkdownLists = /^[\s]*[-*+]\s/.test(article.content);
        const hasMarkdownBold = /\*\*[^*]+\*\*/.test(article.content);
        
        console.log(`- Headers Markdown (# ## ###): ${hasMarkdownHeaders ? '✅' : '❌'}`);
        console.log(`- Tags HTML: ${hasHtmlTags ? '⚠️  Sim' : '✅ Não'}`);
        console.log(`- Listas Markdown: ${hasMarkdownLists ? '✅' : '❌'}`);
        console.log(`- Formatação Bold (**texto**): ${hasMarkdownBold ? '✅' : '❌'}`);
        console.log(`- Tamanho do conteúdo: ${article.content.length} caracteres`);
        
        // Contagem de parágrafos e estrutura
        const paragraphs = article.content.split('\n\n').filter(p => p.trim().length > 0);
        console.log(`- Número de parágrafos: ${paragraphs.length}`);
        
        if (hasHtmlTags) {
          console.log(`\n⚠️  PROBLEMA IDENTIFICADO: Conteúdo contém HTML em vez de Markdown`);
        }
        
        if (!hasMarkdownHeaders) {
          console.log(`\n⚠️  PROBLEMA IDENTIFICADO: Faltam headers Markdown para estruturação`);
        }
      }
      
      console.log('\n' + '='.repeat(100) + '\n');
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar a busca
findStartupArticle();