import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Rota de backup automático
app.post('/api/auto-backup', async (req, res) => {
  try {
    console.log('🔄 [AUTO-BACKUP] Iniciando backup automático...');
    
    // Log de início do backup
    await supabase.from('system_logs').insert({
      type: 'backup_start',
      message: 'Backup automático iniciado via API',
      context: {
        source: 'auto_backup_api',
        triggered_by: 'cron_job',
        timestamp: new Date().toISOString(),
        backup_type: 'scheduled'
      }
    });

    // Executar função de backup
    const { data: backupResult, error: backupError } = await supabase
      .rpc('backup_all_data');

    if (backupError) {
      console.error('❌ [AUTO-BACKUP] Erro no backup:', backupError);
      
      // Log de erro
      await supabase.from('system_logs').insert({
        type: 'backup_error',
        message: 'Falha no backup automático',
        context: {
          source: 'auto_backup_api',
          error: backupError.message,
          timestamp: new Date().toISOString(),
          backup_type: 'scheduled'
        }
      });

      // Enviar alerta de falha
      const { data: subscribers } = await supabase
        .from('alert_subscriptions')
        .select('email')
        .eq('active', true);

      if (subscribers && subscribers.length > 0) {
        const emails = subscribers.map(sub => sub.email);
        
        await supabase.rpc('call_nodejs_email_endpoint', {
          alert_data: {
            type: 'backup_failed',
            source: 'auto_backup_system',
            message: 'Falha no backup automático',
            details: {
              error: backupError.message,
              timestamp: new Date().toISOString(),
              action_required: 'Verificação manual necessária'
            }
          },
          recipients_emails: emails
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Falha no backup automático',
        error: backupError.message
      });
    }

    console.log('✅ [AUTO-BACKUP] Backup concluído com sucesso');
    
    // Log de sucesso
    console.log('📝 [AUTO-BACKUP] Inserindo log backup_success...');
    const { data: logData, error: logError } = await supabase.from('system_logs').insert({
      type: 'backup_success',
      message: 'Backup automático concluído com sucesso',
      context: {
        source: 'auto_backup_api',
        result: backupResult,
        timestamp: new Date().toISOString(),
        backup_type: 'scheduled'
      }
    });

    if (logError) {
      console.error('❌ [AUTO-BACKUP] Erro ao inserir log backup_success:', logError);
    } else {
      console.log('✅ [AUTO-BACKUP] Log backup_success inserido com sucesso:', logData);
    }

    // Limpeza de backups antigos (retenção inteligente)
    try {
      const { error: cleanupError } = await supabase
        .rpc('cleanup_old_backups');
      
      if (cleanupError) {
        console.warn('⚠️ [AUTO-BACKUP] Aviso na limpeza:', cleanupError);
      } else {
        console.log('🧹 [AUTO-BACKUP] Limpeza de backups antigos concluída');
      }
    } catch (cleanupErr) {
      console.warn('⚠️ [AUTO-BACKUP] Erro na limpeza:', cleanupErr);
    }

    res.json({
      success: true,
      message: 'Backup automático concluído com sucesso',
      data: backupResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 [AUTO-BACKUP] Erro crítico:', error);
    
    // Log de erro crítico
    await supabase.from('system_logs').insert({
      type: 'backup_critical_error',
      message: 'Erro crítico no sistema de backup',
      context: {
        source: 'auto_backup_api',
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    });

    res.status(500).json({
      success: false,
      message: 'Erro crítico no sistema de backup',
      error: error.message
    });
  }
});

// Rota de status do backup
app.get('/api/backup-status', async (req, res) => {
  try {
    console.log('📊 [BACKUP-STATUS] Verificando status do sistema de backup...');
    
    // Verificar saúde do sistema de backup
    const { data: healthData, error: healthError } = await supabase
      .rpc('check_backup_health');

    if (healthError) {
      console.error('❌ [BACKUP-STATUS] Erro ao verificar saúde:', healthError);
      throw healthError;
    }

    // Verificar status dos cron jobs
    const { data: cronJobs, error: cronError } = await supabase
      .rpc('get_backup_cron_status');

    if (cronError) {
      console.error('❌ [BACKUP-STATUS] Erro ao verificar cron jobs:', cronError);
    }

    // Buscar logs recentes de backup
    const { data: recentLogs, error: logsError } = await supabase
      .from('system_logs')
      .select('*')
      .in('type', ['backup_start', 'backup_success', 'backup_error', 'backup_critical_error'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (logsError) {
      console.error('❌ [BACKUP-STATUS] Erro ao buscar logs:', logsError);
    }

    // Calcular estatísticas de backup (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: backupStats, error: statsError } = await supabase
      .from('system_logs')
      .select('type')
      .in('type', ['backup_success', 'backup_error', 'backup_critical_error'])
      .gte('created_at', thirtyDaysAgo.toISOString());

    let statistics = {
      total_backups: 0,
      successful_backups: 0,
      failed_backups: 0,
      success_rate: 0
    };

    if (!statsError && backupStats) {
      const successful = backupStats.filter(log => log.type === 'backup_success').length;
      const failed = backupStats.filter(log => 
        log.type === 'backup_error' || log.type === 'backup_critical_error'
      ).length;
      
      statistics = {
        total_backups: successful + failed,
        successful_backups: successful,
        failed_backups: failed,
        success_rate: successful + failed > 0 ? (successful / (successful + failed)) * 100 : 0
      };
    }

    // Calcular próximos horários de backup
    const now = new Date();
    const nextPrimary = new Date();
    const nextSecondary = new Date();

    // Próximo backup principal (6:00 UTC)
    nextPrimary.setUTCHours(6, 0, 0, 0);
    if (nextPrimary <= now) {
      nextPrimary.setDate(nextPrimary.getDate() + 1);
    }

    // Próximo backup secundário (18:00 UTC)
    nextSecondary.setUTCHours(18, 0, 0, 0);
    if (nextSecondary <= now) {
      nextSecondary.setDate(nextSecondary.getDate() + 1);
    }

    const status = {
      system_healthy: healthData?.system_healthy || false,
      last_backup_time: healthData?.last_backup_time || null,
      hours_since_backup: healthData?.hours_since_backup || 999,
      backup_overdue: healthData?.backup_overdue ?? true,
      cron_jobs: cronJobs || [],
      recent_logs: recentLogs || [],
      next_backups: {
        primary: nextPrimary.toISOString(),
        secondary: nextSecondary.toISOString()
      },
      statistics
    };

    console.log('✅ [BACKUP-STATUS] Status verificado:', {
      healthy: status.system_healthy,
      hours_since: status.hours_since_backup,
      cron_jobs: status.cron_jobs.length
    });

    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 [BACKUP-STATUS] Erro ao verificar status:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar status do sistema de backup',
      error: error.message
    });
  }
});

// Rota de verificação forçada de saúde
app.post('/api/backup-status', async (req, res) => {
  try {
    console.log('🔄 [BACKUP-STATUS] Forçando verificação de saúde...');
    
    // Executar verificação de saúde
    const { data: healthData, error: healthError } = await supabase
      .rpc('check_backup_health');

    if (healthError) {
      throw healthError;
    }

    // Se sistema não está saudável, enviar alerta
    if (!healthData.system_healthy) {
      console.log('🚨 [BACKUP-STATUS] Sistema não saudável, enviando alerta...');
      
      const { data: subscribers } = await supabase
        .from('alert_subscriptions')
        .select('email')
        .eq('active', true);

      if (subscribers && subscribers.length > 0) {
        const emails = subscribers.map(sub => sub.email);
        
        await supabase.rpc('call_nodejs_email_endpoint', {
          alert_data: {
            type: 'backup_system_unhealthy',
            source: 'backup_monitoring',
            message: 'Sistema de backup não está funcionando corretamente',
            details: {
              hours_since_backup: healthData.hours_since_backup,
              backup_overdue: healthData.backup_overdue,
              cron_jobs_active: healthData.cron_jobs_active,
              checked_at: healthData.checked_at,
              action_required: 'Verificação manual necessária'
            }
          },
          recipients_emails: emails
        });
      }
    }

    res.json({
      success: true,
      message: 'Verificação de saúde executada',
      data: healthData
    });

  } catch (error) {
    console.error('💥 [BACKUP-STATUS] Erro na verificação forçada:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erro na verificação de saúde',
      error: error.message
    });
  }
});

// Rota de saúde do servidor
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'backup-api-server'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor de backup API rodando na porta ${PORT}`);
  console.log(`📊 Status: http://localhost:${PORT}/api/backup-status`);
  console.log(`🔄 Backup: http://localhost:${PORT}/api/auto-backup`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
});