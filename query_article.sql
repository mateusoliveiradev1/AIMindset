-- Buscar artigo sobre "O Futuro da Humanidade"
SELECT id, title, slug, image_url, excerpt
FROM articles 
WHERE title ILIKE '%Futuro da Humanidade%' 
   OR title ILIKE '%Tendências Tecnológicas%'
   OR title ILIKE '%Moldarão 2030%'
   OR slug ILIKE '%futuro%humanidade%'
   OR slug ILIKE '%tendencias%tecnologicas%'
ORDER BY created_at DESC;