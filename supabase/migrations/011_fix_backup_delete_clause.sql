-- Correção para DELETE sem WHERE na função backup_all_data

-- 1. Remover função existente
DROP FUNCTION IF EXISTS backup_all_data();

-- 2. Recriar função com DELETE corrigido
CREATE OR REPLACE FUNCTION backup_all_data()
RETURNS JSON AS $$
DECLARE
    articles_count INTEGER := 0;
    comments_count INTEGER := 0;
    feedbacks_count INTEGER := 0;
    backend_logs_count INTEGER := 0;
    app_logs_count INTEGER := 0;
    system_logs_count INTEGER := 0;
    total_records INTEGER := 0;
    new_backup_id UUID;
    result JSON;
BEGIN
    -- Gerar ID único para este backup
    new_backup_id := gen_random_uuid();
    
    -- Limpar dados antigos de backup (usar TRUNCATE para limpar completamente)
    TRUNCATE TABLE backend_logs_backup;
    TRUNCATE TABLE app_logs_backup;
    TRUNCATE TABLE system_logs_backup;
    
    -- Backup de artigos (com todos os campos necessários)
    INSERT INTO backup_articles (
        backup_id, original_id, title, excerpt, content, image_url,
        published, category_id, author_id, slug, tags, approval_rate,
        positive_feedback, negative_feedback, total_views, total_likes,
        positive_feedbacks, negative_feedbacks, comments_count, likes_count,
        is_featured, is_featured_manual, created_at, updated_at, backup_created_at
    )
    SELECT 
        new_backup_id, a.id, a.title, a.excerpt, a.content, a.image_url,
        a.published, a.category_id, a.author_id, a.slug, a.tags, a.approval_rate,
        a.positive_feedback, a.negative_feedback, a.total_views, a.total_likes,
        a.positive_feedbacks, a.negative_feedbacks, a.comments_count, a.likes_count,
        a.is_featured, a.is_featured_manual, a.created_at, a.updated_at, NOW()
    FROM articles a;
    
    GET DIAGNOSTICS articles_count = ROW_COUNT;
    
    -- Backup de comentários
    INSERT INTO backup_comments (
        backup_id, original_id, article_id, user_name, content, created_at, backup_created_at
    )
    SELECT 
        new_backup_id, c.id, c.article_id, c.user_name, c.content, c.created_at, NOW()
    FROM comments c;
    
    GET DIAGNOSTICS comments_count = ROW_COUNT;
    
    -- Backup de feedbacks
    INSERT INTO backup_feedbacks (
        backup_id, original_id, article_id, type, user_id, content, created_at, backup_created_at
    )
    SELECT 
        new_backup_id, f.id, f.article_id, f.type, f.user_id, f.content, f.created_at, NOW()
    FROM feedbacks f;
    
    GET DIAGNOSTICS feedbacks_count = ROW_COUNT;
    
    -- Backup de backend_logs (últimos 30 dias para performance)
    INSERT INTO backend_logs_backup (
        id, table_name, action, record_id, old_data, new_data, performed_by, created_at, backup_created_at
    )
    SELECT 
        bl.id, bl.table_name, bl.action, bl.record_id, bl.old_data, bl.new_data, bl.performed_by, bl.created_at, NOW()
    FROM backend_logs bl
    WHERE bl.created_at >= NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS backend_logs_count = ROW_COUNT;
    
    -- Backup de app_logs (últimos 30 dias para performance)
    INSERT INTO app_logs_backup (
        id, level, source, action, details, user_id, created_at, backup_created_at
    )
    SELECT 
        al.id, al.level, al.source, al.action, al.details, al.user_id, al.created_at, NOW()
    FROM app_logs al
    WHERE al.created_at >= NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS app_logs_count = ROW_COUNT;
    
    -- Backup de system_logs (últimos 30 dias para performance)
    INSERT INTO system_logs_backup (
        id, type, message, context, created_at, backup_created_at
    )
    SELECT 
        sl.id, sl.type, sl.message, sl.context, sl.created_at, NOW()
    FROM system_logs sl
    WHERE sl.created_at >= NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS system_logs_count = ROW_COUNT;
    
    total_records := articles_count + comments_count + feedbacks_count + 
                    backend_logs_count + app_logs_count + system_logs_count;
    
    -- Log da operação no sistema de logs
    INSERT INTO system_logs (type, message, context)
    VALUES (
        'backup',
        'Backup completo realizado com sucesso incluindo logs',
        json_build_object(
            'backup_id', new_backup_id,
            'total_records', total_records,
            'articles', articles_count,
            'comments', comments_count,
            'feedbacks', feedbacks_count,
            'backend_logs', backend_logs_count,
            'app_logs', app_logs_count,
            'system_logs', system_logs_count
        )
    );
    
    -- Log da operação no sistema de backup
    INSERT INTO backup_logs (action_type, records_affected, details, success)
    VALUES (
        'backup', 
        total_records,
        FORMAT('Backup ID: %s - Articles: %s, Comments: %s, Feedbacks: %s, Backend Logs: %s, App Logs: %s, System Logs: %s', 
               new_backup_id, articles_count, comments_count, feedbacks_count, 
               backend_logs_count, app_logs_count, system_logs_count),
        true
    );
    
    -- Retornar resultado
    result := json_build_object(
        'success', true,
        'message', 'Backup completo concluído com sucesso incluindo logs',
        'backup_id', new_backup_id,
        'total_records', total_records,
        'articles_count', articles_count,
        'comments_count', comments_count,
        'feedbacks_count', feedbacks_count,
        'backend_logs_count', backend_logs_count,
        'app_logs_count', app_logs_count,
        'system_logs_count', system_logs_count
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    -- Log de erro no sistema de logs
    INSERT INTO system_logs (type, message, context)
    VALUES (
        'error',
        'Erro durante backup completo',
        json_build_object('error', SQLERRM, 'backup_id', new_backup_id)
    );
    
    -- Log de erro no sistema de backup
    INSERT INTO backup_logs (action_type, records_affected, details, success)
    VALUES ('backup', 0, FORMAT('Erro: %s (Backup ID: %s)', SQLERRM, new_backup_id), false);
    
    RETURN json_build_object(
        'success', false,
        'message', 'Erro durante o backup',
        'error', SQLERRM,
        'backup_id', new_backup_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION backup_all_data() TO authenticated;

-- Comentário
COMMENT ON FUNCTION backup_all_data() IS 'Função para criar backup completo incluindo logs (últimos 30 dias) - versão final corrigida';