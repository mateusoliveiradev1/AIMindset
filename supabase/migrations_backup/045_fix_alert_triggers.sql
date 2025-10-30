-- =====================================================
-- CORREÇÃO DOS TRIGGERS DE ALERTAS AUTOMÁTICOS
-- Corrige função process_automatic_alert que estava tentando
-- acessar campos inexistentes
-- =====================================================

-- Função corrigida para processar alertas automáticos
CREATE OR REPLACE FUNCTION process_automatic_alert()
RETURNS TRIGGER AS $$
DECLARE
    alert_payload jsonb;
    function_url text;
    should_alert boolean := false;
    alert_type_value text;
    alert_source_value text;
BEGIN
    -- Verificar se é um erro crítico que precisa de alerta
    IF TG_TABLE_NAME = 'app_logs' THEN
        should_alert := (NEW.level = 'error');
        alert_type_value := 'error';
        alert_source_value := NEW.source;
    ELSIF TG_TABLE_NAME = 'system_logs' THEN
        should_alert := (NEW.type IN ('security', 'database', 'api'));
        alert_type_value := CASE 
            WHEN NEW.type = 'security' THEN 'critical'
            ELSE 'error'
        END;
        alert_source_value := NEW.type;
    END IF;
    
    IF should_alert THEN
        
        -- Construir payload do alerta
        alert_payload := jsonb_build_object(
            'type', alert_type_value,
            'source', alert_source_value,
            'message', CASE 
                WHEN TG_TABLE_NAME = 'app_logs' THEN format('Erro na aplicação: %s - %s', NEW.source, NEW.action)
                WHEN TG_TABLE_NAME = 'system_logs' THEN NEW.message
                ELSE 'Erro desconhecido'
            END,
            'details', CASE 
                WHEN TG_TABLE_NAME = 'app_logs' THEN NEW.details
                WHEN TG_TABLE_NAME = 'system_logs' THEN NEW.context
                ELSE '{}'::jsonb
            END,
            'timestamp', NEW.created_at
        );

        -- Chamar Edge Function de forma assíncrona usando pg_net (se disponível)
        -- Caso pg_net não esteja disponível, o alerta será registrado mas não enviado
        BEGIN
            -- Tentar usar pg_net para chamar a Edge Function
            PERFORM net.http_post(
                url := format('%s/functions/v1/alert-processor', 
                    current_setting('app.supabase_url', true)),
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', format('Bearer %s', 
                        current_setting('app.supabase_service_role_key', true))
                ),
                body := alert_payload
            );
        EXCEPTION WHEN OTHERS THEN
            -- Se pg_net não estiver disponível, apenas registrar o alerta
            INSERT INTO system_logs (type, message, context)
            VALUES (
                'email',
                'Alerta automático registrado (Edge Function não chamada)',
                jsonb_build_object(
                    'alert_payload', alert_payload,
                    'error', SQLERRM,
                    'note', 'pg_net extension may not be available'
                )
            );
        END;

        -- Registrar que um alerta foi processado
        INSERT INTO system_logs (type, message, context)
        VALUES (
            'general',
            'Alerta automático processado',
            jsonb_build_object(
                'trigger_table', TG_TABLE_NAME,
                'alert_type', alert_payload->>'type',
                'alert_source', alert_payload->>'source'
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário da função corrigida
COMMENT ON FUNCTION process_automatic_alert() IS 'Processa alertas automáticos para erros críticos (CORRIGIDO - não acessa campos inexistentes)';

-- Registrar a correção no sistema de logs
INSERT INTO system_logs (type, message, context)
VALUES (
    'general',
    'Função process_automatic_alert corrigida com sucesso',
    jsonb_build_object(
        'component', 'alert_system',
        'fix_description', 'Corrigido acesso a campos inexistentes NEW.type e NEW.source',
        'changes', ARRAY[
            'Separou lógica de determinação de alert_type_value e alert_source_value',
            'Removeu acesso direto a NEW.type fora do contexto system_logs',
            'Garantiu que campos sejam acessados apenas no contexto correto'
        ]
    )
);