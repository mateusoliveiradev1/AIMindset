-- RESET COMPLETO DE TODOS OS FEEDBACKS - VERSÃO FINAL CORRIGIDA
-- Este script vai zerar TUDO relacionado a feedbacks

-- 1. Limpar COMPLETAMENTE a tabela feedback
TRUNCATE TABLE feedback RESTART IDENTITY CASCADE;

-- 2. Zerar TODOS os contadores de feedback nos artigos
UPDATE articles 
SET 
  positive_feedback = 0,
  negative_feedback = 0,
  approval_rate = 0.0
WHERE 1=1;

-- 3. Verificar se os dados foram zerados
SELECT 'Tabela feedback limpa' as status, COUNT(*) as total_feedbacks FROM feedback;
SELECT 'Contadores zerados' as status, 
       SUM(positive_feedback) as total_positive,
       SUM(negative_feedback) as total_negative,
       AVG(approval_rate) as avg_approval_rate
FROM articles;