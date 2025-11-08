// Script para testar as funções RPC no console do navegador
// Cole este código no console do navegador (F12) na página do admin

console.log('🔍 Iniciando teste das funções RPC...');

// Teste 1: Verificar se o Supabase está disponível
console.log('1. Verificando cliente Supabase:', window.supabase ? '✅ Disponível' : '❌ Não encontrado');

if (!window.supabase) {
  console.error('❌ Cliente Supabase não encontrado! Verifique se a página carregou corretamente.');
} else {
  console.log('📊 Cliente Supabase:', window.supabase);
  
  // Teste 2: Testar função RPC simples
  console.log('2. Testando função test_alert_system_simple...');
  
  window.supabase.rpc('test_alert_system_simple', {
    alert_type: 'app_error',
    test_message: 'Teste manual do console do navegador'
  })
  .then(result => {
    console.log('✅ Resultado test_alert_system_simple:', result);
    
    // Teste 3: Testar função RPC completa
    console.log('3. Testando função test_alert_system...');
    return window.supabase.rpc('test_alert_system', {
      alert_type: 'security',
      test_message: 'Teste completo do console do navegador'
    });
  })
  .then(result => {
    console.log('✅ Resultado test_alert_system:', result);
  })
  .catch(error => {
    console.error('❌ Erro durante os testes:', error);
    console.error('Detalhes do erro:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
  });
}

// Teste 4: Verificar logs recentes
console.log('4. Verificando logs recentes...');
window.supabase
  .from('system_logs')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(5)
  .then(result => {
    console.log('📋 Logs recentes:', result);
  })
  .catch(error => {
    console.error('❌ Erro ao buscar logs:', error);
  });