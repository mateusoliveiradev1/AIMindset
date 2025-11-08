-- Função RPC para agendamento de artigos com validações
CREATE OR REPLACE FUNCTION public.schedule_article(
    article_id UUID,
    scheduled_date TIMESTAMP WITH TIME ZONE,
    reason TEXT DEFAULT NULL,
    metadata JSONB DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
    v_article RECORD;
    v_user_id UUID;
    v_result JSON;
BEGIN
    -- Obter ID do usuário autenticado
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Verificar se o artigo existe e o usuário tem permissão
    SELECT * INTO v_article 
    FROM public.articles 
    WHERE id = article_id 
    AND (author_id = v_user_id OR EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = v_user_id 
        AND email IN (SELECT email FROM auth.users WHERE role = 'admin')
    ));

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Artigo não encontrado ou sem permissão';
    END IF;

    -- Validações de data
    IF scheduled_date < NOW() + INTERVAL '5 minutes' THEN
        RAISE EXCEPTION 'A data de agendamento deve ser pelo menos 5 minutos no futuro';
    END IF;

    IF scheduled_date > NOW() + INTERVAL '1 year' THEN
        RAISE EXCEPTION 'A data de agendamento não pode ser mais de 1 ano no futuro';
    END IF;

    -- Verificar se já existe agendamento para a mesma data/hora
    IF EXISTS (
        SELECT 1 FROM public.articles 
        WHERE scheduled_for = scheduled_date 
        AND scheduling_status = 'scheduled' 
        AND id != article_id
    ) THEN
        RAISE EXCEPTION 'Já existe um artigo agendado para esta data/hora';
    END IF;

    -- Atualizar o artigo com as informações de agendamento
    UPDATE public.articles 
    SET 
        scheduled_for = scheduled_date,
        scheduled_by = v_user_id,
        scheduling_reason = COALESCE(reason, 'Agendamento via API'),
        scheduling_status = 'scheduled',
        original_publish_date = CASE 
            WHEN original_publish_date IS NULL AND published_at IS NOT NULL 
            THEN published_at 
            ELSE original_publish_date 
        END,
        updated_at = NOW()
    WHERE id = article_id
    RETURNING * INTO v_article;

    -- Retornar resultado com sucesso
    v_result := json_build_object(
        'success', true,
        'article_id', v_article.id,
        'scheduled_for', v_article.scheduled_for,
        'scheduling_status', v_article.scheduling_status,
        'message', 'Artigo agendado com sucesso'
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.schedule_article(UUID, TIMESTAMP WITH TIME ZONE, TEXT, JSONB) TO authenticated;

-- Função para cancelar agendamento
CREATE OR REPLACE FUNCTION public.cancel_scheduled_article(
    article_id UUID,
    reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_article RECORD;
    v_user_id UUID;
    v_result JSON;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Verificar se o artigo existe e está agendado
    SELECT * INTO v_article 
    FROM public.articles 
    WHERE id = article_id 
    AND scheduling_status = 'scheduled'
    AND (author_id = v_user_id OR EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = v_user_id 
        AND email IN (SELECT email FROM auth.users WHERE role = 'admin')
    ));

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Artigo não encontrado, não está agendado ou sem permissão';
    END IF;

    -- Cancelar o agendamento
    UPDATE public.articles 
    SET 
        scheduling_status = 'cancelled',
        scheduling_reason = COALESCE(reason, 'Agendamento cancelado via API'),
        scheduled_for = NULL,
        scheduled_by = v_user_id,
        updated_at = NOW()
    WHERE id = article_id
    RETURNING * INTO v_article;

    v_result := json_build_object(
        'success', true,
        'article_id', v_article.id,
        'scheduling_status', v_article.scheduling_status,
        'message', 'Agendamento cancelado com sucesso'
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.cancel_scheduled_article(UUID, TEXT) TO authenticated;

-- Função para listar artigos agendados (admin e autor)
CREATE OR REPLACE FUNCTION public.get_scheduled_articles(
    filter_status TEXT DEFAULT 'scheduled',
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    slug VARCHAR,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    scheduled_by UUID,
    scheduling_reason TEXT,
    scheduling_status VARCHAR,
    author_name VARCHAR,
    author_email VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    RETURN QUERY
    SELECT 
        a.id,
        a.title,
        a.slug,
        a.scheduled_for,
        a.scheduled_by,
        a.scheduling_reason,
        a.scheduling_status,
        u.name as author_name,
        u.email as author_email,
        a.created_at
    FROM public.articles a
    JOIN auth.users u ON a.author_id = u.id
    WHERE 
        a.scheduling_status = COALESCE(filter_status, a.scheduling_status)
        AND (
            a.author_id = v_user_id 
            OR EXISTS (
                SELECT 1 FROM auth.users 
                WHERE id = v_user_id 
                AND email IN (SELECT email FROM auth.users WHERE role = 'admin')
            )
        )
    ORDER BY a.scheduled_for ASC
    LIMIT limit_count
    OFFSET offset_count;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_scheduled_articles(TEXT, INTEGER, INTEGER) TO authenticated;