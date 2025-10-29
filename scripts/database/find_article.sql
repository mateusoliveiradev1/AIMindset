-- Buscar todos os artigos para encontrar o correto
SELECT id, title, slug, image_url, excerpt
FROM articles 
WHERE published = true
ORDER BY created_at DESC;