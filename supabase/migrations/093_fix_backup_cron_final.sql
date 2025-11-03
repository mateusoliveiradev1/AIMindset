-- =====================================================
-- CORREÇÃO FINAL DO BACKUP AUTOMÁTICO
-- =====================================================
-- Corrige o cron job e funções para backup automático
-- Data: 2025-01-01
-- Versão: 2.1

-- Log início da correção
INSERT INTO system_logs (type, message, context) VALUES (
  'cron_final_fix',
  'Aplicando correção final do cron job de backup automático',
  jsonb_build_object(
    'schedule_primary', '0 6 * * * (3:00 BRT)',
    'schedule_secondary', '0 18 * * * (15:00 BRT)',
    'api_url', 'https://trae2irqr9z3-gamma.vercel.app/api/auto-backup',
    'timestamp', NOW()
  )
);

-- Remover cron jobs existentes
SELECT cron.unschedule('auto-backup-daily') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'auto-backup-daily'
);

SELECT cron.unschedule('auto-backup-secondary') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'auto-backup-secondary'
);

-- Dropar função existente para recriar com nova assinatura
DROP FUNCTION IF EXISTS get_backup_cron_status();

-- Configurar o cron job principal para executar às 06:00 UTC (3:00 BRT)
SELECT cron.schedule(
  'auto-backup-daily',
  '0 6 * * *', -- Às 06:00 UTC (3:00 BRT)
  $$
  SELECT
    net.http_post(
      url := 'https://trae2irqr9z3-gamma.vercel.app/api/auto-backup',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true)
      ),
      body := jsonb_build_object(
        'triggered_by', 'cron_job_primary',
        'timestamp', NOW(),
        'timezone', 'UTC',
        'local_time_brt', '3:00 AM',
        'backup_type', 'primary'
      )
    ) as request_id;
  $$
);

-- Configurar o cron job secundário para executar às 18:00 UTC (15:00 BRT)
SELECT cron.schedule(
  'auto-backup-secondary',
  '0 18 * * *', -- Às 18:00 UTC (15:00 BRT)
  $$
  SELECT
    net.http_post(
      url := 'https://trae2irqr9z3-gamma.vercel.app/api/auto-backup',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true)
      ),
      body := jsonb_build_object(
        'triggered_by', 'cron_job_secondary',
        'timestamp', NOW(),
        'timezone', 'UTC',
        'local_time_brt', '3:00 PM',
        'backup_type', 'secondary'
      )
    ) as request_id;
  $$
);

-- Recriar função para verificar status dos cron jobs
CREATE OR REPLACE FUNCTION get_backup_cron_status()
RETURNS TABLE (
  jobname TEXT,
  schedule TEXT,
  active BOOLEAN,
  description TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.jobname::TEXT,
    j.schedule::TEXT,
    j.active,
    CASE 
      WHEN j.jobname = 'auto-backup-daily' THEN 'Backup principal às 3:00 BRT (6:00 UTC)'
      WHEN j.jobname = 'auto-backup-secondary' THEN 'Backup secundário às 15:00 BRT (18:00 UTC)'
      ELSE 'Backup job'
    END::TEXT as description
  FROM cron.job j
  WHERE j.jobname IN ('auto-backup-daily', 'auto-backup-secondary')
  ORDER BY j.jobname;
END;
$$;

-- Criar função para verificar saúde do sistema de backup
CREATE OR REPLACE FUNCTION check_backup_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_backup_time TIMESTAMP WITH TIME ZONE;
  hours_since_backup NUMERIC;
  backup_status jsonb;
  cron_jobs_active INTEGER;
BEGIN
  -- Verificar último backup bem-sucedido
  SELECT created_at INTO last_backup_time
  FROM system_logs
  WHERE type = 'backup_success'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Calcular horas desde o último backup
  IF last_backup_time IS NOT NULL THEN
    hours_since_backup := EXTRACT(EPOCH FROM (NOW() - last_backup_time)) / 3600;
  ELSE
    hours_since_backup := 999; -- Valor alto se nunca houve backup
  END IF;
  
  -- Verificar se cron jobs estão ativos
  SELECT COUNT(*) INTO cron_jobs_active
  FROM cron.job
  WHERE jobname IN ('auto-backup-daily', 'auto-backup-secondary')
  AND active = true;
  
  -- Construir status
  backup_status := jsonb_build_object(
    'last_backup_time', last_backup_time,
    'hours_since_backup', hours_since_backup,
    'backup_overdue', hours_since_backup > 25,
    'cron_jobs_active', cron_jobs_active,
    'cron_jobs_expected', 2,
    'system_healthy', hours_since_backup <= 25 AND cron_jobs_active = 2,
    'checked_at', NOW()
  );
  
  -- Se backup está atrasado, registrar alerta
  IF hours_since_backup > 25 THEN
    INSERT INTO system_logs (type, message, context) VALUES (
      'backup_overdue_alert',
      'ALERTA: Backup automático não executado há mais de 25 horas',
      backup_status
    );
  END IF;
  
  RETURN backup_status;
END;
$$;

-- Verificar se os cron jobs foram criados com sucesso
DO $$
DECLARE
  primary_job_count INTEGER;
  secondary_job_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO primary_job_count 
  FROM cron.job 
  WHERE jobname = 'auto-backup-daily';
  
  SELECT COUNT(*) INTO secondary_job_count 
  FROM cron.job 
  WHERE jobname = 'auto-backup-secondary';
  
  IF primary_job_count > 0 AND secondary_job_count > 0 THEN
    INSERT INTO system_logs (type, message, context) VALUES (
      'cron_final_fix_success',
      'Sistema de backup automático corrigido e configurado com sucesso',
      jsonb_build_object(
        'primary_job', 'auto-backup-daily',
        'primary_schedule', '0 6 * * * (3:00 BRT)',
        'secondary_job', 'auto-backup-secondary',
        'secondary_schedule', '0 18 * * * (15:00 BRT)',
        'api_url', 'https://trae2irqr9z3-gamma.vercel.app/api/auto-backup',
        'functions_created', jsonb_build_array('get_backup_cron_status', 'check_backup_health'),
        'timestamp', NOW()
      )
    );
  ELSE
    INSERT INTO system_logs (type, message, context) VALUES (
      'cron_final_fix_error',
      'Falha ao configurar sistema de backup automático',
      jsonb_build_object(
        'primary_job_created', primary_job_count > 0,
        'secondary_job_created', secondary_job_count > 0,
        'timestamp', NOW()
      )
    );
  END IF;
END $$;

-- Comentários sobre as funções
COMMENT ON FUNCTION get_backup_cron_status() IS 'Retorna o status dos cron jobs de backup automático (principal e secundário)';
COMMENT ON FUNCTION check_backup_health() IS 'Verifica se o sistema de backup está funcionando corretamente e alerta se necessário';

-- Log final da correção
INSERT INTO system_logs (type, message, context) VALUES (
  'auto_backup_system_ready',
  'Sistema de backup automático totalmente configurado e operacional',
  jsonb_build_object(
    'primary_backup', '6:00 UTC (3:00 BRT) - Diário',
    'secondary_backup', '18:00 UTC (15:00 BRT) - Diário',
    'api_endpoint', '/api/auto-backup',
    'features', jsonb_build_array(
      'Backup duplo diário',
      'Alertas automáticos por email',
      'Limpeza automática (15 dias)',
      'Logs detalhados',
      'Health check',
      'Retry automático'
    ),
    'timestamp', NOW()
  )
);