-- Debug do sistema de emails
-- Verificar logs do sistema relacionados a alertas

-- 1. Verificar se pg_net está disponível
DO $$
BEGIN
    -- Verificar se pg_net está instalado
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
        INSERT INTO system_logs (type, message, context) 
        VALUES ('debug', 'pg_net extension is installed', '{"status": "available"}');
    ELSE
        INSERT INTO system_logs (type, message, context) 
        VALUES ('debug', 'pg_net extension is NOT installed', '{"status": "missing"}');
    END IF;
    
    -- Verificar se http está instalado
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http') THEN
        INSERT INTO system_logs (type, message, context) 
        VALUES ('debug', 'http extension is installed', '{"status": "available"}');
    ELSE
        INSERT INTO system_logs (type, message, context) 
        VALUES ('debug', 'http extension is NOT installed', '{"status": "missing"}');
    END IF;
END $$;

-- 2. Função para testar o envio de email diretamente
CREATE OR REPLACE FUNCTION test_email_system()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    error_msg text;
BEGIN
    -- Tentar usar pg_net primeiro
    BEGIN
        SELECT net.http_post(
            url := 'https://jywjqzhqynhnhetidzsa.supabase.co/functions/v1/alert-processor',
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ"}'::jsonb,
            body := jsonb_build_object(
                'test', true,
                'email', 'test@example.com',
                'subject', 'Teste do Sistema de Alertas',
                'message', 'Este é um teste para verificar se o sistema está funcionando.',
                'environment', 'production',
                'resend_api_key', 're_5y6JWySh_J6LFqLCLGhjkXyYhYvi7KQXW'
            )
        ) INTO result;
        
        INSERT INTO system_logs (type, message, context) 
        VALUES ('debug', 'Email test via pg_net completed', jsonb_build_object('result', result));
        
        RETURN jsonb_build_object('success', true, 'method', 'pg_net', 'result', result);
        
    EXCEPTION WHEN OTHERS THEN
        error_msg := SQLERRM;
        INSERT INTO system_logs (type, message, context) 
        VALUES ('debug', 'Email test via pg_net failed', jsonb_build_object('error', error_msg));
        
        -- Tentar função RPC alternativa
        BEGIN
            PERFORM send_alert_direct(
                'test@example.com',
                'Teste do Sistema de Alertas (RPC)',
                'Este é um teste usando a função RPC alternativa.'
            );
            
            INSERT INTO system_logs (type, message, context) 
            VALUES ('debug', 'Email test via RPC completed', '{"method": "rpc"}');
            
            RETURN jsonb_build_object('success', true, 'method', 'rpc', 'fallback', true);
            
        EXCEPTION WHEN OTHERS THEN
            error_msg := SQLERRM;
            INSERT INTO system_logs (type, message, context) 
            VALUES ('debug', 'Email test via RPC failed', jsonb_build_object('error', error_msg));
            
            RETURN jsonb_build_object('success', false, 'error', error_msg);
        END;
    END;
END;
$$;

-- 3. Executar o teste
SELECT test_email_system() as test_result;