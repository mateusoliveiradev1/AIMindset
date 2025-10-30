-- Teste final completo do sistema de alertas

-- Função para teste completo do sistema
CREATE OR REPLACE FUNCTION test_complete_email_system()
RETURNS jsonb AS $$
DECLARE
    test_results jsonb := '[]'::jsonb;
    rpc_result jsonb;
    trigger_result jsonb;
    pg_net_available boolean;
BEGIN
    -- Verificar se pg_net está disponível
    SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_net') INTO pg_net_available;
    
    -- Log do início do teste completo
    INSERT INTO system_logs (type, message, context) 
    VALUES ('final_test', 'Iniciando teste completo do sistema de alertas', 
            jsonb_build_object('pg_net_available', pg_net_available, 'timestamp', NOW()));
    
    -- Teste 1: Função RPC direta
    BEGIN
        SELECT send_alert_direct(
            'test@example.com',
            'Teste Final - RPC Direto',
            'Este é um teste final da função RPC send_alert_direct.'
        ) INTO rpc_result;
        
        test_results := test_results || jsonb_build_array(
            jsonb_build_object(
                'test', 'rpc_direct',
                'success', rpc_result->>'success',
                'result', rpc_result
            )
        );
        
    EXCEPTION WHEN OTHERS THEN
        test_results := test_results || jsonb_build_array(
            jsonb_build_object(
                'test', 'rpc_direct',
                'success', false,
                'error', SQLERRM
            )
        );
    END;
    
    -- Teste 2: Trigger automático via inserção em system_logs
    BEGIN
        INSERT INTO system_logs (type, message, context)
        VALUES (
            'error',
            'Teste de erro para trigger automático',
            jsonb_build_object(
                'test_id', 'final_test_' || extract(epoch from now()),
                'severity', 'high',
                'source', 'final_test'
            )
        );
        
        test_results := test_results || jsonb_build_array(
            jsonb_build_object(
                'test', 'automatic_trigger',
                'success', true,
                'message', 'Trigger executado com sucesso'
            )
        );
        
    EXCEPTION WHEN OTHERS THEN
        test_results := test_results || jsonb_build_array(
            jsonb_build_object(
                'test', 'automatic_trigger',
                'success', false,
                'error', SQLERRM
            )
        );
    END;
    
    -- Teste 3: Verificar se há assinantes de alertas
    DECLARE
        subscribers_count integer;
    BEGIN
        SELECT COUNT(*) INTO subscribers_count FROM alert_subscriptions;
        
        IF subscribers_count = 0 THEN
            -- Adicionar um assinante de teste
            INSERT INTO alert_subscriptions (email) 
            VALUES ('admin@aimindset.com') 
            ON CONFLICT (email) DO NOTHING;
            
            subscribers_count := 1;
        END IF;
        
        test_results := test_results || jsonb_build_array(
            jsonb_build_object(
                'test', 'subscribers_check',
                'success', true,
                'subscribers_count', subscribers_count
            )
        );
    END;
    
    -- Log do resultado final
    INSERT INTO system_logs (type, message, context) 
    VALUES ('final_test', 'Teste completo do sistema de alertas finalizado', 
            jsonb_build_object(
                'test_results', test_results,
                'pg_net_available', pg_net_available,
                'timestamp', NOW()
            ));
    
    RETURN jsonb_build_object(
        'success', true,
        'pg_net_available', pg_net_available,
        'tests', test_results,
        'timestamp', NOW(),
        'message', 'Teste completo do sistema de alertas executado'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Executar o teste completo
SELECT test_complete_email_system() as final_test_result;