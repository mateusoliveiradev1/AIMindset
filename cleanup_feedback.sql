-- Script para limpar feedbacks e manter apenas 1 feedback positivo no artigo específico
-- Revolução na Educação: Tecnologias Emergentes Transformando o Aprendizado

-- 1. Primeiro, vamos identificar o artigo pelo título
SELECT id, title, slug, positive_feedback, negative_feedback, approval_rate 
FROM articles 
WHERE title ILIKE '%Revolução na Educação%' 
   OR title ILIKE '%Tecnologias Emergentes%'
   OR title ILIKE '%Transformando o Aprendizado%';

-- 2. Verificar feedbacks existentes
SELECT f.id, f.article_id, f.useful, f.created_at, a.title
FROM feedback f
JOIN articles a ON f.article_id = a.id
ORDER BY a.title, f.created_at;

-- 3. Limpar todos os feedbacks
DELETE FROM feedback;

-- 4. Inserir apenas 1 feedback positivo para o artigo específico
-- (Vamos usar o ID do artigo que encontrarmos na primeira query)
INSERT INTO feedback (article_id, useful, created_at)
SELECT id, true, now()
FROM articles 
WHERE title ILIKE '%Revolução na Educação%' 
   OR title ILIKE '%Tecnologias Emergentes%'
   OR title ILIKE '%Transformando o Aprendizado%'
LIMIT 1;

-- 5. Atualizar as métricas de todos os artigos
UPDATE articles SET 
    positive_feedback = 0,
    negative_feedback = 0,
    approval_rate = 0.0;

-- 6. Atualizar as métricas do artigo específico
UPDATE articles SET 
    positive_feedback = 1,
    negative_feedback = 0,
    approval_rate = 100.0
WHERE id IN (
    SELECT article_id FROM feedback WHERE useful = true
);

-- 7. Verificar resultado final
SELECT a.id, a.title, a.positive_feedback, a.negative_feedback, a.approval_rate,
       COUNT(f.id) as total_feedbacks,
       COUNT(CASE WHEN f.useful = true THEN 1 END) as positive_count,
       COUNT(CASE WHEN f.useful = false THEN 1 END) as negative_count
FROM articles a
LEFT JOIN feedback f ON a.id = f.article_id
GROUP BY a.id, a.title, a.positive_feedback, a.negative_feedback, a.approval_rate
ORDER BY a.title;