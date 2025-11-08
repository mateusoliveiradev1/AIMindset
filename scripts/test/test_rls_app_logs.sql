-- Verificar RLS na tabela app_logs
SELECT schemaname, tablename, rowsecurity, forcerowsecurity 
FROM pg_tables 
WHERE tablename = 'app_logs';

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'app_logs';

-- Testar inserção direta
INSERT INTO app_logs (level, source, action, details, user_id)
VALUES ('error', 'test_direct', 'test_insert', '{"test": true}'::jsonb, NULL);

-- Verificar se foi inserido
SELECT COUNT(*) as total_logs FROM app_logs;

-- Verificar últimos logs
SELECT id, level, source, action, created_at 
FROM app_logs 
ORDER BY created_at DESC 
LIMIT 10;