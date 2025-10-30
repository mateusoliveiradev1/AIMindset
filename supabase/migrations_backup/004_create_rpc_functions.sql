-- =====================================================
-- Funções RPC para Busca e Limpeza de Logs
-- AIMindset - Migração 004
-- =====================================================

-- =====================================================
-- FUNÇÃO RPC: get_logs_filtered
-- Busca logs com filtros avançados
-- =====================================================

CREATE OR REPLACE FUNCTION get_logs_filtered(
    log_type TEXT,
    level_filter TEXT DEFAULT NULL,
    date_from TIMESTAMPTZ DEFAULT NULL,
    date_to TIMESTAMPTZ DEFAULT NULL,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE(
    id BIGINT,
    data JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Validar tipo de log
    IF log_type NOT IN ('backend', 'app', 'system') THEN
        RAISE EXCEPTION 'Tipo de log inválido. Use: backend, app ou system';
    END IF;
    
    -- Validar limite
    IF limit_count > 100 THEN
        limit_count := 100; -- Máximo de 100 logs por consulta
    END IF;
    
    -- Buscar logs de backend
    IF log_type = 'backend' THEN
        RETURN QUERY
        SELECT bl.id, 
               jsonb_build_object(
                   'table_name', bl.table_name,
                   'action', bl.action,
                   'record_id', bl.record_id,
                   'old_data', bl.old_data,
                   'new_data', bl.new_data,
                   'performed_by', bl.performed_by
               ) as data,
               bl.created_at
        FROM backend_logs bl
        WHERE (date_from IS NULL OR bl.created_at >= date_from)
          AND (date_to IS NULL OR bl.created_at <= date_to)
          AND (level_filter IS NULL OR bl.action = level_filter)
        ORDER BY bl.created_at DESC
        LIMIT limit_count;
        
    -- Buscar logs de app
    ELSIF log_type = 'app' THEN
        RETURN QUERY
        SELECT al.id,
               jsonb_build_object(
                   'level', al.level,
                   'source', al.source,
                   'action', al.action,
                   'details', al.details,
                   'user_id', al.user_id
               ) as data,
               al.created_at
        FROM app_logs al
        WHERE (level_filter IS NULL OR al.level = level_filter)
          AND (date_from IS NULL OR al.created_at >= date_from)
          AND (date_to IS NULL OR al.created_at <= date_to)
        ORDER BY al.created_at DESC
        LIMIT limit_count;
        
    -- Buscar logs de sistema
    ELSIF log_type = 'system' THEN
        RETURN QUERY
        SELECT sl.id,
               jsonb_build_object(
                   'type', sl.type,
                   'message', sl.message,
                   'context', sl.context
               ) as data,
               sl.created_at
        FROM system_logs sl
        WHERE (date_from IS NULL OR sl.created_at >= date_from)
          AND (date_to IS NULL OR sl.created_at <= date_to)
          AND (level_filter IS NULL OR sl.type ILIKE '%' || level_filter || '%')
        ORDER BY sl.created_at DESC
        LIMIT limit_count;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNÇÃO RPC: cleanup_old_logs
-- Remove logs antigos automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS JSONB AS $$
DECLARE
    backend_deleted INTEGER := 0;
    app_deleted INTEGER := 0;
    system_deleted INTEGER := 0;
    total_deleted INTEGER := 0;
    cutoff_date TIMESTAMPTZ;
BEGIN
    -- Validar parâmetro
    IF days_to_keep < 1 THEN
        RAISE EXCEPTION 'days_to_keep deve ser maior que 0';
    END IF;
    
    -- Calcular data de corte
    cutoff_date := NOW() - INTERVAL '1 day' * days_to_keep;
    
    -- Limpar backend_logs
    DELETE FROM backend_logs WHERE created_at < cutoff_date;
    GET DIAGNOSTICS backend_deleted = ROW_COUNT;
    
    -- Limpar app_logs
    DELETE FROM app_logs WHERE created_at < cutoff_date;
    GET DIAGNOSTICS app_deleted = ROW_COUNT;
    
    -- Limpar system_logs
    DELETE FROM system_logs WHERE created_at < cutoff_date;
    GET DIAGNOSTICS system_deleted = ROW_COUNT;
    
    -- Calcular total
    total_deleted := backend_deleted + app_deleted + system_deleted;
    
    -- Registrar limpeza no system_logs
    INSERT INTO system_logs (type, message, context)
    VALUES (
        'cleanup',
        'Limpeza automática de logs executada',
        jsonb_build_object(
            'days_to_keep', days_to_keep,
            'cutoff_date', cutoff_date,
            'backend_deleted', backend_deleted,
            'app_deleted', app_deleted,
            'system_deleted', system_deleted,
            'total_deleted', total_deleted
        )
    );
    
    -- Retornar resultado
    RETURN jsonb_build_object(
        'success', true,
        'cutoff_date', cutoff_date,
        'deleted_counts', jsonb_build_object(
            'backend_logs', backend_deleted,
            'app_logs', app_deleted,
            'system_logs', system_deleted,
            'total', total_deleted
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNÇÃO RPC: export_logs_csv
-- Exporta logs em formato CSV
-- =====================================================

CREATE OR REPLACE FUNCTION export_logs_csv(
    log_type TEXT,
    date_from TIMESTAMPTZ DEFAULT NULL,
    date_to TIMESTAMPTZ DEFAULT NULL,
    level_filter TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    csv_content TEXT := '';
    log_record RECORD;
BEGIN
    -- Validar tipo de log
    IF log_type NOT IN ('backend', 'app', 'system') THEN
        RAISE EXCEPTION 'Tipo de log inválido. Use: backend, app ou system';
    END IF;
    
    -- Cabeçalho CSV para backend logs
    IF log_type = 'backend' THEN
        csv_content := 'ID,Tabela,Ação,Record ID,Dados Antigos,Dados Novos,Executado Por,Data/Hora' || E'\n';
        
        FOR log_record IN
            SELECT id, table_name, action, record_id, old_data, new_data, performed_by, created_at
            FROM backend_logs
            WHERE (date_from IS NULL OR created_at >= date_from)
              AND (date_to IS NULL OR created_at <= date_to)
              AND (level_filter IS NULL OR action = level_filter)
            ORDER BY created_at DESC
            LIMIT 1000
        LOOP
            csv_content := csv_content || 
                log_record.id || ',' ||
                COALESCE(log_record.table_name, '') || ',' ||
                COALESCE(log_record.action, '') || ',' ||
                COALESCE(log_record.record_id::text, '') || ',' ||
                COALESCE(replace(log_record.old_data::text, ',', ';'), '') || ',' ||
                COALESCE(replace(log_record.new_data::text, ',', ';'), '') || ',' ||
                COALESCE(log_record.performed_by, '') || ',' ||
                log_record.created_at::text || E'\n';
        END LOOP;
        
    -- Cabeçalho CSV para app logs
    ELSIF log_type = 'app' THEN
        csv_content := 'ID,Nível,Origem,Ação,Detalhes,User ID,Data/Hora' || E'\n';
        
        FOR log_record IN
            SELECT id, level, source, action, details, user_id, created_at
            FROM app_logs
            WHERE (level_filter IS NULL OR level = level_filter)
              AND (date_from IS NULL OR created_at >= date_from)
              AND (date_to IS NULL OR created_at <= date_to)
            ORDER BY created_at DESC
            LIMIT 1000
        LOOP
            csv_content := csv_content || 
                log_record.id || ',' ||
                COALESCE(log_record.level, '') || ',' ||
                COALESCE(log_record.source, '') || ',' ||
                COALESCE(log_record.action, '') || ',' ||
                COALESCE(replace(log_record.details::text, ',', ';'), '') || ',' ||
                COALESCE(log_record.user_id, '') || ',' ||
                log_record.created_at::text || E'\n';
        END LOOP;
        
    -- Cabeçalho CSV para system logs
    ELSIF log_type = 'system' THEN
        csv_content := 'ID,Tipo,Mensagem,Contexto,Data/Hora' || E'\n';
        
        FOR log_record IN
            SELECT id, type, message, context, created_at
            FROM system_logs
            WHERE (date_from IS NULL OR created_at >= date_from)
              AND (date_to IS NULL OR created_at <= date_to)
              AND (level_filter IS NULL OR type ILIKE '%' || level_filter || '%')
            ORDER BY created_at DESC
            LIMIT 1000
        LOOP
            csv_content := csv_content || 
                log_record.id || ',' ||
                COALESCE(log_record.type, '') || ',' ||
                COALESCE(replace(log_record.message, ',', ';'), '') || ',' ||
                COALESCE(replace(log_record.context::text, ',', ';'), '') || ',' ||
                log_record.created_at::text || E'\n';
        END LOOP;
    END IF;
    
    RETURN csv_content;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNÇÃO RPC: get_logs_stats
-- Retorna estatísticas dos logs
-- =====================================================

CREATE OR REPLACE FUNCTION get_logs_stats()
RETURNS JSONB AS $$
DECLARE
    backend_count INTEGER;
    app_count INTEGER;
    system_count INTEGER;
    error_count INTEGER;
    today_count INTEGER;
    week_count INTEGER;
BEGIN
    -- Contar logs por tipo
    SELECT COUNT(*) INTO backend_count FROM backend_logs;
    SELECT COUNT(*) INTO app_count FROM app_logs;
    SELECT COUNT(*) INTO system_count FROM system_logs;
    
    -- Contar erros
    SELECT COUNT(*) INTO error_count FROM app_logs WHERE level = 'error';
    
    -- Contar logs de hoje
    SELECT COUNT(*) INTO today_count FROM (
        SELECT created_at FROM backend_logs WHERE created_at >= CURRENT_DATE
        UNION ALL
        SELECT created_at FROM app_logs WHERE created_at >= CURRENT_DATE
        UNION ALL
        SELECT created_at FROM system_logs WHERE created_at >= CURRENT_DATE
    ) as today_logs;
    
    -- Contar logs da semana
    SELECT COUNT(*) INTO week_count FROM (
        SELECT created_at FROM backend_logs WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        UNION ALL
        SELECT created_at FROM app_logs WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        UNION ALL
        SELECT created_at FROM system_logs WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    ) as week_logs;
    
    RETURN jsonb_build_object(
        'total_logs', backend_count + app_count + system_count,
        'by_type', jsonb_build_object(
            'backend', backend_count,
            'app', app_count,
            'system', system_count
        ),
        'errors_count', error_count,
        'today_count', today_count,
        'week_count', week_count,
        'last_updated', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION get_logs_filtered(TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER) IS 'Busca logs com filtros avançados por tipo, nível, data e limite';
COMMENT ON FUNCTION cleanup_old_logs(INTEGER) IS 'Remove logs antigos baseado no número de dias especificado';
COMMENT ON FUNCTION export_logs_csv(TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) IS 'Exporta logs em formato CSV para relatórios';
COMMENT ON FUNCTION get_logs_stats() IS 'Retorna estatísticas gerais dos logs do sistema';

-- =====================================================
-- TESTE DAS FUNÇÕES
-- =====================================================

-- Inserir log de teste para verificar se as funções RPC estão funcionando
SELECT insert_system_log('migration', 'Funções RPC de logs criadas com sucesso', '{"version": "004", "functions": ["get_logs_filtered", "cleanup_old_logs", "export_logs_csv", "get_logs_stats"]}'::jsonb);