-- =====================================================
-- Teste da Função insert_app_log()
-- =====================================================

-- Teste 1: Inserir um log de teste diretamente
SELECT insert_app_log(
    'test_alert',
    'Teste de log de alerta - função direta',
    jsonb_build_object(
        'test_type', 'direct_function_call',
        'timestamp', NOW(),
        'source', 'sql_test'
    )
) as test_result_1;

-- Teste 2: Verificar se o log foi inserido
SELECT 
    id,
    type,
    message,
    context,
    created_at
FROM app_logs 
WHERE type = 'test_alert' 
ORDER BY created_at DESC 
LIMIT 5;

-- Teste 3: Contar total de logs na tabela
SELECT 
    'Total de logs na tabela app_logs' as info,
    COUNT(*) as total_count
FROM app_logs;

-- Teste 4: Verificar logs recentes (últimos 10)
SELECT 
    'Logs recentes' as info,
    id,
    type,
    message,
    created_at
FROM app_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Teste 5: Inserir log simulando o sistema de alertas
SELECT insert_app_log(
    'app_error',
    'Erro simulado do sistema de alertas',
    jsonb_build_object(
        'error_type', 'simulated_alert_error',
        'component', 'alert_system_test',
        'severity', 'high',
        'timestamp', NOW()
    )
) as alert_simulation_result;