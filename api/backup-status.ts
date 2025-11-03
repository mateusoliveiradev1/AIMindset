import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface BackupStatus {
  system_healthy: boolean;
  last_backup_time: string | null;
  hours_since_backup: number;
  backup_overdue: boolean;
  cron_jobs: any[];
  recent_logs: any[];
  next_backups: {
    primary: string;
    secondary: string;
  };
  statistics: {
    total_backups: number;
    successful_backups: number;
    failed_backups: number;
    success_rate: number;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Permitir apenas GET e POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.method === 'GET') {
  try {
    console.log('📊 [BACKUP-STATUS] Verificando status do sistema de backup...');
    
    // Criar cliente Supabase com service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

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

    const status: BackupStatus = {
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

    return res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('💥 [BACKUP-STATUS] Erro ao verificar status:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erro ao verificar status do sistema de backup',
      error: error.message
    });
  }
  }

  // Endpoint para forçar verificação de saúde e enviar alertas se necessário
  if (req.method === 'POST') {
  try {
    console.log('🔄 [BACKUP-STATUS] Forçando verificação de saúde...');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

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
        const emails = subscribers.map((sub: any) => sub.email);
        
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

    return res.json({
      success: true,
      message: 'Verificação de saúde executada',
      data: healthData
    });

  } catch (error: any) {
    console.error('💥 [BACKUP-STATUS] Erro na verificação forçada:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Erro na verificação de saúde',
      error: error.message
    });
  }
  }
}