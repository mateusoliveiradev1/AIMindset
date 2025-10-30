-- Diagnóstico completo do sistema de alertas

-- 1. Verificar se a função test_alert_system existe
DO $$
DECLARE
    func_exists boolean;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM pg_proc 
        WHERE proname = 'test_alert_system'
    ) INTO func_exists;
    
    INSERT INTO system_logs (type, message, context) 
    VALUES ('diagnosis', 'Verificação da função test_alert_system', 
            jsonb_build_object('function_exists', func_exists));
END $$;

-- 2. Verificar se há assinantes
DO $$
DECLARE
    subscriber_count integer;
    active_count integer;
BEGIN
    SELECT COUNT(*) INTO subscriber_count FROM alert_subscriptions;
    SELECT COUNT(*) INTO active_count FROM alert_subscriptions WHERE is_active = true;
    
    INSERT INTO system_logs (type, message, context) 
    VALUES ('diagnosis', 'Verificação de assinantes', 
            jsonb_build_object(
                'total_subscribers', subscriber_count,
                'active_subscribers', active_count
            ));
END $$;

-- 3. Se não há assinantes, adicionar um para teste
INSERT INTO alert_subscriptions (email, is_active) 
VALUES ('test@example.com', true)
ON CONFLICT (email) DO UPDATE SET is_active = true;

-- 4. Verificar se a função call_nodejs_email_endpoint existe
DO $$
DECLARE
    func_exists boolean;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM pg_proc 
        WHERE proname = 'call_nodejs_email_endpoint'
    ) INTO func_exists;
    
    INSERT INTO system_logs (type, message, context) 
    VALUES ('diagnosis', 'Verificação da função call_nodejs_email_endpoint', 
            jsonb_build_object('function_exists', func_exists));
END $$;

-- 5. Tentar executar a função test_alert_system se ela existir
DO $$
DECLARE
    func_exists boolean;
    test_result jsonb;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM pg_proc 
        WHERE proname = 'test_alert_system'
    ) INTO func_exists;
    
    IF func_exists THEN
        BEGIN
            SELECT test_alert_system('diagnosis', 'Teste de diagnóstico automático') INTO test_result;
            
            INSERT INTO system_logs (type, message, context) 
            VALUES ('diagnosis', 'Teste da função test_alert_system executado', 
                    jsonb_build_object('result', test_result, 'success', true));
        EXCEPTION WHEN OTHERS THEN
            INSERT INTO system_logs (type, message, context) 
            VALUES ('diagnosis', 'Erro ao executar test_alert_system', 
                    jsonb_build_object('error', SQLERRM, 'success', false));
        END;
    ELSE
        INSERT INTO system_logs (type, message, context) 
        VALUES ('diagnosis', 'Função test_alert_system não encontrada', 
                jsonb_build_object('success', false));
    END IF;
END $$;

-- 6. Verificar logs recentes do sistema
INSERT INTO system_logs (type, message, context) 
VALUES ('diagnosis', 'Diagnóstico completo finalizado', 
        jsonb_build_object('timestamp', now(), 'migration', '065_diagnose_test_function'));