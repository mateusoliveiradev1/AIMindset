-- Verificar os resultados dos testes e logs do sistema

-- Verificar logs recentes do sistema
SELECT 
    id,
    type,
    message,
    context,
    created_at
FROM system_logs 
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 20;

-- Verificar assinantes de alertas
SELECT 
    id,
    email,
    created_at
FROM alert_subscriptions
ORDER BY created_at DESC;

-- Verificar se pg_net está disponível
SELECT 
    extname,
    extversion
FROM pg_extension 
WHERE extname = 'pg_net';