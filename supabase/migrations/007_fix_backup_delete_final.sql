-- Correção da função restore_from_backup para resolver erro "DELETE requires a WHERE clause"

-- Primeiro, remover a função existente
DROP FUNCTION IF EXISTS restore_from_backup();

-- Recriar a função com a correção
CREATE OR REPLACE FUNCTION restore_from_backup()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    articles_count INTEGER := 0;
    comments_count INTEGER := 0;
    feedbacks_count INTEGER := 0;
    latest_backup_id UUID;
BEGIN
    -- Verificar se existe backup e obter o mais recente
    SELECT backup_id INTO latest_backup_id
    FROM backup_articles
    ORDER BY backup_created_at DESC
    LIMIT 1;
    
    IF latest_backup_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Nenhum backup encontrado para restaurar'
        );
    END IF;
    
    -- Limpar dados atuais (com cuidado) - CORRIGIDO: WHERE clause específica
    DELETE FROM comments WHERE id > 0;
    DELETE FROM feedbacks WHERE id > 0;
    DELETE FROM articles WHERE id > 0;
    
    -- Restaurar artigos do backup mais recente
    INSERT INTO articles (
        id, title, excerpt, content, image_url, published, 
        category_id, author_id, slug, meta_title, meta_description,
        created_at, updated_at
    )
    SELECT 
        ba.original_id, ba.title, ba.excerpt, ba.content, ba.image_url, ba.published,
        ba.category_id, ba.author_id, ba.slug, ba.meta_title, ba.meta_description,
        ba.created_at, ba.updated_at
    FROM backup_articles ba
    WHERE ba.backup_id = latest_backup_id;
    
    GET DIAGNOSTICS articles_count = ROW_COUNT;
    
    -- Restaurar comentários do backup mais recente
    INSERT INTO comments (id, article_id, user_name, content, created_at)
    SELECT bc.original_id, bc.article_id, bc.user_name, bc.content, bc.created_at
    FROM backup_comments bc
    WHERE bc.backup_id = latest_backup_id;
    
    GET DIAGNOSTICS comments_count = ROW_COUNT;
    
    -- Restaurar feedbacks do backup mais recente
    INSERT INTO feedbacks (id, article_id, type, user_id, content, created_at)
    SELECT bf.original_id, bf.article_id, bf.type, bf.user_id, bf.content, bf.created_at
    FROM backup_feedbacks bf
    WHERE bf.backup_id = latest_backup_id;
    
    GET DIAGNOSTICS feedbacks_count = ROW_COUNT;
    
    -- Registrar log de restauração
    INSERT INTO backup_logs (action_type, records_affected, details, success)
    VALUES (
        'restore',
        articles_count + comments_count + feedbacks_count,
        format('Restauração concluída do backup %s: %s artigos, %s comentários, %s feedbacks',
               latest_backup_id, articles_count, comments_count, feedbacks_count),
        true
    );
    
    -- Retornar resultado
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Restauração concluída com sucesso',
        'backup_id', latest_backup_id,
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
            'restore',
            0,
            format('Erro na restauração: %s (Código: %s)', SQLERRM, SQLSTATE),
            false
        );
        
        -- Retornar erro
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Erro durante a restauração',
            'error', SQLERRM,
            'error_code', SQLSTATE
        );
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION restore_from_backup() TO authenticated;