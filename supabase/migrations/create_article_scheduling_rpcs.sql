-- Migration: Create RPC functions for article scheduling

-- Ensure composite type for SchedulingResult
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scheduling_result') THEN
    CREATE TYPE public.scheduling_result AS (
      success boolean,
      article_id uuid,
      message text,
      error text
    );
  END IF;
END$$;

-- RPC: schedule_article
-- Drop existing function if signature exists to avoid return type conflict
DROP FUNCTION IF EXISTS public.schedule_article(uuid, timestamptz, text, jsonb);
CREATE OR REPLACE FUNCTION public.schedule_article(
  article_id uuid,
  scheduled_date timestamptz,
  reason text DEFAULT 'Agendamento via interface',
  metadata jsonb DEFAULT '{}'::jsonb
) RETURNS public.scheduling_result
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_old articles%ROWTYPE;
  v_updated articles%ROWTYPE;
  v_action text;
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RETURN (false, article_id, NULL, 'not_authenticated');
  END IF;

  -- Lock and fetch current article state
  SELECT * INTO v_old FROM articles WHERE id = schedule_article.article_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN (false, article_id, NULL, 'article_not_found');
  END IF;

  -- Server-side validations (mirror frontend)
  IF scheduled_date < now() + interval '5 minutes' THEN
    RETURN (false, article_id, NULL, 'scheduled_date_too_soon');
  END IF;

  IF scheduled_date > now() + interval '365 days' THEN
    RETURN (false, article_id, NULL, 'scheduled_date_too_far');
  END IF;

  v_action := CASE WHEN v_old.scheduling_status = 'scheduled' THEN 'reschedule' ELSE 'schedule' END;

  -- Update article scheduling fields
  UPDATE articles
     SET scheduled_for = scheduled_date,
         scheduled_by = auth.uid(),
         scheduling_reason = reason,
         scheduling_status = 'scheduled',
         updated_at = now()
   WHERE id = schedule_article.article_id
   RETURNING * INTO v_updated;

  -- Audit log
  INSERT INTO article_scheduling_logs(
    article_id, user_id, action,
    old_scheduled_for, new_scheduled_for,
    old_status, new_status, reason, metadata
  ) VALUES (
    v_updated.id, auth.uid(), v_action,
    v_old.scheduled_for, v_updated.scheduled_for,
    v_old.scheduling_status, v_updated.scheduling_status,
    reason, COALESCE(metadata, '{}'::jsonb)
  );

  RETURN (true, v_updated.id, 'Artigo agendado com sucesso', NULL);
EXCEPTION WHEN OTHERS THEN
  RETURN (false, article_id, NULL, SQLERRM);
END;
$func$;

GRANT EXECUTE ON FUNCTION public.schedule_article(uuid, timestamptz, text, jsonb) TO authenticated;

-- RPC: get_scheduled_articles
-- Ensure clean redeploy
DROP FUNCTION IF EXISTS public.get_scheduled_articles(text, integer, integer);
CREATE OR REPLACE FUNCTION public.get_scheduled_articles(
  filter_status text DEFAULT 'scheduled',
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
) RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  scheduled_for timestamptz,
  scheduled_by uuid,
  scheduling_reason text,
  scheduling_status varchar,
  author_name varchar,
  author_email varchar,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
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
    au.name AS author_name,
    au.email AS author_email,
    a.created_at
  FROM articles a
  LEFT JOIN admin_users au ON au.id = a.author_id
  WHERE (filter_status IS NULL OR a.scheduling_status = filter_status)
    AND a.scheduled_for IS NOT NULL
  ORDER BY a.scheduled_for ASC NULLS LAST, a.created_at DESC
  LIMIT COALESCE(limit_count, 50)
  OFFSET COALESCE(offset_count, 0);
END;
$func$;

GRANT EXECUTE ON FUNCTION public.get_scheduled_articles(text, integer, integer) TO authenticated;