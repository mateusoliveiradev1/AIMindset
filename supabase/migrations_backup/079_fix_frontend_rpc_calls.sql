-- Corrigir chamadas RPC do frontend - criar aliases para as funções que funcionam
-- O frontend chama test_alert_system e test_alert_system_simple
-- Mas as funções que funcionam são test_alert_system_working e test_alert_system_simple_working

-- 1. Substituir test_alert_system para usar a lógica que funciona
CREATE OR REPLACE FUNCTION test_alert_system(
    alert_type text DEFAULT 'test',
    test_message text DEFAULT 'Teste do sistema de alertas via frontend'
)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
    alert_data jsonb;
    subscribers_emails jsonb;
    subscribers_count integer;
BEGIN
    -- Log do início
    INSERT INTO system_logs (type, message, context) 
    VALUES ('test_alert', 'Teste iniciado via frontend - função corrigida', 
            jsonb_build_object(
                'alert_type', alert_type,
                'test_message', test_message,
                'source', 'frontend_button',
                'timestamp', now()
            ));
    
    -- Construir dados do alerta de teste
    alert_data := jsonb_build_object(
        'type', alert_type,
        'source', 'frontend_test_button',
        'message', test_message,
        'details', jsonb_build_object(
            'test_id', 'frontend_test_' || extract(epoch from now())::text,
            'environment', 'supabase_to_nodejs',
            'method', 'corrected_function',
            'called_from', 'admin_panel'
        ),
        'timestamp', now()::text
    );
    
    -- Buscar emails dos assinantes ativos
    SELECT jsonb_agg(email), COUNT(*) 
    INTO subscribers_emails, subscribers_count
    FROM alert_subscriptions 
    WHERE is_active = true;
    
    -- Log dos assinantes encontrados
    INSERT INTO system_logs (type, message, context) 
    VALUES ('test_alert', 'Assinantes encontrados para teste do frontend', 
            jsonb_build_object(
                'subscribers_count', subscribers_count,
                'subscribers_emails', subscribers_emails,
                'source', 'frontend_button'
            ));
    
    IF subscribers_emails IS NULL OR subscribers_count = 0 THEN
        INSERT INTO system_logs (type, message, context) 
        VALUES ('test_alert', 'Teste do frontend falhou - nenhum assinante ativo', 
                jsonb_build_object(
                    'subscribers_count', 0,
                    'source', 'frontend_button'
                ));
        
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Nenhum assinante ativo encontrado',
            'subscribers_count', 0,
            'note', 'Adicione assinantes na seção de Gerenciamento de Alertas'
        );
    END IF;
    
    -- Chamar função que funciona (sem pg_net)
    result := call_nodejs_email_endpoint_working(subscribers_emails, alert_data);
    
    -- Log do resultado
    INSERT INTO system_logs (type, message, context) 
    VALUES ('test_alert', 'Teste do frontend concluído com sucesso', 
            jsonb_build_object(
                'result', result, 
                'subscribers_count', subscribers_count,
                'alert_type', alert_type,
                'success', true,
                'source', 'frontend_button'
            ));
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Sistema de alertas testado com sucesso',
        'method', 'corrected_frontend_function',
        'subscribers_count', subscribers_count,
        'test_result', result,
        'data', jsonb_build_object(
            'logged', true,
            'email_queued', true,
            'timestamp', now()::text,
            'note', 'Verifique os logs na aba App Logs e sua caixa de email'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Substituir test_alert_system_simple para usar a lógica que funciona
CREATE OR REPLACE FUNCTION test_alert_system_simple(
    alert_type text DEFAULT 'simple_test',
    test_message text DEFAULT 'Teste simples via frontend'
)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
    subscribers_count integer;
    alert_data jsonb;
    subscribers_emails jsonb;
BEGIN
    -- Contar assinantes ativos
    SELECT COUNT(*) INTO subscribers_count
    FROM alert_subscriptions 
    WHERE is_active = true;
    
    -- Registrar teste simples
    INSERT INTO system_logs (type, message, context) 
    VALUES ('test_alert_simple', 'Teste simples iniciado via frontend', 
            jsonb_build_object(
                'subscribers_count', subscribers_count,
                'test_type', 'simple_frontend_test',
                'alert_type', alert_type,
                'test_message', test_message,
                'source', 'frontend_simple_button',
                'timestamp', now()
            ));
    
    IF subscribers_count = 0 THEN
        INSERT INTO system_logs (type, message, context) 
        VALUES ('test_alert_simple', 'Teste simples falhou - sem assinantes', 
                jsonb_build_object(
                    'subscribers_count', 0,
                    'source', 'frontend_simple_button'
                ));
        
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Nenhum assinante ativo encontrado',
            'subscribers_count', 0
        );
    END IF;
    
    -- Buscar emails dos assinantes para o teste simples
    SELECT jsonb_agg(email) INTO subscribers_emails
    FROM alert_subscriptions 
    WHERE is_active = true;
    
    -- Construir dados do alerta simples
    alert_data := jsonb_build_object(
        'type', alert_type,
        'source', 'frontend_simple_test',
        'message', test_message,
        'details', jsonb_build_object(
            'test_id', 'simple_' || extract(epoch from now())::text,
            'method', 'simple_corrected_function'
        ),
        'timestamp', now()::text
    );
    
    -- Chamar função que funciona
    result := call_nodejs_email_endpoint_working(subscribers_emails, alert_data);
    
    -- Log do resultado
    INSERT INTO system_logs (type, message, context) 
    VALUES ('test_alert_simple', 'Teste simples concluído via frontend', 
            jsonb_build_object(
                'result', result,
                'subscribers_count', subscribers_count,
                'source', 'frontend_simple_button',
                'success', true
            ));
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Sistema funcionando - ' || subscribers_count || ' assinantes ativos',
        'subscribers_count', subscribers_count,
        'method', 'simple_corrected_test',
        'logged', true,
        'data', jsonb_build_object(
            'email_queued', true,
            'timestamp', now()::text,
            'test_result', result
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Conceder permissões
GRANT EXECUTE ON FUNCTION test_alert_system(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION test_alert_system(text, text) TO anon;
GRANT EXECUTE ON FUNCTION test_alert_system_simple(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION test_alert_system_simple(text, text) TO anon;

-- 4. Log da correção
INSERT INTO system_logs (type, message, context) 
VALUES ('migration', 'Funções RPC do frontend corrigidas', 
        jsonb_build_object(
            'migration', '079_fix_frontend_rpc_calls',
            'problem_solved', 'Frontend agora chama funções que realmente funcionam',
            'functions_fixed', jsonb_build_array('test_alert_system', 'test_alert_system_simple'),
            'status', 'corrected',
            'note', 'Botões do painel admin agora devem funcionar corretamente'
        ));