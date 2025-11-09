-- Migration: Fix schedule_article return type to stable TABLE to avoid record mismatch

-- Drop possible overloaded versions to prevent PostgREST confusion
DROP FUNCTION IF EXISTS public.schedule_article(uuid, timestamptz, text, jsonb);
DROP FUNCTION IF EXISTS public.schedule_article(uuid, timestamptz);

-- Recreate schedule_article returning TABLE (stable shape)
CREATE OR REPLACE FUNCTION public.schedule_article(
  p_article_id uuid,
  scheduled_date timestamptz,
  reason text DEFAULT 'Agendamento via interface',
  metadata jsonb DEFAULT '{}'::jsonb
) RETURNS TABLE (
  success boolean,
  article_id uuid,
  message text,
  error text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET timezone = 'UTC'
AS $func$
DECLARE
  v_old articles%ROWTYPE;
  v_updated articles%ROWTYPE;
  v_action text;
  v_scheduled_min timestamptz;
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT false, p_article_id, NULL::text, 'not_authenticated';
    RETURN;
  END IF;

  -- Lock and fetch current article state
  SELECT * INTO v_old FROM articles WHERE id = p_article_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, p_article_id, NULL::text, 'article_not_found';
    RETURN;
  END IF;

  -- Snap requested date to the minute
  v_scheduled_min := date_trunc('minute', scheduled_date);

  -- Server-side validations (minute precision)
  IF v_scheduled_min < date_trunc('minute', now() + interval '5 minutes') THEN
    RETURN QUERY SELECT false, p_article_id, NULL::text, 'scheduled_date_too_soon';
    RETURN;
  END IF;

  IF v_scheduled_min > date_trunc('minute', now() + interval '365 days') THEN
    RETURN QUERY SELECT false, p_article_id, NULL::text, 'scheduled_date_too_far';
    RETURN;
  END IF;

  v_action := CASE WHEN v_old.scheduling_status = 'scheduled' THEN 'reschedule' ELSE 'schedule' END;

  -- Update article scheduling fields
  UPDATE articles
     SET scheduled_for = v_scheduled_min,
         scheduled_by = auth.uid(),
         scheduling_reason = reason,
         scheduling_status = 'scheduled',
         updated_at = now()
   WHERE id = p_article_id
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

  RETURN QUERY SELECT true, v_updated.id, 'Artigo agendado com sucesso'::text, NULL::text;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, p_article_id, NULL::text, SQLERRM;
END;
$func$;

GRANT EXECUTE ON FUNCTION public.schedule_article(uuid, timestamptz, text, jsonb) TO authenticated;