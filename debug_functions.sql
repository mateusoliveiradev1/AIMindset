-- Script para verificar se as funções do sistema de alertas existem

-- 1. Verificar se a função test_alert_system existe
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname = 'test_alert_system';

-- 2. Verificar se a função call_nodejs_email_endpoint existe
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname = 'call_nodejs_email_endpoint';

-- 3. Verificar se há assinantes na tabela alert_subscriptions
SELECT COUNT(*) as total_subscribers, 
       COUNT(CASE WHEN is_active = true THEN 1 END) as active_subscribers
FROM alert_subscriptions;

-- 4. Listar assinantes ativos
SELECT email, created_at, is_active 
FROM alert_subscriptions 
WHERE is_active = true;

-- 5. Testar a função test_alert_system (se existir)
SELECT test_alert_system('test', 'Teste de diagnóstico do sistema');