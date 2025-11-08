import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugBackupLogs() {
  console.log('🔍 Investigando problema com backup de logs...\n');

  try {
    // 1. Verificar se as tabelas de backup de logs existem
    console.log('1️⃣ Verificando tabelas de backup de logs...');
    
    const tables = ['backend_logs_backup', 'app_logs_backup', 'system_logs_backup'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ Tabela ${table}: NÃO EXISTE ou erro - ${error.message}`);
        } else {
          console.log(`✅ Tabela ${table}: existe (${data?.length || 0} registros)`);
        }
      } catch (err) {
        console.log(`❌ Tabela ${table}: erro ao verificar - ${err.message}`);
      }
    }

    // 2. Verificar a definição atual da função backup_all_data
    console.log('\n2️⃣ Verificando função backup_all_data...');
    
    const { data: functionData, error: functionError } = await supabase
      .rpc('backup_all_data');
    
    if (functionError) {
      console.log('❌ Erro ao executar função backup_all_data:', functionError);
    } else {
      console.log('✅ Função backup_all_data executada com sucesso');
      console.log('📊 Resultado:', JSON.stringify(functionData, null, 2));
    }

    // 3. Verificar logs de backup recentes
    console.log('\n3️⃣ Verificando logs de backup recentes...');
    
    const { data: backupLogs, error: logsError } = await supabase
      .from('backup_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (logsError) {
      console.log('❌ Erro ao buscar logs de backup:', logsError);
    } else {
      console.log('📋 Últimos 5 logs de backup:');
      backupLogs.forEach((log, index) => {
        console.log(`${index + 1}. ${log.created_at} - ${log.action_type} - ${log.success ? '✅' : '❌'}`);
        console.log(`   Registros: ${log.records_affected}`);
        console.log(`   Detalhes: ${log.details}`);
        console.log('');
      });
    }

    // 4. Verificar se existem logs nas tabelas principais
    console.log('4️⃣ Verificando logs nas tabelas principais...');
    
    const logTables = ['backend_logs', 'app_logs', 'system_logs'];
    
    for (const table of logTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${table}: erro - ${error.message}`);
        } else {
          console.log(`📊 ${table}: ${count} registros`);
        }
      } catch (err) {
        console.log(`❌ ${table}: erro ao contar - ${err.message}`);
      }
    }

    // 5. Verificar se existem logs nas tabelas de backup
    console.log('\n5️⃣ Verificando logs nas tabelas de backup...');
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${table}: erro - ${error.message}`);
        } else {
          console.log(`📊 ${table}: ${count} registros`);
        }
      } catch (err) {
        console.log(`❌ ${table}: erro ao contar - ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugBackupLogs();