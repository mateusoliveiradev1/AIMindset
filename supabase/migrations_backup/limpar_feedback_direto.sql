-- LIMPEZA DIRETA DA TABELA FEEDBACK (singular)
-- Esta tabela tem estrutura diferente da feedbacks (plural)

-- Desabilitar triggers temporariamente
SET session_replication_role = replica;

-- Deletar todos os registros da tabela feedback (singular)
DELETE FROM feedback;

-- Reabilitar triggers
SET session_replication_role = DEFAULT;

-- Verificar se está vazio
SELECT COUNT(*) as feedback_count FROM feedback;
SELECT COUNT(*) as feedbacks_count FROM feedbacks;
SELECT COUNT(*) as comments_count FROM comments;