// Script para verificar políticas RLS
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0'

// Usando service role key para verificar políticas
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ'

const supabaseAnon = createClient(supabaseUrl, supabaseKey)
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

async function checkRLS() {
  console.log('🔍 Verificando políticas RLS...')
  
  try {
    // 1. Verificar políticas para categories
    console.log('\n1. Verificando políticas RLS para categories:')
    const { data: categoriesPolicies, error: categoriesPoliciesError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'categories')
    
    if (categoriesPoliciesError) {
      console.error('❌ Erro ao buscar políticas de categories:', categoriesPoliciesError)
    } else {
      console.log('📋 Políticas de categories:', categoriesPolicies)
    }

    // 2. Verificar políticas para articles
    console.log('\n2. Verificando políticas RLS para articles:')
    const { data: articlesPolicies, error: articlesPoliciesError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'articles')
    
    if (articlesPoliciesError) {
      console.error('❌ Erro ao buscar políticas de articles:', articlesPoliciesError)
    } else {
      console.log('📋 Políticas de articles:', articlesPolicies)
    }

    // 3. Testar acesso com cliente anônimo (como no frontend)
    console.log('\n3. Testando acesso com cliente anônimo:')
    
    const { data: anonCategories, error: anonCategoriesError } = await supabaseAnon
      .from('categories')
      .select('*')
    
    console.log('🔍 Categorias com cliente anônimo:', anonCategories?.length || 0, 'erro:', anonCategoriesError)

    const { data: anonArticles, error: anonArticlesError } = await supabaseAnon
      .from('articles')
      .select('*')
      .eq('published', true)
    
    console.log('🔍 Artigos com cliente anônimo:', anonArticles?.length || 0, 'erro:', anonArticlesError)

    // 4. Testar acesso com service role (admin)
    console.log('\n4. Testando acesso com service role:')
    
    const { data: adminCategories, error: adminCategoriesError } = await supabaseAdmin
      .from('categories')
      .select('*')
    
    console.log('🔍 Categorias com service role:', adminCategories?.length || 0, 'erro:', adminCategoriesError)

    const { data: adminArticles, error: adminArticlesError } = await supabaseAdmin
      .from('articles')
      .select('*')
    
    console.log('🔍 Artigos com service role:', adminArticles?.length || 0, 'erro:', adminArticlesError)

  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

checkRLS()