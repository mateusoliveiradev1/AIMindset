-- =====================================================
-- LIMPEZA COMPLETA DAS MÉTRICAS ANTIGAS DO SISTEMA
-- Data: 2024 - Versão Final
-- =====================================================
-- Este script remove TODOS os dados de métricas antigas
-- para permitir que o novo sistema comece do zero

BEGIN;

-- 1. LIMPAR TABELA DE FEEDBACKS
-- Remove todos os feedbacks (positivos, negativos, likes, comentários)
TRUNCATE TABLE feedbacks RESTART IDENTITY CASCADE;

-- 2. LIMPAR TABELA DE COMENTÁRIOS
-- Remove todos os comentários dos artigos
TRUNCATE TABLE comments RESTART IDENTITY CASCADE;

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
  likes_count = 0,
  updated_at = NOW()
WHERE id IS NOT NULL;

-- 4. LIMPAR LOGS DE AUDITORIA RELACIONADOS A FEEDBACKS
-- Remove logs de auditoria relacionados às tabelas limpas
DELETE FROM security_audit_logs 
WHERE table_name IN ('feedbacks', 'comments', 'articles') 
  AND operation IN ('INSERT', 'UPDATE', 'DELETE')
  AND created_at < NOW();

-- 5. RESETAR RATE LIMITS RELACIONADOS A FEEDBACKS
-- Limpa rate limits de ações de feedback
DELETE FROM rate_limits 
WHERE action IN ('feedback', 'comment', 'like', 'article_feedback');

COMMIT;

-- =====================================================
-- VERIFICAÇÃO DA LIMPEZA
-- =====================================================
-- Estas queries devem retornar 0 após a execução:

SELECT 
  'VERIFICAÇÃO DA LIMPEZA COMPLETA' as status,
  (SELECT COUNT(*) FROM feedbacks) as feedbacks_count,
  (SELECT COUNT(*) FROM comments) as comments_count,
  (SELECT SUM(positive_feedback + negative_feedback + comments_count + likes_count) FROM articles) as total_metrics;

-- =====================================================
-- RESULTADO ESPERADO: TODAS AS MÉTRICAS ZERADAS
-- =====================================================