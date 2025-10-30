-- =====================================================
-- CORREÇÃO FINAL DOS TRIGGERS DE ALERTAS AUTOMÁTICOS
-- Corrige todos os problemas de acesso a campos inexistentes
-- =====================================================

-- Função completamente reescrita para processar alertas automáticos
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

        -- Chamar Edge Function de forma assíncrona usando pg_net (se disponível)
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
            -- Usar INSERT direto sem depender de campos específicos
            INSERT INTO system_logs (type, message, context)
            VALUES (
                'email',
                'Alerta automático registrado (Edge Function não chamada)',
                jsonb_build_object(
                    'alert_payload', alert_payload,
                    'error', SQLERRM,
                    'note', 'pg_net extension may not be available',
                    'timestamp', NOW()
                )
            );
        END;

        -- Registrar que um alerta foi processado
        -- Usar INSERT direto sem depender de campos específicos
        INSERT INTO system_logs (type, message, context)
        VALUES (
            'general',
            'Alerta automático processado',
            jsonb_build_object(
                'trigger_table', TG_TABLE_NAME,
                'alert_type', alert_type_value,
                'alert_source', alert_source_value,
                'processed_at', NOW()
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário da função corrigida
COMMENT ON FUNCTION process_automatic_alert() IS 'Processa alertas automáticos - VERSÃO FINAL CORRIGIDA (sem acesso a campos inexistentes)';

-- Recriar os triggers para garantir que estão usando a função corrigida
DROP TRIGGER IF EXISTS trigger_app_logs_alert ON app_logs;
CREATE TRIGGER trigger_app_logs_alert
    AFTER INSERT ON app_logs
    FOR EACH ROW
    EXECUTE FUNCTION process_automatic_alert();

DROP TRIGGER IF EXISTS trigger_system_logs_alert ON system_logs;
CREATE TRIGGER trigger_system_logs_alert
    AFTER INSERT ON system_logs
    FOR EACH ROW
    EXECUTE FUNCTION process_automatic_alert();

-- Registrar a correção final no sistema de logs
INSERT INTO system_logs (type, message, context)
VALUES (
    'general',
    'Função process_automatic_alert corrigida DEFINITIVAMENTE',
    jsonb_build_object(
        'component', 'alert_system',
        'version', 'final_fix',
        'fix_description', 'Reescrita completa da função para evitar todos os erros de campos inexistentes',
        'changes', ARRAY[
            'Separou completamente a lógica por tipo de tabela',
            'Usa COALESCE para campos opcionais',
            'Não acessa campos fora do contexto correto',
            'Preparação de dados antes da construção do payload',
            'Triggers recriados para garantir uso da função corrigida'
        ],
        'timestamp', NOW()
    )
);