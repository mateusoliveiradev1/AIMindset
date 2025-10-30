-- =====================================================
-- AIMindset Backup System - Consolidated Migration
-- Data: 2025-10-30
-- Descrição: Sistema de backup consolidado e funcional
-- =====================================================

-- =====================================================
-- TABELA DE LOGS DE BACKUP
-- =====================================================

CREATE TABLE IF NOT EXISTS backup_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('backup', 'restore')),
    records_affected INTEGER DEFAULT 0,
    details TEXT,
    success BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_backup_logs_created_at ON backup_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_logs_action_type ON backup_logs(action_type);

-- =====================================================
-- TABELAS DE BACKUP
-- =====================================================

-- Tabela de backup de artigos
CREATE TABLE IF NOT EXISTS backup_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_id UUID NOT NULL,
    original_id UUID NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT,
    content TEXT,
    image_url TEXT,
    published BOOLEAN DEFAULT false,
    category_id UUID,
    author_id UUID,
    slug TEXT,
    meta_title TEXT,
    meta_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    backup_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de backup de comentários
CREATE TABLE IF NOT EXISTS backup_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_id UUID NOT NULL,
    original_id UUID NOT NULL,
    article_id UUID NOT NULL,
    user_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE,
    backup_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de backup de feedbacks
CREATE TABLE IF NOT EXISTS backup_feedbacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_id UUID NOT NULL,
    original_id UUID NOT NULL,
    article_id UUID,
    type TEXT NOT NULL,
    user_id TEXT,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    backup_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance das tabelas de backup
CREATE INDEX IF NOT EXISTS idx_backup_articles_backup_id ON backup_articles(backup_id);
CREATE INDEX IF NOT EXISTS idx_backup_comments_backup_id ON backup_comments(backup_id);
CREATE INDEX IF NOT EXISTS idx_backup_feedbacks_backup_id ON backup_feedbacks(backup_id);

CREATE INDEX IF NOT EXISTS idx_backup_articles_created_at ON backup_articles(backup_created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_comments_created_at ON backup_comments(backup_created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_feedbacks_created_at ON backup_feedbacks(backup_created_at DESC);

-- =====================================================
-- HABILITAR ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_feedbacks ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS
-- =====================================================

-- Políticas para backup_logs
CREATE POLICY "backup_logs_authenticated_policy" ON backup_logs
    FOR ALL USING (auth.role() IS NOT NULL);

-- Políticas para backup_articles
CREATE POLICY "backup_articles_authenticated_policy" ON backup_articles
    FOR ALL USING (auth.role() IS NOT NULL);

-- Políticas para backup_comments
CREATE POLICY "backup_comments_authenticated_policy" ON backup_comments
    FOR ALL USING (auth.role() IS NOT NULL);

-- Políticas para backup_feedbacks
CREATE POLICY "backup_feedbacks_authenticated_policy" ON backup_feedbacks
    FOR ALL USING (auth.role() IS NOT NULL);

-- =====================================================
-- FUNÇÃO DE BACKUP COMPLETO
-- =====================================================

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
    
    -- Backup da tabela articles
    INSERT INTO backup_articles (
        backup_id, original_id, title, excerpt, content, image_url,
        published, category_id, author_id, slug, meta_title, meta_description,
        created_at, updated_at
    )
    SELECT 
        backup_id, a.id, a.title, a.excerpt, a.content, a.image_url,
        a.published, a.category_id, a.author_id, a.slug, a.meta_title, a.meta_description,
        a.created_at, a.updated_at
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

-- =====================================================
-- FUNÇÃO DE RESTAURAÇÃO
-- =====================================================

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
    
    -- Limpar dados atuais (com cuidado)
    DELETE FROM comments WHERE id IS NOT NULL;
    DELETE FROM feedbacks WHERE id IS NOT NULL;
    DELETE FROM articles WHERE id IS NOT NULL;
    
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

-- =====================================================
-- FUNÇÃO PARA LISTAR BACKUPS
-- =====================================================

CREATE OR REPLACE FUNCTION list_backups()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    backups_list jsonb;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'backup_id', backup_id,
            'created_at', backup_created_at,
            'articles_count', articles_count,
            'comments_count', comments_count,
            'feedbacks_count', feedbacks_count
        ) ORDER BY backup_created_at DESC
    )
    INTO backups_list
    FROM (
        SELECT 
            ba.backup_id,
            ba.backup_created_at,
            COUNT(DISTINCT ba.id) as articles_count,
            COUNT(DISTINCT bc.id) as comments_count,
            COUNT(DISTINCT bf.id) as feedbacks_count
        FROM backup_articles ba
        LEFT JOIN backup_comments bc ON bc.backup_id = ba.backup_id
        LEFT JOIN backup_feedbacks bf ON bf.backup_id = ba.backup_id
        GROUP BY ba.backup_id, ba.backup_created_at
    ) backup_summary;
    
    RETURN COALESCE(backups_list, '[]'::jsonb);
END;
$$;

-- =====================================================
-- FUNÇÃO PARA OBTER LOGS DE BACKUP
-- =====================================================

CREATE OR REPLACE FUNCTION get_backup_logs(limit_count INTEGER DEFAULT 10)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    logs_list jsonb;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', bl.id,
            'action_type', bl.action_type,
            'records_affected', bl.records_affected,
            'details', bl.details,
            'success', bl.success,
            'created_at', bl.created_at
        ) ORDER BY bl.created_at DESC
    )
    INTO logs_list
    FROM (
        SELECT *
        FROM backup_logs bl
        ORDER BY bl.created_at DESC
        LIMIT limit_count
    ) bl;
    
    RETURN COALESCE(logs_list, '[]'::jsonb);
END;
$$;

-- =====================================================
-- PERMISSÕES
-- =====================================================

-- Permissões para funções de backup
GRANT EXECUTE ON FUNCTION backup_all_data() TO authenticated;
GRANT EXECUTE ON FUNCTION backup_all_data() TO service_role;
GRANT EXECUTE ON FUNCTION restore_from_backup() TO authenticated;
GRANT EXECUTE ON FUNCTION restore_from_backup() TO service_role;
GRANT EXECUTE ON FUNCTION list_backups() TO authenticated;
GRANT EXECUTE ON FUNCTION list_backups() TO service_role;
GRANT EXECUTE ON FUNCTION get_backup_logs(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_backup_logs(INTEGER) TO service_role;

-- Permissões para tabelas de backup
GRANT ALL ON backup_logs TO authenticated;
GRANT ALL ON backup_articles TO authenticated;
GRANT ALL ON backup_comments TO authenticated;
GRANT ALL ON backup_feedbacks TO authenticated;

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE backup_logs IS 'Tabela de logs das operações de backup e restauração';
COMMENT ON TABLE backup_articles IS 'Tabela de backup dos artigos';
COMMENT ON TABLE backup_comments IS 'Tabela de backup dos comentários';
COMMENT ON TABLE backup_feedbacks IS 'Tabela de backup dos feedbacks';

COMMENT ON FUNCTION backup_all_data() IS 'Função para criar backup completo de todos os dados';
COMMENT ON FUNCTION restore_from_backup() IS 'Função para restaurar dados do backup mais recente';
COMMENT ON FUNCTION list_backups() IS 'Função para listar todos os backups disponíveis';
COMMENT ON FUNCTION get_backup_logs(INTEGER) IS 'Função para buscar histórico de logs de backup';

-- =====================================================
-- LOG DA MIGRAÇÃO
-- =====================================================

INSERT INTO system_logs (type, message, context)
VALUES ('migration', 'Sistema de backup consolidado criado com sucesso',
        jsonb_build_object(
            'migration', '005_backup_system.sql',
            'components', jsonb_build_array(
                'backup_logs_table',
                'backup_articles_table',
                'backup_comments_table',
                'backup_feedbacks_table',
                'backup_all_data_function',
                'restore_from_backup_function',
                'list_backups_function',
                'get_backup_logs_function'
            ),
            'features', jsonb_build_array(
                'complete_backup',
                'selective_restore',
                'backup_history',
                'log_tracking'
            )
        ));