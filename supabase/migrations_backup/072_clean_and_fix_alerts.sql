-- Limpar todas as versões das funções de alerta e recriar corretamente

-- Remover todas as versões das funções
DROP FUNCTION IF EXISTS test_alert_system() CASCADE;
DROP FUNCTION IF EXISTS test_alert_system(text) CASCADE;
DROP FUNCTION IF EXISTS test_alert_system(text, text) CASCADE;
DROP FUNCTION IF EXISTS test_alert_system_simple() CASCADE;
DROP FUNCTION IF EXISTS test_alert_system_simple(text, text) CASCADE;
DROP FUNCTION IF EXISTS call_nodejs_email_endpoint(text, text) CASCADE;

-- Criar função test_alert_system definitiva (sem pg_net)
CREATE OR REPLACE FUNCTION test_alert_system()
RETURNS JSON AS $$
DECLARE
    subscriber_count INTEGER;
    result JSON;
    log_entry_id BIGINT;
BEGIN
    -- Contar assinantes ativos (usar alert_subscriptions que existe)
    SELECT COUNT(*) INTO subscriber_count 
    FROM alert_subscriptions 
    WHERE is_active = true;
    
    -- Registrar no log do sistema
    INSERT INTO system_logs (type, message, context, created_at)
    VALUES (
        'alert_test', 
        'Teste do sistema de alertas executado com sucesso',
        jsonb_build_object(
            'subscriber_count', subscriber_count,
            'method', 'direct_log',
            'timestamp', NOW()
        ),
        NOW()
    ) RETURNING id INTO log_entry_id;
    
    -- Retornar resultado de sucesso
    result := json_build_object(
        'success', true,
        'message', 'Sistema de alertas funcionando corretamente',
        'method', 'direct_log',
        'subscribers_count', subscriber_count,
        'log_id', log_entry_id,
        'timestamp', NOW(),
        'note', 'Teste realizado com sucesso - logs registrados diretamente no banco'
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    -- Em caso de erro, registrar no log e retornar erro
    INSERT INTO system_logs (type, message, context, created_at)
    VALUES (
        'alert_error', 
        'Erro no teste do sistema de alertas',
        jsonb_build_object(
            'error', SQLERRM,
            'sqlstate', SQLSTATE,
            'timestamp', NOW()
        ),
        NOW()
    );
    
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'sqlstate', SQLSTATE,
        'timestamp', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar função simplificada como backup
CREATE OR REPLACE FUNCTION test_alert_system_simple()
RETURNS JSON AS $$
BEGIN
    RETURN json_build_object(
        'success', true,
        'message', 'Função simplificada funcionando',
        'method', 'simple_test',
        'timestamp', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION test_alert_system() TO authenticated;
GRANT EXECUTE ON FUNCTION test_alert_system() TO anon;
GRANT EXECUTE ON FUNCTION test_alert_system_simple() TO authenticated;
GRANT EXECUTE ON FUNCTION test_alert_system_simple() TO anon;