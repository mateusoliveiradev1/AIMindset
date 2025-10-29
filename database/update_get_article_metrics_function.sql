-- 🎯 ATUALIZAR FUNÇÃO get_article_metrics PARA INCLUIR MÉTRICAS DE ENGAJAMENTO
-- Esta função busca métricas de artigos incluindo feedback, comentários, curtidas e respostas

CREATE OR REPLACE FUNCTION get_article_metrics(article_id_param UUID DEFAULT NULL, target_article_id UUID DEFAULT NULL)
RETURNS TABLE (
  article_id UUID,
  positive_feedback BIGINT,
  negative_feedback BIGINT,
  total_comments BIGINT,
  approval_rate NUMERIC,
  total_likes BIGINT,
  total_replies BIGINT,
  engagement_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_id UUID;
BEGIN
  -- Determinar qual ID usar (compatibilidade com diferentes parâmetros)
  target_id := COALESCE(article_id_param, target_article_id);
  
  -- Se nenhum ID foi fornecido, retornar vazio
  IF target_id IS NULL THEN
    RETURN;
  END IF;

  -- Buscar métricas do artigo
  RETURN QUERY
  SELECT 
    a.id as article_id,
    COALESCE(
      (SELECT COUNT(*) FROM feedback f WHERE f.article_id = a.id AND f.useful = true),
      0
    )::BIGINT as positive_feedback,
    COALESCE(
      (SELECT COUNT(*) FROM feedback f WHERE f.article_id = a.id AND f.useful = false),
      0
    )::BIGINT as negative_feedback,
    COALESCE(
      (SELECT COUNT(*) FROM comments c WHERE c.article_id = a.id),
      0
    )::BIGINT as total_comments,
    CASE 
      WHEN (
        (SELECT COUNT(*) FROM feedback f WHERE f.article_id = a.id AND f.useful = true) +
        (SELECT COUNT(*) FROM feedback f WHERE f.article_id = a.id AND f.useful = false)
      ) > 0 THEN
        ROUND(
          (SELECT COUNT(*) FROM feedback f WHERE f.article_id = a.id AND f.useful = true)::NUMERIC * 100.0 /
          (
            (SELECT COUNT(*) FROM feedback f WHERE f.article_id = a.id AND f.useful = true) +
            (SELECT COUNT(*) FROM feedback f WHERE f.article_id = a.id AND f.useful = false)
          )::NUMERIC,
          2
        )
      ELSE 0
    END as approval_rate,
    -- Métricas de engajamento
    COALESCE(
      (SELECT SUM(COALESCE(likes, 0)) FROM comments c WHERE c.article_id = a.id),
      0
    )::BIGINT as total_likes,
    COALESCE(
      (SELECT COUNT(*) FROM comments c WHERE c.article_id = a.id AND c.parent_id IS NOT NULL),
      0
    )::BIGINT as total_replies,
    CASE 
      WHEN (SELECT COUNT(*) FROM comments c WHERE c.article_id = a.id) > 0 THEN
        ROUND(
          (SELECT COUNT(*) FROM comments c 
           WHERE c.article_id = a.id 
           AND (COALESCE(c.likes, 0) > 0 OR c.parent_id IS NOT NULL))::NUMERIC * 100.0 /
          (SELECT COUNT(*) FROM comments c WHERE c.article_id = a.id)::NUMERIC,
          2
        )
      ELSE 0
    END as engagement_rate
  FROM articles a
  WHERE a.id = target_id;

EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, retornar métricas zeradas
    RETURN QUERY
    SELECT 
      target_id as article_id,
      0::BIGINT as positive_feedback,
      0::BIGINT as negative_feedback,
      0::BIGINT as total_comments,
      0::NUMERIC as approval_rate,
      0::BIGINT as total_likes,
      0::BIGINT as total_replies,
      0::NUMERIC as engagement_rate;
END;
$$;

-- Garantir permissões para todos os roles
GRANT EXECUTE ON FUNCTION get_article_metrics(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_article_metrics(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_article_metrics(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_article_metrics(UUID, UUID) TO postgres;

-- Comentário para documentação
COMMENT ON FUNCTION get_article_metrics(UUID, UUID) IS 'Busca métricas de artigos incluindo feedback positivo/negativo, comentários, curtidas, respostas e taxa de engajamento. Aceita article_id_param ou target_article_id para compatibilidade.';