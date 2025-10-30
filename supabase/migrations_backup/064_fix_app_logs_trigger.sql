-- =====================================================
-- CORREÇÃO DEFINITIVA DO TRIGGER DE APP_LOGS
-- Remove acesso ao campo 'message' inexistente na tabela app_logs
-- =====================================================

-- Função corrigida para processar alertas automáticos
CREATE OR REPLACE FUNCTION process_automatic_alert()
RETURNS TRIGGER AS $$
DECLARE
    alert_payload jsonb;
    should_alert boolean := false;
    alert_type_value text;
    alert_source_value text;
    alert_message_value text;
    alert_details_value jsonb;
BEGIN
    -- Verificar se é um erro crítico que precisa de alerta e preparar dados
    IF TG_TABLE_NAME = 'app_logs' THEN
        -- Para app_logs: verificar se level = 'error'
        should_alert := (NEW.level = 'error');
        
        IF should_alert THEN
            alert_type_value := 'error';
            alert_source_value := COALESCE(NEW.source, 'unknown');
            -- CORREÇÃO: app_logs não tem campo 'message', usar action e details
            alert_message_value := format('Erro na aplicação: %s - %s', 
                COALESCE(NEW.source, 'unknown'), 
                COALESCE(NEW.action, 'unknown'));
            alert_details_value := COALESCE(NEW.details, '{}'::jsonb);
        END IF;
        
    ELSIF TG_TABLE_NAME = 'system_logs' THEN
        -- Para system_logs: verificar se type está em lista crítica
        should_alert := (NEW.type IN ('security', 'database', 'api', 'error'));
        
        IF should_alert THEN
            alert_type_value := CASE 
                WHEN NEW.type = 'security' THEN 'critical'
                ELSE 'error'
            END;
            alert_source_value := COALESCE(NEW.type, 'unknown');
            -- system_logs TEM campo 'message'
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

        -- Registrar o alerta no sistema de logs (sem tentar enviar email por enquanto)
        INSERT INTO system_logs (type, message, context)
        VALUES (
            'alert_generated',
            format('Alerta automático gerado: %s', alert_message_value),
            jsonb_build_object(
                'alert_payload', alert_payload,
                'trigger_table', TG_TABLE_NAME,
                'alert_type', alert_type_value,
                'alert_source', alert_source_value
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário da função corrigida
COMMENT ON FUNCTION process_automatic_alert() IS 'Processa alertas automáticos - CORRIGIDO para não acessar campo message em app_logs';

-- Recriar os triggers para garantir que usem a função corrigida
DROP TRIGGER IF EXISTS trigger_app_logs_alert ON app_logs;
DROP TRIGGER IF EXISTS app_logs_alert_trigger ON app_logs;

CREATE TRIGGER trigger_app_logs_alert
    AFTER INSERT ON app_logs
    FOR EACH ROW
    EXECUTE FUNCTION process_automatic_alert();

DROP TRIGGER IF EXISTS trigger_system_logs_alert ON system_logs;
DROP TRIGGER IF EXISTS system_logs_alert_trigger ON system_logs;

CREATE TRIGGER trigger_system_logs_alert
    AFTER INSERT ON system_logs
    FOR EACH ROW
    EXECUTE FUNCTION process_automatic_alert();

-- Registrar a correção no sistema de logs
INSERT INTO system_logs (type, message, context)
VALUES (
    'system_fix',
    'Trigger process_automatic_alert corrigido - removido acesso a campo message inexistente em app_logs',
    jsonb_build_object(
        'component', 'alert_system',
        'version', 'v064_fix',
        'fix_description', 'Corrigido acesso ao campo message que não existe na tabela app_logs',
        'changes', ARRAY[
            'Removido acesso a NEW.message para tabela app_logs',
            'Mantido acesso a NEW.message apenas para system_logs',
            'Triggers recriados para garantir uso da função corrigida',
            'Simplificado para apenas registrar alertas (sem envio de email)'
        ],
        'timestamp', NOW()
    )
);