-- Criar tabela de comentários
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL CHECK (length(user_name) >= 2 AND length(user_name) <= 50),
    content TEXT NOT NULL CHECK (length(content) >= 10 AND length(content) <= 500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_comments_article_id ON public.comments(article_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);

-- Políticas RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read comments" ON public.comments 
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert comments" ON public.comments 
    FOR INSERT WITH CHECK (true);

-- Criar tabela de feedback
CREATE TABLE public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
    useful BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_feedback_article_id ON public.feedback(article_id);
CREATE INDEX idx_feedback_created_at ON public.feedback(created_at DESC);
CREATE INDEX idx_feedback_useful ON public.feedback(useful);

-- Políticas RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read feedback" ON public.feedback 
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert feedback" ON public.feedback 
    FOR INSERT WITH CHECK (true);

-- Função RPC para buscar métricas de artigos
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
        a.id as article_id,
        a.title as article_title,
        COALESCE(f_pos.count, 0) as positive_feedback,
        COALESCE(f_neg.count, 0) as negative_feedback,
        COALESCE(c.count, 0) as total_comments,
        CASE 
            WHEN COALESCE(f_pos.count, 0) + COALESCE(f_neg.count, 0) = 0 THEN 0
            ELSE ROUND((COALESCE(f_pos.count, 0)::NUMERIC / (COALESCE(f_pos.count, 0) + COALESCE(f_neg.count, 0))) * 100, 1)
        END as approval_rate,
        GREATEST(
            COALESCE(f_pos.last_updated, '1970-01-01'::timestamp),
            COALESCE(f_neg.last_updated, '1970-01-01'::timestamp),
            COALESCE(c.last_updated, '1970-01-01'::timestamp)
        ) as last_updated
    FROM public.articles a
    LEFT JOIN (
        SELECT article_id, COUNT(*) as count, MAX(created_at) as last_updated
        FROM public.feedback 
        WHERE useful = true
        GROUP BY article_id
    ) f_pos ON a.id = f_pos.article_id
    LEFT JOIN (
        SELECT article_id, COUNT(*) as count, MAX(created_at) as last_updated
        FROM public.feedback 
        WHERE useful = false
        GROUP BY article_id
    ) f_neg ON a.id = f_neg.article_id
    LEFT JOIN (
        SELECT article_id, COUNT(*) as count, MAX(created_at) as last_updated
        FROM public.comments
        GROUP BY article_id
    ) c ON a.id = c.article_id
    WHERE (target_article_id IS NULL OR a.id = target_article_id)
    ORDER BY last_updated DESC NULLS LAST;
END;
$$;

-- Função de limpeza (Opcional)
CREATE OR REPLACE FUNCTION cleanup_old_feedback()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Remove feedback mais antigo que 1 ano
    DELETE FROM public.feedback 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- Conceder permissões para as roles anon e authenticated
GRANT SELECT ON public.comments TO anon;
GRANT INSERT ON public.comments TO anon;
GRANT SELECT ON public.comments TO authenticated;
GRANT ALL PRIVILEGES ON public.comments TO authenticated;

GRANT SELECT ON public.feedback TO anon;
GRANT INSERT ON public.feedback TO anon;
GRANT SELECT ON public.feedback TO authenticated;
GRANT ALL PRIVILEGES ON public.feedback TO authenticated;

-- Conceder permissões para executar as funções RPC
GRANT EXECUTE ON FUNCTION get_article_metrics(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_article_metrics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_feedback() TO authenticated;