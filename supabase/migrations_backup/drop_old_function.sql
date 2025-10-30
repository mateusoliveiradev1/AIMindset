-- Remover todas as versões antigas da função get_featured_articles
DROP FUNCTION IF EXISTS get_featured_articles();
DROP FUNCTION IF EXISTS get_featured_articles(integer);
DROP FUNCTION IF EXISTS get_featured_articles(limit_count integer);