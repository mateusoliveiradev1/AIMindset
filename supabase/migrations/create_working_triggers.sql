-- CRIAÇÃO DE TRIGGERS FUNCIONAIS PARA ATUALIZAR CONTADORES

-- 1. Função para atualizar contadores de feedbacks
CREATE OR REPLACE FUNCTION update_article_feedback_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrementar contador baseado no tipo de feedback
    IF NEW.feedback_type = 'positive' THEN
      UPDATE articles 
      SET positive_feedbacks = positive_feedbacks + 1 
      WHERE id = NEW.article_id;
    ELSIF NEW.feedback_type = 'negative' THEN
      UPDATE articles 
      SET negative_feedbacks = negative_feedbacks + 1 
      WHERE id = NEW.article_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrementar contador baseado no tipo de feedback
    IF OLD.feedback_type = 'positive' THEN
      UPDATE articles 
      SET positive_feedbacks = GREATEST(positive_feedbacks - 1, 0) 
      WHERE id = OLD.article_id;
    ELSIF OLD.feedback_type = 'negative' THEN
      UPDATE articles 
      SET negative_feedbacks = GREATEST(negative_feedbacks - 1, 0) 
      WHERE id = OLD.article_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Função para atualizar contadores de comentários
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
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Dropar triggers existentes se houver
DROP TRIGGER IF EXISTS trigger_update_feedback_counters ON feedbacks;
DROP TRIGGER IF EXISTS trigger_update_comment_counters ON comments;

-- 4. Criar triggers para feedbacks
CREATE TRIGGER trigger_update_feedback_counters
  AFTER INSERT OR DELETE ON feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION update_article_feedback_counters();

-- 5. Criar triggers para comentários
CREATE TRIGGER trigger_update_comment_counters
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_article_comment_counters();