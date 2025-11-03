-- Criar função para limpeza inteligente de backups antigos
-- Estratégia de retenção:
-- - Últimos 15 dias: Todos os backups
-- - Últimas 12 semanas: 1 backup por semana (domingo)
-- - Deletar backups mais antigos automaticamente

CREATE OR REPLACE FUNCTION cleanup_old_backups()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count integer := 0;
    compressed_count integer := 0;
    result json;
    backup_record record;
    cutoff_date_15_days timestamp;
    cutoff_date_12_weeks timestamp;
BEGIN
    -- Definir datas de corte
    cutoff_date_15_days := NOW() - INTERVAL '15 days';
    cutoff_date_12_weeks := NOW() - INTERVAL '12 weeks';
    
    -- Log início da limpeza
    INSERT INTO system_logs (type, source, message, details)
    VALUES (
        'backup_cleanup_start',
        'cleanup_old_backups',
        'Iniciando limpeza inteligente de backups',
        json_build_object(
            'cutoff_15_days', cutoff_date_15_days,
            'cutoff_12_weeks', cutoff_date_12_weeks,
            'started_at', NOW()
        )
    );
    
    -- 1. Deletar backups muito antigos (mais de 12 semanas)
    DELETE FROM backups 
    WHERE created_at < cutoff_date_12_weeks;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- 2. Para backups entre 15 dias e 12 semanas, manter apenas 1 por semana (domingo)
    -- Deletar backups que não são de domingo neste período
    DELETE FROM backups 
    WHERE created_at BETWEEN cutoff_date_12_weeks AND cutoff_date_15_days
    AND EXTRACT(DOW FROM created_at) != 0  -- 0 = domingo
    AND id NOT IN (
        -- Manter o backup mais recente de cada semana se não houver backup de domingo
        SELECT DISTINCT ON (DATE_TRUNC('week', created_at)) id
        FROM backups 
        WHERE created_at BETWEEN cutoff_date_12_weeks AND cutoff_date_15_days
        ORDER BY DATE_TRUNC('week', created_at), created_at DESC
    );
    
    GET DIAGNOSTICS compressed_count = ROW_COUNT;
    deleted_count := deleted_count + compressed_count;
    
    -- 3. Marcar backups com mais de 7 dias para compressão (simulado)
    UPDATE backups 
    SET metadata = COALESCE(metadata, '{}'::json) || json_build_object('compressed', true, 'compressed_at', NOW())
    WHERE created_at < (NOW() - INTERVAL '7 days')
    AND (metadata->>'compressed' IS NULL OR metadata->>'compressed' = 'false');
    
    GET DIAGNOSTICS compressed_count = ROW_COUNT;
    
    -- Log resultado da limpeza
    result := json_build_object(
        'success', true,
        'deleted_backups', deleted_count,
        'compressed_backups', compressed_count,
        'cleanup_completed_at', NOW(),
        'retention_policy', json_build_object(
            'last_15_days', 'all backups kept',
            'last_12_weeks', 'weekly backups (sunday) kept',
            'older_than_12_weeks', 'deleted',
            'older_than_7_days', 'marked for compression'
        )
    );
    
    INSERT INTO system_logs (type, source, message, details)
    VALUES (
        'backup_cleanup_success',
        'cleanup_old_backups',
        'Limpeza de backups concluída com sucesso',
        result
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    -- Log erro na limpeza
    INSERT INTO system_logs (type, source, message, details)
    VALUES (
        'backup_cleanup_error',
        'cleanup_old_backups',
        'Erro na limpeza de backups',
        json_build_object(
            'error_message', SQLERRM,
            'error_state', SQLSTATE,
            'failed_at', NOW()
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
COMMENT ON FUNCTION cleanup_old_backups() IS 'Função para limpeza inteligente de backups antigos com estratégia de retenção: últimos 15 dias (todos), últimas 12 semanas (semanais), mais antigos (deletados)';

-- Conceder permissões
GRANT EXECUTE ON FUNCTION cleanup_old_backups() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_backups() TO authenticated;