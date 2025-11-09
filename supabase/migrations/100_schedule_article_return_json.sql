-- Migration: Make schedule_article return simple JSON to avoid record type mismatch

-- Drop current version to avoid conflicts
DROP FUNCTION IF EXISTS public.schedule_article(uuid, timestamptz, text, jsonb);

-- Recreate schedule_article returning jsonb
CREATE OR REPLACE FUNCTION public.schedule_article(
  article_id uuid,
  scheduled_date timestamptz,
  reason text DEFAULT 'Agendamento via interface',
  metadata jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
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
    RETURN jsonb_build_object('success', false, 'article_id', article_id, 'message', NULL, 'error', 'not_authenticated');
  END IF;

  -- Lock and fetch current article state
  SELECT * INTO v_old FROM articles WHERE id = schedule_article.article_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'article_id', article_id, 'message', NULL, 'error', 'article_not_found');
  END IF;

  -- Snap requested date to the minute
  v_scheduled_min := date_trunc('minute', scheduled_date);

  -- Server-side validations (minute precision)
  IF v_scheduled_min < date_trunc('minute', now() + interval '5 minutes') THEN
    RETURN jsonb_build_object('success', false, 'article_id', article_id, 'message', NULL, 'error', 'scheduled_date_too_soon');
  END IF;

  IF v_scheduled_min > date_trunc('minute', now() + interval '365 days') THEN
    RETURN jsonb_build_object('success', false, 'article_id', article_id, 'message', NULL, 'error', 'scheduled_date_too_far');
  END IF;

  v_action := CASE WHEN v_old.scheduling_status = 'scheduled' THEN 'reschedule' ELSE 'schedule' END;

  -- Update article scheduling fields
  UPDATE articles
     SET scheduled_for = v_scheduled_min,
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

  RETURN jsonb_build_object('success', true, 'article_id', v_updated.id, 'message', 'Artigo agendado com sucesso', 'error', NULL);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'article_id', article_id, 'message', NULL, 'error', SQLERRM);
END;
$func$;

GRANT EXECUTE ON FUNCTION public.schedule_article(uuid, timestamptz, text, jsonb) TO authenticated;