-- Script para zerar TODOS os feedbacks do banco de dados
-- Isso vai limpar completamente os dados de feedback

-- 1. Zerar contadores de feedback nos artigos
UPDATE articles 
SET 
    positive_feedback = 0,
    negative_feedback = 0,
    approval_rate = 0.0
WHERE published = true;