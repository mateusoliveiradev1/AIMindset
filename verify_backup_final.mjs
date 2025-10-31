import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyBackupFinal() {
  console.log('🔍 Verificação final do backup de logs...\n');

  try {
    // 1. Executar backup novamente
    console.log('1️⃣ Executando backup...');
    const { data: backupResult, error: backupError } = await supabase.rpc('backup_all_data');
    
    if (backupError) {
      console.error('❌ Erro no backup:', backupError);
      return;
    }
    
    console.log('✅ Backup executado:', backupResult);
    console.log('');

    // 2. Aguardar um pouco para garantir que os dados foram inseridos
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Verificar contagens nas tabelas de backup
    console.log('2️⃣ Verificando tabelas de backup após execução...');
    
    const tables = ['backend_logs_backup', 'app_logs_backup', 'system_logs_backup'];
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`❌ Erro ao contar ${table}:`, error);
      } else {
        console.log(`📊 ${table}: ${count} registros`);
      }
    }

    // 4. Verificar alguns registros específicos
    console.log('\n3️⃣ Verificando registros específicos...');
    
    const { data: backendLogs, error: backendError } = await supabase
      .from('backend_logs_backup')
      .select('*')
      .limit(3);
    
    if (backendError) {
      console.error('❌ Erro ao buscar backend_logs_backup:', backendError);
    } else {
      console.log(`📋 Primeiros registros backend_logs_backup: ${backendLogs?.length || 0}`);
      if (backendLogs && backendLogs.length > 0) {
        console.log('   Exemplo:', {
          id: backendLogs[0].id,
          table_name: backendLogs[0].table_name,
          action: backendLogs[0].action,
          created_at: backendLogs[0].created_at
        });
      }
    }

    const { data: systemLogs, error: systemError } = await supabase
      .from('system_logs_backup')
      .select('*')
      .limit(3);
    
    if (systemError) {
      console.error('❌ Erro ao buscar system_logs_backup:', systemError);
    } else {
      console.log(`📋 Primeiros registros system_logs_backup: ${systemLogs?.length || 0}`);
      if (systemLogs && systemLogs.length > 0) {
        console.log('   Exemplo:', {
          id: systemLogs[0].id,
          type: systemLogs[0].type,
          message: systemLogs[0].message,
          created_at: systemLogs[0].created_at
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

verifyBackupFinal();