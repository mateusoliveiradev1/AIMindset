import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkFeedbackData() {
  console.log('🔍 Verificando dados de feedback e métricas...\n');
  
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, positive_feedback, negative_feedback, approval_rate, created_at')
    .order('approval_rate', { ascending: false, nullsFirst: false });
  
  if (error) {
    console.error('❌ Erro:', error);
    return;
  }
  
  console.log('📊 Top 10 artigos por approval_rate:');
  console.log('─'.repeat(80));
  
  articles.slice(0, 10).forEach((article, index) => {
    const rate = article.approval_rate || 0;
    const positive = article.positive_feedback || 0;
    const negative = article.negative_feedback || 0;
    const total = positive + negative;
    
    console.log(`${index + 1}. ${article.title.substring(0, 50)}...`);
    console.log(`   Rate: ${rate.toFixed(2)}% | Pos: ${positive} | Neg: ${negative} | Total: ${total}`);
    console.log('');
  });
  
  // Verificar artigos com problemas
  const problematic = articles.filter(a => 
    (a.positive_feedback > 0 || a.negative_feedback > 0) && 
    (a.approval_rate === null || a.approval_rate === 0)
  );
  
  if (problematic.length > 0) {
    console.log(`⚠️ Encontrados ${problematic.length} artigos com métricas inconsistentes:`);
    problematic.forEach(article => {
      console.log(`- ${article.title}: Rate=${article.approval_rate}, Pos=${article.positive_feedback}, Neg=${article.negative_feedback}`);
    });
  } else {
    console.log('✅ Todas as métricas estão consistentes');
  }
  
  // Verificar estatísticas gerais
  const totalArticles = articles.length;
  const articlesWithFeedback = articles.filter(a => (a.positive_feedback > 0 || a.negative_feedback > 0)).length;
  const articlesWithRate = articles.filter(a => a.approval_rate > 0).length;
  
  console.log('\n📈 Estatísticas gerais:');
  console.log(`Total de artigos: ${totalArticles}`);
  console.log(`Artigos com feedback: ${articlesWithFeedback}`);
  console.log(`Artigos com approval_rate > 0: ${articlesWithRate}`);
}

checkFeedbackData()