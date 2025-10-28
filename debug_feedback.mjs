import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugFeedback() {
  console.log('🔍 VERIFICANDO FEEDBACKS DOS ARTIGOS...\n');
  
  try {
    // Buscar todos os artigos publicados
    const { data: articles, error } = await supabase
      .from('articles')
      .select('title, positive_feedback, negative_feedback, approval_rate, created_at')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar artigos:', error);
      return;
    }

    console.log('📊 TODOS OS ARTIGOS (ordenados por data de criação):');
    console.log('='.repeat(80));
    
    articles.forEach((article, index) => {
      const totalFeedback = (article.positive_feedback || 0) + (article.negative_feedback || 0);
      console.log(`${index + 1}. ${article.title}`);
      console.log(`   Positivo: ${article.positive_feedback || 0} | Negativo: ${article.negative_feedback || 0} | Total: ${totalFeedback}`);
      console.log(`   Approval Rate: ${article.approval_rate || 0}% | Criado: ${new Date(article.created_at).toLocaleDateString()}`);
      console.log('');
    });

    // Filtrar especificamente IA Generativa e Computação Quântica
    const iaGenerativa = articles.find(a => a.title.toLowerCase().includes('ia') && a.title.toLowerCase().includes('generativa'));
    const computacaoQuantica = articles.find(a => a.title.toLowerCase().includes('computação') && a.title.toLowerCase().includes('quântica'));

    console.log('\n🎯 COMPARAÇÃO ESPECÍFICA:');
    console.log('='.repeat(50));
    
    if (iaGenerativa) {
      const totalIA = (iaGenerativa.positive_feedback || 0) + (iaGenerativa.negative_feedback || 0);
      console.log(`📝 IA GENERATIVA:`);
      console.log(`   Título: ${iaGenerativa.title}`);
      console.log(`   Positivo: ${iaGenerativa.positive_feedback || 0}`);
      console.log(`   Negativo: ${iaGenerativa.negative_feedback || 0}`);
      console.log(`   TOTAL FEEDBACK: ${totalIA}`);
      console.log(`   Approval Rate: ${iaGenerativa.approval_rate || 0}%`);
    } else {
      console.log('❌ Artigo IA Generativa não encontrado');
    }

    console.log('');

    if (computacaoQuantica) {
      const totalQuantica = (computacaoQuantica.positive_feedback || 0) + (computacaoQuantica.negative_feedback || 0);
      console.log(`🔬 COMPUTAÇÃO QUÂNTICA:`);
      console.log(`   Título: ${computacaoQuantica.title}`);
      console.log(`   Positivo: ${computacaoQuantica.positive_feedback || 0}`);
      console.log(`   Negativo: ${computacaoQuantica.negative_feedback || 0}`);
      console.log(`   TOTAL FEEDBACK: ${totalQuantica}`);
      console.log(`   Approval Rate: ${computacaoQuantica.approval_rate || 0}%`);
    } else {
      console.log('❌ Artigo Computação Quântica não encontrado');
    }

    // Ordenar por feedback total para ver a ordem correta
    const sortedByFeedback = [...articles].sort((a, b) => {
      const totalA = (a.positive_feedback || 0) + (a.negative_feedback || 0);
      const totalB = (b.positive_feedback || 0) + (b.negative_feedback || 0);
      
      if (totalB !== totalA) return totalB - totalA; // Mais feedback primeiro
      if (b.approval_rate !== a.approval_rate) return (b.approval_rate || 0) - (a.approval_rate || 0); // Maior approval rate
      return new Date(b.created_at) - new Date(a.created_at); // Mais recente
    });

    console.log('\n🏆 ORDENAÇÃO CORRETA POR FEEDBACK TOTAL:');
    console.log('='.repeat(60));
    
    sortedByFeedback.slice(0, 5).forEach((article, index) => {
      const totalFeedback = (article.positive_feedback || 0) + (article.negative_feedback || 0);
      console.log(`${index + 1}. ${article.title}`);
      console.log(`   Total Feedback: ${totalFeedback} | Approval: ${article.approval_rate || 0}%`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugFeedback();