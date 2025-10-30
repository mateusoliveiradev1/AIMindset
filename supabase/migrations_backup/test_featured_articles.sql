-- Teste da função get_featured_articles()
-- Este arquivo testa se a função está funcionando corretamente

-- 1. Verificar se a função existe
SELECT 
    routine_name, 
    routine_type, 
    data_type 
FROM information_schema.routines 
WHERE routine_name = 'get_featured_articles';

-- 2. Testar a função diretamente
SELECT * FROM get_featured_articles();

-- 3. Verificar dados dos artigos (para debug)
SELECT 
    id,
    title,
    excerpt,
    published,
    is_featured,
    created_at,
    total_views,
    positive_feedbacks,
    negative_feedbacks,
    comments_count,
    likes_count
FROM articles 
WHERE published = true
ORDER BY created_at DESC;

-- 4. Verificar artigos marcados como featured
SELECT 
    id,
    title,
    is_featured,
    published
FROM articles 
WHERE is_featured = true AND published = true;

-- 5. Testar o ranking automático (caso não haja artigos featured)
SELECT 
    id,
    title,
    total_views,
    positive_feedbacks,
    negative_feedbacks,
    comments_count,
    likes_count,
    -- Fórmula de ranking
    (
        COALESCE(total_views, 0) * 0.1 +
        COALESCE(positive_feedbacks, 0) * 2.0 +
        COALESCE(comments_count, 0) * 1.5 +
        COALESCE(likes_count, 0) * 1.0 -
        COALESCE(negative_feedbacks, 0) * 0.5
    ) as ranking_score
FROM articles 
WHERE published = true
ORDER BY ranking_score DESC
LIMIT 3;