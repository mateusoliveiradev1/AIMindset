-- =====================================================
-- CONFIGURAÇÃO DE POLÍTICAS RLS E LIMPEZA AUTOMÁTICA
-- Sistema de Logs Completo - AIMindset
-- =====================================================

-- 1. CONFIGURAR POLÍTICAS RLS MAIS RESTRITIVAS
-- =====================================================

-- Remover políticas existentes para recriar com mais segurança
DROP POLICY IF EXISTS "admin_backend_logs_policy" ON backend_logs;
DROP POLICY IF EXISTS "admin_app_logs_policy" ON app_logs;
DROP POLICY IF EXISTS "admin_system_logs_policy" ON system_logs;
DROP POLICY IF EXISTS "admin_alert_subscriptions_policy" ON alert_subscriptions;

-- Política para backend_logs - apenas admins autenticados
CREATE POLICY "admin_only_backend_logs_policy" ON backend_logs
    FOR ALL USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid()
        )
    );

-- Política para app_logs - apenas admins autenticados
CREATE POLICY "admin_only_app_logs_policy" ON app_logs
    FOR ALL USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid()
        )
    );

-- Política para system_logs - apenas admins autenticados
CREATE POLICY "admin_only_system_logs_policy" ON system_logs
    FOR ALL USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid()
        )
    );

-- Política para alert_subscriptions - apenas admins autenticados
CREATE POLICY "admin_only_alert_subscriptions_policy" ON alert_subscriptions
    FOR ALL USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.id = auth.uid()
        )
    );

-- 2. FUNÇÃO PARA LIMPEZA AUTOMÁTICA DE LOGS ANTIGOS
-- =====================================================

-- Função melhorada para limpeza automática com logs detalhados
CREATE OR REPLACE FUNCTION cleanup_old_logs_enhanced(days_to_keep INTEGER DEFAULT 90)
RETURNS TABLE(
    table_name TEXT,
    deleted_count BIGINT,
    oldest_remaining TIMESTAMPTZ,
    cleanup_timestamp TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cutoff_date TIMESTAMPTZ;
    backend_deleted BIGINT := 0;
    app_deleted BIGINT := 0;
    system_deleted BIGINT := 0;
    oldest_backend TIMESTAMPTZ;
    oldest_app TIMESTAMPTZ;
    oldest_system TIMESTAMPTZ;
BEGIN
    -- Calcular data de corte
    cutoff_date := NOW() - (days_to_keep || ' days')::INTERVAL;
    
    -- Registrar início da limpeza
    INSERT INTO system_logs (type, message, context, created_at)
    VALUES (
        'maintenance',
        'Iniciando limpeza automática de logs antigos',
        jsonb_build_object(
            'days_to_keep', days_to_keep,
            'cutoff_date', cutoff_date,
            'function_name', 'cleanup_old_logs_enhanced'
        ),
        NOW()
    );
    
    -- Limpeza da tabela backend_logs
    DELETE FROM backend_logs WHERE created_at < cutoff_date;
    GET DIAGNOSTICS backend_deleted = ROW_COUNT;
    
    -- Limpeza da tabela app_logs
    DELETE FROM app_logs WHERE created_at < cutoff_date;
    GET DIAGNOSTICS app_deleted = ROW_COUNT;
    
    -- Limpeza da tabela system_logs (manter logs de limpeza)
    DELETE FROM system_logs 
    WHERE created_at < cutoff_date 
    AND type != 'maintenance';
    GET DIAGNOSTICS system_deleted = ROW_COUNT;
    
    -- Obter datas dos registros mais antigos restantes
    SELECT MIN(created_at) INTO oldest_backend FROM backend_logs;
    SELECT MIN(created_at) INTO oldest_app FROM app_logs;
    SELECT MIN(created_at) INTO oldest_system FROM system_logs;
    
    -- Registrar resultado da limpeza
    INSERT INTO system_logs (type, message, context, created_at)
    VALUES (
        'maintenance',
        'Limpeza automática de logs concluída',
        jsonb_build_object(
            'backend_logs_deleted', backend_deleted,
            'app_logs_deleted', app_deleted,
            'system_logs_deleted', system_deleted,
            'total_deleted', backend_deleted + app_deleted + system_deleted,
            'oldest_backend_remaining', oldest_backend,
            'oldest_app_remaining', oldest_app,
            'oldest_system_remaining', oldest_system,
            'cutoff_date', cutoff_date,
            'function_name', 'cleanup_old_logs_enhanced'
        ),
        NOW()
    );
    
    -- Retornar resultados
    RETURN QUERY VALUES
        ('backend_logs', backend_deleted, oldest_backend, NOW()),
        ('app_logs', app_deleted, oldest_app, NOW()),
        ('system_logs', system_deleted, oldest_system, NOW());
END;
$$;

-- Comentário da função
COMMENT ON FUNCTION cleanup_old_logs_enhanced(INTEGER) IS 'Função melhorada para limpeza automática de logs antigos com relatório detalhado';

-- 3. CONFIGURAR LIMPEZA AUTOMÁTICA COM CRON (pg_cron)
-- =====================================================

-- Nota: pg_cron precisa estar habilitado no Supabase
-- Esta função será executada diariamente às 02:00 UTC

-- Verificar se pg_cron está disponível e criar job se possível
DO $$
BEGIN
    -- Tentar criar job de limpeza automática
    -- Executar todos os dias às 02:00 UTC
    BEGIN
        -- Remover job existente se houver
        PERFORM cron.unschedule('cleanup_old_logs_job');
    EXCEPTION
        WHEN OTHERS THEN
            -- Ignorar erro se job não existir
            NULL;
    END;
    
    -- Criar novo job
    BEGIN
        PERFORM cron.schedule(
            'cleanup_old_logs_job',
            '0 2 * * *', -- Todos os dias às 02:00 UTC
            'SELECT cleanup_old_logs_enhanced(90);'
        );
        
        -- Registrar criação do job
        INSERT INTO system_logs (type, message, context, created_at)
        VALUES (
            'maintenance',
            'Job de limpeza automática configurado com sucesso',
            jsonb_build_object(
                'schedule', '0 2 * * *',
                'function', 'cleanup_old_logs_enhanced',
                'days_to_keep', 90
            ),
            NOW()
        );
    EXCEPTION
        WHEN OTHERS THEN
            -- Registrar falha na criação do job
            INSERT INTO system_logs (type, message, context, created_at)
            VALUES (
                'maintenance',
                'Falha ao configurar job de limpeza automática - pg_cron pode não estar disponível',
                jsonb_build_object(
                    'error', SQLERRM,
                    'note', 'Limpeza manual pode ser executada via cleanup_old_logs_enhanced()'
                ),
                NOW()
            );
    END;
END;
$$;

-- 4. FUNÇÃO PARA VERIFICAR SAÚDE DO SISTEMA DE LOGS
-- =====================================================

CREATE OR REPLACE FUNCTION check_logs_health()
RETURNS TABLE(
    metric_name TEXT,
    metric_value BIGINT,
    status TEXT,
    recommendation TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    backend_count BIGINT;
    app_count BIGINT;
    system_count BIGINT;
    oldest_backend TIMESTAMPTZ;
    oldest_app TIMESTAMPTZ;
    oldest_system TIMESTAMPTZ;
    error_count_24h BIGINT;
BEGIN
    -- Contar registros em cada tabela
    SELECT COUNT(*) INTO backend_count FROM backend_logs;
    SELECT COUNT(*) INTO app_count FROM app_logs;
    SELECT COUNT(*) INTO system_count FROM system_logs;
    
    -- Obter datas mais antigas
    SELECT MIN(created_at) INTO oldest_backend FROM backend_logs;
    SELECT MIN(created_at) INTO oldest_app FROM app_logs;
    SELECT MIN(created_at) INTO oldest_system FROM system_logs;
    
    -- Contar erros nas últimas 24 horas
    SELECT COUNT(*) INTO error_count_24h 
    FROM app_logs 
    WHERE level = 'error' 
    AND created_at > NOW() - INTERVAL '24 hours';
    
    -- Retornar métricas
    RETURN QUERY VALUES
        ('backend_logs_count', backend_count, 
         CASE WHEN backend_count > 100000 THEN 'warning' ELSE 'ok' END,
         CASE WHEN backend_count > 100000 THEN 'Considere executar limpeza' ELSE 'Normal' END),
        
        ('app_logs_count', app_count,
         CASE WHEN app_count > 50000 THEN 'warning' ELSE 'ok' END,
         CASE WHEN app_count > 50000 THEN 'Considere executar limpeza' ELSE 'Normal' END),
        
        ('system_logs_count', system_count,
         CASE WHEN system_count > 10000 THEN 'warning' ELSE 'ok' END,
         CASE WHEN system_count > 10000 THEN 'Considere executar limpeza' ELSE 'Normal' END),
        
        ('errors_24h', error_count_24h,
         CASE WHEN error_count_24h > 100 THEN 'critical' 
              WHEN error_count_24h > 10 THEN 'warning' 
              ELSE 'ok' END,
         CASE WHEN error_count_24h > 100 THEN 'Muitos erros - investigar urgente'
              WHEN error_count_24h > 10 THEN 'Monitorar erros'
              ELSE 'Normal' END),
        
        ('oldest_log_days', 
         EXTRACT(DAY FROM NOW() - LEAST(oldest_backend, oldest_app, oldest_system))::BIGINT,
         CASE WHEN LEAST(oldest_backend, oldest_app, oldest_system) < NOW() - INTERVAL '90 days' 
              THEN 'warning' ELSE 'ok' END,
         CASE WHEN LEAST(oldest_backend, oldest_app, oldest_system) < NOW() - INTERVAL '90 days'
              THEN 'Logs muito antigos - executar limpeza'
              ELSE 'Normal' END);
END;
$$;

-- Comentário da função
COMMENT ON FUNCTION check_logs_health() IS 'Verifica a saúde do sistema de logs e fornece recomendações';

-- 5. ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =====================================================

-- Índices para otimizar consultas de limpeza (sem condições com NOW())
CREATE INDEX IF NOT EXISTS idx_backend_logs_created_at_desc ON backend_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_logs_created_at_desc ON app_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at_desc ON system_logs(created_at DESC);

-- Índices para consultas de erro
CREATE INDEX IF NOT EXISTS idx_app_logs_level_error ON app_logs(level, created_at) WHERE level = 'error';
CREATE INDEX IF NOT EXISTS idx_system_logs_type_error ON system_logs(type, created_at) WHERE type = 'error';

-- 6. REGISTRAR CONFIGURAÇÃO CONCLUÍDA
-- =====================================================

INSERT INTO system_logs (type, message, context, created_at)
VALUES (
    'configuration',
    'Configuração de RLS e limpeza automática concluída',
    jsonb_build_object(
        'policies_created', 4,
        'functions_created', 2,
        'indexes_created', 5,
        'cleanup_schedule', '0 2 * * *',
        'retention_days', 90,
        'migration_file', '005_configure_rls_and_cleanup.sql'
    ),
    NOW()
);

-- Comentários finais
COMMENT ON TABLE backend_logs IS 'Logs de operações do backend com RLS restrito a admins';
COMMENT ON TABLE app_logs IS 'Logs de aplicação com RLS restrito a admins';
COMMENT ON TABLE system_logs IS 'Logs de sistema com RLS restrito a admins';
COMMENT ON TABLE alert_subscriptions IS 'Assinantes de alertas com RLS restrito a admins';