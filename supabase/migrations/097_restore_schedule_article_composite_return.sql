-- Migration: Restore schedule_article to return composite type (single object)

-- Ensure type exists
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

-- Drop current TABLE-returning version to avoid overload conflicts
DROP FUNCTION IF EXISTS public.schedule_article(uuid, timestamptz, text, jsonb);

-- Recreate function returning composite type
CREATE OR REPLACE FUNCTION public.schedule_article(
  p_article_id uuid,
  scheduled_date timestamptz,
  reason text DEFAULT 'Agendamento via interface',
  metadata jsonb DEFAULT '{}'::jsonb
) RETURNS public.scheduling_result
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
    RETURN (false, p_article_id, NULL, 'not_authenticated');
  END IF;

  -- Lock and fetch current article state
  SELECT * INTO v_old FROM articles WHERE id = p_article_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN (false, p_article_id, NULL, 'article_not_found');
  END IF;

  -- Snap requested date to the minute
  v_scheduled_min := date_trunc('minute', scheduled_date);

  -- Server-side validations (minute precision)
  IF v_scheduled_min < date_trunc('minute', now() + interval '5 minutes') THEN
    RETURN (false, p_article_id, NULL, 'scheduled_date_too_soon');
  END IF;

  IF v_scheduled_min > date_trunc('minute', now() + interval '365 days') THEN
    RETURN (false, p_article_id, NULL, 'scheduled_date_too_far');
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

  RETURN (true, v_updated.id, 'Artigo agendado com sucesso', NULL);
EXCEPTION WHEN OTHERS THEN
  RETURN (false, p_article_id, NULL, SQLERRM);
END;
$func$;

GRANT EXECUTE ON FUNCTION public.schedule_article(uuid, timestamptz, text, jsonb) TO authenticated;