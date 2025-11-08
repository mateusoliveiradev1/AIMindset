import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wnqjqxqxqxqxqxqx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWpxeHF4cXhxeHF4cXgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNTU4NzQ5MSwiZXhwIjoyMDUxMTYzNDkxfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAppLogs() {
  console.log('🧪 Testando inserção de logs na tabela app_logs...');
  
  try {
    // Inserir alguns logs de teste
    const testLogs = [
      {
        level: 'info',
        source: 'test',
        action: 'test_log_1',
        details: { message: 'Primeiro log de teste', timestamp: new Date().toISOString() },
        user_id: 'test-user-1'
      },
      {
        level: 'success',
        source: 'test',
        action: 'test_log_2',
        details: { message: 'Segundo log de teste', timestamp: new Date().toISOString() },
        user_id: 'test-user-2'
      },
      {
        level: 'warning',
        source: 'test',
        action: 'test_log_3',
        details: { message: 'Terceiro log de teste', timestamp: new Date().toISOString() },
        user_id: 'test-user-3'
      }
    ];

    for (const log of testLogs) {
      const { data, error } = await supabase.rpc('insert_app_log', {
        p_level: log.level,
        p_source: log.source,
        p_action: log.action,
        p_details: log.details,
        p_user_id: log.user_id
      });

      if (error) {
        console.error('❌ Erro ao inserir log:', error);
      } else {
        console.log('✅ Log inserido com sucesso:', log.action);
      }
    }

    // Verificar quantos logs existem agora
    const { data: logs, error: countError, count } = await supabase
      .from('app_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (countError) {
      console.error('❌ Erro ao contar logs:', countError);
    } else {
      console.log(`📊 Total de logs na tabela app_logs: ${count}`);
      console.log('📋 Últimos 5 logs:');
      logs?.slice(0, 5).forEach((log, index) => {
        console.log(`${index + 1}. ${log.action} (${log.level}) - ${log.created_at}`);
      });
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

testAppLogs();