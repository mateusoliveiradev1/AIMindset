import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixFutureSectionImage() {
  try {
    console.log('🔍 Buscando artigo "Inovação Disruptiva: Como Startups Estão Mudando o Mundo"...');
    
    // Buscar o artigo
    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select('*')
      .eq('title', 'Inovação Disruptiva: Como Startups Estão Mudando o Mundo')
      .single();

    if (fetchError) {
      console.error('❌ Erro ao buscar artigo:', fetchError);
      return;
    }

    if (!article) {
      console.error('❌ Artigo não encontrado!');
      return;
    }

    console.log(`✅ Artigo encontrado: ID ${article.id}`);
    console.log(`📝 Título: ${article.title}`);

    // URL da imagem atual que está quebrada
    const brokenImageUrl = 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1000&h=500&fit=crop&crop=center';
    
    // Nova URL testada e funcional para tecnologia futurista
    const newImageUrl = 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1000&h=500&fit=crop&crop=center';
    
    console.log('🔧 Substituindo imagem quebrada na seção "Futuro da Inovação"...');
    console.log(`❌ URL antiga: ${brokenImageUrl}`);
    console.log(`✅ URL nova: ${newImageUrl}`);

    // Substituir a URL da imagem no conteúdo
    let updatedContent = article.content;
    let replacementMade = false;

    // Tentar diferentes padrões de URL que podem estar quebrados
    const possibleBrokenUrls = [
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1000&h=500&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176',
      'photo-1518709268805-4e9042af2176'
    ];

    for (const brokenUrl of possibleBrokenUrls) {
      if (updatedContent.includes(brokenUrl)) {
        updatedContent = updatedContent.replace(new RegExp(brokenUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newImageUrl);
        replacementMade = true;
        console.log(`✅ Substituição feita para: ${brokenUrl}`);
        break;
      }
    }

    if (!replacementMade) {
      console.log('⚠️ URL da imagem não encontrada no conteúdo. Verificando padrão de imagem...');
      
      // Procurar por padrão de imagem com alt "Futuro da Inovação"
      const imagePattern = /!\[Futuro da Inovação\]\([^)]+\)/g;
      const matches = updatedContent.match(imagePattern);
      
      if (matches) {
        console.log(`🔍 Encontrado padrão de imagem: ${matches[0]}`);
        updatedContent = updatedContent.replace(imagePattern, `![Futuro da Inovação](${newImageUrl})`);
        replacementMade = true;
        console.log('✅ Imagem substituída usando padrão de alt text');
      }
    }

    if (!replacementMade) {
      console.log('❌ Não foi possível encontrar a imagem para substituir');
      return;
    }

    // Atualizar o artigo no banco de dados
    const { error: updateError } = await supabase
      .from('articles')
      .update({ 
        content: updatedContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', article.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar artigo:', updateError);
      return;
    }

    console.log('🎉 IMAGEM DA SEÇÃO "FUTURO DA INOVAÇÃO" CORRIGIDA COM SUCESSO!');
    console.log('');
    console.log('✅ CORREÇÃO APLICADA:');
    console.log('🖼️ Nova imagem: Tecnologia futurista com circuitos e luzes');
    console.log(`🔗 URL: ${newImageUrl}`);
    console.log('📱 Dimensões: 1000x500px otimizada');
    console.log('🎯 Seção: Futuro da Inovação');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar a correção
fixFutureSectionImage();