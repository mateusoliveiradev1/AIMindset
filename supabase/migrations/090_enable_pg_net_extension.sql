-- Migração: Habilitar extensão pg_net para chamadas HTTP
-- Data: 2025-01-27
-- Descrição: Habilita a extensão pg_net necessária para o sistema de alertas via Vercel Function

-- Habilitar extensão pg_net
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Verificar se a extensão foi habilitada
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
        RAISE NOTICE 'Extensão pg_net habilitada com sucesso';
    ELSE
        RAISE EXCEPTION 'Falha ao habilitar extensão pg_net';
    END IF;
END $$;

-- Log da habilitação
INSERT INTO system_logs (type, message, context) 
VALUES ('system_config', 'Extensão pg_net habilitada para sistema de alertas', 
        jsonb_build_object(
            'extension', 'pg_net',
            'purpose', 'vercel_function_calls',
            'timestamp', now()
        ));