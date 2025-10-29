-- Função para recalcular contadores de um artigo específico
CREATE OR REPLACE FUNCTION recalculate_article_counters(article_id_param UUID)
RETURNS VOID AS $$
DECLARE
    positive_feedbacks_count INTEGER;
    comments_count INTEGER;
    total_likes INTEGER;
    new_score INTEGER;
BEGIN
    -- Contar feedbacks positivos
     SELECT COUNT(*) INTO positive_feedbacks_count
     FROM feedbacks 
     WHERE article_id = article_id_param AND type = 'positive';
    
    -- Contar comentários
    SELECT COUNT(*) INTO comments_count
    FROM comments 
    WHERE article_id = article_id_param;
    
    -- Somar likes dos comentários
    SELECT COALESCE(SUM(likes), 0) INTO total_likes
    FROM comments 
    WHERE article_id = article_id_param;
    
    -- Calcular score híbrido
    new_score := (positive_feedbacks_count * 3) + comments_count + total_likes;
    
    -- Atualizar contadores na tabela articles
    UPDATE articles 
    SET 
        positive_feedbacks_count = recalculate_article_counters.positive_feedbacks_count,
        comments_count = recalculate_article_counters.comments_count,
        comment_likes_count = recalculate_article_counters.total_likes,
        engagement_score = recalculate_article_counters.new_score,
        updated_at = NOW()
    WHERE id = article_id_param;
    
    RAISE NOTICE 'Contadores atualizados para artigo %: feedbacks=%, comentários=%, likes=%, score=%', 
        article_id_param, positive_feedbacks_count, comments_count, total_likes, new_score;
END;
$$ LANGUAGE plpgsql;

-- Trigger function para feedbacks
CREATE OR REPLACE FUNCTION trigger_update_counters_on_feedback()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM recalculate_article_counters(NEW.article_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM recalculate_article_counters(OLD.article_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger function para comments
CREATE OR REPLACE FUNCTION trigger_update_counters_on_comment()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM recalculate_article_counters(NEW.article_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM recalculate_article_counters(OLD.article_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para feedbacks
DROP TRIGGER IF EXISTS trigger_feedbacks_update_counters ON feedbacks;
CREATE TRIGGER trigger_feedbacks_update_counters
    AFTER INSERT OR UPDATE OR DELETE ON feedbacks
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_counters_on_feedback();

-- Criar triggers para comments
DROP TRIGGER IF EXISTS trigger_comments_update_counters ON comments;
CREATE TRIGGER trigger_comments_update_counters
    AFTER INSERT OR UPDATE OR DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_counters_on_comment();

-- Recalcular todos os contadores existentes
DO $$
DECLARE
    article_record RECORD;
BEGIN
    FOR article_record IN SELECT id FROM articles LOOP
        PERFORM recalculate_article_counters(article_record.id);
    END LOOP;
END $$;

COMMENT ON FUNCTION recalculate_article_counters(UUID) IS 'Recalcula automaticamente todos os contadores de engajamento para um artigo específico';
COMMENT ON FUNCTION trigger_update_counters_on_feedback() IS 'Trigger function que atualiza contadores quando feedbacks são modificados';
COMMENT ON FUNCTION trigger_update_counters_on_comment() IS 'Trigger function que atualiza contadores quando comentários são modificados';
CREATE OR REPLACE FUNCTION recalculate_article_counters(article_id_param UUID)
RETURNS VOID AS $$
DECLARE
    positive_feedbacks_count INTEGER;
    comments_count INTEGER;
    total_likes INTEGER;
    new_score INTEGER;
BEGIN
    -- Contar feedbacks positivos
    SELECT COUNT(*) INTO positive_feedbacks_count
    FROM feedbacks 
    WHERE article_id = article_id_param AND is_positive = true;
    
    -- Contar comentários
    SELECT COUNT(*) INTO comments_count
    FROM comments 
    WHERE article_id = article_id_param;
    
    -- Somar likes dos comentários
    SELECT COALESCE(SUM(likes), 0) INTO total_likes
    FROM comments 
    WHERE article_id = article_id_param;
    
    -- Calcular score híbrido
    new_score := (positive_feedbacks_count * 3) + comments_count + total_likes;
    
    -- Atualizar contadores na tabela articles
     UPDATE articles 
     SET 
         positive_feedbacks_count = recalculate_article_counters.positive_feedbacks_count,
         comments_count = recalculate_article_counters.comments_count,
         comment_likes_count = recalculate_article_counters.total_likes,
         engagement_score = recalculate_article_counters.new_score,
         updated_at = NOW()
     WHERE id = article_id_param;
    
    RAISE NOTICE 'Contadores atualizados para artigo %: feedbacks=%, comentários=%, likes=%, score=%', 
        article_id_param, positive_feedbacks_count, comments_count, total_likes, new_score;
END;
$$ LANGUAGE plpgsql;

-- Trigger function para feedbacks
CREATE OR REPLACE FUNCTION trigger_update_counters_on_feedback()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM recalculate_article_counters(NEW.article_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM recalculate_article_counters(OLD.article_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger function para comments
CREATE OR REPLACE FUNCTION trigger_update_counters_on_comment()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM recalculate_article_counters(NEW.article_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM recalculate_article_counters(OLD.article_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para feedbacks
DROP TRIGGER IF EXISTS trigger_feedbacks_update_counters ON feedbacks;
CREATE TRIGGER trigger_feedbacks_update_counters
    AFTER INSERT OR UPDATE OR DELETE ON feedbacks
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_counters_on_feedback();

-- Criar triggers para comments
DROP TRIGGER IF EXISTS trigger_comments_update_counters ON comments;
CREATE TRIGGER trigger_comments_update_counters
    AFTER INSERT OR UPDATE OR DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_counters_on_comment();

-- Recalcular todos os contadores existentes
DO $$
DECLARE
    article_record RECORD;
BEGIN
    FOR article_record IN SELECT id FROM articles LOOP
        PERFORM recalculate_article_counters(article_record.id);
    END LOOP;
END $$;

COMMENT ON FUNCTION recalculate_article_counters(UUID) IS 'Recalcula automaticamente todos os contadores de engajamento para um artigo específico';
COMMENT ON FUNCTION trigger_update_counters_on_feedback() IS 'Trigger function que atualiza contadores quando feedbacks são modificados';
COMMENT ON FUNCTION trigger_update_counters_on_comment() IS 'Trigger function que atualiza contadores quando comentários são modificados';