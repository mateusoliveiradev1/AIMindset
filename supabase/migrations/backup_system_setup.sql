-- =====================================================
-- Sistema de Backup Completo do AIMindset
-- Versão Segura e Compatível
-- =====================================================

-- 1. CRIAR TABELA DE LOGS DE BACKUP
-- =====================================================

CREATE TABLE IF NOT EXISTS backup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('backup', 'restore')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    records_affected INTEGER DEFAULT 0,
    details TEXT,
    success BOOLEAN DEFAULT true
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_backup_logs_created_at ON backup_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_logs_action_type ON backup_logs(action_type);

-- 2. CRIAR TABELAS DE BACKUP
-- =====================================================

-- Tabela de backup de artigos
CREATE TABLE IF NOT EXISTS articles_backup (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    slug VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    published BOOLEAN DEFAULT false,
    category VARCHAR(100),
    excerpt TEXT,
    image_url TEXT,
    backup_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de backup de comentários
CREATE TABLE IF NOT EXISTS comments_backup (
    id UUID PRIMARY KEY,
    article_id UUID NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    author_email VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    approved BOOLEAN DEFAULT false,
    backup_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de backup de feedbacks
CREATE TABLE IF NOT EXISTS feedbacks_backup (
    id UUID PRIMARY KEY,
    article_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    user_ip INET,
    backup_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance das tabelas de backup
CREATE INDEX IF NOT EXISTS idx_articles_backup_created_at ON articles_backup(backup_created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_backup_created_at ON comments_backup(backup_created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_backup_created_at ON feedbacks_backup(backup_created_at DESC);

-- 3. FUNÇÃO DE BACKUP COMPLETO
-- =====================================================

CREATE OR REPLACE FUNCTION backup_all_data()
RETURNS JSON AS $$
DECLARE
    articles_count INTEGER := 0;
    comments_count INTEGER := 0;
    feedbacks_count INTEGER := 0;
    total_records INTEGER := 0;
    result JSON;
BEGIN
    -- Limpar dados antigos de backup
    DELETE FROM articles_backup;
    DELETE FROM comments_backup;
    DELETE FROM feedbacks_backup;
    
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
    
    total_records := articles_count + comments_count + feedbacks_count;
    
    -- Log da operação
    INSERT INTO backup_logs (action_type, records_affected, details, success)
    VALUES (
        'backup', 
        total_records,
        FORMAT('Articles: %s, Comments: %s, Feedbacks: %s', 
               articles_count, comments_count, feedbacks_count),
        true
    );
    
    -- Retornar resultado
    result := json_build_object(
        'success', true,
        'message', 'Backup concluído com sucesso',
        'records_affected', total_records,
        'details', json_build_object(
            'articles', articles_count,
            'comments', comments_count,
            'feedbacks', feedbacks_count
        )
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    -- Log de erro
    INSERT INTO backup_logs (action_type, records_affected, details, success)
    VALUES ('backup', 0, SQLERRM, false);
    
    RETURN json_build_object(
        'success', false,
        'message', 'Erro durante o backup',
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FUNÇÃO DE RESTAURAÇÃO
-- =====================================================

CREATE OR REPLACE FUNCTION restore_from_backup()
RETURNS JSON AS $$
DECLARE
    articles_count INTEGER := 0;
    comments_count INTEGER := 0;
    feedbacks_count INTEGER := 0;
    total_records INTEGER := 0;
    result JSON;
BEGIN
    -- Verificar se existem dados de backup
    SELECT COUNT(*) INTO articles_count FROM articles_backup;
    SELECT COUNT(*) INTO comments_count FROM comments_backup;
    SELECT COUNT(*) INTO feedbacks_count FROM feedbacks_backup;
    
    IF articles_count = 0 AND comments_count = 0 AND feedbacks_count = 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Nenhum backup encontrado para restaurar'
        );
    END IF;
    
    -- Limpar dados atuais (cuidado: operação destrutiva)
    DELETE FROM comments;
    DELETE FROM feedbacks;
    DELETE FROM articles;
    
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
    
    total_records := articles_count + comments_count + feedbacks_count;
    
    -- Log da operação
    INSERT INTO backup_logs (action_type, records_affected, details, success)
    VALUES (
        'restore',
        total_records,
        FORMAT('Articles: %s, Comments: %s, Feedbacks: %s', 
               articles_count, comments_count, feedbacks_count),
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
            'feedbacks', feedbacks_count
        )
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    -- Log de erro
    INSERT INTO backup_logs (action_type, records_affected, details, success)
    VALUES ('restore', 0, SQLERRM, false);
    
    RETURN json_build_object(
        'success', false,
        'message', 'Erro durante a restauração',
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNÇÃO PARA BUSCAR LOGS
-- =====================================================

CREATE OR REPLACE FUNCTION get_backup_logs(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    action_type VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE,
    records_affected INTEGER,
    details TEXT,
    success BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bl.id,
        bl.action_type,
        bl.created_at,
        bl.records_affected,
        bl.details,
        bl.success
    FROM backup_logs bl
    ORDER BY bl.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. CONFIGURAR PERMISSÕES RLS
-- =====================================================

-- Habilitar RLS nas tabelas de backup
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks_backup ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuários autenticados (admin)
CREATE POLICY "backup_logs_policy" ON backup_logs
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "articles_backup_policy" ON articles_backup
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "comments_backup_policy" ON comments_backup
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "feedbacks_backup_policy" ON feedbacks_backup
    FOR ALL USING (auth.role() = 'authenticated');

-- 7. CONCEDER PERMISSÕES PARA FUNÇÕES RPC
-- =====================================================

-- Permitir acesso às funções RPC para usuários autenticados
GRANT EXECUTE ON FUNCTION backup_all_data() TO authenticated;
GRANT EXECUTE ON FUNCTION restore_from_backup() TO authenticated;
GRANT EXECUTE ON FUNCTION get_backup_logs(INTEGER) TO authenticated;

-- Permitir acesso às tabelas para usuários autenticados
GRANT ALL ON backup_logs TO authenticated;
GRANT ALL ON articles_backup TO authenticated;
GRANT ALL ON comments_backup TO authenticated;
GRANT ALL ON feedbacks_backup TO authenticated;

-- 8. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE backup_logs IS 'Tabela de logs das operações de backup e restauração';
COMMENT ON TABLE articles_backup IS 'Tabela de backup dos artigos';
COMMENT ON TABLE comments_backup IS 'Tabela de backup dos comentários';
COMMENT ON TABLE feedbacks_backup IS 'Tabela de backup dos feedbacks';

COMMENT ON FUNCTION backup_all_data() IS 'Função para criar backup completo de todos os dados';
COMMENT ON FUNCTION restore_from_backup() IS 'Função para restaurar dados do último backup';
COMMENT ON FUNCTION get_backup_logs(INTEGER) IS 'Função para buscar histórico de logs de backup';

-- =====================================================
-- FIM DO SCRIPT DE SETUP DO SISTEMA DE BACKUP
-- =====================================================