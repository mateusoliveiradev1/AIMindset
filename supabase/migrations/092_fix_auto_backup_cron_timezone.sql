-- =====================================================
-- CORREÇÃO DO BACKUP AUTOMÁTICO - FUSO HORÁRIO E URL
-- =====================================================
-- Corrige o cron job para usar horário UTC correto e URL da API Vercel
-- 3:00 BRT = 6:00 UTC (não 3:00 UTC)
-- Data: 2025-01-01
-- Versão: 2.0

-- Log início da correção
INSERT INTO system_logs (type, message, context) VALUES (
  'cron_fix',
  'Corrigindo configuração do cron job de backup automático',
  jsonb_build_object(
    'old_schedule', '0 3 * * *',
    'new_schedule', '0 6 * * *',
    'old_url', 'https://trae2irqr9z3-gamma.vercel.app/functions/v1/auto-backup',
    'new_url', 'https://trae2irqr9z3-gamma.vercel.app/api/auto-backup',
    'timezone_fix', '3:00 BRT = 6:00 UTC',
    'timestamp', NOW()
  )
);

-- Remover cron job existente
SELECT cron.unschedule('auto-backup-daily') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'auto-backup-daily'
);

-- Configurar o cron job corrigido para executar às 06:00 UTC (3:00 BRT)
-- Chama a API route do Vercel ao invés da Edge Function
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
        'triggered_by', 'cron_job_fixed',
        'timestamp', NOW(),
        'timezone', 'UTC',
        'local_time_brt', '3:00 AM'
      )
    ) as request_id;
  $$
);

-- Adicionar backup de segurança às 18:00 UTC (15:00 BRT)
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
      'cron_fix_success',
      'Cron jobs de backup corrigidos e configurados com sucesso',
      jsonb_build_object(
        'primary_job', 'auto-backup-daily',
        'primary_schedule', '0 6 * * * (3:00 BRT)',
        'secondary_job', 'auto-backup-secondary',
        'secondary_schedule', '0 18 * * * (15:00 BRT)',
        'api_url', 'https://trae2irqr9z3-gamma.vercel.app/api/auto-backup',
        'timestamp', NOW()
      )
    );
  ELSE
    INSERT INTO system_logs (type, message, context) VALUES (
      'cron_fix_error',
      'Falha ao configurar cron jobs de backup corrigidos',
      jsonb_build_object(
        'primary_job_created', primary_job_count > 0,
        'secondary_job_created', secondary_job_count > 0,
        'timestamp', NOW()
      )
    );
  END IF;
END $$;

-- Atualizar função para verificar status dos cron jobs
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

-- Comentário sobre as funções
COMMENT ON FUNCTION get_backup_cron_status() IS 'Retorna o status dos cron jobs de backup automático (principal e secundário)';

-- Criar função para verificar se backup foi executado nas últimas 25 horas
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
  
  -- Se backup está atrasado, enviar alerta
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

-- Comentário sobre a função de health check
COMMENT ON FUNCTION check_backup_health() IS 'Verifica se o sistema de backup está funcionando corretamente';

-- Log final da correção
INSERT INTO system_logs (type, message, context) VALUES (
  'auto_backup_fix_complete',
  'Correção do sistema de backup automático concluída',
  jsonb_build_object(
    'primary_backup', '6:00 UTC (3:00 BRT)',
    'secondary_backup', '18:00 UTC (15:00 BRT)',
    'api_endpoint', 'https://trae2irqr9z3-gamma.vercel.app/api/auto-backup',
    'health_check_function', 'check_backup_health()',
    'timestamp', NOW()
  )
);

-- Mostrar informações dos cron jobs criados
SELECT 
  'Cron jobs configurados:' as info,
  jobname,
  schedule,
  active,
  CASE 
    WHEN jobname = 'auto-backup-daily' THEN 'Backup principal às 3:00 BRT'
    WHEN jobname = 'auto-backup-secondary' THEN 'Backup secundário às 15:00 BRT'
    ELSE 'Backup job'
  END as description
FROM cron.job 
WHERE jobname IN ('auto-backup-daily', 'auto-backup-secondary')
ORDER BY jobname;