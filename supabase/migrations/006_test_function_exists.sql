-- Teste para verificar se a função call_nodejs_email_endpoint existe
DO $$
BEGIN
    -- Verificar se a função existe
    IF EXISTS (
        SELECT 1 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'call_nodejs_email_endpoint'
    ) THEN
        RAISE NOTICE 'SUCCESS: Função call_nodejs_email_endpoint encontrada!';
        
        -- Inserir log de sucesso
        INSERT INTO app_logs (level, source, action, details, created_at)
        VALUES ('info', 'migration_test', 'function_check', '{"message": "Função call_nodejs_email_endpoint existe no banco de dados"}', NOW());
        
    ELSE
        RAISE EXCEPTION 'ERRO: Função call_nodejs_email_endpoint NÃO encontrada!';
    END IF;
END $$;