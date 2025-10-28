import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findArticle() {
  try {
    console.log('🔍 Procurando artigo com slug: futuro-humanidade-tendencias-tecnologicas-2030');
    
    // Buscar o artigo específico
    const { data: article, error } = await supabase
      .from('articles')
      .select('id, title, slug, image_url, excerpt')
      .eq('slug', 'futuro-humanidade-tendencias-tecnologicas-2030')
      .single();

    if (error) {
      console.error('❌ Erro ao buscar artigo:', error);
      return;
    }

    if (!article) {
      console.log('❌ Artigo não encontrado com esse slug');
      
      // Buscar artigos similares
      console.log('\n🔍 Buscando artigos similares...');
      const { data: similarArticles, error: searchError } = await supabase
        .from('articles')
        .select('id, title, slug, image_url')
        .or('title.ilike.%futuro%humanidade%,title.ilike.%tendências%tecnológicas%,title.ilike.%2030%,slug.ilike.%futuro%,slug.ilike.%humanidade%,slug.ilike.%tendencias%')
        .limit(10);

      if (searchError) {
        console.error('❌ Erro na busca:', searchError);
        return;
      }

      console.log('📋 Artigos encontrados:');
      similarArticles?.forEach((art, index) => {
        console.log(`${index + 1}. ${art.title}`);
        console.log(`   Slug: ${art.slug}`);
        console.log(`   Imagem: ${art.image_url}`);
        console.log('');
      });
      
      return;
    }

    console.log('✅ Artigo encontrado!');
    console.log('📄 Título:', article.title);
    console.log('🔗 Slug:', article.slug);
    console.log('🖼️ Imagem atual:', article.image_url);
    console.log('📝 Excerpt:', article.excerpt);

    // Buscar todas as imagens já utilizadas
    console.log('\n🔍 Verificando imagens já utilizadas...');
    const { data: allImages, error: imagesError } = await supabase
      .from('articles')
      .select('image_url')
      .not('image_url', 'is', null);

    if (imagesError) {
      console.error('❌ Erro ao buscar imagens:', imagesError);
      return;
    }

    const usedImages = allImages.map(img => img.image_url).filter(Boolean);
    console.log('📸 Total de imagens em uso:', usedImages.length);
    console.log('🖼️ Imagens utilizadas:');
    usedImages.forEach((img, index) => {
      console.log(`${index + 1}. ${img}`);
    });

    return { article, usedImages };

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

findArticle();