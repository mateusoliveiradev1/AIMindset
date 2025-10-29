import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 VERIFICANDO DISCREPÂNCIA ADMIN vs BANCO')
console.log('=' .repeat(60))

try {
  // 1. VERIFICAR SE HÁ FEEDBACKS NA TABELA feedbacks
  console.log('\n📊 1. VERIFICANDO TABELA feedbacks:')
  
  const { data: feedbacks, error: feedbacksError } = await supabase
    .from('feedbacks')
    .select('*')
  
  if (feedbacksError) {
    console.error('❌ ERRO ao buscar feedbacks:', feedbacksError)
  } else {
    console.log(`✅ ${feedbacks.length} feedbacks encontrados na tabela feedbacks`)
    if (feedbacks.length > 0) {
      console.log('📋 Primeiros 5 feedbacks:')
      feedbacks.slice(0, 5).forEach((feedback, index) => {
        console.log(`   ${index + 1}. Artigo: ${feedback.article_id}, Tipo: ${feedback.type}, Criado: ${feedback.created_at}`)
      })
    }
  }
  
  // 2. VERIFICAR SE HÁ COMENTÁRIOS NA TABELA comments
  console.log('\n💬 2. VERIFICANDO TABELA comments:')
  
  const { data: comments, error: commentsError } = await supabase
    .from('comments')
    .select('*')
  
  if (commentsError) {
    console.error('❌ ERRO ao buscar comentários:', commentsError)
  } else {
    console.log(`✅ ${comments.length} comentários encontrados na tabela comments`)
    if (comments.length > 0) {
      console.log('📋 Primeiros 5 comentários:')
      comments.slice(0, 5).forEach((comment, index) => {
        console.log(`   ${index + 1}. Artigo: ${comment.article_id}, Autor: ${comment.author_name}, Criado: ${comment.created_at}`)
      })
    }
  }
  
  // 3. VERIFICAR CONTADORES NA TABELA articles NOVAMENTE
  console.log('\n📈 3. VERIFICANDO CONTADORES NA TABELA articles:')
  
  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('id, title, positive_feedbacks, negative_feedbacks, comments_count, likes_count, total_views')
    .eq('published', true)
    .order('positive_feedbacks', { ascending: false })
  
  if (articlesError) {
    console.error('❌ ERRO ao buscar artigos:', articlesError)
  } else {
    console.log(`✅ ${articles.length} artigos encontrados`)
    console.log('\n📊 CONTADORES ATUAIS:')
    articles.forEach((article, index) => {
      console.log(`\n   ${index + 1}. ${article.title}`)
      console.log(`      👍 Feedbacks+: ${article.positive_feedbacks}`)
      console.log(`      👎 Feedbacks-: ${article.negative_feedbacks}`)
      console.log(`      💬 Comentários: ${article.comments_count}`)
      console.log(`      ❤️ Likes: ${article.likes_count}`)
      console.log(`      👀 Views: ${article.total_views}`)
    })
  }
  
  // 4. VERIFICAR SE HÁ TRIGGERS FUNCIONANDO
  console.log('\n⚙️ 4. TESTANDO SE TRIGGERS ESTÃO FUNCIONANDO:')
  
  if (feedbacks.length > 0 && articles.length > 0) {
    // Contar feedbacks positivos por artigo manualmente
    const feedbackCounts = {}
    feedbacks.forEach(feedback => {
      if (!feedbackCounts[feedback.article_id]) {
        feedbackCounts[feedback.article_id] = { positive: 0, negative: 0 }
      }
      if (feedback.type === 'positive') {
        feedbackCounts[feedback.article_id].positive++
      } else if (feedback.type === 'negative') {
        feedbackCounts[feedback.article_id].negative++
      }
    })
    
    console.log('\n🧮 CONTAGEM MANUAL DE FEEDBACKS:')
    Object.entries(feedbackCounts).forEach(([articleId, counts]) => {
      const article = articles.find(a => a.id === articleId)
      if (article) {
        console.log(`\n   📄 ${article.title}`)
        console.log(`      🧮 Manual - Positivos: ${counts.positive}, Negativos: ${counts.negative}`)
        console.log(`      📊 Banco - Positivos: ${article.positive_feedbacks}, Negativos: ${article.negative_feedbacks}`)
        
        if (counts.positive !== article.positive_feedbacks || counts.negative !== article.negative_feedbacks) {
          console.log(`      🚨 DISCREPÂNCIA ENCONTRADA!`)
        } else {
          console.log(`      ✅ Contadores sincronizados`)
        }
      }
    })
  }
  
  // 5. VERIFICAR CACHE DO FRONTEND
  console.log('\n🗄️ 5. POSSÍVEL PROBLEMA DE CACHE:')
  console.log('   Se o painel admin mostra 7 feedbacks mas o banco tem 0,')
  console.log('   pode ser um problema de:')
  console.log('   - Cache do navegador')
  console.log('   - Cache do React/Frontend')
  console.log('   - Cache do Supabase')
  console.log('   - Dados não sincronizados')
  
  console.log('\n🔧 SOLUÇÕES RECOMENDADAS:')
  console.log('   1. Limpar cache do navegador (Ctrl+Shift+R)')
  console.log('   2. Verificar se há cache no código React')
  console.log('   3. Forçar refresh dos dados no painel admin')
  console.log('   4. Verificar se triggers estão funcionando')

} catch (error) {
  console.error('❌ ERRO GERAL:', error)
  process.exit(1)
}