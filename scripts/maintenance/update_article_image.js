import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateArticleImage() {
  try {
    // Nova imagem do Unsplash - Conceito futurista de cidade inteligente e tecnologia
    // Representa bem o futuro da humanidade e tendências tecnológicas para 2030
    const newImageUrl = 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80';
    
    console.log('🔄 Atualizando imagem do artigo...');
    console.log('🖼️ Nova imagem:', newImageUrl);
    
    const { data, error } = await supabase
      .from('articles')
      .update({ 
        image_url: newImageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('slug', 'futuro-humanidade-tendencias-tecnologicas-2030')
      .select('id, title, slug, image_url');

    if (error) {
      console.error('❌ Erro ao atualizar artigo:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('❌ Nenhum artigo foi atualizado');
      return;
    }

    console.log('✅ Artigo atualizado com sucesso!');
    console.log('📄 Título:', data[0].title);
    console.log('🔗 Slug:', data[0].slug);
    console.log('🖼️ Nova imagem:', data[0].image_url);
    
    // Verificar se a atualização foi aplicada
    console.log('\n🔍 Verificando se a alteração foi aplicada...');
    const { data: verification, error: verifyError } = await supabase
      .from('articles')
      .select('title, slug, image_url')
      .eq('slug', 'futuro-humanidade-tendencias-tecnologicas-2030')
      .single();

    if (verifyError) {
      console.error('❌ Erro na verificação:', verifyError);
      return;
    }

    console.log('✅ Verificação concluída!');
    console.log('📄 Título:', verification.title);
    console.log('🔗 Slug:', verification.slug);
    console.log('🖼️ Imagem confirmada:', verification.image_url);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

updateArticleImage();