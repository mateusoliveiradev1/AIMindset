const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 INVESTIGAÇÃO COMPLETA - POLÍTICAS RLS')
console.log('============================================================')

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function investigateRLS() {
  try {
    console.log('\n1️⃣ VERIFICANDO POLÍTICAS RLS NA TABELA ARTICLES:')
    
    // Verificar políticas RLS
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'articles')
    
    if (policiesError) {
      console.log('❌ Erro ao buscar políticas:', policiesError)
    } else {
      console.log('📊 Políticas encontradas:', policies?.length || 0)
      policies?.forEach((policy, index) => {
        console.log(`\n📋 Política ${index + 1}:`)
        console.log(`   Nome: ${policy.policyname}`)
        console.log(`   Comando: ${policy.cmd}`)
        console.log(`   Permissivo: ${policy.permissive}`)
        console.log(`   Roles: ${policy.roles}`)
        console.log(`   Qual: ${policy.qual}`)
        console.log(`   With Check: ${policy.with_check}`)
      })
    }
    
    console.log('\n2️⃣ VERIFICANDO STATUS RLS DA TABELA:')
    
    // Verificar se RLS está habilitado
    const { data: tableInfo, error: tableError } = await supabase
      .from('pg_class')
      .select('relname, relrowsecurity, relforcerowsecurity')
      .eq('relname', 'articles')
    
    if (tableError) {
      console.log('❌ Erro ao verificar tabela:', tableError)
    } else {
      console.log('📊 Info da tabela:', tableInfo)
    }
    
    console.log('\n3️⃣ TESTANDO ACESSO DIRETO COM SERVICE_ROLE:')
    
    // Testar select direto
    const { data: selectTest, error: selectError } = await supabase
      .from('articles')
      .select('id, title, published')
      .eq('id', 'ecbdb9c4-21df-4fa7-82bb-62708536076f')
    
    if (selectError) {
      console.log('❌ Erro no SELECT:', selectError)
    } else {
      console.log('✅ SELECT funcionou:', selectTest)
    }
    
    console.log('\n4️⃣ TESTANDO UPDATE DIRETO COM SERVICE_ROLE:')
    
    // Testar update direto
    const { data: updateTest, error: updateError } = await supabase
      .from('articles')
      .update({ 
        published: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'ecbdb9c4-21df-4fa7-82bb-62708536076f')
      .select()
    
    if (updateError) {
      console.log('❌ Erro no UPDATE:', updateError)
    } else {
      console.log('✅ UPDATE funcionou:', updateTest)
    }
    
    console.log('\n5️⃣ VERIFICANDO USUÁRIO ATUAL:')
    
    // Verificar usuário atual
    const { data: userInfo, error: userError } = await supabase.auth.getUser()
    console.log('👤 Usuário atual:', userInfo?.user?.id || 'Nenhum')
    console.log('🔑 Usando service_role:', !!supabaseServiceKey)
    
  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

investigateRLS()
  .then(() => {
    console.log('\n============================================================')
    console.log('🏁 INVESTIGAÇÃO CONCLUÍDA')
    console.log('✅ Verificação finalizada')
  })
  .catch(console.error)