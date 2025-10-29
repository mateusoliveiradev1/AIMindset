-- Função para recalcular contadores de um artigo específico
CREATE OR REPLACE FUNCTION recalculate_article_counters(article_id_param UUID)
RETURNS VOID AS $$
DECLARE
    pos_feedbacks INTEGER;
    neg_feedbacks INTEGER;
    total_comments INTEGER;
    total_comment_likes INTEGER;
    new_score INTEGER;
BEGIN
    -- Contar feedbacks positivos
    SELECT COUNT(*) INTO pos_feedbacks
    FROM feedbacks 
    WHERE article_id = article_id_param AND type = 'positive';
    
    -- Contar feedbacks negativos
    SELECT COUNT(*) INTO neg_feedbacks
    FROM feedbacks 
    WHERE article_id = article_id_param AND type = 'negative';
    
    -- Contar comentários
    SELECT COUNT(*) INTO total_comments
    FROM comments 
    WHERE article_id = article_id_param;
    
    -- Somar likes dos comentários
    SELECT COALESCE(SUM(likes), 0) INTO total_comment_likes
    FROM comments 
    WHERE article_id = article_id_param;
    
    -- Calcular score híbrido: feedbacks positivos * 3 + comentários + likes
    new_score := (pos_feedbacks * 3) + total_comments + total_comment_likes;
    
    -- Atualizar contadores na tabela articles
    UPDATE articles 
    SET 
        positive_feedbacks = pos_feedbacks,
        comments_count = total_comments,
        likes_count = total_comment_likes,
        updated_at = NOW()
    WHERE id = article_id_param;
    
    RAISE NOTICE 'Contadores atualizados para artigo %: pos_feedbacks=%, comentários=%, likes=%, score=%', 
        article_id_param, pos_feedbacks, total_comments, total_comment_likes, new_score;
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

-- Remover triggers existentes se houver
DROP TRIGGER IF EXISTS trigger_feedbacks_update_counters ON feedbacks;
DROP TRIGGER IF EXISTS trigger_comments_update_counters ON comments;

-- Criar triggers para feedbacks
CREATE TRIGGER trigger_feedbacks_update_counters
    AFTER INSERT OR UPDATE OR DELETE ON feedbacks
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_counters_on_feedback();

-- Criar triggers para comments
CREATE TRIGGER trigger_comments_update_counters
    AFTER INSERT OR UPDATE OR DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_counters_on_comment();

-- Recalcular todos os contadores existentes uma vez
DO $$
DECLARE
    article_record RECORD;
BEGIN
    FOR article_record IN SELECT id FROM articles LOOP
        PERFORM recalculate_article_counters(article_record.id);
    END LOOP;
    RAISE NOTICE 'Todos os contadores foram recalculados!';
END $$;