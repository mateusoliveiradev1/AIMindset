-- Verificar os logs de diagnóstico

SELECT 
    type,
    message,
    context,
    created_at
FROM system_logs 
WHERE type = 'diagnosis' 
ORDER BY created_at DESC 
LIMIT 10;