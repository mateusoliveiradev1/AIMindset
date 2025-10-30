-- Teste completo do sistema de alertas via Node.js (sem Docker) - CORRIGIDO

-- 1. Verificar se há assinantes (criar um se não houver)
INSERT INTO alert_subscriptions (email)
SELECT 'delivered@resend.dev'
WHERE NOT EXISTS (
    SELECT 1 FROM alert_subscriptions WHERE email = 'delivered@resend.dev'
);

-- 2. Testar função RPC direta
SELECT test_alert_system('test', 'Teste do sistema via Node.js - SEM DOCKER!') as test_result;

-- 3. Testar trigger automático inserindo um log de erro
INSERT INTO system_logs (type, message, context)
VALUES (
    'error',
    'Teste de erro automático para trigger via Node.js',
    jsonb_build_object(
        'test_type', 'automatic_trigger',
        'docker_required', false,
        'method', 'nodejs_endpoint',
        'timestamp', now()
    )
);

-- 4. Verificar logs recentes
SELECT 
    id,
    type,
    message,
    context,
    created_at
FROM system_logs 
WHERE created_at >= NOW() - INTERVAL '5 minutes'
AND (
    type IN ('test_alert', 'rpc_alert', 'email_auto', 'email_fallback')
    OR message ILIKE '%nodejs%'
    OR message ILIKE '%docker%'
)
ORDER BY created_at DESC
LIMIT 10;

-- 5. Verificar assinantes
SELECT 
    id,
    email,
    created_at
FROM alert_subscriptions
ORDER BY created_at DESC;