-- Script para limpar todos os dados de feedback e comentários
-- Executado após exclusão de todos os artigos
-- Data: 2024

-- Início da transação para garantir atomicidade
BEGIN;

-- Limpar tabela de feedback
-- Esta tabela contém avaliações de utilidade dos artigos (útil/não útil)
DELETE FROM public.feedback;

-- Limpar tabela de comentários
-- Esta tabela contém comentários dos usuários nos artigos
DELETE FROM public.comments;

-- Verificar se as tabelas estão vazias
DO $$
DECLARE
    feedback_count INTEGER;
    comments_count INTEGER;
BEGIN
    -- Contar registros restantes
    SELECT COUNT(*) INTO feedback_count FROM public.feedback;
    SELECT COUNT(*) INTO comments_count FROM public.comments;
    
    -- Log dos resultados
    RAISE NOTICE 'Registros restantes na tabela feedback: %', feedback_count;
    RAISE NOTICE 'Registros restantes na tabela comments: %', comments_count;
    
    -- Verificar se a limpeza foi bem-sucedida
    IF feedback_count = 0 AND comments_count = 0 THEN
        RAISE NOTICE 'SUCESSO: Todas as tabelas de feedback foram limpas com sucesso!';
    ELSE
        RAISE EXCEPTION 'ERRO: Ainda existem registros nas tabelas. Limpeza falhou.';
    END IF;
END $$;

-- Confirmar transação
COMMIT;

-- Log final
SELECT 
    'feedback' as tabela,
    COUNT(*) as registros_restantes
FROM public.feedback
UNION ALL
SELECT 
    'comments' as tabela,
    COUNT(*) as registros_restantes
FROM public.comments;