const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkAppLogs() {
  try {
    console.log('🔍 Verificando tabela app_logs...');
    
    // Verificar total de registros
    const { count: totalCount, error: countError } = await supabase
      .from('app_logs')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Erro ao contar registros:', countError);
      return;
    }
    
    console.log(`📊 Total de registros na tabela app_logs: ${totalCount}`);
    
    // Buscar os últimos 10 registros
    const { data: logs, error: logsError } = await supabase
      .from('app_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (logsError) {
      console.error('❌ Erro ao buscar logs:', logsError);
      return;
    }
    
    console.log('\n📋 Últimos 10 registros:');
    logs.forEach((log, index) => {
      console.log(`${index + 1}. [${log.level.toUpperCase()}] ${log.source} - ${log.action}`);
      console.log(`   Criado em: ${new Date(log.created_at).toLocaleString()}`);
      console.log(`   User ID: ${log.user_id || 'N/A'}`);
      console.log('');
    });
    
    // Verificar distribuição por nível
    const { data: levelStats, error: levelError } = await supabase
      .from('app_logs')
      .select('level')
      .order('level');
    
    if (!levelError && levelStats) {
      const levelCounts = levelStats.reduce((acc, log) => {
        acc[log.level] = (acc[log.level] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📈 Distribuição por nível:');
      Object.entries(levelCounts).forEach(([level, count]) => {
        console.log(`   ${level}: ${count} registros`);
      });
    }
    
    // Verificar distribuição por fonte
    const { data: sourceStats, error: sourceError } = await supabase
      .from('app_logs')
      .select('source')
      .order('source');
    
    if (!sourceError && sourceStats) {
      const sourceCounts = sourceStats.reduce((acc, log) => {
        acc[log.source] = (acc[log.source] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n🔧 Distribuição por fonte:');
      Object.entries(sourceCounts).forEach(([source, count]) => {
        console.log(`   ${source}: ${count} registros`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkAppLogs();