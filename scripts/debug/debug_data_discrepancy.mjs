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

console.log('🔍 DEBUG: DISCREPÂNCIA NOS DADOS - Artigos em Destaque');
console.log('='.repeat(70));

async function debugDataDiscrepancy() {
  try {
    console.log('\n1. 🔄 Verificando estrutura da tabela articles...');
    
    // Verificar todos os campos da tabela articles
    const { data: allColumns, error: columnsError } = await supabase
      .from('articles')
      .select('*')
      .eq('published', true)
      .eq('is_featured', true)
      .limit(1);
    
    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError);
      return;
    }
    
    if (allColumns && allColumns.length > 0) {
      console.log('📋 Colunas disponíveis na tabela articles:');
      Object.keys(allColumns[0]).forEach(column => {
        console.log(`   • ${column}: ${typeof allColumns[0][column]} = ${allColumns[0][column]}`);
      });
    }
    
    console.log('\n2. 🔄 Comparando campos de feedback...');
    
    // Query específica para comparar campos de feedback
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('articles')
      .select(`
        id, title, 
        positive_feedback, negative_feedback,
        positive_feedbacks, negative_feedbacks,
        likes_count, comments_count,
        is_featured, published
      `)
      .eq('published', true)
      .eq('is_featured', true);
    
    if (feedbackError) {
      console.error('❌ Erro ao buscar dados de feedback:', feedbackError);
      return;
    }
    
    console.log('📊 Comparação de campos de feedback:');
    feedbackData.forEach((article, index) => {
      console.log(`\n   ${index + 1}. "${article.title}"`);
      console.log(`      • positive_feedback: ${article.positive_feedback}`);
      console.log(`      • positive_feedbacks: ${article.positive_feedbacks}`);
      console.log(`      • negative_feedback: ${article.negative_feedback}`);
      console.log(`      • negative_feedbacks: ${article.negative_feedbacks}`);
      console.log(`      • likes_count: ${article.likes_count}`);
      console.log(`      • comments_count: ${article.comments_count}`);
      
      // Calcular scores com ambos os campos
      const score1 = (article.positive_feedback || 0) * 3 + (article.comments_count || 0) * 2 + (article.likes_count || 0);
      const score2 = (article.positive_feedbacks || 0) * 3 + (article.comments_count || 0) * 2 + (article.likes_count || 0);
      
      console.log(`      • Score com positive_feedback: ${score1}`);
      console.log(`      • Score com positive_feedbacks: ${score2}`);
      
      if (score1 !== score2) {
        console.log(`      🚨 DISCREPÂNCIA ENCONTRADA!`);
      }
    });
    
    console.log('\n3. 🔄 Testando função SQL com debug...');
    
    // Testar função SQL
    const { data: sqlFunction, error: sqlError } = await supabase.rpc('get_featured_articles');
    
    if (sqlError) {
      console.error('❌ Erro na função SQL:', sqlError);
      return;
    }
    
    console.log('📊 Dados retornados pela função SQL:');
    sqlFunction.forEach((article, index) => {
      console.log(`\n   ${index + 1}. "${article.title}"`);
      console.log(`      • positive_feedbacks: ${article.positive_feedbacks}`);
      console.log(`      • negative_feedbacks: ${article.negative_feedbacks}`);
      console.log(`      • likes_count: ${article.likes_count}`);
      console.log(`      • comments_count: ${article.comments_count}`);
      console.log(`      • rank_score: ${article.rank_score}`);
    });
    
    console.log('\n4. 🔍 Verificando se há tabela de métricas separada...');
    
    // Verificar se existe tabela article_metrics ou similar
    try {
      const { data: metricsData, error: metricsError } = await supabase
        .from('article_metrics')
        .select('*')
        .limit(3);
      
      if (!metricsError && metricsData) {
        console.log('✅ Tabela article_metrics encontrada:');
        console.log(metricsData);
      }
    } catch (err) {
      console.log('ℹ️ Tabela article_metrics não existe ou não é acessível');
    }
    
    console.log('\n5. 🔄 Verificando se há triggers ou funções que atualizam os dados...');
    
    // Verificar se há diferença temporal nos dados
    const { data: timestampData, error: timestampError } = await supabase
      .from('articles')
      .select('id, title, created_at, updated_at, positive_feedback, positive_feedbacks')
      .eq('published', true)
      .eq('is_featured', true)
      .order('updated_at', { ascending: false });
    
    if (!timestampError && timestampData) {
      console.log('📅 Dados com timestamps:');
      timestampData.forEach(article => {
        console.log(`   • "${article.title}"`);
        console.log(`     Created: ${article.created_at}`);
        console.log(`     Updated: ${article.updated_at}`);
        console.log(`     positive_feedback: ${article.positive_feedback}`);
        console.log(`     positive_feedbacks: ${article.positive_feedbacks}`);
      });
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('📋 RESUMO DO DEBUG:');
    
    const hasDiscrepancy = feedbackData.some(article => 
      (article.positive_feedback || 0) !== (article.positive_feedbacks || 0) ||
      (article.negative_feedback || 0) !== (article.negative_feedbacks || 0)
    );
    
    if (hasDiscrepancy) {
      console.log('🚨 PROBLEMA: Há discrepância entre os campos de feedback!');
      console.log('   • A função SQL usa positive_feedbacks');
      console.log('   • A query direta usa positive_feedback');
      console.log('   • Os valores são diferentes!');
    } else {
      console.log('✅ Os campos de feedback são consistentes');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o debug:', error);
  }
}

// Executar o debug
debugDataDiscrepancy().then(() => {
  console.log('\n🏁 Debug de discrepância de dados concluído');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});