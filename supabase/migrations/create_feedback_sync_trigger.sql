-- Função para atualizar contadores de feedback nos artigos
CREATE OR REPLACE FUNCTION update_article_feedback_counters()
RETURNS TRIGGER AS $$
BEGIN
  -- Se for INSERT ou UPDATE, atualizar contadores para o artigo
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE articles 
    SET 
      positive_feedback = (
        SELECT COUNT(*) 
        FROM feedback 
        WHERE article_id = NEW.article_id AND useful = true
      ),
      negative_feedback = (
        SELECT COUNT(*) 
        FROM feedback 
        WHERE article_id = NEW.article_id AND useful = false
      )
    WHERE id = NEW.article_id;
    
    -- Calcular approval_rate
    UPDATE articles 
    SET approval_rate = CASE 
      WHEN (positive_feedback + negative_feedback) > 0 
      THEN ROUND((positive_feedback::numeric / (positive_feedback + negative_feedback)) * 100, 2)
      ELSE 0 
    END
    WHERE id = NEW.article_id;
    
    RETURN NEW;
  END IF;
  
  -- Se for DELETE, atualizar contadores para o artigo do registro deletado
  IF TG_OP = 'DELETE' THEN
    UPDATE articles 
    SET 
      positive_feedback = (
        SELECT COUNT(*) 
        FROM feedback 
        WHERE article_id = OLD.article_id AND useful = true
      ),
      negative_feedback = (
        SELECT COUNT(*) 
        FROM feedback 
        WHERE article_id = OLD.article_id AND useful = false
      )
    WHERE id = OLD.article_id;
    
    -- Calcular approval_rate
    UPDATE articles 
    SET approval_rate = CASE 
      WHEN (positive_feedback + negative_feedback) > 0 
      THEN ROUND((positive_feedback::numeric / (positive_feedback + negative_feedback)) * 100, 2)
      ELSE 0 
    END
    WHERE id = OLD.article_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para sincronização automática
DROP TRIGGER IF EXISTS feedback_sync_trigger ON feedback;
CREATE TRIGGER feedback_sync_trigger
  AFTER INSERT OR UPDATE OR DELETE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_article_feedback_counters();

-- Sincronizar dados existentes (corrigir dessincronização atual)
UPDATE articles 
SET 
  positive_feedback = (
    SELECT COUNT(*) 
    FROM feedback 
    WHERE feedback.article_id = articles.id AND useful = true
  ),
  negative_feedback = (
    SELECT COUNT(*) 
    FROM feedback 
    WHERE feedback.article_id = articles.id AND useful = false
  );

-- Calcular approval_rate para todos os artigos
UPDATE articles 
SET approval_rate = CASE 
  WHEN (positive_feedback + negative_feedback) > 0 
  THEN ROUND((positive_feedback::numeric / (positive_feedback + negative_feedback)) * 100, 2)
  ELSE 0 
END;