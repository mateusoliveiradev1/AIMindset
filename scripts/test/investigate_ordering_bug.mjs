import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 INVESTIGAÇÃO CRÍTICA - BUG NA ORDENAÇÃO')
console.log('=' .repeat(60))

try {
  // 1. VERIFICAR DADOS REAIS DOS ARTIGOS
  console.log('\n📊 1. DADOS REAIS DOS ARTIGOS NO BANCO:')
  
  const { data: allArticles, error: articlesError } = await supabase
    .from('articles')
    .select('id, title, positive_feedbacks, negative_feedbacks, comments_count, likes_count, total_views, is_featured_manual, created_at')
    .eq('published', true)
    .order('positive_feedbacks', { ascending: false })
  
  if (articlesError) {
    console.error('❌ ERRO ao buscar artigos:', articlesError)
    process.exit(1)
  }
  
  console.log(`\n✅ ${allArticles.length} artigos encontrados (ordenados por feedbacks+):`)
  allArticles.forEach((article, index) => {
    const score = (article.positive_feedbacks * 3) + (article.comments_count * 2) + (article.likes_count * 1.5) + (article.total_views * 0.1) - (article.negative_feedbacks * 1)
    console.log(`\n   ${index + 1}. ${article.title}`)
    console.log(`      👍 Feedbacks+: ${article.positive_feedbacks}`)
    console.log(`      👎 Feedbacks-: ${article.negative_feedbacks}`)
    console.log(`      💬 Comentários: ${article.comments_count}`)
    console.log(`      ❤️ Likes: ${article.likes_count}`)
    console.log(`      👀 Views: ${article.total_views}`)
    console.log(`      📌 Fixo: ${article.is_featured_manual ? 'SIM' : 'NÃO'}`)
    console.log(`      🧮 Score Calculado: ${score.toFixed(2)}`)
    console.log(`      🆔 ID: ${article.id}`)
  })
  
  // 2. TESTAR FUNÇÃO get_featured_articles() DIRETAMENTE
  console.log('\n🎯 2. TESTANDO FUNÇÃO get_featured_articles():')
  
  const { data: featuredResult, error: featuredError } = await supabase
    .rpc('get_featured_articles')
  
  if (featuredError) {
    console.error('❌ ERRO na função get_featured_articles:', featuredError)
  } else {
    console.log(`\n✅ Função retornou ${featuredResult.length} artigos:`)
    featuredResult.forEach((article, index) => {
      console.log(`\n   ${index + 1}. ${article.title}`)
      console.log(`      📊 Score da Função: ${article.engagement_score}`)
      console.log(`      🆔 ID: ${article.id}`)
    })
  }
  
  // 3. COMPARAR ORDENAÇÃO ESPERADA VS REAL
  console.log('\n⚖️ 3. COMPARAÇÃO - ESPERADO VS REAL:')
  
  // Calcular scores manualmente e ordenar
  const articlesWithScores = allArticles.map(article => ({
    ...article,
    calculated_score: (article.positive_feedbacks * 3) + (article.comments_count * 2) + (article.likes_count * 1.5) + (article.total_views * 0.1) - (article.negative_feedbacks * 1)
  })).sort((a, b) => b.calculated_score - a.calculated_score)
  
  console.log('\n🧮 ORDENAÇÃO ESPERADA (por score calculado):')
  articlesWithScores.slice(0, 3).forEach((article, index) => {
    console.log(`   ${index + 1}. ${article.title} (Score: ${article.calculated_score.toFixed(2)})`)
  })
  
  console.log('\n🎯 ORDENAÇÃO ATUAL (função get_featured_articles):')
  if (featuredResult) {
    featuredResult.forEach((article, index) => {
      console.log(`   ${index + 1}. ${article.title} (Score: ${article.engagement_score})`)
    })
  }
  
  // 4. VERIFICAR SE HÁ DISCREPÂNCIA
  if (featuredResult && articlesWithScores.length > 0) {
    const expectedFirst = articlesWithScores[0]
    const actualFirst = featuredResult[0]
    
    if (expectedFirst.id !== actualFirst.id) {
      console.log('\n🚨 PROBLEMA ENCONTRADO!')
      console.log(`   ❌ Esperado em 1º: "${expectedFirst.title}" (Score: ${expectedFirst.calculated_score.toFixed(2)})`)
      console.log(`   ❌ Atual em 1º: "${actualFirst.title}" (Score: ${actualFirst.engagement_score})`)
      console.log('\n🔧 NECESSÁRIO CORRIGIR A FUNÇÃO get_featured_articles()!')
    } else {
      console.log('\n✅ Ordenação está correta!')
    }
  }
  
  // 5. VERIFICAR FEEDBACKS ESPECÍFICOS MENCIONADOS
  console.log('\n🔍 5. PROCURANDO ARTIGO COM 7 FEEDBACKS:')
  const articleWith7Feedbacks = allArticles.find(a => a.positive_feedbacks === 7)
  if (articleWith7Feedbacks) {
    console.log(`   ✅ Encontrado: "${articleWith7Feedbacks.title}"`)
    console.log(`   📊 Score: ${((articleWith7Feedbacks.positive_feedbacks * 3) + (articleWith7Feedbacks.comments_count * 2) + (articleWith7Feedbacks.likes_count * 1.5) + (articleWith7Feedbacks.total_views * 0.1) - (articleWith7Feedbacks.negative_feedbacks * 1)).toFixed(2)}`)
  } else {
    console.log('   ❌ Nenhum artigo com exatamente 7 feedbacks positivos encontrado')
  }
  
  console.log('\n🔍 PROCURANDO ARTIGOS COM 2 FEEDBACKS:')
  const articlesWith2Feedbacks = allArticles.filter(a => a.positive_feedbacks === 2)
  if (articlesWith2Feedbacks.length > 0) {
    articlesWith2Feedbacks.forEach(article => {
      const score = (article.positive_feedbacks * 3) + (article.comments_count * 2) + (article.likes_count * 1.5) + (article.total_views * 0.1) - (article.negative_feedbacks * 1)
      console.log(`   ✅ "${article.title}" - Score: ${score.toFixed(2)}`)
    })
  } else {
    console.log('   ❌ Nenhum artigo com exatamente 2 feedbacks positivos encontrado')
  }

} catch (error) {
  console.error('❌ ERRO GERAL:', error)
  process.exit(1)
}

console.log('🔍 INVESTIGAÇÃO CRÍTICA - BUG NA ORDENAÇÃO')
console.log('=' .repeat(60))

try {
  // 1. VERIFICAR DADOS REAIS DOS ARTIGOS
  console.log('\n📊 1. DADOS REAIS DOS ARTIGOS NO BANCO:')
  
  const { data: allArticles, error: articlesError } = await supabase
    .from('articles')
    .select('id, title, positive_feedbacks, negative_feedbacks, comments_count, likes_count, total_views, is_featured_manual, created_at')
    .eq('published', true)
    .order('positive_feedbacks', { ascending: false })
  
  if (articlesError) {
    console.error('❌ ERRO ao buscar artigos:', articlesError)
    process.exit(1)
  }
  
  console.log(`\n✅ ${allArticles.length} artigos encontrados (ordenados por feedbacks+):`)
  allArticles.forEach((article, index) => {
    const score = (article.positive_feedbacks * 3) + (article.comments_count * 2) + (article.likes_count * 1.5) + (article.total_views * 0.1) - (article.negative_feedbacks * 1)
    console.log(`\n   ${index + 1}. ${article.title}`)
    console.log(`      👍 Feedbacks+: ${article.positive_feedbacks}`)
    console.log(`      👎 Feedbacks-: ${article.negative_feedbacks}`)
    console.log(`      💬 Comentários: ${article.comments_count}`)
    console.log(`      ❤️ Likes: ${article.likes_count}`)
    console.log(`      👀 Views: ${article.total_views}`)
    console.log(`      📌 Fixo: ${article.is_featured_manual ? 'SIM' : 'NÃO'}`)
    console.log(`      🧮 Score Calculado: ${score.toFixed(2)}`)
    console.log(`      🆔 ID: ${article.id}`)
  })
  
  // 2. TESTAR FUNÇÃO get_featured_articles() DIRETAMENTE
  console.log('\n🎯 2. TESTANDO FUNÇÃO get_featured_articles():')
  
  const { data: featuredResult, error: featuredError } = await supabase
    .rpc('get_featured_articles')
  
  if (featuredError) {
    console.error('❌ ERRO na função get_featured_articles:', featuredError)
  } else {
    console.log(`\n✅ Função retornou ${featuredResult.length} artigos:`)
    featuredResult.forEach((article, index) => {
      console.log(`\n   ${index + 1}. ${article.title}`)
      console.log(`      📊 Score da Função: ${article.engagement_score}`)
      console.log(`      🆔 ID: ${article.id}`)
    })
  }
  
  // 3. COMPARAR ORDENAÇÃO ESPERADA VS REAL
  console.log('\n⚖️ 3. COMPARAÇÃO - ESPERADO VS REAL:')
  
  // Calcular scores manualmente e ordenar
  const articlesWithScores = allArticles.map(article => ({
    ...article,
    calculated_score: (article.positive_feedbacks * 3) + (article.comments_count * 2) + (article.likes_count * 1.5) + (article.total_views * 0.1) - (article.negative_feedbacks * 1)
  })).sort((a, b) => b.calculated_score - a.calculated_score)
  
  console.log('\n🧮 ORDENAÇÃO ESPERADA (por score calculado):')
  articlesWithScores.slice(0, 3).forEach((article, index) => {
    console.log(`   ${index + 1}. ${article.title} (Score: ${article.calculated_score.toFixed(2)})`)
  })
  
  console.log('\n🎯 ORDENAÇÃO ATUAL (função get_featured_articles):')
  if (featuredResult) {
    featuredResult.forEach((article, index) => {
      console.log(`   ${index + 1}. ${article.title} (Score: ${article.engagement_score})`)
    })
  }
  
  // 4. VERIFICAR SE HÁ DISCREPÂNCIA
  if (featuredResult && articlesWithScores.length > 0) {
    const expectedFirst = articlesWithScores[0]
    const actualFirst = featuredResult[0]
    
    if (expectedFirst.id !== actualFirst.id) {
      console.log('\n🚨 PROBLEMA ENCONTRADO!')
      console.log(`   ❌ Esperado em 1º: "${expectedFirst.title}" (Score: ${expectedFirst.calculated_score.toFixed(2)})`)
      console.log(`   ❌ Atual em 1º: "${actualFirst.title}" (Score: ${actualFirst.engagement_score})`)
      console.log('\n🔧 NECESSÁRIO CORRIGIR A FUNÇÃO get_featured_articles()!')
    } else {
      console.log('\n✅ Ordenação está correta!')
    }
  }
  
  // 5. VERIFICAR FEEDBACKS ESPECÍFICOS MENCIONADOS
  console.log('\n🔍 5. PROCURANDO ARTIGO COM 7 FEEDBACKS:')
  const articleWith7Feedbacks = allArticles.find(a => a.positive_feedbacks === 7)
  if (articleWith7Feedbacks) {
    console.log(`   ✅ Encontrado: "${articleWith7Feedbacks.title}"`)
    console.log(`   📊 Score: ${((articleWith7Feedbacks.positive_feedbacks * 3) + (articleWith7Feedbacks.comments_count * 2) + (articleWith7Feedbacks.likes_count * 1.5) + (articleWith7Feedbacks.total_views * 0.1) - (articleWith7Feedbacks.negative_feedbacks * 1)).toFixed(2)}`)
  } else {
    console.log('   ❌ Nenhum artigo com exatamente 7 feedbacks positivos encontrado')
  }
  
  console.log('\n🔍 PROCURANDO ARTIGOS COM 2 FEEDBACKS:')
  const articlesWith2Feedbacks = allArticles.filter(a => a.positive_feedbacks === 2)
  if (articlesWith2Feedbacks.length > 0) {
    articlesWith2Feedbacks.forEach(article => {
      const score = (article.positive_feedbacks * 3) + (article.comments_count * 2) + (article.likes_count * 1.5) + (article.total_views * 0.1) - (article.negative_feedbacks * 1)
      console.log(`   ✅ "${article.title}" - Score: ${score.toFixed(2)}`)
    })
  } else {
    console.log('   ❌ Nenhum artigo com exatamente 2 feedbacks positivos encontrado')
  }

} catch (error) {
  console.error('❌ ERRO GERAL:', error)
  process.exit(1)
}