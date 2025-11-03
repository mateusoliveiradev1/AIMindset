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

async function checkSystemLogs() {
  try {
    console.log('🔍 Verificando system_logs para backup...\n');

    // 1. Verificar todos os logs recentes
    console.log('1️⃣ Buscando logs recentes na system_logs...');
    const { data: recentLogs, error: recentError } = await supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (recentError) {
      console.error('❌ Erro ao buscar logs recentes:', recentError);
    } else {
      console.log(`✅ Encontrados ${recentLogs.length} logs recentes:`);
      recentLogs.forEach((log, index) => {
        console.log(`   ${index + 1}. [${log.created_at}] ${log.type}: ${log.message}`);
      });
    }

    // 2. Buscar especificamente por logs de backup
    console.log('\n2️⃣ Buscando logs que contenham "backup"...');
    const { data: backupRelatedLogs, error: backupError } = await supabase
      .from('system_logs')
      .select('*')
      .or('message.ilike.%backup%,type.ilike.%backup%')
      .order('created_at', { ascending: false })
      .limit(10);

    if (backupError) {
      console.error('❌ Erro ao buscar logs de backup:', backupError);
    } else {
      console.log(`✅ Encontrados ${backupRelatedLogs.length} logs relacionados a backup:`);
      backupRelatedLogs.forEach((log, index) => {
        console.log(`   ${index + 1}. [${log.created_at}] ${log.type}: ${log.message}`);
        if (log.context) {
          console.log(`      Context: ${JSON.stringify(log.context, null, 2)}`);
        }
      });
    }

    // 3. Verificar tipos únicos de logs
    console.log('\n3️⃣ Verificando tipos únicos de logs...');
    const { data: logTypes, error: typesError } = await supabase
      .from('system_logs')
      .select('type')
      .order('type');

    if (typesError) {
      console.error('❌ Erro ao buscar tipos de logs:', typesError);
    } else {
      const uniqueTypes = [...new Set(logTypes.map(log => log.type))];
      console.log(`✅ Tipos únicos encontrados (${uniqueTypes.length}):`);
      uniqueTypes.forEach((type, index) => {
        console.log(`   ${index + 1}. ${type}`);
      });
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

checkSystemLogs();