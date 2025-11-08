-- Correção das funções RPC de agendamento para usar admin_users e JWT email
-- Ajusta as verificações de permissão e reduz dependência de auth.users.email

-- Atualizar schedule_article
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
      v_user_email TEXT;
      v_admin_id UUID;
      v_is_admin BOOLEAN;
      v_result JSON;
  BEGIN
      v_user_id := auth.uid();
      v_user_email := auth.jwt() ->> 'email';

      IF v_user_id IS NULL OR v_user_email IS NULL THEN
          RAISE EXCEPTION 'Usuário não autenticado';
      END IF;

      -- Verificar permissão via admin_users usando email do JWT
      SELECT EXISTS (
        SELECT 1 FROM public.admin_users au
        WHERE au.email = v_user_email
      ) INTO v_is_admin;

      -- Obter ID do admin correspondente ao email, se existir
      SELECT au.id INTO v_admin_id
      FROM public.admin_users au
      WHERE au.email = v_user_email
      LIMIT 1;

      -- Verificar se o artigo existe e o usuário tem permissão (autor ou admin)
      SELECT * INTO v_article 
      FROM public.articles 
      WHERE id = article_id 
      AND (
        author_id = v_admin_id 
        OR v_is_admin
      );

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

      -- Verificar conflitos
      IF EXISTS (
          SELECT 1 FROM public.articles 
          WHERE scheduled_for = scheduled_date 
          AND scheduling_status = 'scheduled' 
          AND id != article_id
      ) THEN
          RAISE EXCEPTION 'Já existe um artigo agendado para esta data/hora';
      END IF;

      -- Atualizar agendamento
      UPDATE public.articles 
      SET 
          scheduled_for = scheduled_date,
          scheduled_by = v_user_id,
          scheduling_reason = COALESCE(reason, 'Agendamento via API'),
          scheduling_status = 'scheduled',
          updated_at = NOW()
      WHERE id = article_id
      RETURNING * INTO v_article;

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

-- Atualizar cancel_scheduled_article
CREATE OR REPLACE FUNCTION public.cancel_scheduled_article(
      article_id UUID,
      reason TEXT DEFAULT NULL
  )
  RETURNS JSON AS $$
  DECLARE
      v_article RECORD;
      v_user_id UUID;
      v_user_email TEXT;
      v_admin_id UUID;
      v_is_admin BOOLEAN;
      v_result JSON;
  BEGIN
      v_user_id := auth.uid();
      v_user_email := auth.jwt() ->> 'email';

      IF v_user_id IS NULL OR v_user_email IS NULL THEN
          RAISE EXCEPTION 'Usuário não autenticado';
      END IF;

      SELECT EXISTS (
        SELECT 1 FROM public.admin_users au
        WHERE au.email = v_user_email
      ) INTO v_is_admin;

      SELECT au.id INTO v_admin_id
      FROM public.admin_users au
      WHERE au.email = v_user_email
      LIMIT 1;

      SELECT * INTO v_article 
      FROM public.articles 
      WHERE id = article_id 
      AND scheduling_status = 'scheduled'
      AND (
        author_id = v_admin_id OR v_is_admin
      );

      IF NOT FOUND THEN
          RAISE EXCEPTION 'Artigo não encontrado, não está agendado ou sem permissão';
      END IF;

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

-- Atualizar get_scheduled_articles
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
      v_user_email TEXT;
      v_is_admin BOOLEAN;
      v_admin_id UUID;
  BEGIN
      v_user_id := auth.uid();
      v_user_email := auth.jwt() ->> 'email';

      IF v_user_id IS NULL OR v_user_email IS NULL THEN
          RAISE EXCEPTION 'Usuário não autenticado';
      END IF;

      SELECT EXISTS (
        SELECT 1 FROM public.admin_users au
        WHERE au.email = v_user_email
      ) INTO v_is_admin;

      SELECT au.id INTO v_admin_id
      FROM public.admin_users au
      WHERE au.email = v_user_email
      LIMIT 1;

      RETURN QUERY
      SELECT 
          a.id,
          a.title,
          a.slug,
          a.scheduled_for,
          a.scheduled_by,
          a.scheduling_reason,
          a.scheduling_status,
          au.name as author_name,
          au.email as author_email,
          a.created_at
      FROM public.articles a
      LEFT JOIN public.admin_users au ON a.author_id = au.id
      WHERE 
          a.scheduling_status = COALESCE(filter_status, a.scheduling_status)
          AND (
            a.author_id = v_admin_id OR v_is_admin
          )
      ORDER BY a.scheduled_for ASC
      LIMIT limit_count
      OFFSET offset_count;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.schedule_article(UUID, TIMESTAMP WITH TIME ZONE, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_scheduled_article(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_scheduled_articles(TEXT, INTEGER, INTEGER) TO authenticated;