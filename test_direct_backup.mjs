import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🧪 TESTE DIRETO DO BACKUP - PASSO A PASSO')
console.log('==================================================')

async function testStepByStep() {
  try {
    console.log('\n1. 🔍 Verificando tabelas existentes...')
    
    // Verificar se as tabelas existem
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('count', { count: 'exact', head: true })
    
    if (articlesError) {
      console.log('❌ Erro ao verificar articles:', articlesError.message)
      return
    }
    
    console.log(`✅ Tabela articles: ${articles || 0} registros`)
    
    console.log('\n2. 🧪 Testando INSERT direto na tabela backup_articles...')
    
    // Testar INSERT direto
    const { data: insertResult, error: insertError } = await supabase
      .from('backup_articles')
      .insert({
        backup_id: crypto.randomUUID(),
        original_id: crypto.randomUUID(),
        title: 'Teste',
        excerpt: 'Resumo de teste',
        content: 'Conteúdo de teste',
        published: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
    
    if (insertError) {
      console.log('❌ Erro no INSERT direto:', insertError.message)
      return
    }
    
    console.log('✅ INSERT direto funcionou!')
    
    console.log('\n3. 🧪 Testando função backup_all_data com SQL direto...')
    
    // Testar a função diretamente
    const { data: backupResult, error: backupError } = await supabase
      .rpc('backup_all_data')
    
    if (backupError) {
      console.log('❌ Erro na função backup_all_data:', backupError.message)
      console.log('📋 Detalhes do erro:', backupError)
      return
    }
    
    console.log('✅ Função backup_all_data executada!')
    console.log('📊 Resultado:', JSON.stringify(backupResult, null, 2))
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message)
  }
}

testStepByStep()