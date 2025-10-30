-- Correção da função restore_from_backup - restaurar apenas o backup mais recente

CREATE OR REPLACE FUNCTION restore_from_backup()
RETURNS JSON AS $$
DECLARE
    articles_count INTEGER := 0;
    comments_count INTEGER := 0;
    feedbacks_count INTEGER := 0;
    total_records INTEGER := 0;
    backup_exists BOOLEAN := false;
    latest_backup_id UUID;
    result JSON;
BEGIN
    -- Verificar se existe backup e obter o mais recente
    SELECT backup_id INTO latest_backup_id
    FROM backup_articles 
    ORDER BY backup_created_at DESC 
    LIMIT 1;
    
    IF latest_backup_id IS NULL THEN
        result := json_build_object(
            'success', false,
            'message', 'Nenhum backup encontrado para restaurar'
        );
        RETURN result;
    END IF;
    
    -- Limpar dados atuais usando DELETE com condição sempre verdadeira
    DELETE FROM feedbacks WHERE 1=1;
    DELETE FROM comments WHERE 1=1;
    DELETE FROM articles WHERE 1=1;
    
    -- Restaurar artigos do backup mais recente apenas
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
    WHERE ba.backup_id = latest_backup_id;
    
    GET DIAGNOSTICS articles_count = ROW_COUNT;
    
    -- Restaurar comentários do backup mais recente apenas
    INSERT INTO comments (
        id, article_id, user_name, content, created_at, parent_id, likes
    )
    SELECT 
        bc.original_id, bc.article_id, bc.user_name, bc.content, bc.created_at, 
        bc.parent_id, bc.likes
    FROM backup_comments bc
    WHERE bc.backup_id = latest_backup_id;
    
    GET DIAGNOSTICS comments_count = ROW_COUNT;
    
    -- Restaurar feedbacks do backup mais recente apenas
    INSERT INTO feedbacks (
        id, article_id, type, user_id, content, created_at, updated_at
    )
    SELECT 
        bf.original_id, bf.article_id, bf.type, bf.user_id, bf.content, 
        bf.created_at, bf.updated_at
    FROM backup_feedbacks bf
    WHERE bf.backup_id = latest_backup_id;
    
    GET DIAGNOSTICS feedbacks_count = ROW_COUNT;
    
    -- Calcular total
    total_records := articles_count + comments_count + feedbacks_count;
    
    -- Registrar log de restauração
    INSERT INTO backup_logs (action_type, records_affected, details, success)
    VALUES (
        'restore',
        total_records,
        format('Restauração concluída do backup %s: %s artigos, %s comentários, %s feedbacks', 
               latest_backup_id, articles_count, comments_count, feedbacks_count),
        true
    );
    
    -- Retornar resultado
    result := json_build_object(
        'success', true,
        'message', 'Dados restaurados com sucesso',
        'backup_id', latest_backup_id,
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
COMMENT ON FUNCTION restore_from_backup() IS 'Função para restaurar dados do backup mais recente apenas';