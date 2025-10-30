-- Correção da função restore_from_backup - usar UPSERT em vez de DELETE

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
    
    -- Restaurar artigos usando UPSERT (INSERT ... ON CONFLICT)
    INSERT INTO articles (
        id, title, content, excerpt, slug, image_url, category_id, author_id, 
        published, created_at, updated_at, tags, approval_rate, positive_feedback, 
        negative_feedback, total_views, total_likes, positive_feedbacks, 
        negative_feedbacks, comments_count, likes_count, is_featured, is_featured_manual
    )
    SELECT 
        ba.original_id, ba.title, ba.content, ba.excerpt, ba.slug, ba.image_url, 
        ba.category_id, ba.author_id, ba.published, ba.created_at, ba.updated_at, 
        ba.tags, ba.approval_rate, ba.positive_feedback, ba.negative_feedback, 
        ba.total_views, ba.total_likes, ba.positive_feedbacks, ba.negative_feedbacks, 
        ba.comments_count, ba.likes_count, ba.is_featured, ba.is_featured_manual
    FROM backup_articles ba
    ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        excerpt = EXCLUDED.excerpt,
        slug = EXCLUDED.slug,
        image_url = EXCLUDED.image_url,
        category_id = EXCLUDED.category_id,
        author_id = EXCLUDED.author_id,
        published = EXCLUDED.published,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at,
        tags = EXCLUDED.tags,
        approval_rate = EXCLUDED.approval_rate,
        positive_feedback = EXCLUDED.positive_feedback,
        negative_feedback = EXCLUDED.negative_feedback,
        total_views = EXCLUDED.total_views,
        total_likes = EXCLUDED.total_likes,
        positive_feedbacks = EXCLUDED.positive_feedbacks,
        negative_feedbacks = EXCLUDED.negative_feedbacks,
        comments_count = EXCLUDED.comments_count,
        likes_count = EXCLUDED.likes_count,
        is_featured = EXCLUDED.is_featured,
        is_featured_manual = EXCLUDED.is_featured_manual;
    
    GET DIAGNOSTICS articles_count = ROW_COUNT;
    
    -- Restaurar comentários usando UPSERT
    INSERT INTO comments (
        id, article_id, user_name, content, created_at, parent_id, likes
    )
    SELECT 
        bc.original_id, bc.article_id, bc.user_name, bc.content, bc.created_at, 
        bc.parent_id, bc.likes
    FROM backup_comments bc
    ON CONFLICT (id) DO UPDATE SET
        article_id = EXCLUDED.article_id,
        user_name = EXCLUDED.user_name,
        content = EXCLUDED.content,
        created_at = EXCLUDED.created_at,
        parent_id = EXCLUDED.parent_id,
        likes = EXCLUDED.likes;
    
    GET DIAGNOSTICS comments_count = ROW_COUNT;
    
    -- Restaurar feedbacks usando UPSERT
    INSERT INTO feedbacks (
        id, article_id, type, user_id, content, created_at, updated_at
    )
    SELECT 
        bf.original_id, bf.article_id, bf.type, bf.user_id, bf.content, 
        bf.created_at, bf.updated_at
    FROM backup_feedbacks bf
    ON CONFLICT (id) DO UPDATE SET
        article_id = EXCLUDED.article_id,
        type = EXCLUDED.type,
        user_id = EXCLUDED.user_id,
        content = EXCLUDED.content,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at;
    
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
COMMENT ON FUNCTION restore_from_backup() IS 'Função para restaurar dados do último backup - usando UPSERT para evitar conflitos';