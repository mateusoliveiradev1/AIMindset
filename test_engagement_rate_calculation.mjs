import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://ixqhqjqjqjqjqjqjqjqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWhxanFqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzE0NzAsImV4cCI6MjA1MDU0NzQ3MH0.example';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEngagementRateCalculation() {
  console.log('🧪 Testando o novo cálculo de engagement_rate...\n');

  try {
    // 1. Buscar todos os artigos
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title')
      .limit(5);

    if (articlesError) {
      console.error('❌ Erro ao buscar artigos:', articlesError);
      return;
    }

    console.log(`📚 Encontrados ${articles.length} artigos para teste\n`);

    // 2. Para cada artigo, buscar métricas e calcular engagement_rate
    for (const article of articles) {
      console.log(`📖 Testando artigo: "${article.title}"`);
      
      // Buscar métricas do artigo
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('get_article_metrics', { target_article_id: article.id });

      if (metricsError) {
        console.error(`❌ Erro ao buscar métricas para ${article.id}:`, metricsError);
        continue;
      }

      const metrics = metricsData || {};
      
      // Simular o cálculo que está sendo feito no frontend
      const totalComments = Number(metrics.total_comments) || 0;
      const totalLikes = Number(metrics.total_likes) || 0;
      const totalReplies = Number(metrics.total_replies) || 0;
      
      // Novo cálculo: (total_likes + total_replies) / total_comments * 100
      const newEngagementRate = totalComments > 0 
        ? ((totalLikes + totalReplies) / totalComments * 100) 
        : 0;
      
      console.log(`  📊 Métricas:`);
      console.log(`     - Total de comentários: ${totalComments}`);
      console.log(`     - Total de curtidas: ${totalLikes}`);
      console.log(`     - Total de respostas: ${totalReplies}`);
      console.log(`     - Engagement rate (antigo): ${metrics.engagement_rate || 0}`);
      console.log(`     - Engagement rate (NOVO): ${Math.round(newEngagementRate * 100) / 100}%`);
      console.log(`     - Filtro "Alto Engajamento (80%+)": ${newEngagementRate >= 80 ? '✅ PASSA' : '❌ NÃO PASSA'}`);
      console.log('');
    }

    // 3. Teste específico: simular dados que deveriam passar no filtro
    console.log('🎯 TESTE ESPECÍFICO - Simulando artigo com alto engajamento:');
    console.log('   Cenário: 10 comentários, 5 curtidas, 3 respostas');
    
    const testComments = 10;
    const testLikes = 5;
    const testReplies = 3;
    const testEngagementRate = (testLikes + testReplies) / testComments * 100;
    
    console.log(`   Engagement Rate: ${testEngagementRate}%`);
    console.log(`   Filtro "Alto Engajamento (80%+)": ${testEngagementRate >= 80 ? '✅ PASSA' : '❌ NÃO PASSA'}`);
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testEngagementRateCalculation();