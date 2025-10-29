-- =====================================================
-- ATUALIZAR FUNÇÃO get_featured_articles PARA MODO HÍBRIDO
-- Incluir suporte ao campo is_featured_manual
-- =====================================================

-- Remover função existente
DROP FUNCTION IF EXISTS get_featured_articles(INTEGER);

-- Criar função atualizada com lógica híbrida
CREATE OR REPLACE FUNCTION get_featured_articles(limit_count INTEGER DEFAULT 3)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  excerpt TEXT,
  content TEXT,
  image_url TEXT,
  category_id UUID,
  author_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  positive_feedbacks INTEGER,
  negative_feedbacks INTEGER,
  comments_count INTEGER,
  likes_count INTEGER,
  rank_score INTEGER,
  is_featured BOOLEAN,
  is_featured_manual BOOLEAN
) AS $$
DECLARE
  manual_featured_count INTEGER;
  remaining_slots INTEGER;
BEGIN
  -- Verificar quantos artigos estão marcados manualmente como destaque
  SELECT COUNT(*) INTO manual_featured_count
  FROM articles 
  WHERE published = true AND is_featured_manual = true;

  -- PRIORIDADE 1: Artigos marcados manualmente como destaque (is_featured_manual = true)
  -- Retornar primeiro os artigos com destaque manual, ordenados por data/score
  IF manual_featured_count > 0 THEN
    -- Se temos artigos manuais suficientes para preencher o limite
    IF manual_featured_count >= limit_count THEN
      RETURN QUERY
      SELECT 
        a.id,
        a.title,
        a.slug,
        a.excerpt,
        a.content,
        a.image_url,
        a.category_id,
        a.author_id,
        a.created_at,
        a.updated_at,
        a.positive_feedbacks,
        a.negative_feedbacks,
        a.comments_count,
        a.likes_count,
        (a.positive_feedbacks * 3 + a.comments_count * 2 + a.likes_count) AS rank_score,
        a.is_featured,
        a.is_featured_manual
      FROM articles a
      WHERE a.published = true 
        AND a.is_featured_manual = true
      ORDER BY 
        (a.positive_feedbacks * 3 + a.comments_count * 2 + a.likes_count) DESC,
        a.created_at DESC
      LIMIT limit_count;
    ELSE
      -- Se não temos artigos manuais suficientes, pegar todos os manuais + completar com automáticos
      remaining_slots := limit_count - manual_featured_count;
      
      -- Primeiro, retornar todos os artigos marcados manualmente
      RETURN QUERY
      SELECT 
        a.id,
        a.title,
        a.slug,
        a.excerpt,
        a.content,
        a.image_url,
        a.category_id,
        a.author_id,
        a.created_at,
        a.updated_at,
        a.positive_feedbacks,
        a.negative_feedbacks,
        a.comments_count,
        a.likes_count,
        (a.positive_feedbacks * 3 + a.comments_count * 2 + a.likes_count) AS rank_score,
        a.is_featured,
        a.is_featured_manual
      FROM articles a
      WHERE a.published = true 
        AND a.is_featured_manual = true
      ORDER BY 
        (a.positive_feedbacks * 3 + a.comments_count * 2 + a.likes_count) DESC,
        a.created_at DESC;
      
      -- Depois, completar com artigos automáticos (excluindo os já marcados manualmente)
      RETURN QUERY
      SELECT 
        a.id,
        a.title,
        a.slug,
        a.excerpt,
        a.content,
        a.image_url,
        a.category_id,
        a.author_id,
        a.created_at,
        a.updated_at,
        a.positive_feedbacks,
        a.negative_feedbacks,
        a.comments_count,
        a.likes_count,
        (a.positive_feedbacks * 3 + a.comments_count * 2 + a.likes_count) AS rank_score,
        a.is_featured,
        a.is_featured_manual
      FROM articles a
      WHERE a.published = true 
        AND (a.is_featured_manual = false OR a.is_featured_manual IS NULL)
      ORDER BY 
        (a.positive_feedbacks * 3 + a.comments_count * 2 + a.likes_count) DESC,
        a.created_at DESC
      LIMIT remaining_slots;
    END IF;
  ELSE
    -- PRIORIDADE 2: Se não há artigos marcados manualmente, usar sistema automático
    RETURN QUERY
    SELECT 
      a.id,
      a.title,
      a.slug,
      a.excerpt,
      a.content,
      a.image_url,
      a.category_id,
      a.author_id,
      a.created_at,
      a.updated_at,
      a.positive_feedbacks,
      a.negative_feedbacks,
      a.comments_count,
      a.likes_count,
      (a.positive_feedbacks * 3 + a.comments_count * 2 + a.likes_count) AS rank_score,
      a.is_featured,
      COALESCE(a.is_featured_manual, false) AS is_featured_manual
    FROM articles a
    WHERE a.published = true
    ORDER BY 
      (a.positive_feedbacks * 3 + a.comments_count * 2 + a.likes_count) DESC,
      a.created_at DESC
    LIMIT limit_count;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTÁRIO SOBRE A LÓGICA HÍBRIDA
-- =====================================================

/*
LÓGICA DO MODO HÍBRIDO:

1. PRIORIDADE MÁXIMA: Artigos com is_featured_manual = true
   - Sempre aparecem primeiro
   - Ordenados por score de engajamento + data

2. PREENCHIMENTO AUTOMÁTICO: Se sobrar espaço
   - Completa com artigos por métricas de engajamento
   - Exclui artigos já marcados manualmente

3. FALLBACK: Se não há artigos manuais
   - Usa sistema automático tradicional
   - Baseado em métricas de engajamento

4. GARANTIA: Sempre retorna exatamente 3 artigos (ou o limite especificado)
*/

SELECT 'Função get_featured_articles atualizada para modo híbrido!' as status;