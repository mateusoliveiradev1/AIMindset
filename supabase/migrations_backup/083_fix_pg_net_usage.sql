-- Corrigir uso da extensão pg_net para chamadas HTTP assíncronas
-- A pg_net funciona de forma assíncrona, não síncrona

-- 1. Recriar função call_nodejs_email_endpoint_working com pg_net correto
CREATE OR REPLACE FUNCTION call_nodejs_email_endpoint_working(
    recipients jsonb,
    alert_data jsonb
)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
    recipients_count integer;
    nodejs_url text;
    request_id bigint;
    request_body jsonb;
BEGIN
    -- Contar destinatários
    recipients_count := jsonb_array_length(recipients);
    nodejs_url := 'http://localhost:3001/api/send-alert-email';
    
    -- Construir corpo da requisição
    request_body := jsonb_build_object(
        'recipients', recipients,
        'alertData', alert_data
    );
    
    -- Log do início da tentativa
    INSERT INTO system_logs (type, message, context)
    VALUES (
        'email_alert',
        'Enviando email via Node.js - chamada HTTP assíncrona',
        jsonb_build_object(
            'recipients', recipients,
            'recipients_count', recipients_count,
            'alert_data', alert_data,
            'endpoint', nodejs_url,
            'method', 'pg_net_async',
            'request_body', request_body
        )
    );
    
    -- Tentar fazer a chamada HTTP assíncrona
    BEGIN
        -- Usar pg_net para fazer a chamada HTTP assíncrona
        SELECT net.http_post(
            url := nodejs_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json'
            ),
            body := request_body::text
        ) INTO request_id;
        
        -- Se chegou até aqui, a requisição foi enfileirada com sucesso
        INSERT INTO system_logs (type, message, context)
        VALUES (
            'email_queued',
            'Email enfileirado com sucesso via pg_net',
            jsonb_build_object(
                'recipients', recipients,
                'recipients_count', recipients_count,
                'request_id', request_id,
                'endpoint', nodejs_url,
                'method', 'pg_net_queued'
            )
        );
        
        result := jsonb_build_object(
            'success', true,
            'message', 'Email enfileirado com sucesso via pg_net',
            'method', 'pg_net_async',
            'recipients_count', recipients_count,
            'request_id', request_id,
            'queued_at', now()::text
        );
        
    EXCEPTION WHEN OTHERS THEN
        -- Fallback: registrar nos logs se pg_net falhar
        INSERT INTO system_logs (type, message, context)
        VALUES (
            'email_fallback',
            'Alerta registrado nos logs (pg_net indisponível)',
            jsonb_build_object(
                'recipients', recipients,
                'recipients_count', recipients_count,
                'alert_data', alert_data,
                'error', SQLERRM,
                'method', 'fallback_logs',
                'fallback', true,
                'logged_at', now()::text
            )
        );
        
        result := jsonb_build_object(
            'success', false,
            'message', 'Alerta registrado nos logs (pg_net indisponível)',
            'method', 'fallback_logs',
            'recipients_count', recipients_count,
            'error', SQLERRM,
            'fallback', true,
            'logged_at', now()::text
        );
    END;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Conceder permissões
GRANT EXECUTE ON FUNCTION call_nodejs_email_endpoint_working(jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION call_nodejs_email_endpoint_working(jsonb, jsonb) TO anon;

-- 3. Log da correção
INSERT INTO system_logs (type, message, context) 
VALUES ('migration', 'Função call_nodejs_email_endpoint_working corrigida para usar pg_net assíncrono', 
        jsonb_build_object(
            'migration', '083_fix_pg_net_usage',
            'function', 'call_nodejs_email_endpoint_working',
            'change', 'Fixed pg_net usage to async mode',
            'status', 'updated'
        ));