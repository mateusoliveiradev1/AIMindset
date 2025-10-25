-- Migração para otimizar performance do banco de dados
-- Adiciona índices estratégicos para melhorar velocidade das queries

-- 1. ÍNDICES PARA TABELA ARTICLES (mais consultada)
-- Índice composto para busca de artigos publicados por categoria
CREATE INDEX IF NOT EXISTS idx_articles_published_category 
ON articles (published, category_id) 
WHERE published = true;

-- Índice para busca por slug (usado em URLs)
CREATE INDEX IF NOT EXISTS idx_articles_slug 
ON articles (slug) 
WHERE published = true;

-- Índice para ordenação por data de criação (artigos recentes)
CREATE INDEX IF NOT EXISTS idx_articles_created_at 
ON articles (created_at DESC) 
WHERE published = true;

-- Índice para busca full-text no título e excerpt
CREATE INDEX IF NOT EXISTS idx_articles_search 
ON articles USING gin(to_tsvector('portuguese', title || ' ' || excerpt)) 
WHERE published = true;

-- Índice para tags (busca por tags específicas)
CREATE INDEX IF NOT EXISTS idx_articles_tags 
ON articles USING gin(to_tsvector('portuguese', tags)) 
WHERE published = true AND tags IS NOT NULL;

-- 2. ÍNDICES PARA TABELA CATEGORIES
-- Índice para busca por slug de categoria
CREATE INDEX IF NOT EXISTS idx_categories_slug 
ON categories (slug);

-- 3. ÍNDICES PARA TABELA SEO_METADATA (cache de SEO)
-- Índice composto para busca rápida de metadados SEO
CREATE INDEX IF NOT EXISTS idx_seo_metadata_lookup 
ON seo_metadata (page_type, page_slug);

-- 4. OTIMIZAÇÕES DE PERFORMANCE
-- Atualizar estatísticas das tabelas para melhor planejamento de queries
ANALYZE articles;
ANALYZE categories;
ANALYZE seo_metadata;

-- 5. CONFIGURAÇÕES DE PERFORMANCE
-- Aumentar work_mem temporariamente para esta sessão
SET work_mem = '256MB';

-- 6. VACUUM FULL para reorganizar tabelas (apenas se necessário)
-- VACUUM FULL articles;
-- VACUUM FULL categories;
-- VACUUM FULL seo_metadata;

-- Comentários sobre os índices criados:
-- 
-- idx_articles_published_category: Acelera queries que buscam artigos publicados de uma categoria específica
-- idx_articles_slug: Acelera carregamento de artigos individuais via URL
-- idx_articles_created_at: Acelera listagem de artigos ordenados por data (mais recentes primeiro)
-- idx_articles_search: Permite busca full-text rápida no título e excerpt
-- idx_articles_tags: Acelera busca por tags específicas
-- idx_categories_slug: Acelera carregamento de páginas de categoria
-- idx_seo_metadata_lookup: Acelera carregamento de metadados SEO para qualquer página
--
-- Estes índices foram projetados para otimizar as queries mais comuns do AIMindset:
-- 1. Listagem de artigos por categoria
-- 2. Carregamento de artigo individual
-- 3. Busca de artigos
-- 4. Carregamento de metadados SEO
-- 5. Navegação por categorias