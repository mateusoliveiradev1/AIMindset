-- Teste direto da Edge Function com logs detalhados

-- Função para testar a Edge Function com logs detalhados
CREATE OR REPLACE FUNCTION test_edge_function_direct()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    error_msg text;
    http_response jsonb;
BEGIN
    -- Log do início do teste
    INSERT INTO system_logs (type, message, context) 
    VALUES ('test', 'Starting direct Edge Function test', 
            jsonb_build_object('timestamp', NOW()));
    
    -- Tentar chamar a Edge Function com dados de teste
    BEGIN
        SELECT net.http_post(
            url := 'https://jywjqzhqynhnhetidzsa.supabase.co/functions/v1/alert-processor',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ'
            ),
            body := jsonb_build_object(
                'type', 'test',
                'source', 'manual_test',
                'message', 'Teste manual do sistema de alertas',
                'details', jsonb_build_object(
                    'test_id', 'manual_' || extract(epoch from now()),
                    'environment', 'production'
                ),
                'timestamp', NOW()::text
            )
        ) INTO http_response;
        
        -- Log do resultado
        INSERT INTO system_logs (type, message, context) 
        VALUES ('test', 'Edge Function call completed', 
                jsonb_build_object('response', http_response));
        
        RETURN jsonb_build_object(
            'success', true,
            'response', http_response,
            'timestamp', NOW()
        );
        
    EXCEPTION WHEN OTHERS THEN
        error_msg := SQLERRM;
        
        -- Log do erro
        INSERT INTO system_logs (type, message, context) 
        VALUES ('test', 'Edge Function call failed', 
                jsonb_build_object('error', error_msg, 'sqlstate', SQLSTATE));
        
        RETURN jsonb_build_object(
            'success', false,
            'error', error_msg,
            'sqlstate', SQLSTATE,
            'timestamp', NOW()
        );
    END;
END;
$$;

-- Executar o teste
SELECT test_edge_function_direct() as test_result;