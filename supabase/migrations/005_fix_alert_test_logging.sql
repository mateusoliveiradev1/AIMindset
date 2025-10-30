-- =====================================================
-- CORREÇÃO: Adicionar logs na tabela app_logs para funções de teste de alertas
-- =====================================================

-- Função de teste do sistema de alertas (corrigida)
CREATE OR REPLACE FUNCTION test_alert_system(
    alert_type text DEFAULT 'test',
    test_message text DEFAULT 'Teste do sistema de alertas'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    subscribers_emails jsonb;
    alert_data jsonb;
    result jsonb;
BEGIN
    -- Log do início do teste (system_logs)
    INSERT INTO system_logs (type, message, context)
    VALUES ('test_alert', 'Teste iniciado via frontend - função corrigida',
            jsonb_build_object(
                'alert_type', alert_type,
                'test_message', test_message
            ));
    
    -- Log do início do teste (app_logs) - NOVO
    PERFORM insert_app_log(
        'info',
        'alert_test',
        'test_started',
        jsonb_build_object(
            'alert_type', alert_type,
            'test_message', test_message,
            'timestamp', NOW()
        )
    );
    
    -- Construir dados do alerta de teste
    alert_data := jsonb_build_object(
        'type', alert_type,
        'message', test_message,
        'timestamp', NOW(),
        'test', true
    );
    
    -- Buscar assinantes ativos
    SELECT jsonb_agg(email)
    INTO subscribers_emails
    FROM alert_subscriptions
    WHERE is_active = true;
    
    -- Verificar se há assinantes
    IF subscribers_emails IS NULL OR jsonb_array_length(subscribers_emails) = 0 THEN
        INSERT INTO system_logs (type, message, context)
        VALUES ('test_alert', 'Teste do frontend falhou - nenhum assinante ativo',
                jsonb_build_object(
                    'alert_type', alert_type,
                    'subscribers_found', 0,
                    'recommendation', 'Adicione assinantes na seção de Gerenciamento de Alertas'
                ));
        
        -- Log de falha (app_logs) - NOVO
        PERFORM insert_app_log(
            'warning',
            'alert_test',
            'test_failed_no_subscribers',
            jsonb_build_object(
                'alert_type', alert_type,
                'reason', 'Nenhum assinante ativo encontrado',
                'recommendation', 'Adicione assinantes na seção de Gerenciamento de Alertas'
            )
        );
        
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Nenhum assinante ativo encontrado',
            'note', 'Adicione assinantes na seção de Gerenciamento de Alertas'
        );
    END IF;
    
    -- Chamar endpoint Node.js
    result := call_nodejs_email_endpoint(subscribers_emails, alert_data);
    
    -- Log do sucesso (system_logs)
    INSERT INTO system_logs (type, message, context)
    VALUES ('test_alert', 'Teste do frontend concluído com sucesso',
            jsonb_build_object(
                'result', result,
                'alert_type', alert_type,
                'subscribers_count', jsonb_array_length(subscribers_emails)
            ));
    
    -- Log do sucesso (app_logs) - NOVO
    PERFORM insert_app_log(
        'info',
        'alert_test',
        'test_executed',
        jsonb_build_object(
            'alert_type', alert_type,
            'subscribers_count', jsonb_array_length(subscribers_emails),
            'result', result,
            'message', 'Sistema de alertas testado com sucesso'
        )
    );
    
    -- Retornar resultado com informações adicionais
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Sistema de alertas testado com sucesso',
        'subscribers_count', jsonb_array_length(subscribers_emails),
        'alert_type', alert_type,
        'result', result
    );
END;
$$;

-- Função simplificada de teste (corrigida)
CREATE OR REPLACE FUNCTION test_alert_system_simple(
    alert_type text DEFAULT 'simple_test',
    test_message text DEFAULT 'Teste simples do sistema'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    subscribers_count integer;
    subscribers_emails jsonb;
    alert_data jsonb;
    result jsonb;
BEGIN
    -- Contar assinantes ativos
    SELECT COUNT(*)
    INTO subscribers_count
    FROM alert_subscriptions
    WHERE is_active = true;
    
    -- Log do início (system_logs)
    INSERT INTO system_logs (type, message, context)
    VALUES ('test_alert_simple', 'Teste simples iniciado via frontend',
            jsonb_build_object(
                'subscribers_count', subscribers_count,
                'alert_type', alert_type,
                'test_message', test_message
            ));
    
    -- Log do início (app_logs) - NOVO
    PERFORM insert_app_log(
        'info',
        'alert_test',
        'simple_test_started',
        jsonb_build_object(
            'alert_type', alert_type,
            'test_message', test_message,
            'subscribers_count', subscribers_count,
            'timestamp', NOW()
        )
    );
    
    -- Verificar se há assinantes
    IF subscribers_count = 0 THEN
        INSERT INTO system_logs (type, message, context)
        VALUES ('test_alert_simple', 'Teste simples falhou - sem assinantes',
                jsonb_build_object(
                    'alert_type', alert_type,
                    'recommendation', 'Adicione assinantes na tabela alert_subscriptions'
                ));
        
        -- Log de falha (app_logs) - NOVO
        PERFORM insert_app_log(
            'warning',
            'alert_test',
            'simple_test_failed_no_subscribers',
            jsonb_build_object(
                'alert_type', alert_type,
                'reason', 'Nenhum assinante encontrado',
                'recommendation', 'Adicione assinantes na tabela alert_subscriptions'
            )
        );
        
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Nenhum assinante encontrado',
            'subscribers_count', 0
        );
    END IF;
    
    -- Buscar emails dos assinantes
    SELECT jsonb_agg(email)
    INTO subscribers_emails
    FROM alert_subscriptions
    WHERE is_active = true;
    
    -- Construir dados do alerta simples
    alert_data := jsonb_build_object(
        'type', alert_type,
        'message', test_message,
        'timestamp', NOW(),
        'test', true,
        'simple', true
    );
    
    -- Chamar endpoint Node.js
    result := call_nodejs_email_endpoint(subscribers_emails, alert_data);
    
    -- Log do sucesso (system_logs)
    INSERT INTO system_logs (type, message, context)
    VALUES ('test_alert_simple', 'Teste simples concluído via frontend',
            jsonb_build_object(
                'result', result,
                'subscribers_count', subscribers_count
            ));
    
    -- Log do sucesso (app_logs) - NOVO
    PERFORM insert_app_log(
        'info',
        'alert_test',
        'simple_test_executed',
        jsonb_build_object(
            'alert_type', alert_type,
            'subscribers_count', subscribers_count,
            'result', result,
            'message', 'Teste simples executado com sucesso'
        )
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Teste simples executado com sucesso',
        'subscribers_count', subscribers_count,
        'result', result
    );
END;
$$;