const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 TESTE COM FUNÇÃO SQL PERSONALIZADA')
console.log('============================================================')

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testSQLFunction() {
  try {
    const articleId = 'ecbdb9c4-21df-4fa7-82bb-62708536076f'
    
    console.log('\n1️⃣ ESTADO ATUAL DO ARTIGO:')
    
    // Verificar estado atual
    const { data: currentState, error: currentError } = await supabase
      .from('articles')
      .select('id, title, published, updated_at')
      .eq('id', articleId)
      .single()
    
    if (currentError) {
      console.log('❌ Erro ao buscar estado atual:', currentError)
      return
    }
    
    console.log('📊 Estado atual:', currentState)
    
    const newValue = !currentState.published
    console.log(`🔄 Tentando alterar de ${currentState.published} para ${newValue}`)
    
    console.log('\n2️⃣ EXECUTANDO SQL VIA FUNÇÃO PERSONALIZADA:')
    
    // Usar função SQL personalizada
    const sqlQuery = `UPDATE articles SET published = ${newValue}, updated_at = CURRENT_TIMESTAMP WHERE id = '${articleId}'`
    
    const { data: sqlResult, error: sqlError } = await supabase.rpc('execute_sql', {
      sql_query: sqlQuery
    })
    
    if (sqlError) {
      console.log('❌ Erro na função SQL:', sqlError)
    } else {
      console.log('✅ Função SQL executada:', sqlResult)
    }
    
    console.log('\n3️⃣ VERIFICANDO ESTADO APÓS FUNÇÃO SQL:')
    
    // Verificar se mudou
    const { data: newState, error: newError } = await supabase
      .from('articles')
      .select('id, title, published, updated_at')
      .eq('id', articleId)
      .single()
    
    if (newError) {
      console.log('❌ Erro ao verificar novo estado:', newError)
    } else {
      console.log('📊 Estado após função SQL:', newState)
      
      if (newState.published === newValue) {
        console.log('✅ SUCCESS: Estado foi alterado com sucesso!')
      } else {
        console.log('❌ FALHA: Estado não foi alterado')
      }
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

testSQLFunction()
  .then(() => {
    console.log('\n============================================================')
    console.log('🏁 TESTE COM FUNÇÃO SQL CONCLUÍDO')
    console.log('✅ Teste finalizado')
  })
  .catch(console.error)