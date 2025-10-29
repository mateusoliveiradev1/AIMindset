-- =====================================================
-- SCRIPT EMERGENCIAL: ZERAR TUDO DO BANCO DE DADOS
-- =====================================================
-- Este script vai DELETAR TODOS os feedbacks e comentários
-- e ZERAR todos os contadores na tabela articles

-- 1. DELETAR TODOS OS FEEDBACKS
DELETE FROM feedbacks;
DELETE FROM feedback; -- Caso ainda exista a tabela antiga

-- 2. DELETAR TODOS OS COMENTÁRIOS  
DELETE FROM comments;

-- 3. ZERAR TODOS OS CONTADORES NA TABELA ARTICLES
UPDATE articles SET 
  positive_feedbacks = 0,
  negative_feedbacks = 0,
  comments_count = 0,
  likes_count = 0,
  total_views = COALESCE(total_views, 0) -- Manter views se existir
WHERE true;

-- 4. VERIFICAR SE LIMPEZA FOI FEITA
SELECT 'FEEDBACKS RESTANTES:' as status, COUNT(*) as count FROM feedbacks
UNION ALL
SELECT 'COMENTÁRIOS RESTANTES:' as status, COUNT(*) as count FROM comments
UNION ALL
SELECT 'ARTIGOS COM CONTADORES ZERADOS:' as status, COUNT(*) as count 
FROM articles 
WHERE positive_feedbacks = 0 AND negative_feedbacks = 0 AND comments_count = 0 AND likes_count = 0;

-- 5. MOSTRAR ESTADO FINAL DOS ARTIGOS
SELECT 
  id,
  title,
  positive_feedbacks,
  negative_feedbacks,
  comments_count,
  likes_count
FROM articles 
WHERE published = true
ORDER BY created_at DESC
LIMIT 10;