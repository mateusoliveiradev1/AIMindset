-- Verificar resultados finais dos testes de alertas

-- Mostrar logs de alertas das últimas 2 horas
SELECT 
    'LOGS DE ALERTAS' as section,
    id,
    type,
    message,
    context,
    created_at
FROM system_logs 
WHERE type IN ('alert_sent', 'alert_fallback', 'alert_failed', 'alert_queued', 'final_test', 'test', 'debug')
AND created_at >= NOW() - INTERVAL '2 hours'
ORDER BY created_at DESC;

-- Mostrar estatísticas de alertas
SELECT 
    'ESTATÍSTICAS DE ALERTAS' as section,
    type,
    COUNT(*) as total,
    MAX(created_at) as ultimo_alerta
FROM system_logs 
WHERE type LIKE 'alert_%' 
AND created_at > now() - interval '24 hours'
GROUP BY type
ORDER BY total DESC;

-- Verificar se pg_net está disponível
SELECT 
    'EXTENSÕES DISPONÍVEIS' as section,
    extname as extension_name,
    extversion as version
FROM pg_extension 
WHERE extname IN ('pg_net', 'http');

-- Verificar assinantes de alertas
SELECT 
    'ASSINANTES DE ALERTAS' as section,
    id,
    email,
    created_at
FROM alert_subscriptions
ORDER BY created_at DESC;