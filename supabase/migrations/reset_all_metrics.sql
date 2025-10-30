-- =====================================================
-- LIMPEZA COMPLETA DAS MÉTRICAS ANTIGAS DO SISTEMA
-- =====================================================
-- Este script remove TODOS os dados de métricas antigas
-- para permitir que o novo sistema comece do zero

-- 1. LIMPAR TABELA DE FEEDBACKS
-- Remove todos os feedbacks (positivos, negativos, likes, comentários)
DELETE FROM feedbacks;

-- 2. LIMPAR TABELA DE COMENTÁRIOS
-- Remove todos os comentários dos artigos
DELETE FROM comments;

-- 3. RESETAR TODAS AS MÉTRICAS DOS ARTIGOS
-- Zera todos os contadores de métricas nos artigos
UPDATE articles SET
  approval_rate = 0.0,
  positive_feedback = 0,
  negative_feedback = 0,
  total_views = 0,
  total_likes = 0,
  positive_feedbacks = 0,
  negative_feedbacks = 0,
  comments_count = 0,
  likes_count = 0
WHERE id IS NOT NULL;

-- 4. LIMPAR LOGS DE AUDITORIA DE SEGURANÇA (OPCIONAL)
-- Remove logs antigos de auditoria para começar limpo
-- DELETE FROM security_audit_logs WHERE created_at < NOW();

-- 5. RESETAR SEQUÊNCIAS E CONTADORES (se necessário)
-- Garante que os IDs começem do zero novamente

-- =====================================================
-- VERIFICAÇÃO DA LIMPEZA
-- =====================================================
-- Estas queries devem retornar 0 após a execução:

-- SELECT COUNT(*) as feedbacks_count FROM feedbacks;
-- SELECT COUNT(*) as comments_count FROM comments;
-- SELECT 
--   SUM(positive_feedback) as total_positive,
--   SUM(negative_feedback) as total_negative,
--   SUM(comments_count) as total_comments,
--   SUM(likes_count) as total_likes
-- FROM articles;

-- =====================================================
-- RESULTADO ESPERADO: TODAS AS MÉTRICAS ZERADAS
-- =====================================================