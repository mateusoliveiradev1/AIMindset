-- =====================================================
-- CONFIGURAÇÃO DO BACKUP AUTOMÁTICO DIÁRIO
-- =====================================================
-- Este arquivo configura o cron job para executar backup automático às 03:00 diariamente
-- Data: 2024-12-31
-- Versão: 1.0

-- Habilitar a extensão pg_cron se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Log início da configuração
INSERT INTO system_logs (type, message, context) VALUES (
  'cron_setup',
  'Configurando cron job para backup automático diário',
  jsonb_build_object(
    'schedule', '0 3 * * *',
    'function', 'auto-backup',
    'timestamp', NOW()
  )
);

-- Remover qualquer cron job existente para backup automático
SELECT cron.unschedule('auto-backup-daily') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'auto-backup-daily'
);

-- Configurar o cron job para executar às 03:00 todos os dias
-- Faz uma chamada HTTP para a Edge Function auto-backup
SELECT cron.schedule(
  'auto-backup-daily',
  '0 3 * * *', -- Às 03:00 todos os dias
  $$
  SELECT
    net.http_post(
      url := 'https://trae2irqr9z3-gamma.vercel.app/functions/v1/auto-backup',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key', true)
      ),
      body := jsonb_build_object(
        'triggered_by', 'cron_job',
        'timestamp', NOW()
      )
    ) as request_id;
  $$
);

-- Verificar se o cron job foi criado com sucesso
DO $$
DECLARE
  job_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO job_count 
  FROM cron.job 
  WHERE jobname = 'auto-backup-daily';
  
  IF job_count > 0 THEN
    INSERT INTO system_logs (type, message, context) VALUES (
      'cron_setup_success',
      'Cron job para backup automático configurado com sucesso',
      jsonb_build_object(
        'jobname', 'auto-backup-daily',
        'schedule', '0 3 * * *',
        'timestamp', NOW()
      )
    );
  ELSE
    INSERT INTO system_logs (type, message, context) VALUES (
      'cron_setup_error',
      'Falha ao configurar cron job para backup automático',
      jsonb_build_object(
        'jobname', 'auto-backup-daily',
        'timestamp', NOW()
      )
    );
  END IF;
END $$;

-- Criar função para verificar status do cron job
CREATE OR REPLACE FUNCTION get_backup_cron_status()
RETURNS TABLE (
  jobname TEXT,
  schedule TEXT,
  active BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.jobname::TEXT,
    j.schedule::TEXT,
    j.active
  FROM cron.job j
  WHERE j.jobname = 'auto-backup-daily';
END;
$$;

-- Comentário sobre o cron job
COMMENT ON FUNCTION get_backup_cron_status() IS 'Retorna o status do cron job de backup automático';

-- Log final
INSERT INTO system_logs (type, message, context) VALUES (
  'auto_backup_setup_complete',
  'Configuração do backup automático concluída',
  jsonb_build_object(
    'cron_schedule', '0 3 * * *',
    'edge_function', 'auto-backup',
    'timestamp', NOW()
  )
);

-- Mostrar informações do cron job criado
SELECT 
  'Cron job configurado:' as info,
  jobname,
  schedule,
  active
FROM cron.job 
WHERE jobname = 'auto-backup-daily';