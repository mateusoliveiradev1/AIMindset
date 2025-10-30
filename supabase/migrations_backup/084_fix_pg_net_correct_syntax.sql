-- Corrigir sintaxe da pg_net - usar net.http_request ao invés de net.http_post
-- Baseado na documentação oficial da pg_net

-- 1. Recriar função call_nodejs_email_endpoint_working com sintaxe correta
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
    request_body text;
BEGIN
    -- Contar destinatários
    recipients_count := jsonb_array_length(recipients);
    nodejs_url := 'http://localhost:3001/api/send-alert-email';
    
    -- Construir corpo da requisição como texto JSON
    request_body := jsonb_build_object(
        'recipients', recipients,
        'alertData', alert_data
    )::text;
    
    -- Log do início da tentativa
    INSERT INTO system_logs (type, message, context)
    VALUES (
        'email_alert',
        'Enviando email via Node.js - usando net.http_request',
        jsonb_build_object(
            'recipients', recipients,
            'recipients_count', recipients_count,
            'alert_data', alert_data,
            'endpoint', nodejs_url,
            'method', 'net_http_request',
            'request_body_size', length(request_body)
        )
    );
    
    -- Tentar fazer a chamada HTTP usando net.http_request
    BEGIN
        -- Usar net.http_request (sintaxe correta da pg_net)
        SELECT net.http_request(
            method := 'POST',
            url := nodejs_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json'
            ),
            body := request_body
        ) INTO request_id;
        
        -- Se chegou até aqui, a requisição foi enfileirada com sucesso
        INSERT INTO system_logs (type, message, context)
        VALUES (
            'email_queued',
            'Email enfileirado com sucesso via net.http_request',
            jsonb_build_object(
                'recipients', recipients,
                'recipients_count', recipients_count,
                'request_id', request_id,
                'endpoint', nodejs_url,
                'method', 'net_http_request_success'
            )
        );
        
        result := jsonb_build_object(
            'success', true,
            'message', 'Email enfileirado com sucesso via net.http_request',
            'method', 'net_http_request',
            'recipients_count', recipients_count,
            'request_id', request_id,
            'queued_at', now()::text
        );
        
    EXCEPTION WHEN OTHERS THEN
        -- Fallback: registrar nos logs se net.http_request falhar
        INSERT INTO system_logs (type, message, context)
        VALUES (
            'email_fallback',
            'Alerta registrado nos logs (net.http_request indisponível)',
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
            'message', 'Alerta registrado nos logs (net.http_request indisponível)',
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
VALUES ('migration', 'Função call_nodejs_email_endpoint_working corrigida para usar net.http_request', 
        jsonb_build_object(
            'migration', '084_fix_pg_net_correct_syntax',
            'function', 'call_nodejs_email_endpoint_working',
            'change', 'Fixed to use net.http_request instead of net.http_post',
            'status', 'updated'
        ));