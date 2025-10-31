import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Definida' : '❌ Não definida');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Definida' : '❌ Não definida');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testBackupFunctions() {
  console.log('🧪 Testando funções de backup...\n');

  try {
    // 1. Testar função backup_all_data
    console.log('1️⃣ Testando backup_all_data...');
    const { data: backupResult, error: backupError } = await supabase.rpc('backup_all_data');
    
    if (backupError) {
      console.error('❌ Erro na função backup_all_data:', backupError);
      return false;
    }
    
    console.log('✅ backup_all_data funcionando:', backupResult);
    console.log('');

    // 2. Testar função get_backup_logs
    console.log('2️⃣ Testando get_backup_logs...');
    const { data: logsResult, error: logsError } = await supabase.rpc('get_backup_logs', { limit_count: 5 });
    
    if (logsError) {
      console.error('❌ Erro na função get_backup_logs:', logsError);
      return false;
    }
    
    console.log('✅ get_backup_logs funcionando:', logsResult);
    console.log('');

    // 3. Testar função list_backups
    console.log('3️⃣ Testando list_backups...');
    const { data: listResult, error: listError } = await supabase.rpc('list_backups');
    
    if (listError) {
      console.error('❌ Erro na função list_backups:', listError);
      return false;
    }
    
    console.log('✅ list_backups funcionando:', listResult);
    console.log('');

    // 4. Verificar tabelas de backup
    console.log('4️⃣ Verificando tabelas de backup...');
    
    const { data: backupLogsTable, error: tableError } = await supabase
      .from('backup_logs')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Erro ao acessar tabela backup_logs:', tableError);
      return false;
    }
    
    console.log('✅ Tabela backup_logs acessível');
    console.log('');

    return true;

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
    return false;
  }
}

// Executar teste
testBackupFunctions().then(success => {
  if (success) {
    console.log('🎉 Todos os testes de backup passaram!');
  } else {
    console.log('💥 Alguns testes falharam. Verifique os erros acima.');
  }
  process.exit(success ? 0 : 1);
});