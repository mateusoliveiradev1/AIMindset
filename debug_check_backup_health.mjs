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

async function debugCheckBackupHealth() {
  try {
    console.log('🔍 Debugando função check_backup_health...\n');

    // 1. Verificar logs backup_success recentes
    console.log('1️⃣ Verificando logs backup_success na tabela system_logs...');
    const { data: backupSuccessLogs, error: logsError } = await supabase
      .from('system_logs')
      .select('*')
      .eq('type', 'backup_success')
      .order('created_at', { ascending: false })
      .limit(5);

    if (logsError) {
      console.error('❌ Erro ao buscar logs backup_success:', logsError);
    } else {
      console.log(`✅ Encontrados ${backupSuccessLogs.length} logs backup_success:`);
      backupSuccessLogs.forEach((log, index) => {
        console.log(`   ${index + 1}. [${log.created_at}] ${log.message}`);
        if (log.context) {
          console.log(`      Context: ${JSON.stringify(log.context, null, 2)}`);
        }
      });
    }

    // 2. Executar check_backup_health
    console.log('\n2️⃣ Executando função check_backup_health...');
    const { data: healthData, error: healthError } = await supabase
      .rpc('check_backup_health');

    if (healthError) {
      console.error('❌ Erro na função check_backup_health:', healthError);
    } else {
      console.log('✅ Resultado da função check_backup_health:');
      console.log(JSON.stringify(healthData, null, 2));
    }

    // 3. Verificar se existe a função check_backup_health
    console.log('\n3️⃣ Verificando se a função check_backup_health existe...');
    const { data: functions, error: functionsError } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'check_backup_health');

    if (functionsError) {
      console.log('⚠️ Não foi possível verificar funções via pg_proc');
    } else {
      console.log(`✅ Função check_backup_health ${functions.length > 0 ? 'existe' : 'NÃO existe'}`);
    }

    // 4. Tentar executar uma query manual similar à função
    console.log('\n4️⃣ Executando query manual para verificar último backup...');
    const { data: manualCheck, error: manualError } = await supabase
      .from('system_logs')
      .select('created_at')
      .eq('type', 'backup_success')
      .order('created_at', { ascending: false })
      .limit(1);

    if (manualError) {
      console.error('❌ Erro na query manual:', manualError);
    } else {
      if (manualCheck.length > 0) {
        const lastBackup = new Date(manualCheck[0].created_at);
        const now = new Date();
        const hoursDiff = (now - lastBackup) / (1000 * 60 * 60);
        
        console.log(`✅ Último backup_success encontrado: ${lastBackup.toISOString()}`);
        console.log(`✅ Horas desde o último backup: ${hoursDiff.toFixed(2)}`);
        console.log(`✅ Sistema saudável: ${hoursDiff < 25 ? 'SIM' : 'NÃO'}`);
      } else {
        console.log('❌ Nenhum log backup_success encontrado');
      }
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

// Executar debug
debugCheckBackupHealth().then(() => {
  console.log('\n🏁 Debug concluído');
  process.exit(0);
});