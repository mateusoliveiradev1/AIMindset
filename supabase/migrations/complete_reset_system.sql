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

-- 3. GARANTIR QUE TODOS OS ARTIGOS ESTÃO DESPUBLICADOS COMO FIXOS (EXCETO SE VOCÊ QUISER MANTER ALGUM)
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
        -- FÓRMULA DE ENGAJAMENTO BASEADA EM MÉTRICAS REAIS:
        -- Feedbacks positivos: peso 3.0 (mais importante)
        -- Comentários: peso 2.0 (engajamento ativo)
        -- Likes dos comentários: peso 1.5 (engajamento passivo)
        -- Views: peso 0.1 (alcance)
        -- Feedbacks negativos: peso -1.0 (penalização)
        (COALESCE(a.positive_feedbacks, 0) * 3.0) +
        (COALESCE(a.comments_count, 0) * 2.0) +
        (COALESCE(a.likes_count, 0) * 1.5) +
        (COALESCE(a.total_views, 0) * 0.1) +
        (COALESCE(a.negative_feedbacks, 0) * -1.0)
      ) as score
    FROM articles a
    WHERE a.published = true
  ),
  -- SISTEMA HÍBRIDO: 1 ARTIGO FIXO MANUAL (SE EXISTIR)
  manual_featured AS (
    SELECT * FROM article_scores 
    WHERE is_featured_manual = true 
    ORDER BY score DESC 
    LIMIT 1
  ),
  -- ARTIGOS AUTOMÁTICOS POR SCORE (2 SE HÁ 1 FIXO, 3 SE NÃO HÁ FIXO)
  auto_featured AS (
    SELECT * FROM article_scores 
    WHERE is_featured_manual = false 
    ORDER BY score DESC 
    LIMIT CASE 
      WHEN (SELECT COUNT(*) FROM manual_featured) > 0 THEN 2 
      ELSE 3 
    END
  )
  -- RESULTADO FINAL: FIXO PRIMEIRO, DEPOIS AUTOMÁTICOS POR SCORE
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

-- 6. CRIAR TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA EM TEMPO REAL

-- Trigger para atualizar contadores quando feedback é inserido/atualizado/deletado
CREATE OR REPLACE FUNCTION update_article_feedback_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrementar contador baseado no tipo de feedback
    IF NEW.type = 'positive' THEN
      UPDATE articles 
      SET positive_feedbacks = positive_feedbacks + 1
      WHERE id = NEW.article_id;
    ELSIF NEW.type = 'negative' THEN
      UPDATE articles 
      SET negative_feedbacks = negative_feedbacks + 1
      WHERE id = NEW.article_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrementar contador baseado no tipo de feedback
    IF OLD.type = 'positive' THEN
      UPDATE articles 
      SET positive_feedbacks = GREATEST(positive_feedbacks - 1, 0)
      WHERE id = OLD.article_id;
    ELSIF OLD.type = 'negative' THEN
      UPDATE articles 
      SET negative_feedbacks = GREATEST(negative_feedbacks - 1, 0)
      WHERE id = OLD.article_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contadores quando comentário é inserido/deletado
CREATE OR REPLACE FUNCTION update_article_comment_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE articles 
    SET comments_count = comments_count + 1
    WHERE id = NEW.article_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE articles 
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.article_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Atualizar likes_count baseado na diferença de likes
    UPDATE articles 
    SET likes_count = likes_count + (NEW.likes - OLD.likes)
    WHERE id = NEW.article_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
DROP TRIGGER IF EXISTS feedback_counter_trigger ON feedbacks;
CREATE TRIGGER feedback_counter_trigger
  AFTER INSERT OR DELETE ON feedbacks
  FOR EACH ROW EXECUTE FUNCTION update_article_feedback_counters();

DROP TRIGGER IF EXISTS comment_counter_trigger ON comments;
CREATE TRIGGER comment_counter_trigger
  AFTER INSERT OR DELETE OR UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_article_comment_counters();

-- 7. ATUALIZAR TAXA DE APROVAÇÃO AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION update_approval_rate()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE articles 
  SET approval_rate = CASE 
    WHEN (positive_feedbacks + negative_feedbacks) > 0 
    THEN (positive_feedbacks::NUMERIC / (positive_feedbacks + negative_feedbacks)) * 100
    ELSE 0 
  END
  WHERE id = COALESCE(NEW.article_id, OLD.article_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS approval_rate_trigger ON feedbacks;
CREATE TRIGGER approval_rate_trigger
  AFTER INSERT OR DELETE ON feedbacks
  FOR EACH ROW EXECUTE FUNCTION update_approval_rate();