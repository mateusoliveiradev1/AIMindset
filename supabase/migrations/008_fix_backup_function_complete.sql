-- Correção completa da função backup_all_data para incluir todos os campos necessários

-- Primeiro, remover a função existente
DROP FUNCTION IF EXISTS backup_all_data();

-- Recriar a função com todos os campos corretos
CREATE OR REPLACE FUNCTION backup_all_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    articles_count INTEGER := 0;
    comments_count INTEGER := 0;
    feedbacks_count INTEGER := 0;
    backup_id UUID;
BEGIN
    -- Gerar ID único para este backup
    backup_id := gen_random_uuid();
    
    -- Backup da tabela articles (incluindo TODOS os campos)
    INSERT INTO backup_articles (
        backup_id, original_id, title, excerpt, content, image_url,
        published, category_id, author_id, slug, tags, approval_rate,
        positive_feedback, negative_feedback, total_views, total_likes,
        positive_feedbacks, negative_feedbacks, comments_count, likes_count,
        is_featured, is_featured_manual, created_at, updated_at
    )
    SELECT 
        backup_id, a.id, a.title, a.excerpt, a.content, a.image_url,
        a.published, a.category_id, a.author_id, a.slug, a.tags, a.approval_rate,
        a.positive_feedback, a.negative_feedback, a.total_views, a.total_likes,
        a.positive_feedbacks, a.negative_feedbacks, a.comments_count, a.likes_count,
        a.is_featured, a.is_featured_manual, a.created_at, a.updated_at
    FROM articles a;
    
    GET DIAGNOSTICS articles_count = ROW_COUNT;
    
    -- Backup da tabela comments
    INSERT INTO backup_comments (
        backup_id, original_id, article_id, user_name, content, created_at
    )
    SELECT 
        backup_id, c.id, c.article_id, c.user_name, c.content, c.created_at
    FROM comments c;
    
    GET DIAGNOSTICS comments_count = ROW_COUNT;
    
    -- Backup da tabela feedbacks
    INSERT INTO backup_feedbacks (
        backup_id, original_id, article_id, type, user_id, content, created_at
    )
    SELECT 
        backup_id, f.id, f.article_id, f.type, f.user_id, f.content, f.created_at
    FROM feedbacks f;
    
    GET DIAGNOSTICS feedbacks_count = ROW_COUNT;
    
    -- Registrar log de backup
    INSERT INTO backup_logs (action_type, records_affected, details, success)
    VALUES (
        'backup',
        articles_count + comments_count + feedbacks_count,
        format('Backup realizado com sucesso. Artigos: %s, Comentários: %s, Feedbacks: %s, Backup ID: %s',
               articles_count, comments_count, feedbacks_count, backup_id),
        true
    );
    
    -- Retornar resultado
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Backup criado com sucesso',
        'backup_id', backup_id,
        'articles_count', articles_count,
        'comments_count', comments_count,
        'feedbacks_count', feedbacks_count,
        'total_records', articles_count + comments_count + feedbacks_count
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Registrar erro no log
        INSERT INTO backup_logs (action_type, records_affected, details, success)
        VALUES (
            'backup',
            0,
            format('Erro no backup: %s (Código: %s)', SQLERRM, SQLSTATE),
            false
        );
        
        -- Retornar erro
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Erro durante o backup',
            'error', SQLERRM,
            'error_code', SQLSTATE
        );
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION backup_all_data() TO authenticated;