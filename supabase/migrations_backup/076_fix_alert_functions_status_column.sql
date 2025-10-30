-- Corrigir funções de alerta - substituir coluna 'status' por 'is_active'
-- PROBLEMA IDENTIFICADO: funções tentavam acessar coluna 'status' que não existe
-- SOLUÇÃO: usar coluna 'is_active' que existe na tabela alert_subscriptions

-- Remover funções com erro
DROP FUNCTION IF EXISTS public.test_alert_system CASCADE;
DROP FUNCTION IF EXISTS public.test_alert_system_simple CASCADE;

-- Criar função principal de teste de alertas (CORRIGIDA)
CREATE OR REPLACE FUNCTION public.test_alert_system(
    alert_type TEXT,
    test_message TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    subscriber_count INTEGER;
    log_entry_id BIGINT;
    result JSON;
BEGIN
    -- Contar assinantes ativos (CORRIGIDO: usar is_active em vez de status)
    SELECT COUNT(*) INTO subscriber_count
    FROM alert_subscriptions 
    WHERE is_active = true;
    
    -- Registrar no log do sistema
    INSERT INTO system_logs (type, message, context, created_at)
    VALUES (
        'api_error',
        'Teste de sistema de alertas executado',
        jsonb_build_object(
            'alert_type', alert_type,
            'test_message', test_message,
            'subscriber_count', subscriber_count,
            'timestamp', NOW()
        ),
        NOW()
    )
    RETURNING id INTO log_entry_id;
    
    -- Construir resultado JSON
    result := json_build_object(
        'success', true,
        'message', 'Sistema de alertas testado com sucesso',
        'data', json_build_object(
            'alert_type', alert_type,
            'test_message', test_message,
            'subscriber_count', subscriber_count,
            'log_id', log_entry_id,
            'timestamp', NOW(),
            'methods', json_build_object(
                'database_log', json_build_object(
                    'success', true,
                    'message', 'Log registrado no banco de dados'
                ),
                'email_notification', json_build_object(
                    'success', true,
                    'message', 'Notificação por email simulada (função de teste)',
                    'recipients', subscriber_count
                )
            )
        )
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    -- Em caso de erro, retornar informações do erro
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'message', 'Erro ao executar teste de alertas',
        'timestamp', NOW()
    );
END;
$$;

-- Criar função simplificada de teste de alertas (CORRIGIDA)
CREATE OR REPLACE FUNCTION public.test_alert_system_simple(
    alert_type TEXT,
    test_message TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    subscriber_count INTEGER;
    result JSON;
BEGIN
    -- Contar assinantes (CORRIGIDO: usar is_active em vez de status)
    SELECT COUNT(*) INTO subscriber_count
    FROM alert_subscriptions 
    WHERE is_active = true;
    
    -- Resultado simplificado
    result := json_build_object(
        'success', true,
        'message', 'Teste simplificado executado',
        'alert_type', alert_type,
        'test_message', test_message,
        'subscriber_count', subscriber_count,
        'timestamp', NOW()
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'message', 'Erro no teste simplificado'
    );
END;
$$;

-- Conceder permissões para usuários anônimos e autenticados
GRANT EXECUTE ON FUNCTION public.test_alert_system(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.test_alert_system(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_alert_system_simple(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.test_alert_system_simple(TEXT, TEXT) TO authenticated;

-- Log da correção das funções
INSERT INTO system_logs (type, message, context, created_at)
VALUES (
    'deploy',
    'Funções de alerta corrigidas - problema da coluna status resolvido',
    jsonb_build_object(
        'functions_fixed', ARRAY['test_alert_system', 'test_alert_system_simple'],
        'issue_resolved', 'Substituído status por is_active',
        'permissions_granted', true,
        'timestamp', NOW()
    ),
    NOW()
);

-- Comentários nas funções para documentação
COMMENT ON FUNCTION public.test_alert_system(TEXT, TEXT) IS 'Função principal para testar o sistema de alertas - CORRIGIDA para usar is_active';
COMMENT ON FUNCTION public.test_alert_system_simple(TEXT, TEXT) IS 'Função simplificada para testar o sistema de alertas - CORRIGIDA para usar is_active';