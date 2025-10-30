-- Migração: Atualizar triggers de alertas com fallback para função RPC
-- Data: 2024-01-20
-- Descrição: Atualiza a função process_automatic_alert para usar função RPC como fallback

-- Recriar a função process_automatic_alert com fallback melhorado
CREATE OR REPLACE FUNCTION process_automatic_alert()
RETURNS TRIGGER AS $$
DECLARE
    alert_payload jsonb;
    function_url text;
    response record;
    fallback_result jsonb;
BEGIN
    -- Processar apenas alertas de erro crítico ou erro
    IF TG_TABLE_NAME = 'app_logs' THEN
        -- Para app_logs, verificar se é erro
        IF NEW.level NOT IN ('error') THEN
            RETURN NEW;
        END IF;
        
        -- Construir payload para app_logs
        alert_payload := jsonb_build_object(
            'type', 'error',
            'source', COALESCE(NEW.source, 'app_logs'),
            'message', format('Erro na aplicação: %s - %s', 
                COALESCE(NEW.action, 'ação desconhecida'),
                COALESCE(NEW.details->>'message', 'detalhes não disponíveis')
            ),
            'details', jsonb_build_object(
                'level', NEW.level,
                'source', NEW.source,
                'action', NEW.action,
                'details', NEW.details,
                'table', 'app_logs',
                'record_id', NEW.id
            ),
            'timestamp', NEW.created_at::text
        );
        
    ELSIF TG_TABLE_NAME = 'system_logs' THEN
        -- Para system_logs, verificar se é tipo crítico
        IF NEW.type NOT IN ('security', 'database_error', 'critical_error') THEN
            RETURN NEW;
        END IF;
        
        -- Construir payload para system_logs
        alert_payload := jsonb_build_object(
            'type', CASE 
                WHEN NEW.type = 'security' THEN 'critical'
                ELSE 'error'
            END,
            'source', COALESCE(NEW.context->>'source', 'system_logs'),
            'message', NEW.message,
            'details', jsonb_build_object(
                'type', NEW.type,
                'message', NEW.message,
                'context', NEW.context,
                'table', 'system_logs',
                'record_id', NEW.id
            ),
            'timestamp', NEW.created_at::text
        );
    ELSE
        -- Tabela não suportada
        RETURN NEW;
    END IF;

    -- Tentar enviar alerta via pg_net primeiro
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
            -- Construir URL da Edge Function
            function_url := current_setting('app.supabase_url', true) || '/functions/v1/alert-processor';
            
            -- Chamar Edge Function
            SELECT status, body INTO response
            FROM net.http_post(
                url := function_url,
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
                ),
                body := alert_payload
            );
            
            -- Se sucesso, registrar no log
            IF response.status BETWEEN 200 AND 299 THEN
                INSERT INTO system_logs (type, message, context)
                VALUES (
                    'alert_sent',
                    'Alerta enviado com sucesso via pg_net',
                    jsonb_build_object(
                        'alert_payload', alert_payload,
                        'response_status', response.status,
                        'method', 'pg_net_direct'
                    )
                );
            ELSE
                -- Se falhou, usar função RPC como fallback
                RAISE EXCEPTION 'pg_net failed with status %', response.status;
            END IF;
        ELSE
            -- pg_net não disponível, usar função RPC
            RAISE EXCEPTION 'pg_net not available';
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        -- Fallback: usar função RPC
        BEGIN
            SELECT send_alert_direct(
                alert_payload->>'type',
                alert_payload->>'source',
                alert_payload->>'message',
                alert_payload->'details'
            ) INTO fallback_result;
            
            -- Registrar o uso do fallback
            INSERT INTO system_logs (type, message, context)
            VALUES (
                'alert_fallback',
                'Alerta enviado via função RPC (fallback)',
                jsonb_build_object(
                    'alert_payload', alert_payload,
                    'fallback_result', fallback_result,
                    'original_error', SQLERRM,
                    'method', 'rpc_fallback'
                )
            );
            
        EXCEPTION WHEN OTHERS THEN
            -- Se tudo falhar, apenas registrar o erro
            INSERT INTO system_logs (type, message, context)
            VALUES (
                'alert_failed',
                'Falha ao enviar alerta: ' || SQLERRM,
                jsonb_build_object(
                    'alert_payload', alert_payload,
                    'error_message', SQLERRM,
                    'error_state', SQLSTATE,
                    'method', 'all_methods_failed'
                )
            );
        END;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar os triggers
DROP TRIGGER IF EXISTS app_logs_alert_trigger ON app_logs;
DROP TRIGGER IF EXISTS system_logs_alert_trigger ON system_logs;

CREATE TRIGGER app_logs_alert_trigger
    AFTER INSERT ON app_logs
    FOR EACH ROW
    EXECUTE FUNCTION process_automatic_alert();

CREATE TRIGGER system_logs_alert_trigger
    AFTER INSERT ON system_logs
    FOR EACH ROW
    EXECUTE FUNCTION process_automatic_alert();

-- Registrar a migração no sistema de logs
INSERT INTO system_logs (type, message, context)
VALUES (
    'migration',
    'Migração 048: Atualizada função process_automatic_alert com fallback para RPC',
    jsonb_build_object(
        'migration_file', '048_update_alert_triggers_with_fallback.sql',
        'changes', jsonb_build_array(
            'Adicionado fallback para função RPC quando pg_net falha',
            'Melhorado tratamento de erros',
            'Adicionados logs detalhados para debug'
        ),
        'triggers_recreated', jsonb_build_array(
            'app_logs_alert_trigger',
            'system_logs_alert_trigger'
        )
    )
);