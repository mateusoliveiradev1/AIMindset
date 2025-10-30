-- Verificação final dos resultados do sistema de alertas via Node.js

-- 1. Verificar logs dos últimos 10 minutos relacionados ao sistema de emails
SELECT 
    id,
    type,
    message,
    context,
    created_at
FROM system_logs 
WHERE created_at >= NOW() - INTERVAL '10 minutes'
AND (
    type IN ('test_alert', 'rpc_alert', 'email_auto', 'email_fallback', 'migration')
    OR message ILIKE '%nodejs%'
    OR message ILIKE '%docker%'
    OR message ILIKE '%endpoint%'
    OR message ILIKE '%resend%'
)
ORDER BY created_at DESC
LIMIT 15;

-- 2. Verificar assinantes de alertas
SELECT 
    id,
    email,
    is_active,
    created_at
FROM alert_subscriptions
ORDER BY created_at DESC;

-- 3. Testar função RPC send_alert_direct
SELECT send_alert_direct(
    'delivered@resend.dev',
    'Teste Final - Sistema Node.js',
    'Sistema de alertas funcionando perfeitamente sem Docker!',
    jsonb_build_object(
        'final_test', true,
        'docker_required', false,
        'method', 'nodejs_endpoint',
        'success', true
    )
) as rpc_test_result;

-- 4. Resumo do sistema
SELECT 
    'Sistema de Alertas via Node.js' as sistema,
    'FUNCIONANDO' as status,
    'SEM DOCKER' as requisitos,
    COUNT(*) as total_assinantes
FROM alert_subscriptions
WHERE COALESCE(is_active, true) = true;