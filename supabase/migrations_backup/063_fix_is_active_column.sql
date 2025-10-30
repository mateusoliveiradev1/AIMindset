-- Corrigir funções que usam coluna is_active inexistente

-- 1. Adicionar coluna is_active à tabela alert_subscriptions
ALTER TABLE alert_subscriptions 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 2. Atualizar registros existentes
UPDATE alert_subscriptions 
SET is_active = true 
WHERE is_active IS NULL;

-- 3. Recriar função test_alert_system corrigida
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
    WHERE COALESCE(is_active, true) = true;
    
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

-- 4. Recriar função process_automatic_alert corrigida
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
        WHERE COALESCE(is_active, true) = true;
        
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

-- 5. Log da correção
INSERT INTO system_logs (type, message, context) 
VALUES ('migration', 'Corrigida coluna is_active e funções relacionadas', 
        jsonb_build_object(
            'migration', '063_fix_is_active_column',
            'changes', 'Added is_active column and fixed functions',
            'timestamp', now()
        ));