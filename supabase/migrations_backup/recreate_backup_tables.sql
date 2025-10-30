-- Recriar tabelas de backup com estrutura correta

-- Remover tabelas antigas
DROP TABLE IF EXISTS backup_articles CASCADE;
DROP TABLE IF EXISTS backup_comments CASCADE;
DROP TABLE IF EXISTS backup_feedbacks CASCADE;

-- Criar tabela de backup para articles
CREATE TABLE backup_articles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    backup_id uuid NOT NULL,
    original_id uuid NOT NULL,
    title text NOT NULL,
    excerpt text NOT NULL,
    content text NOT NULL,
    image_url text,
    category_id uuid,
    author_id uuid,
    published boolean NOT NULL DEFAULT false,
    created_at timestamptz,
    updated_at timestamptz,
    slug text NOT NULL,
    tags text,
    approval_rate numeric DEFAULT 0.0,
    positive_feedback integer DEFAULT 0,
    negative_feedback integer DEFAULT 0,
    total_views integer DEFAULT 0,
    total_likes integer DEFAULT 0,
    positive_feedbacks integer DEFAULT 0,
    negative_feedbacks integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    likes_count integer DEFAULT 0,
    is_featured boolean DEFAULT false,
    is_featured_manual boolean DEFAULT false,
    backup_created_at timestamptz DEFAULT now()
);

-- Criar tabela de backup para comments
CREATE TABLE backup_comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    backup_id uuid NOT NULL,
    original_id uuid NOT NULL,
    article_id uuid,
    user_name text NOT NULL,
    content text NOT NULL,
    created_at timestamptz,
    parent_id uuid,
    likes integer DEFAULT 0,
    backup_created_at timestamptz DEFAULT now()
);

-- Criar tabela de backup para feedbacks
CREATE TABLE backup_feedbacks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    backup_id uuid NOT NULL,
    original_id uuid NOT NULL,
    article_id uuid NOT NULL,
    type varchar NOT NULL,
    user_id uuid,
    content text,
    created_at timestamptz,
    updated_at timestamptz,
    backup_created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE backup_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_feedbacks ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS (permitir tudo para usuários autenticados)
CREATE POLICY "Enable all operations for authenticated users" ON backup_articles
    FOR ALL USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON backup_comments
    FOR ALL USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON backup_feedbacks
    FOR ALL USING (true);

-- Criar índices para melhor performance
CREATE INDEX idx_backup_articles_backup_id ON backup_articles(backup_id);
CREATE INDEX idx_backup_comments_backup_id ON backup_comments(backup_id);
CREATE INDEX idx_backup_feedbacks_backup_id ON backup_feedbacks(backup_id);

CREATE INDEX idx_backup_articles_created_at ON backup_articles(backup_created_at);
CREATE INDEX idx_backup_comments_created_at ON backup_comments(backup_created_at);
CREATE INDEX idx_backup_feedbacks_created_at ON backup_feedbacks(backup_created_at);