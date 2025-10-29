import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getStartupArticleContent() {
  console.log('🔍 Buscando artigo "Inovação Disruptiva: Como Startups Estão Mudando o Mundo"...\n');

  try {
    // Buscar o artigo específico
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, title, content, image_url, excerpt, slug')
      .or(`title.ilike.%Inovação Disruptiva%,title.ilike.%Startups Estão Mudando%`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Erro ao buscar artigo:', error);
      return;
    }

    if (!articles || articles.length === 0) {
      console.log('❌ Artigo não encontrado!');
      return;
    }

    const article = articles[0];
    console.log('✅ Artigo encontrado!');
    console.log(`📄 ID: ${article.id}`);
    console.log(`📝 Título: ${article.title}`);
    console.log(`🔗 Slug: ${article.slug}`);
    console.log(`🖼️ Imagem atual: ${article.image_url || 'Nenhuma'}`);
    console.log(`📊 Tamanho do conteúdo: ${article.content?.length || 0} caracteres\n`);

    // Analisar estrutura do conteúdo
    if (article.content) {
      console.log('📋 ESTRUTURA DO CONTEÚDO:\n');
      
      // Extrair headers
      const headers = article.content.match(/^#{1,6}\s+.+$/gm) || [];
      console.log(`🏷️ Headers encontrados (${headers.length}):`);
      headers.forEach((header, index) => {
        console.log(`   ${index + 1}. ${header}`);
      });

      console.log('\n📄 CONTEÚDO COMPLETO:\n');
      console.log('=' .repeat(80));
      console.log(article.content);
      console.log('=' .repeat(80));

      // Identificar seções principais para imagens
      console.log('\n🎯 SEÇÕES IDENTIFICADAS PARA IMAGENS:\n');
      
      const sections = [
        { title: 'Introdução/Hero', description: 'Imagem principal sobre inovação disruptiva' },
        { title: 'Setores Revolucionados', description: 'Montagem com ícones de diferentes setores' },
        { title: 'Transporte (Uber/Tesla)', description: 'Carros elétricos e apps de transporte' },
        { title: 'Hospedagem (Airbnb)', description: 'Conceito de economia compartilhada' },
        { title: 'Fintech', description: 'Tecnologia financeira e pagamentos digitais' },
        { title: 'Educação Online', description: 'E-learning e educação digital' },
        { title: 'Pilares da Disrupção', description: 'Infográfico com pilares estratégicos' },
        { title: 'Tecnologias Emergentes', description: 'IA, blockchain, IoT' },
        { title: 'Casos de Sucesso', description: 'Logos de startups famosas' },
        { title: 'Futuro/Conclusão', description: 'Conceito futurista de inovação' }
      ];

      sections.forEach((section, index) => {
        console.log(`   ${index + 1}. ${section.title}: ${section.description}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar a função
getStartupArticleContent();