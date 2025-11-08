-- Teste direto da função insert_app_log
SELECT insert_app_log(
    'error'::text,
    'frontend_test_button'::text,
    'app_error'::text,
    jsonb_build_object(
        'test_type', 'direct_function_call', 
        'timestamp', NOW(),
        'message', 'Teste de log de erro via botão'
    ),
    NULL::text
);

-- Verificar se o log foi inserido na tabela app_logs
SELECT id, level, source, action, details, user_id, created_at
FROM app_logs 
WHERE source = 'frontend_test_button' 
ORDER BY created_at DESC 
LIMIT 5;