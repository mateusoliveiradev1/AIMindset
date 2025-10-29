-- Teste da função get_featured_articles() após correção
-- Verificar se a ordenação por score está funcionando

-- 1. Testar a função com limite padrão (3)
SELECT 
    title,
    positive_feedbacks,
    negative_feedbacks,
    comments_count,
    likes_count,
    rank_score,
    is_featured,
    created_at
FROM get_featured_articles()
ORDER BY rank_score DESC, created_at DESC;

-- 2. Verificar todos os artigos is_featured ordenados por score
SELECT 
    title,
    positive_feedbacks,
    negative_feedbacks,
    comments_count,
    likes_count,
    (positive_feedbacks * 3 + comments_count * 2 + likes_count) AS calculated_score,
    is_featured,
    created_at
FROM articles 
WHERE published = true AND is_featured = true
ORDER BY (positive_feedbacks * 3 + comments_count * 2 + likes_count) DESC, created_at DESC;