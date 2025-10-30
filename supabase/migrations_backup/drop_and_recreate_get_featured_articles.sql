-- CORREÇÃO CRÍTICA: Drop e recria função get_featured_articles() sem coluna total_views inexistente

-- 1. Dropar função existente
DROP FUNCTION IF EXISTS get_featured_articles();

-- 2. Recriar função corrigida sem total_views
CREATE OR REPLACE FUNCTION get_featured_articles()
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  slug VARCHAR,
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
        (a.positive_feedbacks * 3.0) +
        (a.comments_count * 2.0) +
        (a.likes_count * 1.5) +
        (a.negative_feedbacks * -1.0)
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
    LIMIT CASE WHEN (SELECT COUNT(*) FROM manual_featured) > 0 THEN 2 ELSE 3 END
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