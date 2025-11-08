import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('⚡ Teste Rápido do Sistema de Logs\n');

async function testLogsQuick() {
  try {
    // Teste rápido: Verificar se consegue acessar e criar logs
    console.log('🔍 Verificando acesso às tabelas...');
    
    const { data, error } = await supabase
      .from('app_logs')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Erro no acesso:', error.message);
      return false;
    }

    console.log('✅ Acesso OK');
    
    // Criar um log de teste
    console.log('📝 Criando log de teste...');
    const { data: newLog, error: insertError } = await supabase
      .from('app_logs')
      .insert({
        level: 'info',
        source: 'quick_test',
        action: 'quick_test_log',
        details: { message: 'Teste rápido executado com sucesso' }
      })
      .select();

    if (insertError) {
      console.log('❌ Erro ao criar log:', insertError.message);
      return false;
    }

    console.log('✅ Log criado com sucesso');
    console.log('🎉 TESTE RÁPIDO PASSOU!');
    return true;

  } catch (error) {
    console.log('❌ Erro geral:', error.message);
    return false;
  }
}

testLogsQuick().catch(console.error);