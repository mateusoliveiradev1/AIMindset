-- Diagnóstico completo do sistema de emails

-- 1. Habilitar pg_net se não estiver habilitado
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Função para testar conectividade com a Edge Function
CREATE OR REPLACE FUNCTION diagnose_email_system()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    error_msg text;
    pg_net_available boolean;
BEGIN
    -- Verificar se pg_net está disponível
    SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_net') INTO pg_net_available;
    
    INSERT INTO system_logs (type, message, context) 
    VALUES ('diagnosis', 'Starting email system diagnosis', 
            jsonb_build_object('pg_net_available', pg_net_available));
    
    IF pg_net_available THEN
        -- Tentar chamar a Edge Function
        BEGIN
            SELECT net.http_post(
                url := 'https://jywjqzhqynhnhetidzsa.supabase.co/functions/v1/alert-processor',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ'
                ),
                body := jsonb_build_object(
                    'test', true,
                    'email', 'test@example.com',
                    'subject', 'Teste de Diagnóstico',
                    'message', 'Este é um teste de diagnóstico do sistema de emails.',
                    'environment', 'production',
                    'resend_api_key', 're_5y6JWySh_J6LFqLCLGhjkXyYhYvi7KQXW'
                )
            ) INTO result;
            
            INSERT INTO system_logs (type, message, context) 
            VALUES ('diagnosis', 'Edge Function call successful', 
                    jsonb_build_object('result', result, 'method', 'pg_net'));
            
            RETURN jsonb_build_object(
                'success', true, 
                'method', 'pg_net', 
                'result', result,
                'pg_net_available', true
            );
            
        EXCEPTION WHEN OTHERS THEN
            error_msg := SQLERRM;
            INSERT INTO system_logs (type, message, context) 
            VALUES ('diagnosis', 'Edge Function call failed via pg_net', 
                    jsonb_build_object('error', error_msg, 'method', 'pg_net'));
        END;
    END IF;
    
    -- Tentar função RPC alternativa
    BEGIN
        PERFORM send_alert_direct(
            'test@example.com',
            'Teste de Diagnóstico (RPC)',
            'Este é um teste usando a função RPC alternativa.'
        );
        
        INSERT INTO system_logs (type, message, context) 
        VALUES ('diagnosis', 'RPC function call successful', 
                jsonb_build_object('method', 'rpc'));
        
        RETURN jsonb_build_object(
            'success', true, 
            'method', 'rpc', 
            'fallback', true,
            'pg_net_available', pg_net_available
        );
        
    EXCEPTION WHEN OTHERS THEN
        error_msg := SQLERRM;
        INSERT INTO system_logs (type, message, context) 
        VALUES ('diagnosis', 'RPC function call failed', 
                jsonb_build_object('error', error_msg, 'method', 'rpc'));
        
        RETURN jsonb_build_object(
            'success', false, 
            'error', error_msg,
            'pg_net_available', pg_net_available
        );
    END;
END;
$$;

-- 3. Executar diagnóstico
SELECT diagnose_email_system() as diagnosis_result;