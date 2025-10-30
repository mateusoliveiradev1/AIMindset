-- Verificar se as funções existem e suas definições
SELECT 
    p.proname as function_name,
    pg_get_function_result(p.oid) as return_type,
    pg_get_function_arguments(p.oid) as arguments,
    p.prosrc as source_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('test_alert_system', 'test_alert_system_simple', 'call_nodejs_email_endpoint');

-- Verificar permissões das funções
SELECT 
    p.proname as function_name,
    p.proacl as permissions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('test_alert_system', 'test_alert_system_simple');

-- Verificar se há assinantes
SELECT COUNT(*) as subscriber_count FROM alert_subscribers;

-- Testar função test_alert_system_simple
DO $$
BEGIN
    BEGIN
        PERFORM test_alert_system_simple();
        INSERT INTO system_logs (type, message, context, created_at)
        VALUES ('info', 'Função test_alert_system_simple testada com sucesso', 
                jsonb_build_object('result', 'success'), NOW());
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO system_logs (type, message, context, created_at)
        VALUES ('error', 'Erro ao testar função test_alert_system_simple', 
                jsonb_build_object('error', SQLERRM), NOW());
    END;
END $$;

-- Testar função test_alert_system
DO $$
BEGIN
    BEGIN
        PERFORM test_alert_system();
        INSERT INTO system_logs (type, message, context, created_at)
        VALUES ('info', 'Função test_alert_system testada com sucesso', 
                jsonb_build_object('result', 'success'), NOW());
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO system_logs (type, message, context, created_at)
        VALUES ('error', 'Erro ao testar função test_alert_system', 
                jsonb_build_object('error', SQLERRM), NOW());
    END;
END $$;

-- Verificar logs recentes
SELECT * FROM system_logs 
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC
LIMIT 10;