-- Migração: Habilitar extensão pg_net para chamadas HTTP
-- Data: 2025-10-31
-- Descrição: Habilita a extensão pg_net necessária para fazer chamadas HTTP para a Vercel Function

-- Verificar se pg_net está disponível e habilitá-la
DO $$
BEGIN
    -- Tentar habilitar a extensão pg_net
    BEGIN
        CREATE EXTENSION IF NOT EXISTS pg_net;
        
        -- Log de sucesso
        INSERT INTO system_logs (type, message, context)
        VALUES (
            'extension_enabled',
            'Extensão pg_net habilitada com sucesso',
            jsonb_build_object(
                'extension', 'pg_net',
                'timestamp', now(),
                'status', 'enabled'
            )
        );
        
    EXCEPTION WHEN OTHERS THEN
        -- Log de erro se não conseguir habilitar
        INSERT INTO system_logs (type, message, context)
        VALUES (
            'extension_error',
            'Erro ao habilitar extensão pg_net: ' || SQLERRM,
            jsonb_build_object(
                'extension', 'pg_net',
                'timestamp', now(),
                'error', SQLERRM,
                'status', 'failed'
            )
        );
    END;
END $$;

-- Verificar se a extensão está disponível
DO $$
DECLARE
    extension_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_net'
    ) INTO extension_exists;
    
    -- Log do status da extensão
    INSERT INTO system_logs (type, message, context)
    VALUES (
        'extension_check',
        CASE 
            WHEN extension_exists THEN 'Extensão pg_net está disponível'
            ELSE 'Extensão pg_net NÃO está disponível'
        END,
        jsonb_build_object(
            'extension', 'pg_net',
            'available', extension_exists,
            'timestamp', now()
        )
    );
END $$;

-- Função de teste para verificar se pg_net funciona
CREATE OR REPLACE FUNCTION test_pg_net_connection()
RETURNS jsonb AS $$
DECLARE
    test_result jsonb;
    http_response record;
BEGIN
    -- Verificar se pg_net está disponível
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Extensão pg_net não está disponível',
            'available', false
        );
    END IF;
    
    -- Tentar fazer uma chamada HTTP de teste
    BEGIN
        SELECT net.http_get(
            url := 'https://httpbin.org/get'
        ) INTO http_response;
        
        RETURN jsonb_build_object(
            'success', true,
            'message', 'pg_net está funcionando',
            'available', true,
            'test_status_code', http_response.status_code
        );
        
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Erro ao testar pg_net: ' || SQLERRM,
            'available', true,
            'error', SQLERRM
        );
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION test_pg_net_connection() TO authenticated;
GRANT EXECUTE ON FUNCTION test_pg_net_connection() TO service_role;