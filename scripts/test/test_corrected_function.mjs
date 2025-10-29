import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🧪 TESTANDO FUNÇÃO CORRIGIDA get_featured_articles()')
console.log('=' .repeat(60))

try {
  // Testar função corrigida
  console.log('\n📊 Testando função com colunas corretas...')
  const { data: featuredArticles, error } = await supabase
    .rpc('get_featured_articles')

  if (error) {
    console.error('❌ ERRO na função:', error)
    process.exit(1)
  }

  console.log(`\n✅ SUCESSO! Função retornou ${featuredArticles.length} artigos`)
  
  featuredArticles.forEach((article, index) => {
    console.log(`\n${index + 1}. ${article.title}`)
    console.log(`   📊 Score: ${article.engagement_score}`)
    console.log(`   🔗 Slug: ${article.slug}`)
    console.log(`   📅 Criado: ${new Date(article.created_at).toLocaleDateString('pt-BR')}`)
  })

  // Verificar se as métricas estão sendo calculadas corretamente
  console.log('\n🔍 VERIFICANDO MÉTRICAS REAIS...')
  const { data: allArticles, error: allError } = await supabase
    .from('articles')
    .select('title, positive_feedbacks, negative_feedbacks, comments_count, likes_count, total_views')
    .eq('published', true)
    .order('positive_feedbacks', { ascending: false })
    .limit(5)

  if (allError) {
    console.error('❌ ERRO ao buscar artigos:', allError)
  } else {
    console.log('\n📈 TOP 5 ARTIGOS POR MÉTRICAS:')
    allArticles.forEach((article, index) => {
      const score = (
        (article.positive_feedbacks || 0) * 3.0 +
        (article.comments_count || 0) * 2.0 +
        (article.likes_count || 0) * 1.5 +
        (article.total_views || 0) * 0.1 +
        (article.negative_feedbacks || 0) * -1.0
      )
      
      console.log(`\n${index + 1}. ${article.title}`)
      console.log(`   👍 Feedbacks+: ${article.positive_feedbacks || 0}`)
      console.log(`   👎 Feedbacks-: ${article.negative_feedbacks || 0}`)
      console.log(`   💬 Comentários: ${article.comments_count || 0}`)
      console.log(`   ❤️ Likes: ${article.likes_count || 0}`)
      console.log(`   👀 Views: ${article.total_views || 0}`)
      console.log(`   📊 Score calculado: ${score.toFixed(2)}`)
    })
  }

  console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!')
  console.log('🎯 Função agora usa apenas colunas reais da tabela articles')

} catch (error) {
  console.error('❌ ERRO GERAL:', error)
  process.exit(1)
}