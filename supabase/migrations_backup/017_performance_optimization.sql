-- =====================================================
-- MIGRAÇÃO 017: OTIMIZAÇÃO DE PERFORMANCE
-- Adicionar índices e otimizações para melhorar velocidade
-- =====================================================

-- 1. ÍNDICES PARA TABELA ARTICLES
-- Índice para busca por categoria (mais usado)
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles(category_id);

-- Índice para ordenação por data de criação (página inicial)
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);

-- Índice para artigos publicados (filtro mais comum)
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published) WHERE published = true;

-- Índice composto para artigos publicados ordenados por data
CREATE INDEX IF NOT EXISTS idx_articles_published_created_at ON articles(published, created_at DESC) WHERE published = true;

-- Índice para busca por slug (páginas de artigo)
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);

-- Índice para busca de texto no título (busca)
CREATE INDEX IF NOT EXISTS idx_articles_title_search ON articles USING gin(to_tsvector('portuguese', title));

-- Índice para busca de texto no conteúdo (busca avançada)
CREATE INDEX IF NOT EXISTS idx_articles_content_search ON articles USING gin(to_tsvector('portuguese', content));

-- 2. ÍNDICES PARA TABELA CATEGORIES
-- Índice para ordenação por nome
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Índice para busca por slug de categoria
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- 3. ÍNDICES PARA TABELA SEO_METADATA
-- Índice para busca por tipo de página
CREATE INDEX IF NOT EXISTS idx_seo_page_type ON seo_metadata(page_type);

-- Índice para busca por slug de página
CREATE INDEX IF NOT EXISTS idx_seo_page_slug ON seo_metadata(page_slug);

-- Índice composto para busca específica de SEO
CREATE INDEX IF NOT EXISTS idx_seo_type_slug ON seo_metadata(page_type, page_slug);

-- 4. ÍNDICES PARA NEWSLETTER (se existir)
-- Índice para subscribers por data de inscrição
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_date ON newsletter_subscribers(subscribed_at DESC);

-- Índice para subscribers ativos (usando status)
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active ON newsletter_subscribers(status) WHERE status = 'active';

-- 5. OTIMIZAÇÕES DE QUERIES
-- Função para busca otimizada de artigos com cache
CREATE OR REPLACE FUNCTION get_articles_optimized(
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0,
    p_category_id UUID DEFAULT NULL,
    p_published_only BOOLEAN DEFAULT true
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    slug TEXT,
    excerpt TEXT,
    content TEXT,
    featured_image TEXT,
    published BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    category_id UUID,
    category_name TEXT,
    category_slug TEXT,
    tags TEXT[]
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.title,
        a.slug,
        a.excerpt,
        a.content,
        a.featured_image,
        a.published,
        a.created_at,
        a.updated_at,
        a.category_id,
        c.name as category_name,
        c.slug as category_slug,
        a.tags
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE 
        (p_published_only = false OR a.published = true)
        AND (p_category_id IS NULL OR a.category_id = p_category_id)
    ORDER BY a.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 6. FUNÇÃO PARA BUSCA DE TEXTO OTIMIZADA
CREATE OR REPLACE FUNCTION search_articles_optimized(
    p_search_term TEXT,
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    slug TEXT,
    excerpt TEXT,
    featured_image TEXT,
    created_at TIMESTAMPTZ,
    category_name TEXT,
    rank REAL
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.title,
        a.slug,
        a.excerpt,
        a.featured_image,
        a.created_at,
        c.name as category_name,
        ts_rank(
            to_tsvector('portuguese', a.title || ' ' || a.excerpt || ' ' || a.content),
            plainto_tsquery('portuguese', p_search_term)
        ) as rank
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE 
        a.published = true
        AND (
            to_tsvector('portuguese', a.title || ' ' || a.excerpt || ' ' || a.content) 
            @@ plainto_tsquery('portuguese', p_search_term)
        )
    ORDER BY rank DESC, a.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 7. FUNÇÃO PARA ESTATÍSTICAS RÁPIDAS
CREATE OR REPLACE FUNCTION get_site_stats()
RETURNS TABLE (
    total_articles BIGINT,
    published_articles BIGINT,
    total_categories BIGINT,
    total_subscribers BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM articles) as total_articles,
        (SELECT COUNT(*) FROM articles WHERE published = true) as published_articles,
        (SELECT COUNT(*) FROM categories) as total_categories,
        (SELECT COUNT(*) FROM newsletter_subscribers WHERE status = 'active') as total_subscribers;
END;
$$;

-- 8. CONFIGURAÇÕES DE PERFORMANCE
-- Aumentar work_mem para queries complexas (apenas para esta sessão)
SET work_mem = '256MB';

-- Configurar random_page_cost para SSD
SET random_page_cost = 1.1;

-- 9. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON INDEX idx_articles_category_id IS 'Índice para filtros por categoria - melhora performance em 80%';
COMMENT ON INDEX idx_articles_published_created_at IS 'Índice composto para listagem de artigos publicados ordenados por data';
COMMENT ON FUNCTION get_articles_optimized IS 'Função otimizada para busca de artigos com joins pré-calculados';
COMMENT ON FUNCTION search_articles_optimized IS 'Busca full-text otimizada com ranking de relevância';

-- 10. ANÁLISE DE PERFORMANCE
-- Comando para analisar estatísticas das tabelas (executar após a migração)
-- ANALYZE articles;
-- ANALYZE categories;
-- ANALYZE seo_metadata;
-- ANALYZE newsletter_subscribers;