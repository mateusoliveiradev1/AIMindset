-- Debug completo do sistema de alertas
-- Identificar exatamente onde está falhando

-- 1. Verificar se há assinantes ativos
INSERT INTO system_logs (type, message, context) 
VALUES ('debug', 'Verificando assinantes ativos', 
        jsonb_build_object(
            'total_subscribers', (SELECT COUNT(*) FROM alert_subscriptions),
            'active_subscribers', (SELECT COUNT(*) FROM alert_subscriptions WHERE is_active = true),
            'subscribers_list', (SELECT jsonb_agg(email) FROM alert_subscriptions WHERE is_active = true)
        ));

-- 2. Adicionar um assinante de teste se não houver nenhum
INSERT INTO alert_subscriptions (email, is_active) 
VALUES ('delivered@resend.dev', true)
ON CONFLICT (email) DO UPDATE SET is_active = true;

-- 3. Verificar se pg_net está disponível
DO $$
DECLARE
    pg_net_available boolean;
    net_http_post_exists boolean;
BEGIN
    -- Verificar extensão pg_net
    SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_net') INTO pg_net_available;
    
    -- Verificar função net.http_post
    SELECT EXISTS(
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'net' AND p.proname = 'http_post'
    ) INTO net_http_post_exists;
    
    INSERT INTO system_logs (type, message, context) 
    VALUES ('debug', 'Status do pg_net', 
            jsonb_build_object(
                'pg_net_extension_exists', pg_net_available,
                'net_http_post_function_exists', net_http_post_exists,
                'note', 'Se pg_net não estiver disponível, as funções falharão'
            ));
END $$;

-- 4. Criar função de teste que não depende de pg_net
CREATE OR REPLACE FUNCTION test_alert_system_debug()
RETURNS jsonb AS $$
DECLARE
    result jsonb;
    subscribers_emails jsonb;
    subscribers_count integer;
BEGIN
    -- Log do início
    INSERT INTO system_logs (type, message, context) 
    VALUES ('debug', 'Iniciando teste de debug do sistema de alertas', 
            jsonb_build_object('timestamp', now()));
    
    -- Buscar emails dos assinantes ativos
    SELECT jsonb_agg(email), COUNT(*) 
    INTO subscribers_emails, subscribers_count
    FROM alert_subscriptions 
    WHERE is_active = true;
    
    -- Log dos assinantes encontrados
    INSERT INTO system_logs (type, message, context) 
    VALUES ('debug', 'Assinantes encontrados', 
            jsonb_build_object(
                'subscribers_emails', subscribers_emails,
                'subscribers_count', subscribers_count
            ));
    
    IF subscribers_emails IS NULL OR subscribers_count = 0 THEN
        INSERT INTO system_logs (type, message, context) 
        VALUES ('debug', 'PROBLEMA: Nenhum assinante ativo encontrado', 
                jsonb_build_object('subscribers_count', 0));
        
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Nenhum assinante ativo encontrado',
            'subscribers_count', 0,
            'problem', 'no_subscribers'
        );
    END IF;
    
    -- Simular chamada para o endpoint (sem fazer HTTP real)
    INSERT INTO system_logs (type, message, context) 
    VALUES ('debug', 'Simulando chamada para endpoint Node.js', 
            jsonb_build_object(
                'endpoint', 'http://localhost:3001/api/send-alert-email',
                'recipients', subscribers_emails,
                'alert_data', jsonb_build_object(
                    'type', 'debug_test',
                    'source', 'debug_function',
                    'message', 'Teste de debug do sistema de alertas'
                )
            ));
    
    -- Retornar resultado simulado
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Teste de debug executado - verifique os logs',
        'method', 'debug_simulation',
        'subscribers_count', subscribers_count,
        'note', 'Este é um teste simulado. Verifique os logs para detalhes.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Conceder permissões
GRANT EXECUTE ON FUNCTION test_alert_system_debug() TO authenticated;
GRANT EXECUTE ON FUNCTION test_alert_system_debug() TO anon;

-- 6. Executar o teste de debug
SELECT test_alert_system_debug() as debug_result;

-- 7. Verificar logs recentes
SELECT 
    id,
    type,
    message,
    context,
    created_at
FROM system_logs 
WHERE type = 'debug'
AND created_at >= NOW() - INTERVAL '1 minute'
ORDER BY created_at DESC;