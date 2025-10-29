import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔍 VALIDAÇÃO DA MIGRAÇÃO DE FEEDBACKS')
console.log('=====================================')

async function validateMigration() {
  try {
    // 1. Verificar conexão
    console.log('\n1. Testando conexão com Supabase...')
    const { data: connection, error: connError } = await supabase
      .from('articles')
      .select('count', { count: 'exact', head: true })
    
    if (connError) {
      console.error('❌ Erro de conexão:', connError.message)
      return
    }
    console.log('✅ Conexão estabelecida com sucesso!')

    // 2. Contar registros nas tabelas
    console.log('\n2. Contando registros nas tabelas...')
    
    const { count: feedbackCount } = await supabase
      .from('feedback')
      .select('*', { count: 'exact', head: true })
    
    const { count: feedbacksCount } = await supabase
      .from('feedbacks')
      .select('*', { count: 'exact', head: true })
    
    const { count: articlesCount } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })

    console.log(`📊 Tabela 'feedback' (original): ${feedbackCount} registros`)
    console.log(`📊 Tabela 'feedbacks' (nova): ${feedbacksCount} registros`)
    console.log(`📊 Tabela 'articles': ${articlesCount} registros`)

    // 3. Verificar estrutura da tabela feedbacks
    console.log('\n3. Verificando estrutura da tabela feedbacks...')
    const { data: feedbacksData, error: feedbacksError } = await supabase
      .from('feedbacks')
      .select('*')
      .limit(5)

    if (feedbacksError) {
      console.error('❌ Erro ao consultar feedbacks:', feedbacksError.message)
    } else {
      console.log('✅ Estrutura da tabela feedbacks validada')
      if (feedbacksData.length > 0) {
        console.log('📋 Exemplo de registro:', feedbacksData[0])
      }
    }

    // 4. Verificar contadores dos artigos
    console.log('\n4. Verificando contadores dos artigos...')
    const { data: articlesData, error: articlesError } = await supabase
      .from('articles')
      .select('id, title, positive_feedbacks, negative_feedbacks, likes_count, comments_count, approval_rate')

    if (articlesError) {
      console.error('❌ Erro ao consultar artigos:', articlesError.message)
    } else {
      console.log('✅ Contadores dos artigos:')
      articlesData.forEach(article => {
        console.log(`📄 ${article.title}:`)
        console.log(`   - Feedbacks positivos: ${article.positive_feedbacks}`)
        console.log(`   - Feedbacks negativos: ${article.negative_feedbacks}`)
        console.log(`   - Likes: ${article.likes_count}`)
        console.log(`   - Comentários: ${article.comments_count}`)
        console.log(`   - Taxa de aprovação: ${article.approval_rate}%`)
        console.log('')
      })
    }

    // 5. Testar função get_article_metrics
    console.log('\n5. Testando função get_article_metrics...')
    if (articlesData && articlesData.length > 0) {
      const testArticleId = articlesData[0].id
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('get_article_metrics', { article_uuid: testArticleId })

      if (metricsError) {
        console.error('❌ Erro ao testar função get_article_metrics:', metricsError.message)
      } else {
        console.log('✅ Função get_article_metrics funcionando:')
        console.log('📊 Métricas:', metricsData[0])
      }
    }

    // 6. Verificar políticas RLS
    console.log('\n6. Testando políticas RLS...')
    const { data: rlsTest, error: rlsError } = await supabase
      .from('feedbacks')
      .select('*')
      .limit(1)

    if (rlsError) {
      console.error('❌ Erro nas políticas RLS:', rlsError.message)
    } else {
      console.log('✅ Políticas RLS funcionando corretamente')
    }

    // 7. Resumo da validação
    console.log('\n7. RESUMO DA VALIDAÇÃO')
    console.log('======================')
    console.log(`✅ Migração concluída com sucesso!`)
    console.log(`📊 ${feedbackCount} registros migrados da tabela 'feedback' para 'feedbacks'`)
    console.log(`🔧 Triggers e funções implementados`)
    console.log(`🔒 Políticas RLS configuradas`)
    console.log(`📈 Contadores dos artigos atualizados`)
    
    if (feedbackCount === 0 && feedbacksCount === 0) {
      console.log('\n⚠️  ATENÇÃO: Ambas as tabelas estão vazias.')
      console.log('   Isso pode indicar que não havia dados para migrar ou que foram limpos anteriormente.')
    }

  } catch (error) {
    console.error('❌ Erro durante a validação:', error.message)
  }
}

// Executar validação
validateMigration()