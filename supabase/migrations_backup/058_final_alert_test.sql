-- Teste final do sistema de alertas sem dependência do Docker

-- 1. Verificar se há assinantes de alertas
INSERT INTO alert_subscriptions (email) 
VALUES ('admin@aimindset.com') 
ON CONFLICT (email) DO NOTHING;

-- 2. Testar função RPC send_alert_direct
SELECT send_alert_direct(
    'admin@aimindset.com',
    'Teste Final - Sistema de Alertas',
    'Este é um teste final do sistema de alertas. Se você receber este email, o sistema está funcionando corretamente!'
) as test_result;

-- 3. Testar função test_alert_system
SELECT test_alert_system('app_error', 'Teste de erro da aplicação - Sistema funcionando') as app_error_test;

SELECT test_alert_system('security', 'Teste de alerta de segurança - Sistema funcionando') as security_test;

-- 4. Inserir log de erro para testar trigger automático
INSERT INTO system_logs (type, message, context)
VALUES (
    'error',
    'Teste de erro crítico para trigger automático',
    jsonb_build_object(
        'test_id', 'final_test_' || extract(epoch from now()),
        'severity', 'high',
        'source', 'final_test',
        'timestamp', NOW()
    )
);

-- 5. Verificar logs de alertas recentes
SELECT 
    id,
    type,
    message,
    context,
    created_at
FROM system_logs 
WHERE type IN ('alert_sent', 'alert_fallback', 'alert_failed', 'alert_queued', 'final_test', 'test')
AND created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 20;

-- 6. Verificar assinantes
SELECT 
    id,
    email,
    created_at
FROM alert_subscriptions
ORDER BY created_at DESC;