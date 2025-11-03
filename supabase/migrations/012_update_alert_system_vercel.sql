-- Migração: Atualizar sistema de alertas para usar Vercel Function
-- Data: 2025-10-31
-- Descrição: Atualiza funções RPC para usar URL da Vercel ao invés de localhost

-- Atualizar função call_nodejs_email_endpoint para usar Vercel
CREATE OR REPLACE FUNCTION call_nodejs_email_endpoint(
    alert_data jsonb,
    recipients_emails text[]
)
RETURNS jsonb AS $$
DECLARE
    nodejs_url text;
    request_body jsonb;
    response_data jsonb;
    http_response record;
BEGIN
    -- URL da Vercel Function
    nodejs_url := 'https://trae2irqr9z3-gamma.vercel.app/api/send-alert-email';
    
    -- Construir corpo da requisição
    request_body := jsonb_build_object(
        'alertData', alert_data,
        'recipients', to_jsonb(recipients_emails)
    );
    
    -- Log da tentativa de envio
    INSERT INTO system_logs (type, message, context)
    VALUES (
        'email_alert',
        'Enviando email via Vercel Function',
        jsonb_build_object(
            'method', 'vercel_function',
            'endpoint', nodejs_url,
            'alert_data', alert_data,
            'recipients', recipients_emails,
            'recipients_count', array_length(recipients_emails, 1),
            'request_body_size', length(request_body::text)
        )
    );
    
    -- Tentar fazer a chamada HTTP usando pg_net (se disponível)
    BEGIN
        -- Verificar se pg_net está disponível
        IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
            -- Usar pg_net para fazer a chamada HTTP
            SELECT net.http_post(
                url := nodejs_url,
                headers := jsonb_build_object(
                    'Content-Type', 'application/json'
                ),
                body := request_body
            ) INTO http_response;
            
            -- Verificar se a resposta foi bem-sucedida
            IF http_response.status_code BETWEEN 200 AND 299 THEN
                INSERT INTO system_logs (type, message, context)
                VALUES (
                    'email_success',
                    'Email enviado com sucesso via Vercel Function',
                    jsonb_build_object(
                        'method', 'vercel_function',
                        'endpoint', nodejs_url,
                        'status_code', http_response.status_code,
                        'response', http_response.content,
                        'recipients_count', array_length(recipients_emails, 1)
                    )
                );
                
                RETURN jsonb_build_object(
                    'success', true,
                    'message', 'Email enviado com sucesso via Vercel Function',
                    'method', 'vercel_function',
                    'status_code', http_response.status_code,
                    'recipients_count', array_length(recipients_emails, 1)
                );
            ELSE
                -- Falha na chamada HTTP
                INSERT INTO system_logs (type, message, context)
                VALUES (
                    'email_error',
                    'Falha ao enviar email via Vercel Function',
                    jsonb_build_object(
                        'method', 'vercel_function',
                        'endpoint', nodejs_url,
                        'status_code', http_response.status_code,
                        'error_response', http_response.content,
                        'recipients_count', array_length(recipients_emails, 1)
                    )
                );
                
                RETURN jsonb_build_object(
                    'success', false,
                    'message', 'Falha ao enviar email via Vercel Function',
                    'method', 'vercel_function',
                    'status_code', http_response.status_code,
                    'error', http_response.content
                );
            END IF;
        ELSE
            -- pg_net não disponível, registrar nos logs
            RAISE EXCEPTION 'pg_net extension not available';
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        -- Fallback: registrar nos logs para processamento posterior
        INSERT INTO system_logs (type, message, context)
        VALUES (
            'email_fallback',
            'Fallback: Registrando alerta nos logs (Vercel Function indisponível)',
            jsonb_build_object(
                'note', 'Vercel Function pode estar indisponível ou pg_net não configurado',
                'error', SQLERRM,
                'method', 'fallback_to_logs',
                'endpoint', nodejs_url,
                'alert_data', alert_data,
                'recipients', recipients_emails,
                'recipients_count', array_length(recipients_emails, 1)
            )
        );
        
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Alerta registrado nos logs (Vercel Function indisponível)',
            'method', 'fallback_to_logs',
            'note', 'Email será processado quando a Vercel Function estiver disponível',
            'recipients_count', array_length(recipients_emails, 1)
        );
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar função send_alert_direct para usar Vercel
CREATE OR REPLACE FUNCTION send_alert_direct(
    p_email text,
    p_subject text,
    p_message text,
    p_details jsonb DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
    alert_payload jsonb;
    recipients_array text[];
BEGIN
    -- Construir payload do alerta
    alert_payload := jsonb_build_object(
        'type', 'manual',
        'source', 'rpc_direct',
        'message', p_message,
        'subject', p_subject,
        'details', COALESCE(p_details, '{}'::jsonb),
        'timestamp', now()::text
    );

    -- Preparar array de destinatários
    recipients_array := ARRAY[p_email];

    -- Log do início do processo
    INSERT INTO system_logs (type, message, context) 
    VALUES ('rpc_alert', 'Iniciando envio direto de alerta via RPC para Vercel', 
            jsonb_build_object('email', p_email, 'subject', p_subject, 'method', 'vercel_function'));

    -- Chamar função para enviar via Vercel
    SELECT call_nodejs_email_endpoint(alert_payload, recipients_array) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar função test_alert_system para usar Vercel
CREATE OR REPLACE FUNCTION test_alert_system(
    alert_type text DEFAULT 'test',
    test_message text DEFAULT 'Teste do sistema de alertas via frontend'
)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
    alert_data jsonb;
    subscribers_emails text[];
    subscribers_count integer;
BEGIN
    -- Log do início
    INSERT INTO system_logs (type, message, context) 
    VALUES ('test_alert', 'Teste iniciado via frontend - usando Vercel Function', 
            jsonb_build_object(
                'alert_type', alert_type,
                'test_message', test_message,
                'source', 'frontend_button',
                'method', 'vercel_function',
                'timestamp', now()
            ));
    
    -- Buscar assinantes de alertas
    SELECT array_agg(email), count(*) 
    INTO subscribers_emails, subscribers_count
    FROM alert_subscriptions 
    WHERE is_active = true;
    
    IF subscribers_count = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Nenhum assinante ativo encontrado',
            'subscribers_count', 0,
            'method', 'vercel_function'
        );
    END IF;
    
    -- Construir dados do alerta de teste
    alert_data := jsonb_build_object(
        'type', alert_type,
        'source', 'frontend_test_button',
        'message', test_message,
        'details', jsonb_build_object(
            'test_id', 'frontend_test_' || extract(epoch from now())::text,
            'environment', 'supabase_to_vercel',
            'method', 'vercel_function',
            'called_from', 'admin_panel'
        ),
        'timestamp', now()::text
    );
    
    -- Chamar função para enviar via Vercel
    SELECT call_nodejs_email_endpoint(alert_data, subscribers_emails) INTO result;
    
    -- Adicionar informações do teste ao resultado
    result := result || jsonb_build_object(
        'test_info', jsonb_build_object(
            'alert_type', alert_type,
            'subscribers_count', subscribers_count,
            'method', 'vercel_function'
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION call_nodejs_email_endpoint(jsonb, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION call_nodejs_email_endpoint(jsonb, text[]) TO service_role;
GRANT EXECUTE ON FUNCTION send_alert_direct(text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION send_alert_direct(text, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION test_alert_system(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION test_alert_system(text, text) TO service_role;

-- Log da migração
INSERT INTO system_logs (type, message, context)
VALUES (
    'migration',
    'Sistema de alertas migrado para Vercel Function',
    jsonb_build_object(
        'migration', '012_update_alert_system_vercel',
        'timestamp', now(),
        'endpoint_url', 'https://trae2irqr9z3-gamma.vercel.app/api/send-alert-email',
        'method', 'vercel_function',
        'functions_updated', jsonb_build_array(
            'call_nodejs_email_endpoint',
            'send_alert_direct', 
            'test_alert_system'
        )
    )
);