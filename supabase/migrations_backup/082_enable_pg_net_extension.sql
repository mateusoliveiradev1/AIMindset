-- Habilitar extensão pg_net para fazer chamadas HTTP
-- Esta extensão é necessária para que as funções RPC possam chamar o servidor Node.js

-- 1. Habilitar a extensão pg_net
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Verificar se a extensão foi habilitada
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- 3. Log da habilitação
INSERT INTO system_logs (type, message, context) 
VALUES ('migration', 'Extensão pg_net habilitada para chamadas HTTP', 
        jsonb_build_object(
            'migration', '082_enable_pg_net_extension',
            'extension', 'pg_net',
            'purpose', 'Enable HTTP calls from RPC functions to Node.js server',
            'status', 'enabled'
        ));