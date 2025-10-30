-- =====================================================
-- VERIFICAÇÃO DA LIMPEZA COMPLETA DO SISTEMA
-- =====================================================
-- Este script verifica se todas as métricas foram zeradas

-- 1. VERIFICAR TABELAS DE FEEDBACK E COMENTÁRIOS
SELECT 
  'TABELAS DE DADOS' as categoria,
  (SELECT COUNT(*) FROM feedbacks) as feedbacks_count,
  (SELECT COUNT(*) FROM comments) as comments_count;

-- 2. VERIFICAR MÉTRICAS DOS ARTIGOS
SELECT 
  'MÉTRICAS DOS ARTIGOS' as categoria,
  COUNT(*) as total_articles,
  SUM(positive_feedback) as total_positive_feedback,
  SUM(negative_feedback) as total_negative_feedback,
  SUM(positive_feedbacks) as total_positive_feedbacks,
  SUM(negative_feedbacks) as total_negative_feedbacks,
  SUM(comments_count) as total_comments_count,
  SUM(likes_count) as total_likes_count,
  SUM(total_views) as total_views_sum,
  SUM(total_likes) as total_likes_sum,
  AVG(approval_rate) as avg_approval_rate
FROM articles;

-- 3. VERIFICAR ARTIGOS INDIVIDUAIS (PRIMEIROS 5)
SELECT 
  title,
  positive_feedback,
  negative_feedback,
  comments_count,
  likes_count,
  approval_rate
FROM articles 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. RESULTADO ESPERADO
-- feedbacks_count: 0
-- comments_count: 0  
-- Todas as métricas dos artigos: 0
-- approval_rate: 0.0