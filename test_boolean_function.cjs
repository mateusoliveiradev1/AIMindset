const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 TESTE COM FUNÇÃO BOOLEAN NATIVA')
console.log('============================================================')

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testBooleanFunction() {
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
    
    console.log('\n2️⃣ TESTANDO FUNÇÃO COM BOOLEAN NATIVO:')
    
    // Usar função com BOOLEAN direto
    const { data: boolResult, error: boolError } = await supabase.rpc('emergency_update_published', {
      article_id: articleId,
      published_value: newValue  // BOOLEAN direto
    })
    
    if (boolError) {
      console.log('❌ Erro na função BOOLEAN:', boolError)
    } else {
      console.log('✅ Função BOOLEAN executada:', boolResult)
    }
    
    console.log('\n3️⃣ VERIFICANDO ESTADO APÓS FUNÇÃO BOOLEAN:')
    
    // Verificar se mudou
    const { data: newState, error: newError } = await supabase
      .from('articles')
      .select('id, title, published, updated_at')
      .eq('id', articleId)
      .single()
    
    if (newError) {
      console.log('❌ Erro ao verificar novo estado:', newError)
    } else {
      console.log('📊 Estado após função BOOLEAN:', newState)
      
      if (newState.published === newValue) {
        console.log('✅ SUCCESS: Estado foi alterado com sucesso!')
        
        // Testar voltando ao estado original
        console.log('\n4️⃣ TESTANDO VOLTA AO ESTADO ORIGINAL:')
        
        const { data: revertResult, error: revertError } = await supabase.rpc('emergency_update_published', {
          article_id: articleId,
          published_value: currentState.published  // Voltar ao original
        })
        
        if (revertError) {
          console.log('❌ Erro ao reverter:', revertError)
        } else {
          console.log('✅ Reversão executada:', revertResult)
          
          // Verificar se voltou
          const { data: finalState, error: finalError } = await supabase
            .from('articles')
            .select('id, title, published, updated_at')
            .eq('id', articleId)
            .single()
          
          if (finalError) {
            console.log('❌ Erro ao verificar estado final:', finalError)
          } else {
            console.log('📊 Estado final:', finalState)
            
            if (finalState.published === currentState.published) {
              console.log('✅ PERFEITO: Função está funcionando 100%!')
            } else {
              console.log('❌ Problema na reversão')
            }
          }
        }
        
      } else {
        console.log('❌ FALHA: Estado não foi alterado')
      }
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

testBooleanFunction()
  .then(() => {
    console.log('\n============================================================')
    console.log('🏁 TESTE COM FUNÇÃO BOOLEAN CONCLUÍDO')
    console.log('✅ Teste finalizado')
  })
  .catch(console.error)