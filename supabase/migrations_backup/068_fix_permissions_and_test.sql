-- Corrigir permissões e testar função test_alert_system

-- 1. Garantir que a função test_alert_system existe e tem as permissões corretas
GRANT EXECUTE ON FUNCTION test_alert_system(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION test_alert_system(text, text) TO anon;
GRANT EXECUTE ON FUNCTION test_alert_system(text, text) TO service_role;

-- 2. Garantir que há pelo menos um assinante ativo
INSERT INTO alert_subscriptions (email, is_active) 
VALUES ('test@example.com', true)
ON CONFLICT (email) DO UPDATE SET is_active = true;

-- 3. Testar a função diretamente
DO $$
DECLARE
    test_result jsonb;
    error_msg text;
BEGIN
    BEGIN
        SELECT test_alert_system('test', 'Teste de correção de permissões') INTO test_result;
        
        INSERT INTO system_logs (type, message, context) 
        VALUES ('permission_fix', 'Teste da função test_alert_system após correção de permissões', 
                jsonb_build_object('result', test_result, 'success', true));
    EXCEPTION WHEN OTHERS THEN
        error_msg := SQLERRM;
        INSERT INTO system_logs (type, message, context) 
        VALUES ('permission_fix', 'Erro ao testar função test_alert_system', 
                jsonb_build_object('error', error_msg, 'success', false));
    END;
END $$;

-- 4. Verificar se a extensão pg_net está disponível
DO $$
DECLARE
    pg_net_available boolean;
BEGIN
    SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_net') INTO pg_net_available;
    
    INSERT INTO system_logs (type, message, context) 
    VALUES ('permission_fix', 'Verificação da extensão pg_net', 
            jsonb_build_object('pg_net_available', pg_net_available));
END $$;

-- 5. Verificar logs recentes
SELECT 
    type,
    message,
    context,
    created_at
FROM system_logs 
WHERE type IN ('permission_fix', 'diagnosis', 'test_alert', 'email_auto', 'rpc_alert')
ORDER BY created_at DESC 
LIMIT 10;