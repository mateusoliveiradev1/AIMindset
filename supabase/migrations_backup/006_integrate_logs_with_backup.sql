-- =====================================================
-- Integração do Sistema de Logs com Sistema de Backup
-- Adiciona tabelas de logs ao sistema de backup existente
-- =====================================================

-- 1. CRIAR TABELAS DE BACKUP PARA LOGS
-- =====================================================

-- Tabela de backup para backend_logs
CREATE TABLE IF NOT EXISTS backend_logs_backup (
    id BIGINT PRIMARY KEY,
    table_name TEXT NOT NULL,
    action TEXT NOT NULL,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    performed_by TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    backup_created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de backup para app_logs
CREATE TABLE IF NOT EXISTS app_logs_backup (
    id BIGINT PRIMARY KEY,
    level TEXT NOT NULL,
    source TEXT NOT NULL,
    action TEXT NOT NULL,
    details JSONB,
    user_id TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    backup_created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de backup para system_logs
CREATE TABLE IF NOT EXISTS system_logs_backup (
    id BIGINT PRIMARY KEY,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    context JSONB,
    created_at TIMESTAMPTZ NOT NULL,
    backup_created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance das tabelas de backup de logs
CREATE INDEX IF NOT EXISTS idx_backend_logs_backup_created_at ON backend_logs_backup(backup_created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_logs_backup_created_at ON app_logs_backup(backup_created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_backup_created_at ON system_logs_backup(backup_created_at DESC);

-- 2. ATUALIZAR FUNÇÃO DE BACKUP PARA INCLUIR LOGS
-- =====================================================

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
    result JSON;
BEGIN
    -- Limpar dados antigos de backup
    DELETE FROM articles_backup;
    DELETE FROM comments_backup;
    DELETE FROM feedbacks_backup;
    DELETE FROM backend_logs_backup;
    DELETE FROM app_logs_backup;
    DELETE FROM system_logs_backup;
    
    -- Backup de artigos
    INSERT INTO articles_backup (
        id, title, content, slug, created_at, updated_at, 
        published, category, excerpt, image_url
    )
    SELECT 
        id, title, content, slug, created_at, updated_at,
        published, category, excerpt, image_url
    FROM articles;
    
    GET DIAGNOSTICS articles_count = ROW_COUNT;
    
    -- Backup de comentários
    INSERT INTO comments_backup (
        id, article_id, author_name, author_email, 
        content, created_at, approved
    )
    SELECT 
        id, article_id, author_name, author_email,
        content, created_at, approved
    FROM comments;
    
    GET DIAGNOSTICS comments_count = ROW_COUNT;
    
    -- Backup de feedbacks
    INSERT INTO feedbacks_backup (
        id, article_id, type, content, created_at, user_ip
    )
    SELECT 
        id, article_id, type, content, created_at, user_ip
    FROM feedbacks;
    
    GET DIAGNOSTICS feedbacks_count = ROW_COUNT;
    
    -- Backup de backend_logs (últimos 30 dias para performance)
    INSERT INTO backend_logs_backup (
        id, table_name, action, record_id, old_data, new_data, performed_by, created_at
    )
    SELECT 
        id, table_name, action, record_id, old_data, new_data, performed_by, created_at
    FROM backend_logs
    WHERE created_at >= NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS backend_logs_count = ROW_COUNT;
    
    -- Backup de app_logs (últimos 30 dias para performance)
    INSERT INTO app_logs_backup (
        id, level, source, action, details, user_id, created_at
    )
    SELECT 
        id, level, source, action, details, user_id, created_at
    FROM app_logs
    WHERE created_at >= NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS app_logs_count = ROW_COUNT;
    
    -- Backup de system_logs (últimos 30 dias para performance)
    INSERT INTO system_logs_backup (
        id, type, message, context, created_at
    )
    SELECT 
        id, type, message, context, created_at
    FROM system_logs
    WHERE created_at >= NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS system_logs_count = ROW_COUNT;
    
    total_records := articles_count + comments_count + feedbacks_count + 
                    backend_logs_count + app_logs_count + system_logs_count;
    
    -- Log da operação no sistema de logs
    INSERT INTO system_logs (type, message, context)
    VALUES (
        'backup',
        'Backup completo realizado com sucesso',
        json_build_object(
            'total_records', total_records,
            'articles', articles_count,
            'comments', comments_count,
            'feedbacks', feedbacks_count,
            'backend_logs', backend_logs_count,
            'app_logs', app_logs_count,
            'system_logs', system_logs_count
        )
    );
    
    -- Log da operação no sistema de backup (compatibilidade)
    INSERT INTO backup_logs (action_type, records_affected, details, success)
    VALUES (
        'backup', 
        total_records,
        FORMAT('Articles: %s, Comments: %s, Feedbacks: %s, Backend Logs: %s, App Logs: %s, System Logs: %s', 
               articles_count, comments_count, feedbacks_count, 
               backend_logs_count, app_logs_count, system_logs_count),
        true
    );
    
    -- Retornar resultado
    result := json_build_object(
        'success', true,
        'message', 'Backup completo concluído com sucesso',
        'records_affected', total_records,
        'details', json_build_object(
            'articles', articles_count,
            'comments', comments_count,
            'feedbacks', feedbacks_count,
            'backend_logs', backend_logs_count,
            'app_logs', app_logs_count,
            'system_logs', system_logs_count
        )
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    -- Log de erro no sistema de logs
    INSERT INTO system_logs (type, message, context)
    VALUES (
        'error',
        'Erro durante backup completo',
        json_build_object('error', SQLERRM)
    );
    
    -- Log de erro no sistema de backup (compatibilidade)
    INSERT INTO backup_logs (action_type, records_affected, details, success)
    VALUES ('backup', 0, SQLERRM, false);
    
    RETURN json_build_object(
        'success', false,
        'message', 'Erro durante o backup',
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ATUALIZAR FUNÇÃO DE RESTAURAÇÃO PARA INCLUIR LOGS
-- =====================================================

CREATE OR REPLACE FUNCTION restore_from_backup()
RETURNS JSON AS $$
DECLARE
    articles_count INTEGER := 0;
    comments_count INTEGER := 0;
    feedbacks_count INTEGER := 0;
    backend_logs_count INTEGER := 0;
    app_logs_count INTEGER := 0;
    system_logs_count INTEGER := 0;
    total_records INTEGER := 0;
    result JSON;
BEGIN
    -- Verificar se existem dados de backup
    SELECT COUNT(*) INTO articles_count FROM articles_backup;
    SELECT COUNT(*) INTO comments_count FROM comments_backup;
    SELECT COUNT(*) INTO feedbacks_count FROM feedbacks_backup;
    SELECT COUNT(*) INTO backend_logs_count FROM backend_logs_backup;
    SELECT COUNT(*) INTO app_logs_count FROM app_logs_backup;
    SELECT COUNT(*) INTO system_logs_count FROM system_logs_backup;
    
    IF articles_count = 0 AND comments_count = 0 AND feedbacks_count = 0 AND
       backend_logs_count = 0 AND app_logs_count = 0 AND system_logs_count = 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Nenhum backup encontrado para restaurar'
        );
    END IF;
    
    -- Log da operação de restauração
    INSERT INTO system_logs (type, message, context)
    VALUES (
        'restore',
        'Iniciando restauração do backup',
        json_build_object(
            'backup_records', json_build_object(
                'articles', articles_count,
                'comments', comments_count,
                'feedbacks', feedbacks_count,
                'backend_logs', backend_logs_count,
                'app_logs', app_logs_count,
                'system_logs', system_logs_count
            )
        )
    );
    
    -- Limpar dados atuais (cuidado: operação destrutiva)
    DELETE FROM comments;
    DELETE FROM feedbacks;
    DELETE FROM articles;
    -- Não limpar logs para preservar histórico de operações
    
    -- Restaurar artigos
    INSERT INTO articles (
        id, title, content, slug, created_at, updated_at,
        published, category, excerpt, image_url
    )
    SELECT 
        id, title, content, slug, created_at, updated_at,
        published, category, excerpt, image_url
    FROM articles_backup;
    
    GET DIAGNOSTICS articles_count = ROW_COUNT;
    
    -- Restaurar comentários
    INSERT INTO comments (
        id, article_id, author_name, author_email,
        content, created_at, approved
    )
    SELECT 
        id, article_id, author_name, author_email,
        content, created_at, approved
    FROM comments_backup;
    
    GET DIAGNOSTICS comments_count = ROW_COUNT;
    
    -- Restaurar feedbacks
    INSERT INTO feedbacks (
        id, article_id, type, content, created_at, user_ip
    )
    SELECT 
        id, article_id, type, content, created_at, user_ip
    FROM feedbacks_backup;
    
    GET DIAGNOSTICS feedbacks_count = ROW_COUNT;
    
    -- Restaurar logs apenas se não existirem (evitar duplicatas)
    INSERT INTO backend_logs (
        id, table_name, action, record_id, old_data, new_data, performed_by, created_at
    )
    SELECT 
        b.id, b.table_name, b.action, b.record_id, b.old_data, b.new_data, b.performed_by, b.created_at
    FROM backend_logs_backup b
    WHERE NOT EXISTS (
        SELECT 1 FROM backend_logs bl WHERE bl.id = b.id
    );
    
    GET DIAGNOSTICS backend_logs_count = ROW_COUNT;
    
    INSERT INTO app_logs (
        id, level, source, action, details, user_id, created_at
    )
    SELECT 
        b.id, b.level, b.source, b.action, b.details, b.user_id, b.created_at
    FROM app_logs_backup b
    WHERE NOT EXISTS (
        SELECT 1 FROM app_logs al WHERE al.id = b.id
    );
    
    GET DIAGNOSTICS app_logs_count = ROW_COUNT;
    
    INSERT INTO system_logs (
        id, type, message, context, created_at
    )
    SELECT 
        b.id, b.type, b.message, b.context, b.created_at
    FROM system_logs_backup b
    WHERE NOT EXISTS (
        SELECT 1 FROM system_logs sl WHERE sl.id = b.id
    );
    
    GET DIAGNOSTICS system_logs_count = ROW_COUNT;
    
    total_records := articles_count + comments_count + feedbacks_count + 
                    backend_logs_count + app_logs_count + system_logs_count;
    
    -- Log da operação no sistema de logs
    INSERT INTO system_logs (type, message, context)
    VALUES (
        'restore',
        'Restauração do backup concluída com sucesso',
        json_build_object(
            'total_records', total_records,
            'articles', articles_count,
            'comments', comments_count,
            'feedbacks', feedbacks_count,
            'backend_logs', backend_logs_count,
            'app_logs', app_logs_count,
            'system_logs', system_logs_count
        )
    );
    
    -- Log da operação no sistema de backup (compatibilidade)
    INSERT INTO backup_logs (action_type, records_affected, details, success)
    VALUES (
        'restore', 
        total_records,
        FORMAT('Articles: %s, Comments: %s, Feedbacks: %s, Backend Logs: %s, App Logs: %s, System Logs: %s', 
               articles_count, comments_count, feedbacks_count,
               backend_logs_count, app_logs_count, system_logs_count),
        true
    );
    
    -- Retornar resultado
    result := json_build_object(
        'success', true,
        'message', 'Restauração concluída com sucesso',
        'records_affected', total_records,
        'details', json_build_object(
            'articles', articles_count,
            'comments', comments_count,
            'feedbacks', feedbacks_count,
            'backend_logs', backend_logs_count,
            'app_logs', app_logs_count,
            'system_logs', system_logs_count
        )
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    -- Log de erro no sistema de logs
    INSERT INTO system_logs (type, message, context)
    VALUES (
        'error',
        'Erro durante restauração do backup',
        json_build_object('error', SQLERRM)
    );
    
    -- Log de erro no sistema de backup (compatibilidade)
    INSERT INTO backup_logs (action_type, records_affected, details, success)
    VALUES ('restore', 0, SQLERRM, false);
    
    RETURN json_build_object(
        'success', false,
        'message', 'Erro durante a restauração',
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CONFIGURAR POLÍTICAS RLS PARA TABELAS DE BACKUP DE LOGS
-- =====================================================

-- Habilitar RLS nas tabelas de backup de logs
ALTER TABLE backend_logs_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_logs_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs_backup ENABLE ROW LEVEL SECURITY;

-- Políticas para backend_logs_backup (apenas admins)
CREATE POLICY "Admin access to backend_logs_backup" ON backend_logs_backup
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid()
        )
    );

-- Políticas para app_logs_backup (apenas admins)
CREATE POLICY "Admin access to app_logs_backup" ON app_logs_backup
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid()
        )
    );

-- Políticas para system_logs_backup (apenas admins)
CREATE POLICY "Admin access to system_logs_backup" ON system_logs_backup
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid()
        )
    );

-- 5. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE backend_logs_backup IS 'Tabela de backup dos logs de backend';
COMMENT ON TABLE app_logs_backup IS 'Tabela de backup dos logs de aplicação';
COMMENT ON TABLE system_logs_backup IS 'Tabela de backup dos logs de sistema';

COMMENT ON FUNCTION backup_all_data() IS 'Função para criar backup completo incluindo logs (últimos 30 dias)';
COMMENT ON FUNCTION restore_from_backup() IS 'Função para restaurar dados do backup incluindo logs (sem duplicatas)';

-- =====================================================
-- FIM DA INTEGRAÇÃO DO SISTEMA DE LOGS COM BACKUP
-- =====================================================