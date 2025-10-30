const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkSystemLogs() {
  try {
    console.log('🔍 Verificando tabela system_logs...');
    
    // Verificar total de registros
    const { count: totalCount, error: countError } = await supabase
      .from('system_logs')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Erro ao contar registros:', countError);
      return;
    }
    
    console.log(`📊 Total de registros na tabela system_logs: ${totalCount}`);
    
    // Buscar os últimos 10 registros
    const { data: logs, error: logsError } = await supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (logsError) {
      console.error('❌ Erro ao buscar logs:', logsError);
      return;
    }
    
    console.log('\n📋 Últimos 10 registros:');
    logs.forEach((log, index) => {
      console.log(`${index + 1}. [${log.type.toUpperCase()}] ${log.source} - ${log.message}`);
      console.log(`   Criado em: ${new Date(log.created_at).toLocaleString()}`);
      console.log('');
    });
    
    // Verificar distribuição por tipo
    const { data: typeStats, error: typeError } = await supabase
      .from('system_logs')
      .select('type')
      .order('type');
    
    if (!typeError && typeStats) {
      const typeCounts = typeStats.reduce((acc, log) => {
        acc[log.type] = (acc[log.type] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📈 Distribuição por tipo:');
      Object.entries(typeCounts).forEach(([type, count]) => {
        console.log(`   ${type}: ${count} registros`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkSystemLogs();