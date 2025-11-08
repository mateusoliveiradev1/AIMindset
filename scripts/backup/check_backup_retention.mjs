import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBackupRetention() {
  console.log('🔍 VERIFICANDO SISTEMA DE RETENÇÃO DE BACKUPS...\n');

  try {
    // 1. Verificar logs de backup por período
    console.log('📊 ANÁLISE DE LOGS DE BACKUP:');
    console.log('=' .repeat(50));

    // Contar logs de backup por período
    const periods = [
      { name: '24 horas', interval: '1 day' },
      { name: '7 dias', interval: '7 days' },
      { name: '30 dias', interval: '30 days' },
      { name: '90 dias', interval: '90 days' },
      { name: 'Mais de 90 dias', interval: null }
    ];

    for (const period of periods) {
      let query = supabase
        .from('system_logs')
        .select('*', { count: 'exact', head: true })
        .in('type', ['backup_success', 'backup_start', 'backup_error']);

      if (period.interval) {
        const cutoffDate = new Date();
        if (period.name === 'Mais de 90 dias') {
          cutoffDate.setDate(cutoffDate.getDate() - 90);
          query = query.lt('created_at', cutoffDate.toISOString());
        } else {
          const days = period.interval.includes('day') ? parseInt(period.interval) : 
                      period.interval.includes('days') ? parseInt(period.interval) : 1;
          cutoffDate.setDate(cutoffDate.getDate() - days);
          query = query.gte('created_at', cutoffDate.toISOString());
        }
      }

      const { count, error } = await query;
      
      if (error) {
        console.error(`❌ Erro ao contar logs de ${period.name}:`, error);
      } else {
        console.log(`📈 ${period.name.padEnd(15)}: ${count || 0} logs de backup`);
      }
    }

    // 2. Verificar logs mais antigos
    console.log('\n📅 LOGS MAIS ANTIGOS:');
    console.log('=' .repeat(50));

    const { data: oldestBackup, error: oldestError } = await supabase
      .from('system_logs')
      .select('created_at, type, message')
      .in('type', ['backup_success', 'backup_start', 'backup_error'])
      .order('created_at', { ascending: true })
      .limit(1);

    if (oldestError) {
      console.error('❌ Erro ao buscar log mais antigo:', oldestError);
    } else if (oldestBackup && oldestBackup.length > 0) {
      const oldest = oldestBackup[0];
      const ageInDays = Math.floor((new Date() - new Date(oldest.created_at)) / (1000 * 60 * 60 * 24));
      console.log(`📆 Log de backup mais antigo: ${oldest.created_at}`);
      console.log(`⏰ Idade: ${ageInDays} dias`);
      console.log(`📝 Tipo: ${oldest.type}`);
    } else {
      console.log('ℹ️  Nenhum log de backup encontrado');
    }

    // 3. Verificar logs mais recentes
    const { data: newestBackup, error: newestError } = await supabase
      .from('system_logs')
      .select('created_at, type, message')
      .in('type', ['backup_success', 'backup_start', 'backup_error'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (newestError) {
      console.error('❌ Erro ao buscar log mais recente:', newestError);
    } else if (newestBackup && newestBackup.length > 0) {
      const newest = newestBackup[0];
      const ageInHours = Math.floor((new Date() - new Date(newest.created_at)) / (1000 * 60 * 60));
      console.log(`📆 Log de backup mais recente: ${newest.created_at}`);
      console.log(`⏰ Há: ${ageInHours} horas`);
      console.log(`📝 Tipo: ${newest.type}`);
    }

    // 4. Verificar logs de limpeza
    console.log('\n🧹 HISTÓRICO DE LIMPEZA:');
    console.log('=' .repeat(50));

    const { data: cleanupLogs, error: cleanupError } = await supabase
      .from('system_logs')
      .select('created_at, type, message, context')
      .in('type', ['backup_cleanup_success', 'backup_cleanup_start', 'backup_cleanup_error'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (cleanupError) {
      console.error('❌ Erro ao buscar logs de limpeza:', cleanupError);
    } else if (cleanupLogs && cleanupLogs.length > 0) {
      cleanupLogs.forEach((log, index) => {
        console.log(`\n${index + 1}. ${log.created_at} - ${log.type}`);
        console.log(`   📝 ${log.message}`);
        if (log.context && typeof log.context === 'object') {
          if (log.context.deleted_backup_logs !== undefined) {
            console.log(`   🗑️  Logs de backup removidos: ${log.context.deleted_backup_logs}`);
          }
          if (log.context.deleted_other_logs !== undefined) {
            console.log(`   🗑️  Outros logs removidos: ${log.context.deleted_other_logs}`);
          }
        }
      });
    } else {
      console.log('ℹ️  Nenhum log de limpeza encontrado');
    }

    // 5. Análise de retenção
    console.log('\n📋 ANÁLISE DE RETENÇÃO:');
    console.log('=' .repeat(50));

    // Contar logs que deveriam ser removidos (mais de 90 dias)
    const cutoff90Days = new Date();
    cutoff90Days.setDate(cutoff90Days.getDate() - 90);

    const { count: oldBackupLogs, error: oldBackupError } = await supabase
      .from('system_logs')
      .select('*', { count: 'exact', head: true })
      .in('type', ['backup_success', 'backup_start', 'backup_error'])
      .lt('created_at', cutoff90Days.toISOString());

    if (oldBackupError) {
      console.error('❌ Erro ao contar logs antigos:', oldBackupError);
    } else {
      console.log(`⚠️  Logs de backup com mais de 90 dias: ${oldBackupLogs || 0}`);
      if (oldBackupLogs > 0) {
        console.log('   ⚠️  ATENÇÃO: Estes logs deveriam ter sido removidos pela limpeza!');
      } else {
        console.log('   ✅ Política de retenção funcionando corretamente');
      }
    }

    // Contar outros logs que deveriam ser removidos (mais de 30 dias)
    const cutoff30Days = new Date();
    cutoff30Days.setDate(cutoff30Days.getDate() - 30);

    const { count: oldOtherLogs, error: oldOtherError } = await supabase
      .from('system_logs')
      .select('*', { count: 'exact', head: true })
      .not('type', 'in', '(backup_success,backup_start,backup_error)')
      .lt('created_at', cutoff30Days.toISOString());

    if (oldOtherError) {
      console.error('❌ Erro ao contar outros logs antigos:', oldOtherError);
    } else {
      console.log(`⚠️  Outros logs com mais de 30 dias: ${oldOtherLogs || 0}`);
      if (oldOtherLogs > 0) {
        console.log('   ⚠️  ATENÇÃO: Estes logs deveriam ter sido removidos pela limpeza!');
      } else {
        console.log('   ✅ Política de retenção funcionando corretamente');
      }
    }

    // 6. Resumo final
    console.log('\n📊 RESUMO DO SISTEMA DE RETENÇÃO:');
    console.log('=' .repeat(50));
    console.log('📋 Política configurada:');
    console.log('   • Logs de backup: 90 dias de retenção');
    console.log('   • Outros logs: 30 dias de retenção');
    console.log('   • Limpeza: Executada a cada backup automático');
    
    const totalOldLogs = (oldBackupLogs || 0) + (oldOtherLogs || 0);
    if (totalOldLogs === 0) {
      console.log('\n✅ SISTEMA DE RETENÇÃO: FUNCIONANDO CORRETAMENTE');
      console.log('   • Não há logs antigos acumulados');
      console.log('   • Política de retenção sendo respeitada');
    } else {
      console.log('\n⚠️  SISTEMA DE RETENÇÃO: NECESSITA ATENÇÃO');
      console.log(`   • ${totalOldLogs} logs antigos encontrados`);
      console.log('   • Pode ser necessário executar limpeza manual');
    }

  } catch (error) {
    console.error('💥 Erro na verificação:', error);
  }
}

// Executar verificação
checkBackupRetention();