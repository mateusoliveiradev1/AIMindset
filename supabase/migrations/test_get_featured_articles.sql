-- Teste da função get_featured_articles()
-- Este arquivo testa se a função está retornando os dados corretos

-- Primeiro, vamos verificar se há artigos na tabela
SELECT 
    id,
    title,
    is_featured,
    created_at,
    total_views,
    total_likes,
    comments_count,
    published
FROM articles 
WHERE published = true 
ORDER BY created_at DESC;

-- Agora vamos testar a função get_featured_articles()
SELECT * FROM get_featured_articles();

-- Vamos também verificar quantos artigos temos no total
SELECT 
    COUNT(*) as total_articles,
    COUNT(CASE WHEN is_featured = true THEN 1 END) as featured_articles,
    COUNT(CASE WHEN published = true THEN 1 END) as published_articles
FROM articles;