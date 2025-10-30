-- Corrigir função send_alert_direct com parâmetros corretos

-- Função RPC corrigida para envio direto de alertas
CREATE OR REPLACE FUNCTION send_alert_direct(
    p_email text,
    p_subject text,
    p_message text,
    p_details jsonb DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
    alert_payload jsonb;
    function_url text;
    response_status integer;
    response_body text;
    http_response jsonb;
BEGIN
    -- Construir payload do alerta para a Edge Function
    alert_payload := jsonb_build_object(
        'type', 'manual',
        'source', 'rpc_direct',
        'message', p_message,
        'email', p_email,
        'subject', p_subject,
        'details', COALESCE(p_details, '{}'::jsonb),
        'timestamp', now()::text
    );

    -- Log do início do processo
    INSERT INTO system_logs (type, message, context) 
    VALUES ('rpc_alert', 'Iniciando envio direto de alerta via RPC', 
            jsonb_build_object('email', p_email, 'subject', p_subject));

    -- Tentar chamar a Edge Function diretamente
    BEGIN
        -- Construir URL da Edge Function
        function_url := 'https://jywjqzhqynhnhetidzsa.supabase.co/functions/v1/alert-processor';
        
        -- Chamar Edge Function usando pg_net
        SELECT net.http_post(
            url := function_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ'
            ),
            body := alert_payload
        ) INTO http_response;
        
        -- Extrair status da resposta
        response_status := (http_response->>'status')::integer;
        response_body := http_response->>'body';
        
        IF response_status BETWEEN 200 AND 299 THEN
            INSERT INTO system_logs (type, message, context) 
            VALUES ('rpc_alert', 'Alerta enviado com sucesso via RPC', 
                    jsonb_build_object(
                        'email', p_email,
                        'subject', p_subject,
                        'status', response_status,
                        'response', response_body
                    ));
            
            result := jsonb_build_object(
                'success', true,
                'message', 'Alerta enviado com sucesso via RPC',
                'method', 'rpc_direct',
                'status', response_status,
                'email', p_email
            );
        ELSE
            -- Se falhou, registrar no log do sistema
            INSERT INTO system_logs (type, message, context)
            VALUES (
                'rpc_alert_error',
                'Falha ao enviar alerta via RPC',
                jsonb_build_object(
                    'email', p_email,
                    'subject', p_subject,
                    'status', response_status,
                    'response', response_body,
                    'function_url', function_url
                )
            );
            
            result := jsonb_build_object(
                'success', false,
                'message', 'Falha ao enviar alerta via RPC',
                'method', 'rpc_direct',
                'status', response_status,
                'error', response_body,
                'email', p_email
            );
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        -- Em caso de erro, registrar no log
        INSERT INTO system_logs (type, message, context)
        VALUES (
            'rpc_alert_error',
            'Erro ao processar alerta via RPC: ' || SQLERRM,
            jsonb_build_object(
                'email', p_email,
                'subject', p_subject,
                'error_message', SQLERRM,
                'error_state', SQLSTATE
            )
        );
        
        result := jsonb_build_object(
            'success', false,
            'message', 'Erro ao processar alerta via RPC: ' || SQLERRM,
            'error_state', SQLSTATE,
            'email', p_email
        );
    END;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário da função corrigida
COMMENT ON FUNCTION send_alert_direct(text, text, text, jsonb) IS 'Função RPC corrigida para envio direto de alertas via Edge Function';

-- Conceder permissões
GRANT EXECUTE ON FUNCTION send_alert_direct(text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION send_alert_direct(text, text, text, jsonb) TO service_role;

-- Testar a função corrigida
SELECT send_alert_direct(
    'test@example.com',
    'Teste de Função Corrigida',
    'Este é um teste da função send_alert_direct corrigida.'
) as test_result;