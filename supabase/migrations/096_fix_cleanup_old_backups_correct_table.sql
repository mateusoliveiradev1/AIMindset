-- Corrigir função cleanup_old_backups para usar a tabela system_logs corretamente
-- Os backups são registrados como logs do tipo 'backup_success' na tabela system_logs

DROP FUNCTION IF EXISTS cleanup_old_backups();

CREATE OR REPLACE FUNCTION cleanup_old_backups()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count integer := 0;
    old_logs_count integer := 0;
    result json;
    cutoff_date_30_days timestamp;
    cutoff_date_90_days timestamp;
BEGIN
    -- Definir datas de corte para logs antigos
    cutoff_date_30_days := NOW() - INTERVAL '30 days';
    cutoff_date_90_days := NOW() - INTERVAL '90 days';
    
    -- Log início da limpeza
    INSERT INTO system_logs (type, message, context)
    VALUES (
        'backup_cleanup_start',
        'Iniciando limpeza de logs antigos de backup',
        json_build_object(
            'cutoff_30_days', cutoff_date_30_days,
            'cutoff_90_days', cutoff_date_90_days,
            'started_at', NOW(),
            'source', 'cleanup_old_backups'
        )
    );
    
    -- 1. Deletar logs de backup muito antigos (mais de 90 dias)
    DELETE FROM system_logs 
    WHERE type IN ('backup_success', 'backup_start', 'backup_error') 
    AND created_at < cutoff_date_90_days;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- 2. Deletar logs de sistema antigos (mais de 30 dias) exceto backup_success
    DELETE FROM system_logs 
    WHERE type NOT IN ('backup_success', 'backup_start', 'backup_error') 
    AND created_at < cutoff_date_30_days;
    
    GET DIAGNOSTICS old_logs_count = ROW_COUNT;
    
    -- Log resultado da limpeza
    result := json_build_object(
        'success', true,
        'deleted_backup_logs', deleted_count,
        'deleted_other_logs', old_logs_count,
        'cleanup_completed_at', NOW(),
        'retention_policy', json_build_object(
            'backup_logs', '90 days retention',
            'other_logs', '30 days retention'
        )
    );
    
    INSERT INTO system_logs (type, message, context)
    VALUES (
        'backup_cleanup_success',
        'Limpeza de logs concluída com sucesso',
        result || json_build_object('source', 'cleanup_old_backups')
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    -- Log erro na limpeza
    INSERT INTO system_logs (type, message, context)
    VALUES (
        'backup_cleanup_error',
        'Erro na limpeza de logs de backup',
        json_build_object(
            'error_message', SQLERRM,
            'error_state', SQLSTATE,
            'failed_at', NOW(),
            'source', 'cleanup_old_backups'
        )
    );
    
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'error_state', SQLSTATE
    );
END;
$$;

-- Comentário da função
COMMENT ON FUNCTION cleanup_old_backups() IS 'Função para limpeza de logs antigos de backup na tabela system_logs. Mantém logs de backup por 90 dias e outros logs por 30 dias.';

-- Conceder permissões
GRANT EXECUTE ON FUNCTION cleanup_old_backups() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_backups() TO authenticated;