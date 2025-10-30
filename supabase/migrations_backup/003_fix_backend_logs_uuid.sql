-- =====================================================
-- Correção: Alterar record_id para UUID na tabela backend_logs
-- AIMindset - Migração 003
-- =====================================================

-- Alterar o tipo da coluna record_id de BIGINT para UUID
-- para ser compatível com as tabelas que usam UUID como PK
ALTER TABLE backend_logs 
ALTER COLUMN record_id TYPE UUID USING record_id::text::uuid;

-- Recriar o índice com o novo tipo
DROP INDEX IF EXISTS idx_backend_logs_record_id;
CREATE INDEX idx_backend_logs_record_id ON backend_logs(record_id);

-- Inserir log de teste para verificar se a correção funcionou
SELECT insert_system_log('migration', 'Correção de tipo UUID aplicada na tabela backend_logs', '{"version": "003"}'::jsonb);