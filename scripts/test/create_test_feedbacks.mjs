import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🧪 CRIANDO FEEDBACKS DE TESTE PARA VALIDAR ORDENAÇÃO')
console.log('=' .repeat(60))

try {
  // 1. BUSCAR ARTIGOS DISPONÍVEIS
  console.log('\n📚 1. BUSCANDO ARTIGOS DISPONÍVEIS:')
  
  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('id, title')
    .eq('published', true)
    .limit(3)
  
  if (articlesError) {
    console.error('❌ ERRO ao buscar artigos:', articlesError)
    process.exit(1)
  }
  
  console.log(`✅ ${articles.length} artigos encontrados:`)
  articles.forEach((article, index) => {
    console.log(`   ${index + 1}. ${article.title} (ID: ${article.id})`)
  })
  
  // 2. CRIAR FEEDBACKS DE TESTE
  console.log('\n👍 2. CRIANDO FEEDBACKS DE TESTE:')
  
  // Artigo 1: 7 feedbacks positivos (para ser o primeiro)
  console.log(`\n   Criando 7 feedbacks positivos para: "${articles[0].title}"`)
  for (let i = 0; i < 7; i++) {
    const { error } = await supabase
      .from('feedbacks')
      .insert({
        article_id: articles[0].id,
        type: 'positive',
        user_ip: `192.168.1.${i + 1}`,
        user_agent: 'Test Browser'
      })
    
    if (error) {
      console.error(`❌ Erro ao criar feedback ${i + 1}:`, error)
    } else {
      console.log(`   ✅ Feedback ${i + 1}/7 criado`)
    }
  }
  
  // Artigo 2: 2 feedbacks positivos (para ser o segundo)
  console.log(`\n   Criando 2 feedbacks positivos para: "${articles[1].title}"`)
  for (let i = 0; i < 2; i++) {
    const { error } = await supabase
      .from('feedbacks')
      .insert({
        article_id: articles[1].id,
        type: 'positive',
        user_ip: `192.168.2.${i + 1}`,
        user_agent: 'Test Browser'
      })
    
    if (error) {
      console.error(`❌ Erro ao criar feedback ${i + 1}:`, error)
    } else {
      console.log(`   ✅ Feedback ${i + 1}/2 criado`)
    }
  }
  
  // Artigo 3: 1 feedback positivo (para ser o terceiro)
  console.log(`\n   Criando 1 feedback positivo para: "${articles[2].title}"`)
  const { error: feedback3Error } = await supabase
    .from('feedbacks')
    .insert({
      article_id: articles[2].id,
      type: 'positive',
      user_ip: '192.168.3.1',
      user_agent: 'Test Browser'
    })
  
  if (feedback3Error) {
    console.error('❌ Erro ao criar feedback:', feedback3Error)
  } else {
    console.log('   ✅ Feedback criado')
  }
  
  // 3. AGUARDAR TRIGGERS ATUALIZAREM
  console.log('\n⏳ 3. AGUARDANDO TRIGGERS ATUALIZAREM CONTADORES...')
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // 4. VERIFICAR CONTADORES ATUALIZADOS
  console.log('\n📊 4. VERIFICANDO CONTADORES ATUALIZADOS:')
  
  const { data: updatedArticles, error: updateError } = await supabase
    .from('articles')
    .select('id, title, positive_feedbacks, negative_feedbacks, comments_count, likes_count')
    .eq('published', true)
    .order('positive_feedbacks', { ascending: false })
  
  if (updateError) {
    console.error('❌ ERRO ao buscar artigos atualizados:', updateError)
  } else {
    console.log('\n✅ CONTADORES ATUALIZADOS:')
    updatedArticles.forEach((article, index) => {
      const score = (article.positive_feedbacks * 3) + (article.comments_count * 2) + (article.likes_count * 1.5) - (article.negative_feedbacks * 1)
      console.log(`\n   ${index + 1}. ${article.title}`)
      console.log(`      👍 Feedbacks+: ${article.positive_feedbacks}`)
      console.log(`      👎 Feedbacks-: ${article.negative_feedbacks}`)
      console.log(`      💬 Comentários: ${article.comments_count}`)
      console.log(`      ❤️ Likes: ${article.likes_count}`)
      console.log(`      🧮 Score: ${score.toFixed(2)}`)
    })
  }
  
  // 5. TESTAR FUNÇÃO get_featured_articles()
  console.log('\n🎯 5. TESTANDO FUNÇÃO get_featured_articles():')
  
  const { data: featuredResult, error: featuredError } = await supabase
    .rpc('get_featured_articles')
  
  if (featuredError) {
    console.error('❌ ERRO na função:', featuredError)
  } else {
    console.log(`\n✅ Função retornou ${featuredResult.length} artigos:`)
    featuredResult.forEach((article, index) => {
      console.log(`\n   ${index + 1}. ${article.title}`)
      console.log(`      📊 Score: ${article.engagement_score}`)
    })
    
    // Verificar se a ordenação está correta
    if (featuredResult.length >= 2) {
      if (featuredResult[0].engagement_score >= featuredResult[1].engagement_score) {
        console.log('\n✅ ORDENAÇÃO CORRETA! Artigo com maior score em primeiro!')
      } else {
        console.log('\n❌ ORDENAÇÃO INCORRETA! Precisa corrigir a função!')
      }
    }
  }
  
  console.log('\n🎉 TESTE CONCLUÍDO!')
  console.log('Agora você pode verificar no painel admin se os feedbacks aparecem corretamente!')

} catch (error) {
  console.error('❌ ERRO GERAL:', error)
  process.exit(1)
}