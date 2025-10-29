import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeArticleImages() {
  try {
    console.log('🔍 Buscando artigo "Inovação Disruptiva: Como Startups Estão Mudando o Mundo"...');
    
    // Buscar o artigo pelo título
    const { data: articles, error: searchError } = await supabase
      .from('articles')
      .select('*')
      .ilike('title', '%Inovação Disruptiva: Como Startups Estão Mudando o Mundo%')
      .limit(1);

    if (searchError) {
      console.error('❌ Erro ao buscar artigo:', searchError);
      return;
    }

    if (!articles || articles.length === 0) {
      console.log('❌ Artigo não encontrado');
      return;
    }

    const article = articles[0];
    console.log(`✅ Artigo encontrado: ID ${article.id}`);
    console.log(`📝 Título: ${article.title}`);
    console.log(`🖼️ Imagem principal: ${article.image_url}`);
    
    // Analisar imagens no conteúdo
    const content = article.content;
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const images = [];
    let match;
    
    while ((match = imageRegex.exec(content)) !== null) {
      images.push({
        alt: match[1],
        url: match[2],
        position: match.index
      });
    }
    
    console.log('\n🖼️ IMAGENS ENCONTRADAS NO CONTEÚDO:');
    console.log(`📊 Total de imagens: ${images.length}`);
    
    if (images.length === 0) {
      console.log('⚠️ Nenhuma imagem encontrada no conteúdo!');
      return;
    }
    
    // Analisar duplicatas
    const urlCounts = {};
    images.forEach((img, index) => {
      console.log(`${index + 1}. Alt: "${img.alt}"`);
      console.log(`   URL: ${img.url}`);
      console.log(`   Posição: ${img.position}`);
      
      if (urlCounts[img.url]) {
        urlCounts[img.url]++;
      } else {
        urlCounts[img.url] = 1;
      }
    });
    
    // Identificar duplicatas
    console.log('\n🔍 ANÁLISE DE DUPLICATAS:');
    const duplicates = Object.entries(urlCounts).filter(([url, count]) => count > 1);
    
    if (duplicates.length > 0) {
      console.log('❌ IMAGENS DUPLICADAS ENCONTRADAS:');
      duplicates.forEach(([url, count]) => {
        console.log(`   ${url} - aparece ${count} vezes`);
      });
    } else {
      console.log('✅ Nenhuma duplicata encontrada');
    }
    
    // Verificar se imagem principal aparece no conteúdo
    const heroInContent = images.some(img => img.url === article.image_url);
    if (heroInContent) {
      console.log('⚠️ PROBLEMA: Imagem principal também aparece no conteúdo!');
    }
    
    // Analisar seções sem imagem
    const sections = [
      'A Revolução Silenciosa',
      'Setores Completamente Revolucionados', 
      'Transporte: A Mobilidade Reinventada',
      'Hospedagem: Economia Compartilhada',
      'Fintech: Democratizando as Finanças',
      'Educação: Aprendizado Sem Fronteiras',
      'Os Pilares da Disrupção',
      'Tecnologias Emergentes Impulsionando a Disrupção',
      'Casos de Sucesso Inspiradores',
      'O Futuro Que Estamos Construindo'
    ];
    
    console.log('\n📋 ANÁLISE DE SEÇÕES:');
    sections.forEach(section => {
      const hasImage = content.includes(`## ${section}`) || content.includes(`### ${section}`);
      if (hasImage) {
        // Verificar se há imagem próxima à seção
        const sectionIndex = content.indexOf(section);
        const nextSectionIndex = content.indexOf('##', sectionIndex + section.length);
        const sectionContent = nextSectionIndex > -1 ? 
          content.substring(sectionIndex, nextSectionIndex) : 
          content.substring(sectionIndex);
        
        const hasImageInSection = /!\[([^\]]*)\]\(([^)]+)\)/.test(sectionContent);
        console.log(`${hasImageInSection ? '✅' : '❌'} ${section}`);
      }
    });

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar a análise
analyzeArticleImages();