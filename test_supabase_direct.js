// TESTE DIRETO NO SUPABASE - BYPASS COMPLETO DO FRONTEND
// Este script testa inserção direta no Supabase para identificar se o problema é frontend ou backend

import { createClient } from '@supabase/supabase-js'

// Configurações do Supabase (usando as mesmas do projeto)
const SUPABASE_URL = 'https://jywjqzhqynhnhetidzsa.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ'

// Cliente Supabase com configurações otimizadas
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
  },
})

// Função para gerar conteúdo grande
function generateLargeContent(sizeInKB) {
  const targetSize = sizeInKB * 1024 // Converter KB para bytes
  let content = ''
  const baseText = 'Este é um texto de teste para artigo grande. '
  
  while (content.length < targetSize) {
    content += baseText + `Parágrafo ${Math.floor(content.length / 100) + 1}. `
    content += 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '
    content += 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. '
    content += 'Ut enim ad minim veniam, quis nostrud exercitation ullamco. '
    content += '\n\n'
  }
  
  return content.substring(0, targetSize)
}

// Função para testar inserção direta
async function testDirectInsert(sizeInKB) {
  console.log(`\n🔥 TESTE DIRETO SUPABASE - ${sizeInKB}KB`)
  console.log('=' .repeat(50))
  
  const startTime = Date.now()
  
  try {
    // Gerar dados de teste
    const content = generateLargeContent(sizeInKB)
    const articleData = {
      title: `Teste Direto ${sizeInKB}KB - ${new Date().toISOString()}`,
      slug: `teste-direto-${sizeInKB}kb-${Date.now()}`,
      excerpt: `Artigo de teste com ${sizeInKB}KB gerado diretamente no Supabase`,
      content: content,
      tags: 'teste,direto,supabase',
      category_id: null, // UUID válido ou null
      published: false
    }
    
    console.log('📊 DADOS PREPARADOS:')
    console.log(`   - Título: ${articleData.title}`)
    console.log(`   - Slug: ${articleData.slug}`)
    console.log(`   - Tamanho do conteúdo: ${content.length} caracteres`)
    console.log(`   - Tamanho em bytes: ${new TextEncoder().encode(content).length}`)
    console.log(`   - Tamanho em KB: ${(new TextEncoder().encode(content).length / 1024).toFixed(2)}`)
    console.log(`   - Tags: ${articleData.tags}`)
    
    // Testar inserção
    console.log('\n🚀 INICIANDO INSERÇÃO DIRETA...')
    const insertStart = Date.now()
    
    const { data, error } = await supabase
      .from('articles')
      .insert([articleData])
      .select()
    
    const insertEnd = Date.now()
    const duration = insertEnd - insertStart
    
    if (error) {
      console.error('❌ ERRO NA INSERÇÃO:')
      console.error(`   - Código: ${error.code}`)
      console.error(`   - Mensagem: ${error.message}`)
      console.error(`   - Detalhes: ${error.details}`)
      console.error(`   - Hint: ${error.hint}`)
      console.error(`   - Duração até erro: ${duration}ms`)
      return false
    }
    
    console.log('✅ SUCESSO NA INSERÇÃO!')
    console.log(`   - ID do artigo: ${data[0]?.id}`)
    console.log(`   - Duração: ${duration}ms (${(duration/1000).toFixed(2)}s)`)
    console.log(`   - Dados retornados: ${JSON.stringify(data[0], null, 2).substring(0, 200)}...`)
    
    return true
    
  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error('💥 ERRO CRÍTICO:')
    console.error(`   - Tipo: ${error.name}`)
    console.error(`   - Mensagem: ${error.message}`)
    console.error(`   - Stack: ${error.stack?.substring(0, 300)}...`)
    console.error(`   - Tempo total: ${totalTime}ms`)
    return false
  }
}

// Função principal de teste
async function runTests() {
  console.log('🎯 INICIANDO TESTES DIRETOS NO SUPABASE')
  console.log('Objetivo: Identificar se o problema é frontend ou backend')
  console.log('Data/Hora:', new Date().toISOString())
  console.log('\n')
  
  // Testar diferentes tamanhos
  const sizes = [1, 5, 10, 25, 50, 100] // KB
  
  for (const size of sizes) {
    const success = await testDirectInsert(size)
    
    if (!success) {
      console.log(`\n🚨 FALHA DETECTADA NO TAMANHO: ${size}KB`)
      console.log('Este é o limite onde o problema ocorre!')
      break
    }
    
    // Pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('\n🏁 TESTES CONCLUÍDOS')
  console.log('Verifique os resultados acima para identificar o ponto de falha')
}

// Executar testes
runTests().catch(console.error)

// INSTRUÇÕES DE USO:
// 1. Execute: node test_supabase_direct.js
// 2. Observe onde exatamente falha
// 3. Compare com os testes do frontend
// 4. Identifique se o problema é no Supabase ou no frontend