-- Verificar funções RPC existentes no banco de dados
-- Esta migração verifica quais funções de alerta existem atualmente

-- Verificar se as funções existem
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%alert%'
ORDER BY routine_name;

-- Verificar parâmetros das funções
SELECT 
    r.routine_name,
    p.parameter_name,
    p.data_type,
    p.parameter_mode
FROM information_schema.routines r
LEFT JOIN information_schema.parameters p ON r.specific_name = p.specific_name
WHERE r.routine_schema = 'public' 
AND r.routine_name LIKE '%alert%'
ORDER BY r.routine_name, p.ordinal_position;

-- Log da verificação (usando a estrutura correta da tabela)
INSERT INTO system_logs (type, message, context, created_at)
VALUES (
    'deploy',
    'Verificação de funções RPC de alerta executada',
    jsonb_build_object(
        'action', 'check_alert_functions',
        'timestamp', NOW()
    ),
    NOW()
);