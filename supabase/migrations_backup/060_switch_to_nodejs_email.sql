-- Migração: Modificar sistema de alertas para usar endpoint Node.js em vez de Edge Function
-- Data: 2024-01-20
-- Descrição: Remove dependência do Docker/Edge Functions e usa endpoint Node.js local

-- 1. Função auxiliar para fazer chamadas HTTP para o endpoint Node.js
CREATE OR REPLACE FUNCTION call_nodejs_email_endpoint(
    recipients jsonb,
    alert_data jsonb
)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
    nodejs_url text;
    response_status integer;
    response_body text;
BEGIN
    -- URL do endpoint Node.js (assumindo que roda na porta 3001)
    nodejs_url := 'http://localhost:3001/api/send-alert-email';
    
    -- Tentar fazer a chamada HTTP usando pg_net (se disponível)
    BEGIN
        SELECT status, body INTO response_status, response_body
        FROM net.http_post(
            url := nodejs_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json'
            ),
            body := jsonb_build_object(
                'recipients', recipients,
                'alertData', alert_data
            )
        );
        
        IF response_status BETWEEN 200 AND 299 THEN
            result := jsonb_build_object(
                'success', true,
                'message', 'Email enviado via Node.js endpoint',
                'method', 'nodejs_endpoint',
                'status', response_status
            );
        ELSE
            result := jsonb_build_object(
                'success', false,
                'message', 'Falha na chamada do endpoint Node.js',
                'method', 'nodejs_endpoint',
                'status', response_status,
                'response', response_body
            );
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        -- Se pg_net não estiver disponível ou houver erro
        INSERT INTO system_logs (type, message, context)
        VALUES (
            'email_fallback',
            'Não foi possível chamar endpoint Node.js - registrando alerta nos logs',
            jsonb_build_object(
                'error', SQLERRM,
                'alert_data', alert_data,
                'recipients', recipients,
                'note', 'pg_net may not be available or Node.js server may be down'
            )
        );
        
        result := jsonb_build_object(
            'success', false,
            'message', 'Alerta registrado nos logs (endpoint Node.js indisponível)',
            'method', 'fallback_log',
            'error', SQLERRM
        );
    END;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Recriar função send_alert_direct para usar endpoint Node.js
CREATE OR REPLACE FUNCTION send_alert_direct(
    p_email text,
    p_subject text,
    p_message text,
    p_details jsonb DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
    alert_data jsonb;
    recipients jsonb;
BEGIN
    -- Construir dados do alerta
    alert_data := jsonb_build_object(
        'type', 'manual',
        'source', 'rpc_direct',
        'message', p_message,
        'details', COALESCE(p_details, '{}'::jsonb),
        'timestamp', now()::text
    );
    
    -- Lista de destinatários
    recipients := jsonb_build_array(p_email);
    
    -- Log do início do processo
    INSERT INTO system_logs (type, message, context) 
    VALUES ('rpc_alert', 'Iniciando envio direto de alerta via Node.js endpoint', 
            jsonb_build_object('email', p_email, 'subject', p_subject));
    
    -- Chamar endpoint Node.js
    result := call_nodejs_email_endpoint(recipients, alert_data);
    
    -- Log do resultado
    INSERT INTO system_logs (type, message, context) 
    VALUES ('rpc_alert', 'Resultado do envio via Node.js endpoint', 
            jsonb_build_object('result', result, 'email', p_email));
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Modificar função de processamento automático de alertas
CREATE OR REPLACE FUNCTION process_automatic_alert()
RETURNS trigger AS $$
DECLARE
    should_alert boolean := false;
    alert_type_value text;
    alert_source_value text;
    alert_message_value text;
    alert_details_value jsonb;
    alert_payload jsonb;
    subscribers_emails jsonb;
    email_result jsonb;
BEGIN
    -- Determinar se deve gerar alerta baseado na tabela e tipo
    IF TG_TABLE_NAME = 'app_logs' THEN
        -- Alertar para erros críticos em app_logs
        IF NEW.level IN ('error', 'critical') THEN
            should_alert := true;
            alert_type_value := 'app_error';
            alert_source_value := COALESCE(NEW.source, 'app_logs');
            alert_message_value := COALESCE(NEW.message, 'Erro na aplicação');
            alert_details_value := COALESCE(NEW.details, '{}'::jsonb);
        END IF;
    ELSIF TG_TABLE_NAME = 'system_logs' THEN
        -- Alertar para tipos específicos em system_logs
        IF NEW.type IN ('error', 'critical', 'security') THEN
            should_alert := true;
            alert_type_value := CASE 
                WHEN NEW.type = 'security' THEN 'security'
                ELSE 'error'
            END;
            alert_source_value := COALESCE(NEW.type, 'system_logs');
            alert_message_value := COALESCE(NEW.message, 'Erro no sistema');
            alert_details_value := COALESCE(NEW.context, '{}'::jsonb);
        END IF;
    END IF;
    
    -- Se deve alertar, processar o alerta
    IF should_alert THEN
        -- Construir payload do alerta
        alert_payload := jsonb_build_object(
            'type', alert_type_value,
            'source', alert_source_value,
            'message', alert_message_value,
            'details', alert_details_value,
            'timestamp', NEW.created_at,
            'table_origin', TG_TABLE_NAME
        );

        -- Buscar emails dos assinantes ativos
        SELECT jsonb_agg(email) INTO subscribers_emails
        FROM alert_subscriptions 
        WHERE is_active = true;
        
        -- Se há assinantes, tentar enviar via Node.js endpoint
        IF subscribers_emails IS NOT NULL AND jsonb_array_length(subscribers_emails) > 0 THEN
            email_result := call_nodejs_email_endpoint(subscribers_emails, alert_payload);
            
            -- Registrar resultado
            INSERT INTO system_logs (type, message, context)
            VALUES (
                'email_auto',
                'Alerta automático processado via Node.js endpoint',
                jsonb_build_object(
                    'trigger_table', TG_TABLE_NAME,
                    'alert_type', alert_type_value,
                    'alert_source', alert_source_value,
                    'email_result', email_result,
                    'subscribers_count', jsonb_array_length(subscribers_emails),
                    'processed_at', NOW()
                )
            );
        ELSE
            -- Sem assinantes
            INSERT INTO system_logs (type, message, context)
            VALUES (
                'email_auto',
                'Alerta automático não enviado - sem assinantes',
                jsonb_build_object(
                    'trigger_table', TG_TABLE_NAME,
                    'alert_type', alert_type_value,
                    'alert_source', alert_source_value,
                    'processed_at', NOW()
                )
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Função para testar o sistema via Node.js
CREATE OR REPLACE FUNCTION test_alert_system(
    alert_type text DEFAULT 'test',
    test_message text DEFAULT 'Teste do sistema de alertas via Node.js'
)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
    alert_data jsonb;
    subscribers_emails jsonb;
BEGIN
    -- Construir dados do alerta de teste
    alert_data := jsonb_build_object(
        'type', alert_type,
        'source', 'test_function',
        'message', test_message,
        'details', jsonb_build_object(
            'test_id', 'test_' || extract(epoch from now())::text,
            'environment', 'nodejs_endpoint',
            'docker_required', false
        ),
        'timestamp', now()::text
    );
    
    -- Buscar emails dos assinantes ativos
    SELECT jsonb_agg(email) INTO subscribers_emails
    FROM alert_subscriptions 
    WHERE is_active = true;
    
    IF subscribers_emails IS NULL OR jsonb_array_length(subscribers_emails) = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Nenhum assinante ativo encontrado',
            'subscribers_count', 0
        );
    END IF;
    
    -- Chamar endpoint Node.js
    result := call_nodejs_email_endpoint(subscribers_emails, alert_data);
    
    -- Log do teste
    INSERT INTO system_logs (type, message, context) 
    VALUES ('test_alert', 'Teste do sistema de alertas via Node.js', 
            jsonb_build_object(
                'result', result, 
                'subscribers_count', jsonb_array_length(subscribers_emails),
                'alert_type', alert_type
            ));
    
    RETURN jsonb_build_object(
        'success', result->>'success' = 'true',
        'message', result->>'message',
        'method', 'nodejs_endpoint',
        'subscribers_count', jsonb_array_length(subscribers_emails),
        'test_result', result
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Comentários das funções
COMMENT ON FUNCTION call_nodejs_email_endpoint(jsonb, jsonb) IS 'Chama endpoint Node.js para envio de emails de alerta';
COMMENT ON FUNCTION send_alert_direct(text, text, text, jsonb) IS 'Envia alerta diretamente via endpoint Node.js (sem Docker)';
COMMENT ON FUNCTION process_automatic_alert() IS 'Processa alertas automáticos via endpoint Node.js';
COMMENT ON FUNCTION test_alert_system(text, text) IS 'Testa sistema de alertas via endpoint Node.js';

-- 6. Conceder permissões
GRANT EXECUTE ON FUNCTION call_nodejs_email_endpoint(jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION call_nodejs_email_endpoint(jsonb, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION send_alert_direct(text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION send_alert_direct(text, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION test_alert_system(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION test_alert_system(text, text) TO service_role;

-- 7. Log da migração
INSERT INTO system_logs (type, message, context) 
VALUES ('migration', 'Sistema de alertas migrado para endpoint Node.js', 
        jsonb_build_object(
            'migration', '060_switch_to_nodejs_email',
            'docker_required', false,
            'endpoint_url', 'http://localhost:3001/api/send-alert-email',
            'timestamp', now()
        ));