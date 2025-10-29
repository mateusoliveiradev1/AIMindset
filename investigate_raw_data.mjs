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

console.log('🔍 INVESTIGAÇÃO DETALHADA DOS DADOS BRUTOS');
console.log('='.repeat(70));

async function investigarDados() {
  try {
    console.log('\n1. 📊 Listando todos os artigos...');
    
    const { data: artigos, error: artigosError } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (artigosError) {
      console.error('❌ Erro ao buscar artigos:', artigosError);
      return;
    }
    
    console.log(`✅ Encontrados ${artigos.length} artigos:`);
    artigos.forEach((artigo, index) => {
      console.log(`\n   ${index + 1}. ID: ${artigo.id}`);
      console.log(`      Título: "${artigo.title}"`);
      console.log(`      Positive Feedbacks: ${artigo.positive_feedbacks || 0}`);
      console.log(`      Comments Count: ${artigo.comments_count || 0}`);
      console.log(`      Likes Count: ${artigo.likes_count || 0}`);
      console.log(`      Created: ${artigo.created_at}`);
    });
    
    console.log('\n2. 📝 Listando todos os feedbacks...');
    
    const { data: feedbacks, error: feedbacksError } = await supabase
      .from('feedbacks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (feedbacksError) {
      console.error('❌ Erro ao buscar feedbacks:', feedbacksError);
      return;
    }
    
    console.log(`✅ Encontrados ${feedbacks.length} feedbacks:`);
    feedbacks.forEach((feedback, index) => {
      const artigo = artigos.find(a => a.id === feedback.article_id);
      console.log(`\n   ${index + 1}. ID: ${feedback.id}`);
      console.log(`      Article ID: ${feedback.article_id}`);
      console.log(`      Article Title: "${artigo ? artigo.title : 'NÃO ENCONTRADO'}"`);
      console.log(`      Type: ${feedback.type}`);
      console.log(`      Created: ${feedback.created_at}`);
    });
    
    console.log('\n3. 💬 Listando todos os comentários...');
    
    const { data: comentarios, error: comentariosError } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (comentariosError) {
      console.error('❌ Erro ao buscar comentários:', comentariosError);
      return;
    }
    
    console.log(`✅ Encontrados ${comentarios.length} comentários:`);
    comentarios.forEach((comentario, index) => {
      const artigo = artigos.find(a => a.id === comentario.article_id);
      console.log(`\n   ${index + 1}. ID: ${comentario.id}`);
      console.log(`      Article ID: ${comentario.article_id}`);
      console.log(`      Article Title: "${artigo ? artigo.title : 'NÃO ENCONTRADO'}"`);
      console.log(`      Content: "${comentario.content.substring(0, 50)}..."`);
      console.log(`      Likes Count: ${comentario.likes_count || 0}`);
      console.log(`      Created: ${comentario.created_at}`);
    });
    
    console.log('\n4. 🔍 Análise por artigo específico...');
    
    // Artigos específicos mencionados nos dados reais
    const artigosEspecificos = [
      'Produtividade Digital',
      'Revolução na Educação',
      'IA & Tecnologia',
      'Computação Quântica'
    ];
    
    artigosEspecificos.forEach(busca => {
      console.log(`\n📄 Buscando artigos com "${busca}":`);
      
      const artigosEncontrados = artigos.filter(artigo => 
        artigo.title.toLowerCase().includes(busca.toLowerCase())
      );
      
      if (artigosEncontrados.length === 0) {
        console.log('   ❌ Nenhum artigo encontrado');
        return;
      }
      
      artigosEncontrados.forEach(artigo => {
        console.log(`\n   ✅ "${artigo.title}"`);
        console.log(`      ID: ${artigo.id}`);
        
        // Feedbacks para este artigo
        const feedbacksArtigo = feedbacks.filter(f => f.article_id === artigo.id);
        const feedbacksPositivos = feedbacksArtigo.filter(f => f.type === 'positive');
        const feedbacksNegativos = feedbacksArtigo.filter(f => f.type === 'negative');
        
        console.log(`      Feedbacks Positivos: ${feedbacksPositivos.length}`);
        console.log(`      Feedbacks Negativos: ${feedbacksNegativos.length}`);
        
        // Comentários para este artigo
        const comentariosArtigo = comentarios.filter(c => c.article_id === artigo.id);
        const totalLikes = comentariosArtigo.reduce((sum, c) => sum + (c.likes_count || 0), 0);
        
        console.log(`      Comentários: ${comentariosArtigo.length}`);
        console.log(`      Total Likes: ${totalLikes}`);
        
        // Contadores na tabela articles
        console.log(`      Contador Positive Feedbacks: ${artigo.positive_feedbacks || 0}`);
        console.log(`      Contador Comments: ${artigo.comments_count || 0}`);
        console.log(`      Contador Likes: ${artigo.likes_count || 0}`);
      });
    });
    
  } catch (error) {
    console.error('❌ Erro durante a investigação:', error);
  }
}

console.log('🚀 Iniciando investigação...');
investigarDados().then(() => {
  console.log('\n🏁 Investigação concluída');
});