-- Migração: Adicionar função RPC para envio direto de alertas
-- Data: 2024-01-20
-- Descrição: Cria função alternativa para envio de alertas quando pg_net não está disponível

-- Função RPC para envio direto de alertas via Edge Function
CREATE OR REPLACE FUNCTION send_alert_direct(
    p_type text,
    p_source text,
    p_message text,
    p_details jsonb DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
    alert_payload jsonb;
    subscribers_count integer;
    function_url text;
    response_status integer;
    response_body text;
BEGIN
    -- Verificar se há assinantes
    SELECT COUNT(*) INTO subscribers_count
    FROM alert_subscriptions;
    
    IF subscribers_count = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Nenhum assinante encontrado para alertas',
            'subscribers_count', 0
        );
    END IF;

    -- Construir payload do alerta
    alert_payload := jsonb_build_object(
        'type', p_type,
        'source', p_source,
        'message', p_message,
        'details', COALESCE(p_details, '{}'::jsonb),
        'timestamp', now()::text
    );

    -- Tentar chamar a Edge Function diretamente
    BEGIN
        -- Construir URL da Edge Function
        function_url := current_setting('app.supabase_url', true) || '/functions/v1/alert-processor';
        
        -- Chamar Edge Function usando pg_net (se disponível)
        IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
            SELECT status, body INTO response_status, response_body
            FROM net.http_post(
                url := function_url,
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
                ),
                body := alert_payload
            );
            
            IF response_status BETWEEN 200 AND 299 THEN
                result := jsonb_build_object(
                    'success', true,
                    'message', 'Alerta enviado com sucesso via pg_net',
                    'method', 'pg_net',
                    'status', response_status,
                    'subscribers_count', subscribers_count
                );
            ELSE
                -- Se falhou, registrar no log do sistema
                INSERT INTO system_logs (type, message, context)
                VALUES (
                    'email_error',
                    'Falha ao enviar alerta via pg_net',
                    jsonb_build_object(
                        'alert_payload', alert_payload,
                        'response_status', response_status,
                        'response_body', response_body,
                        'function_url', function_url
                    )
                );
                
                result := jsonb_build_object(
                    'success', false,
                    'message', 'Falha ao enviar alerta via pg_net',
                    'method', 'pg_net',
                    'status', response_status,
                    'error', response_body
                );
            END IF;
        ELSE
            -- pg_net não disponível, registrar para processamento posterior
            INSERT INTO system_logs (type, message, context)
            VALUES (
                'alert_queued',
                'Alerta registrado para processamento (pg_net indisponível)',
                jsonb_build_object(
                    'alert_payload', alert_payload,
                    'subscribers_count', subscribers_count,
                    'reason', 'pg_net_unavailable'
                )
            );
            
            result := jsonb_build_object(
                'success', true,
                'message', 'Alerta registrado para processamento (pg_net indisponível)',
                'method', 'queued',
                'subscribers_count', subscribers_count
            );
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        -- Em caso de erro, registrar no log
        INSERT INTO system_logs (type, message, context)
        VALUES (
            'alert_error',
            'Erro ao processar alerta: ' || SQLERRM,
            jsonb_build_object(
                'alert_payload', alert_payload,
                'error_message', SQLERRM,
                'error_state', SQLSTATE
            )
        );
        
        result := jsonb_build_object(
            'success', false,
            'message', 'Erro ao processar alerta: ' || SQLERRM,
            'error_state', SQLSTATE
        );
    END;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário da função
COMMENT ON FUNCTION send_alert_direct(text, text, text, jsonb) IS 'Função para envio direto de alertas via Edge Function com fallback';

-- Conceder permissões
GRANT EXECUTE ON FUNCTION send_alert_direct(text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION send_alert_direct(text, text, text, jsonb) TO service_role;

-- Função para processar alertas em fila (para quando pg_net não está disponível)
CREATE OR REPLACE FUNCTION process_queued_alerts()
RETURNS jsonb AS $$
DECLARE
    queued_alert record;
    processed_count integer := 0;
    failed_count integer := 0;
    result jsonb;
BEGIN
    -- Buscar alertas em fila
    FOR queued_alert IN 
        SELECT id, context
        FROM system_logs 
        WHERE type = 'alert_queued' 
        AND created_at > now() - interval '1 hour'
        ORDER BY created_at ASC
        LIMIT 10
    LOOP
        BEGIN
            -- Tentar processar o alerta
            SELECT send_alert_direct(
                (queued_alert.context->>'alert_payload')::jsonb->>'type',
                (queued_alert.context->>'alert_payload')::jsonb->>'source',
                (queued_alert.context->>'alert_payload')::jsonb->>'message',
                (queued_alert.context->>'alert_payload')::jsonb->'details'
            ) INTO result;
            
            IF (result->>'success')::boolean THEN
                -- Marcar como processado
                UPDATE system_logs 
                SET type = 'alert_processed',
                    context = context || jsonb_build_object('processed_at', now())
                WHERE id = queued_alert.id;
                
                processed_count := processed_count + 1;
            ELSE
                failed_count := failed_count + 1;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            failed_count := failed_count + 1;
        END;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'processed_count', processed_count,
        'failed_count', failed_count,
        'message', format('Processados %s alertas, %s falharam', processed_count, failed_count)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário da função de processamento
COMMENT ON FUNCTION process_queued_alerts() IS 'Processa alertas em fila quando pg_net não estava disponível';

-- Conceder permissões
GRANT EXECUTE ON FUNCTION process_queued_alerts() TO authenticated;
GRANT EXECUTE ON FUNCTION process_queued_alerts() TO service_role;

-- Registrar a migração no sistema de logs
INSERT INTO system_logs (type, message, context)
VALUES (
    'migration',
    'Migração 047: Adicionadas funções RPC para envio direto de alertas',
    jsonb_build_object(
        'migration_file', '047_add_direct_alert_function.sql',
        'functions_added', jsonb_build_array(
            'send_alert_direct',
            'process_queued_alerts'
        ),
        'description', 'Alternativa para envio de alertas quando pg_net não está disponível'
    )
);