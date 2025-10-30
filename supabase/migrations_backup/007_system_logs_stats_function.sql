-- Função para obter estatísticas dos logs do sistema
CREATE OR REPLACE FUNCTION get_system_logs_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    total_logs INTEGER;
    error_count INTEGER;
    warning_count INTEGER;
    info_count INTEGER;
    last_24_hours INTEGER;
BEGIN
    -- Contar total de logs
    SELECT COUNT(*) INTO total_logs FROM system_logs;
    
    -- Contar logs por tipo
    SELECT COUNT(*) INTO error_count FROM system_logs WHERE type = 'error';
    SELECT COUNT(*) INTO warning_count FROM system_logs WHERE type = 'warning';
    SELECT COUNT(*) INTO info_count FROM system_logs WHERE type = 'info';
    
    -- Contar logs das últimas 24 horas
    SELECT COUNT(*) INTO last_24_hours 
    FROM system_logs 
    WHERE created_at >= NOW() - INTERVAL '24 hours';
    
    -- Construir resultado JSON
    result := json_build_object(
        'totalLogs', total_logs,
        'errorCount', error_count,
        'warningCount', warning_count,
        'infoCount', info_count,
        'last24Hours', last_24_hours
    );
    
    RETURN result;
END;
$$;

-- Conceder permissões para usuários autenticados
GRANT EXECUTE ON FUNCTION get_system_logs_stats() TO authenticated;