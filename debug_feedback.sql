-- Query para verificar os feedbacks dos artigos IA Generativa e Computação Quântica
SELECT 
    title,
    positive_feedback,
    negative_feedback,
    (positive_feedback + negative_feedback) as total_feedback,
    approval_rate,
    created_at
FROM articles 
WHERE title ILIKE '%IA%generativa%' OR title ILIKE '%computação%quântica%' OR title ILIKE '%quantum%'
ORDER BY (positive_feedback + negative_feedback) DESC, approval_rate DESC, created_at DESC;

-- Query para ver todos os artigos ordenados por feedback total
SELECT 
    title,
    positive_feedback,
    negative_feedback,
    (positive_feedback + negative_feedback) as total_feedback,
    approval_rate,
    created_at
FROM articles 
WHERE published = true
ORDER BY (positive_feedback + negative_feedback) DESC, approval_rate DESC, created_at DESC
LIMIT 10;