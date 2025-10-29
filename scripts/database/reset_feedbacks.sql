-- Script para zerar TODOS os feedbacks do banco de dados
-- Isso vai limpar completamente os dados de feedback

-- 1. Zerar contadores de feedback nos artigos
UPDATE articles 
SET 
    positive_feedback = 0,
    negative_feedback = 0,
    approval_rate = 0.0
WHERE published = true;

-- 2. Limpar tabela de feedbacks (se existir)
DELETE FROM article_feedback;

-- 3. Verificar se os dados foram zerados
SELECT 
    title,
    positive_feedback,
    negative_feedback,
    (positive_feedback + negative_feedback) as total_feedback,
    approval_rate
FROM articles 
WHERE published = true
ORDER BY title;