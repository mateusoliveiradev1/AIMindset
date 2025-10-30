-- Corrigir função get_article_metrics para usar a tabela 'feedbacks' (plural)
-- Esta migração resolve o problema de nome de tabela incorreto

CREATE OR REPLACE FUNCTION public.get_article_metrics(target_article_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    positive_count INTEGER := 0;
    negative_count INTEGER := 0;
    total_feedback INTEGER := 0;
    comments_count INTEGER := 0;
    likes_count INTEGER := 0;
    replies_count INTEGER := 0;
    approval_rate NUMERIC := 0;
    engagement_rate NUMERIC := 0;
BEGIN
    -- Contar feedbacks positivos (usando tabela 'feedbacks' plural)
    SELECT COUNT(*) INTO positive_count
    FROM public.feedbacks
    WHERE article_id = target_article_id AND type = 'positive';

    -- Contar feedbacks negativos (usando tabela 'feedbacks' plural)
    SELECT COUNT(*) INTO negative_count
    FROM public.feedbacks
    WHERE article_id = target_article_id AND type = 'negative';

    -- Total de feedbacks
    total_feedback := positive_count + negative_count;

    -- Contar comentários principais (não respostas)
    SELECT COUNT(*) INTO comments_count
    FROM public.comments
    WHERE article_id = target_article_id AND parent_id IS NULL;

    -- Contar total de curtidas nos comentários
    SELECT COALESCE(SUM(likes), 0) INTO likes_count
    FROM public.comments
    WHERE article_id = target_article_id;

    -- Contar respostas (comentários com parent_id)
    SELECT COUNT(*) INTO replies_count
    FROM public.comments
    WHERE article_id = target_article_id AND parent_id IS NOT NULL;

    -- Calcular taxa de aprovação
    IF total_feedback > 0 THEN
        approval_rate := ROUND((positive_count::NUMERIC / total_feedback::NUMERIC) * 100, 2);
    END IF;

    -- Calcular taxa de engajamento (comentários + curtidas + feedbacks)
    engagement_rate := comments_count + likes_count + total_feedback;

    -- Montar resultado JSON
    result := json_build_object(
        'positive_feedback', positive_count,
        'negative_feedback', negative_count,
        'total_comments', comments_count,
        'approval_rate', approval_rate,
        'total_likes', likes_count,
        'total_replies', replies_count,
        'engagement_rate', engagement_rate
    );

    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        -- Em caso de erro, retornar métricas zeradas
        RETURN json_build_object(
            'positive_feedback', 0,
            'negative_feedback', 0,
            'total_comments', 0,
            'approval_rate', 0,
            'total_likes', 0,
            'total_replies', 0,
            'engagement_rate', 0
        );
END;
$$;