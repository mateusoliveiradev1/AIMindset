-- Solução alternativa sem pg_net: usar sistema de filas nos logs
-- A função RPC registra o alerta com status 'pending_email'
-- Um processo externo monitora e processa esses logs

-- 1. Recriar função call_nodejs_email_endpoint_working sem pg_net
CREATE OR REPLACE FUNCTION call_nodejs_email_endpoint_working(
    recipients jsonb,
    alert_data jsonb
)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
    recipients_count integer;
    log_id bigint;
BEGIN
    -- Contar destinatários
    recipients_count := jsonb_array_length(recipients);
    
    -- Registrar o alerta com status 'pending_email' para processamento
    INSERT INTO system_logs (type, message, context)
    VALUES (
        'email_pending',
        'Alerta enfileirado para envio de email',
        jsonb_build_object(
            'recipients', recipients,
            'recipients_count', recipients_count,
            'alert_data', alert_data,
            'status', 'pending_email',
            'method', 'queue_system',
            'queued_at', now()::text,
            'processed', false
        )
    )
    RETURNING id INTO log_id;
    
    -- Retornar sucesso imediato
    result := jsonb_build_object(
        'success', true,
        'message', 'Email enfileirado com sucesso no sistema de logs',
        'method', 'queue_system',
        'recipients_count', recipients_count,
        'log_id', log_id,
        'status', 'pending_email',
        'queued_at', now()::text
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criar função para marcar logs como processados
CREATE OR REPLACE FUNCTION mark_email_log_processed(
    log_id bigint,
    success boolean DEFAULT true,
    error_message text DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
    UPDATE system_logs 
    SET context = context || jsonb_build_object(
        'processed', true,
        'processed_at', now()::text,
        'success', success,
        'error_message', error_message
    )
    WHERE id = log_id AND type = 'email_pending';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar função para buscar logs pendentes de email
CREATE OR REPLACE FUNCTION get_pending_email_logs()
RETURNS TABLE (
    id bigint,
    recipients jsonb,
    alert_data jsonb,
    queued_at text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sl.id,
        (sl.context->>'recipients')::jsonb as recipients,
        (sl.context->>'alert_data')::jsonb as alert_data,
        sl.context->>'queued_at' as queued_at
    FROM system_logs sl
    WHERE sl.type = 'email_pending' 
    AND (sl.context->>'processed')::boolean = false
    ORDER BY sl.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Conceder permissões
GRANT EXECUTE ON FUNCTION call_nodejs_email_endpoint_working(jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION call_nodejs_email_endpoint_working(jsonb, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION mark_email_log_processed(bigint, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_email_log_processed(bigint, boolean, text) TO anon;
GRANT EXECUTE ON FUNCTION get_pending_email_logs() TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_email_logs() TO anon;

-- 5. Log da implementação
INSERT INTO system_logs (type, message, context) 
VALUES ('migration', 'Sistema de filas de email implementado sem pg_net', 
        jsonb_build_object(
            'migration', '085_alternative_email_solution',
            'functions', jsonb_build_array(
                'call_nodejs_email_endpoint_working',
                'mark_email_log_processed', 
                'get_pending_email_logs'
            ),
            'method', 'queue_system_logs',
            'status', 'implemented'
        ));