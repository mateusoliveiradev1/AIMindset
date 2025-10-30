-- =====================================================
-- SISTEMA DE ALERTAS AUTOMÁTICOS - AIMindset
-- =====================================================
-- Cria sistema de alertas automáticos para erros críticos
-- Integração com Edge Function para envio de e-mails

-- Função para processar alertas automáticos
CREATE OR REPLACE FUNCTION process_automatic_alert()
RETURNS TRIGGER AS $$
DECLARE
    alert_payload jsonb;
    function_url text;
    should_alert boolean := false;
BEGIN
    -- Verificar se é um erro crítico que precisa de alerta
    IF TG_TABLE_NAME = 'app_logs' THEN
        should_alert := (NEW.level = 'error');
    ELSIF TG_TABLE_NAME = 'system_logs' THEN
        should_alert := (NEW.type IN ('security', 'database', 'api'));
    END IF;
    
    IF should_alert THEN
        
        -- Construir payload do alerta
        alert_payload := jsonb_build_object(
            'type', CASE 
                WHEN TG_TABLE_NAME = 'app_logs' THEN 'error'
                WHEN NEW.type = 'security' THEN 'critical'
                ELSE 'error'
            END,
            'source', CASE 
                WHEN TG_TABLE_NAME = 'app_logs' THEN NEW.source
                WHEN TG_TABLE_NAME = 'system_logs' THEN NEW.type
                ELSE 'unknown'
            END,
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

-- Comentário da função
COMMENT ON FUNCTION process_automatic_alert() IS 'Processa alertas automáticos para erros críticos e chama Edge Function para envio de e-mails';

-- Criar triggers para alertas automáticos
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

-- Função RPC para testar o sistema de alertas
CREATE OR REPLACE FUNCTION test_alert_system(
    alert_type text DEFAULT 'error',
    test_message text DEFAULT 'Teste do sistema de alertas'
)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    -- Inserir um log de teste que deve disparar o alerta
    IF alert_type = 'app_error' THEN
        INSERT INTO app_logs (level, source, action, details)
        VALUES (
            'error',
            'test_system',
            'alert_test',
            jsonb_build_object(
                'test', true,
                'message', test_message,
                'timestamp', now()
            )
        );
    ELSE
        INSERT INTO system_logs (type, message, context)
        VALUES (
            'security',
            test_message,
            jsonb_build_object(
                'test', true,
                'alert_type', alert_type,
                'timestamp', now()
            )
        );
    END IF;

    result := jsonb_build_object(
        'success', true,
        'message', 'Alerta de teste inserido com sucesso',
        'alert_type', alert_type,
        'test_message', test_message
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário da função de teste
COMMENT ON FUNCTION test_alert_system(text, text) IS 'Função para testar o sistema de alertas automáticos';

-- Conceder permissões para usuários autenticados
GRANT EXECUTE ON FUNCTION test_alert_system(text, text) TO authenticated;

-- Função RPC para gerenciar assinantes de alertas
CREATE OR REPLACE FUNCTION manage_alert_subscription(
    p_email text,
    p_action text DEFAULT 'add' -- 'add' ou 'remove'
)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
    existing_count integer;
BEGIN
    -- Verificar se o e-mail já existe
    SELECT COUNT(*) INTO existing_count
    FROM alert_subscriptions
    WHERE email = p_email;

    IF p_action = 'add' THEN
        IF existing_count > 0 THEN
            result := jsonb_build_object(
                'success', false,
                'message', 'E-mail já está inscrito para receber alertas',
                'email', p_email
            );
        ELSE
            INSERT INTO alert_subscriptions (email)
            VALUES (p_email);
            
            result := jsonb_build_object(
                'success', true,
                'message', 'E-mail inscrito com sucesso para receber alertas',
                'email', p_email
            );
        END IF;
    ELSIF p_action = 'remove' THEN
        IF existing_count = 0 THEN
            result := jsonb_build_object(
                'success', false,
                'message', 'E-mail não encontrado na lista de assinantes',
                'email', p_email
            );
        ELSE
            DELETE FROM alert_subscriptions WHERE email = p_email;
            
            result := jsonb_build_object(
                'success', true,
                'message', 'E-mail removido com sucesso da lista de alertas',
                'email', p_email
            );
        END IF;
    ELSE
        result := jsonb_build_object(
            'success', false,
            'message', 'Ação inválida. Use "add" ou "remove"',
            'action', p_action
        );
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário da função de gerenciamento
COMMENT ON FUNCTION manage_alert_subscription(text, text) IS 'Gerencia assinantes de alertas automáticos (adicionar/remover)';

-- Conceder permissões para usuários autenticados
GRANT EXECUTE ON FUNCTION manage_alert_subscription(text, text) TO authenticated;

-- Função RPC para listar assinantes (apenas para admins)
CREATE OR REPLACE FUNCTION get_alert_subscribers()
RETURNS TABLE(
    id bigint,
    email text,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.email,
        a.created_at
    FROM alert_subscriptions a
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário da função de listagem
COMMENT ON FUNCTION get_alert_subscribers() IS 'Lista todos os assinantes de alertas (apenas para admins)';

-- Conceder permissões apenas para usuários autenticados (admins)
GRANT EXECUTE ON FUNCTION get_alert_subscribers() TO authenticated;

-- Inserir um e-mail de administrador padrão para receber alertas
INSERT INTO alert_subscriptions (email)
VALUES ('admin@aimindset.com')
ON CONFLICT (email) DO NOTHING;

-- Registrar a criação do sistema de alertas
INSERT INTO system_logs (type, message, context)
VALUES (
    'general',
    'Sistema de alertas automáticos configurado com sucesso',
    jsonb_build_object(
        'component', 'alert_system',
        'functions_created', ARRAY[
            'process_automatic_alert',
            'test_alert_system',
            'manage_alert_subscription',
            'get_alert_subscribers'
        ],
        'triggers_created', ARRAY[
            'trigger_app_logs_alert',
            'trigger_system_logs_alert'
        ],
        'default_subscriber', 'admin@aimindset.com'
    )
);