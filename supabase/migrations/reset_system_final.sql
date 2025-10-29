-- LIMPEZA TOTAL DO SISTEMA DE FEEDBACK E RESET COMPLETO
-- Garantir que tudo funcione 100% automático e em tempo real

-- 1. LIMPEZA TOTAL DE DADOS
DELETE FROM feedbacks;
DELETE FROM comments;

-- 2. RESET COMPLETO DOS CONTADORES NA TABELA ARTICLES
UPDATE articles SET 
  positive_feedbacks = 0,
  negative_feedbacks = 0,
  comments_count = 0,
  likes_count = 0,
  total_views = 0,
  total_likes = 0,
  positive_feedback = 0,
  negative_feedback = 0,
  approval_rate = 0.0;

-- 3. GARANTIR QUE TODOS OS ARTIGOS ESTÃO DESPUBLICADOS COMO FIXOS
UPDATE articles SET is_featured_manual = false;

-- 4. REMOVER FUNÇÃO EXISTENTE E RECRIAR CORRETAMENTE
DROP FUNCTION IF EXISTS get_featured_articles();

-- 5. CRIAR FUNÇÃO DEFINITIVA COM SISTEMA HÍBRIDO 100% FUNCIONAL
CREATE OR REPLACE FUNCTION get_featured_articles()
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  excerpt TEXT,
  content TEXT,
  image_url TEXT,
  category_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  engagement_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH article_scores AS (
    SELECT 
      a.*,
      (
        (COALESCE(a.positive_feedbacks, 0) * 3.0) +
        (COALESCE(a.comments_count, 0) * 2.0) +
        (COALESCE(a.likes_count, 0) * 1.5) +
        (COALESCE(a.total_views, 0) * 0.1) +
        (COALESCE(a.negative_feedbacks, 0) * -1.0)
      ) as score
    FROM articles a
    WHERE a.published = true
  ),
  manual_featured AS (
    SELECT * FROM article_scores 
    WHERE is_featured_manual = true 
    ORDER BY score DESC 
    LIMIT 1
  ),
  auto_featured AS (
    SELECT * FROM article_scores 
    WHERE is_featured_manual = false 
    ORDER BY score DESC 
    LIMIT CASE 
      WHEN (SELECT COUNT(*) FROM manual_featured) > 0 THEN 2 
      ELSE 3 
    END
  )
  SELECT 
    af.id, af.title, af.slug, af.excerpt, af.content, 
    af.image_url, af.category_id, af.created_at, af.score
  FROM (
    SELECT * FROM manual_featured
    UNION ALL
    SELECT * FROM auto_featured
  ) af
  ORDER BY 
    CASE WHEN af.is_featured_manual THEN 0 ELSE 1 END,
    af.score DESC
  LIMIT 3;
END;
$$ LANGUAGE plpgsql;