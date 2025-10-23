-- Função get_article_metrics corrigida
CREATE OR REPLACE FUNCTION get_article_metrics(target_article_id UUID DEFAULT NULL)
RETURNS TABLE (
    article_id UUID,
    article_title TEXT,
    positive_feedback BIGINT,
    negative_feedback BIGINT,
    total_comments BIGINT,
    approval_rate NUMERIC,
    last_updated TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.title,
        COALESCE(f_pos.count, 0),
        COALESCE(f_neg.count, 0),
        COALESCE(c.count, 0),
        CASE 
            WHEN COALESCE(f_pos.count, 0) + COALESCE(f_neg.count, 0) = 0 THEN 0
            ELSE ROUND((COALESCE(f_pos.count, 0)::NUMERIC / (COALESCE(f_pos.count, 0) + COALESCE(f_neg.count, 0))) * 100, 1)
        END,
        GREATEST(
            COALESCE(f_pos.last_updated, '1970-01-01'::timestamp),
            COALESCE(f_neg.last_updated, '1970-01-01'::timestamp),
            COALESCE(c.last_updated, '1970-01-01'::timestamp)
        )
    FROM public.articles a
    LEFT JOIN (
        SELECT f1.article_id, COUNT(*) as count, MAX(f1.created_at) as last_updated
        FROM public.feedback f1
        WHERE f1.useful = true
        GROUP BY f1.article_id
    ) f_pos ON a.id = f_pos.article_id
    LEFT JOIN (
        SELECT f2.article_id, COUNT(*) as count, MAX(f2.created_at) as last_updated
        FROM public.feedback f2
        WHERE f2.useful = false
        GROUP BY f2.article_id
    ) f_neg ON a.id = f_neg.article_id
    LEFT JOIN (
        SELECT c1.article_id, COUNT(*) as count, MAX(c1.created_at) as last_updated
        FROM public.comments c1
        GROUP BY c1.article_id
    ) c ON a.id = c.article_id
    WHERE (target_article_id IS NULL OR a.id = target_article_id)
    ORDER BY 7 DESC NULLS LAST;
END;
$$;

-- Conceder permissões para as roles anon e authenticated
GRANT EXECUTE ON FUNCTION get_article_metrics(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_article_metrics(UUID) TO authenticated;