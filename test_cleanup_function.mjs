import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCleanupFunction() {
  console.log('🧪 TESTANDO FUNÇÃO DE LIMPEZA DE BACKUPS...\n');

  try {
    // 1. Contar logs antes da limpeza
    console.log('📊 CONTAGEM ANTES DA LIMPEZA:');
    console.log('=' .repeat(40));

    const { count: backupLogsBefore, error: backupError1 } = await supabase
      .from('system_logs')
      .select('*', { count: 'exact', head: true })
      .in('type', ['backup_success', 'backup_start', 'backup_error']);

    const { count: otherLogsBefore, error: otherError1 } = await supabase
      .from('system_logs')
      .select('*', { count: 'exact', head: true })
      .not('type', 'in', '(backup_success,backup_start,backup_error)');

    if (backupError1 || otherError1) {
      console.error('❌ Erro ao contar logs antes:', backupError1 || otherError1);
      return;
    }

    console.log(`📈 Logs de backup: ${backupLogsBefore || 0}`);
    console.log(`📈 Outros logs: ${otherLogsBefore || 0}`);
    console.log(`📈 Total: ${(backupLogsBefore || 0) + (otherLogsBefore || 0)}`);

    // 2. Executar função de limpeza
    console.log('\n🧹 EXECUTANDO FUNÇÃO DE LIMPEZA...');
    console.log('=' .repeat(40));

    const { data: cleanupResult, error: cleanupError } = await supabase
      .rpc('cleanup_old_backups');

    if (cleanupError) {
      console.error('❌ Erro na execução da limpeza:', cleanupError);
      return;
    }

    console.log('✅ Função executada com sucesso!');
    console.log('📋 Resultado:', JSON.stringify(cleanupResult, null, 2));

    // 3. Contar logs após a limpeza
    console.log('\n📊 CONTAGEM APÓS A LIMPEZA:');
    console.log('=' .repeat(40));

    const { count: backupLogsAfter, error: backupError2 } = await supabase
      .from('system_logs')
      .select('*', { count: 'exact', head: true })
      .in('type', ['backup_success', 'backup_start', 'backup_error']);

    const { count: otherLogsAfter, error: otherError2 } = await supabase
      .from('system_logs')
      .select('*', { count: 'exact', head: true })
      .not('type', 'in', '(backup_success,backup_start,backup_error)');

    if (backupError2 || otherError2) {
      console.error('❌ Erro ao contar logs depois:', backupError2 || otherError2);
      return;
    }

    console.log(`📈 Logs de backup: ${backupLogsAfter || 0}`);
    console.log(`📈 Outros logs: ${otherLogsAfter || 0}`);
    console.log(`📈 Total: ${(backupLogsAfter || 0) + (otherLogsAfter || 0)}`);

    // 4. Calcular diferenças
    console.log('\n📊 ANÁLISE DE REMOÇÃO:');
    console.log('=' .repeat(40));

    const backupLogsRemoved = (backupLogsBefore || 0) - (backupLogsAfter || 0);
    const otherLogsRemoved = (otherLogsBefore || 0) - (otherLogsAfter || 0);
    const totalRemoved = backupLogsRemoved + otherLogsRemoved;

    console.log(`🗑️  Logs de backup removidos: ${backupLogsRemoved}`);
    console.log(`🗑️  Outros logs removidos: ${otherLogsRemoved}`);
    console.log(`🗑️  Total removido: ${totalRemoved}`);

    // 5. Verificar se resultado da função confere
    if (cleanupResult && typeof cleanupResult === 'object') {
      const reportedBackupRemoved = cleanupResult.deleted_backup_logs || 0;
      const reportedOtherRemoved = cleanupResult.deleted_other_logs || 0;

      console.log('\n🔍 VERIFICAÇÃO DE CONSISTÊNCIA:');
      console.log('=' .repeat(40));
      console.log(`📊 Função reportou - Backup: ${reportedBackupRemoved}, Outros: ${reportedOtherRemoved}`);
      console.log(`📊 Contagem real - Backup: ${backupLogsRemoved}, Outros: ${otherLogsRemoved}`);

      if (reportedBackupRemoved === backupLogsRemoved && reportedOtherRemoved === otherLogsRemoved) {
        console.log('✅ Consistência verificada: Relatório da função confere com contagem real');
      } else {
        console.log('⚠️  Inconsistência detectada: Relatório da função não confere com contagem real');
      }
    }

    // 6. Verificar logs antigos restantes
    console.log('\n🔍 VERIFICAÇÃO DE LOGS ANTIGOS RESTANTES:');
    console.log('=' .repeat(40));

    // Logs de backup com mais de 90 dias
    const cutoff90Days = new Date();
    cutoff90Days.setDate(cutoff90Days.getDate() - 90);

    const { count: oldBackupLogs, error: oldBackupError } = await supabase
      .from('system_logs')
      .select('*', { count: 'exact', head: true })
      .in('type', ['backup_success', 'backup_start', 'backup_error'])
      .lt('created_at', cutoff90Days.toISOString());

    // Outros logs com mais de 30 dias
    const cutoff30Days = new Date();
    cutoff30Days.setDate(cutoff30Days.getDate() - 30);

    const { count: oldOtherLogs, error: oldOtherError } = await supabase
      .from('system_logs')
      .select('*', { count: 'exact', head: true })
      .not('type', 'in', '(backup_success,backup_start,backup_error)')
      .lt('created_at', cutoff30Days.toISOString());

    if (oldBackupError || oldOtherError) {
      console.error('❌ Erro ao verificar logs antigos:', oldBackupError || oldOtherError);
    } else {
      console.log(`⚠️  Logs de backup com +90 dias restantes: ${oldBackupLogs || 0}`);
      console.log(`⚠️  Outros logs com +30 dias restantes: ${oldOtherLogs || 0}`);

      const totalOldRemaining = (oldBackupLogs || 0) + (oldOtherLogs || 0);
      if (totalOldRemaining === 0) {
        console.log('✅ Perfeito! Nenhum log antigo restante');
      } else {
        console.log(`⚠️  ATENÇÃO: ${totalOldRemaining} logs antigos ainda presentes`);
      }
    }

    // 7. Resumo final
    console.log('\n📋 RESUMO DO TESTE:');
    console.log('=' .repeat(40));
    
    if (cleanupResult && cleanupResult.success) {
      console.log('✅ Função de limpeza: FUNCIONANDO');
    } else {
      console.log('❌ Função de limpeza: COM PROBLEMAS');
    }

    if (totalRemoved > 0) {
      console.log(`✅ Remoção ativa: ${totalRemoved} logs removidos`);
    } else {
      console.log('ℹ️  Remoção: Nenhum log antigo para remover (normal se sistema novo)');
    }

    const finalOldLogs = (oldBackupLogs || 0) + (oldOtherLogs || 0);
    if (finalOldLogs === 0) {
      console.log('✅ Retenção: Política sendo respeitada');
    } else {
      console.log('⚠️  Retenção: Logs antigos ainda presentes');
    }

  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
}

// Executar teste
testCleanupFunction();