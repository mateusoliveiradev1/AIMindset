import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkBackupLogs() {
  try {
    console.log('🔍 Verificando logs de backup no Supabase...\n');

    // 1. Verificar logs recentes de backup
    console.log('1️⃣ Buscando logs de backup recentes...');
    const { data: backupLogs, error: logsError } = await supabase
      .from('system_logs')
      .select('*')
      .in('type', ['backup_start', 'backup_success', 'backup_error', 'backup_critical_error'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (logsError) {
      console.error('❌ Erro ao buscar logs:', logsError);
    } else {
      console.log(`✅ Encontrados ${backupLogs.length} logs de backup:`);
      backupLogs.forEach((log, index) => {
        console.log(`   ${index + 1}. [${log.created_at}] ${log.type}: ${log.message}`);
        if (log.context) {
          console.log(`      Context: ${JSON.stringify(log.context, null, 2)}`);
        }
      });
    }

    // 2. Verificar função check_backup_health
    console.log('\n2️⃣ Executando check_backup_health...');
    const { data: healthData, error: healthError } = await supabase
      .rpc('check_backup_health');

    if (healthError) {
      console.error('❌ Erro na função check_backup_health:', healthError);
    } else {
      console.log('✅ Status de saúde do backup:');
      console.log(JSON.stringify(healthData, null, 2));
    }

    // 3. Verificar logs de backup_logs (tabela específica)
    console.log('\n3️⃣ Verificando tabela backup_logs...');
    const { data: backupLogsTable, error: backupLogsError } = await supabase
      .from('backup_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (backupLogsError) {
      console.error('❌ Erro ao buscar backup_logs:', backupLogsError);
    } else {
      console.log(`✅ Encontrados ${backupLogsTable.length} registros na tabela backup_logs:`);
      backupLogsTable.forEach((log, index) => {
        console.log(`   ${index + 1}. [${log.created_at}] ${log.action_type}: ${log.records_affected} registros - ${log.success ? 'SUCESSO' : 'FALHA'}`);
        if (log.details) {
          console.log(`      Detalhes: ${log.details}`);
        }
      });
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

checkBackupLogs();