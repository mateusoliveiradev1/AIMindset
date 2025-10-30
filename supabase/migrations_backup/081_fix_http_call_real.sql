-- Corrigir função call_nodejs_email_endpoint_working para fazer chamada HTTP REAL
-- Problema: A função atual apenas registra nos logs, mas não envia o email

-- 1. Recriar função com chamada HTTP real usando pg_net
CREATE OR REPLACE FUNCTION call_nodejs_email_endpoint_working(
    recipients jsonb,
    alert_data jsonb
)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
    recipients_count integer;
    nodejs_url text;
    http_response record;
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
        'Tentando enviar email via Node.js - chamada HTTP real',
        jsonb_build_object(
            'recipients', recipients,
            'recipients_count', recipients_count,
            'alert_data', alert_data,
            'endpoint', nodejs_url,
            'method', 'http_post_real',
            'request_body', request_body
        )
    );
    
    -- Tentar fazer a chamada HTTP real
    BEGIN
        -- Usar pg_net para fazer a chamada HTTP
        SELECT status, body, headers INTO http_response
        FROM net.http_post(
            url := nodejs_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json'
            ),
            body := request_body
        );
        
        -- Verificar se a resposta foi bem-sucedida
        IF http_response.status BETWEEN 200 AND 299 THEN
            -- Sucesso - registrar nos logs
            INSERT INTO system_logs (type, message, context)
            VALUES (
                'email_success',
                'Email enviado com sucesso via Node.js',
                jsonb_build_object(
                    'recipients', recipients,
                    'recipients_count', recipients_count,
                    'http_status', http_response.status,
                    'response_body', http_response.body,
                    'endpoint', nodejs_url,
                    'method', 'http_post_success'
                )
            );
            
            result := jsonb_build_object(
                'success', true,
                'message', 'Email enviado com sucesso via Node.js',
                'method', 'http_post_real',
                'recipients_count', recipients_count,
                'http_status', http_response.status,
                'response', http_response.body,
                'sent_at', now()::text
            );
        ELSE
            -- Erro HTTP - registrar nos logs
            INSERT INTO system_logs (type, message, context)
            VALUES (
                'email_error',
                'Erro HTTP ao enviar email via Node.js',
                jsonb_build_object(
                    'recipients', recipients,
                    'recipients_count', recipients_count,
                    'http_status', http_response.status,
                    'response_body', http_response.body,
                    'endpoint', nodejs_url,
                    'method', 'http_post_error'
                )
            );
            
            result := jsonb_build_object(
                'success', false,
                'message', 'Erro HTTP ao enviar email',
                'method', 'http_post_real',
                'recipients_count', recipients_count,
                'http_status', http_response.status,
                'error', http_response.body
            );
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        -- Erro na chamada HTTP - fallback para logs
        INSERT INTO system_logs (type, message, context)
        VALUES (
            'email_fallback',
            'Fallback: Registrando alerta nos logs (Node.js indisponível)',
            jsonb_build_object(
                'recipients', recipients,
                'recipients_count', recipients_count,
                'alert_data', alert_data,
                'endpoint', nodejs_url,
                'error', SQLERRM,
                'method', 'fallback_to_logs',
                'note', 'Servidor Node.js pode estar offline ou pg_net indisponível'
            )
        );
        
        result := jsonb_build_object(
            'success', false,
            'message', 'Alerta registrado nos logs (servidor Node.js indisponível)',
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
GRANT EXECUTE ON FUNCTION call_nodejs_email_endpoint_working(jsonb, jsonb) TO service_role;

-- 3. Log da correção
INSERT INTO system_logs (type, message, context) 
VALUES ('migration', 'Função call_nodejs_email_endpoint_working corrigida para chamada HTTP real', 
        jsonb_build_object(
            'migration', '081_fix_http_call_real',
            'problem_solved', 'Função agora faz chamada HTTP real para Node.js',
            'method', 'pg_net_with_fallback',
            'endpoint', 'http://localhost:3001/api/send-alert-email',
            'status', 'http_call_enabled',
            'note', 'Emails agora são enviados automaticamente quando o botão é clicado'
        ));