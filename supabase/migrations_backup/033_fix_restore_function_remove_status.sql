-- Correção da função restore_from_backup - remover coluna 'status' inexistente

CREATE OR REPLACE FUNCTION restore_from_backup()
RETURNS JSON AS $$
DECLARE
    articles_count INTEGER := 0;
    comments_count INTEGER := 0;
    feedbacks_count INTEGER := 0;
    total_records INTEGER := 0;
    backup_exists BOOLEAN := false;
    result JSON;
BEGIN
    -- Verificar se existe backup
    SELECT EXISTS(SELECT 1 FROM backup_articles LIMIT 1) INTO backup_exists;
    
    IF NOT backup_exists THEN
        result := json_build_object(
            'success', false,
            'message', 'Nenhum backup encontrado para restaurar'
        );
        RETURN result;
    END IF;
    
    -- Limpar dados atuais (com WHERE clause)
    DELETE FROM comments WHERE id IS NOT NULL;
    DELETE FROM feedbacks WHERE id IS NOT NULL;
    DELETE FROM articles WHERE id IS NOT NULL;
    
    -- Restaurar artigos (SEM a coluna 'status' que não existe)
    INSERT INTO articles (
        id, title, content, excerpt, slug, image_url, category_id, author_id, 
        published, created_at, updated_at, tags, approval_rate, positive_feedback, 
        negative_feedback, total_views, total_likes, positive_feedbacks, 
        negative_feedbacks, comments_count, likes_count, is_featured, is_featured_manual
    )
    SELECT 
        original_id, title, content, excerpt, slug, image_url, category_id, author_id,
        published, created_at, updated_at, tags, approval_rate, positive_feedback,
        negative_feedback, total_views, total_likes, positive_feedbacks,
        negative_feedbacks, comments_count, likes_count, is_featured, is_featured_manual
    FROM backup_articles;
    
    GET DIAGNOSTICS articles_count = ROW_COUNT;
    
    -- Restaurar comentários
    INSERT INTO comments (
        id, article_id, user_name, content, created_at, parent_id, likes
    )
    SELECT 
        original_id, article_id, user_name, content, created_at, parent_id, likes
    FROM backup_comments;
    
    GET DIAGNOSTICS comments_count = ROW_COUNT;
    
    -- Restaurar feedbacks
    INSERT INTO feedbacks (
        id, article_id, type, user_id, content, created_at, updated_at
    )
    SELECT 
        original_id, article_id, type, user_id, content, created_at, updated_at
    FROM backup_feedbacks;
    
    GET DIAGNOSTICS feedbacks_count = ROW_COUNT;
    
    -- Calcular total
    total_records := articles_count + comments_count + feedbacks_count;
    
    -- Registrar log de restauração
    INSERT INTO backup_logs (action_type, records_affected, details, success)
    VALUES (
        'restore',
        total_records,
        format('Restauração concluída: %s artigos, %s comentários, %s feedbacks', 
               articles_count, comments_count, feedbacks_count),
        true
    );
    
    -- Retornar resultado
    result := json_build_object(
        'success', true,
        'message', 'Dados restaurados com sucesso',
        'records_affected', total_records,
        'details', json_build_object(
            'articles', articles_count,
            'comments', comments_count,
            'feedbacks', feedbacks_count
        )
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    -- Registrar log de erro
    INSERT INTO backup_logs (action_type, records_affected, details, success)
    VALUES (
        'restore',
        0,
        format('Erro na restauração: %s', SQLERRM),
        false
    );
    
    result := json_build_object(
        'success', false,
        'message', 'Erro durante a restauração',
        'error', SQLERRM
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário da função
COMMENT ON FUNCTION restore_from_backup() IS 'Função para restaurar dados do último backup - corrigida para não usar coluna status inexistente';