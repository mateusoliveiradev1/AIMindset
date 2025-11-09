-- Migration: Create auto-publish function and schedule pg_cron job

-- Ensure pg_cron is available
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Publish due scheduled articles
DROP FUNCTION IF EXISTS public.publish_due_articles();
CREATE OR REPLACE FUNCTION public.publish_due_articles()
RETURNS integer
AS $$
DECLARE
  v_published_count integer := 0;
BEGIN
  -- Update due articles to published
  WITH due AS (
    SELECT a.id,
           a.scheduled_for,
           a.scheduling_status,
           a.published,
           a.scheduled_by
    FROM public.articles a
    WHERE a.scheduling_status = 'scheduled'
      AND a.scheduled_for IS NOT NULL
      AND a.scheduled_for <= now()
      AND COALESCE(a.published, false) = false
    FOR UPDATE SKIP LOCKED
  ), updated AS (
    UPDATE public.articles a
       SET published = true,
           scheduling_status = 'published',
           updated_at = now(),
           original_publish_date = COALESCE(a.original_publish_date, now())
      FROM due d
     WHERE a.id = d.id
     RETURNING a.*
  )
  INSERT INTO public.article_scheduling_logs(
    article_id,
    user_id,
    action,
    old_scheduled_for,
    new_scheduled_for,
    old_status,
    new_status,
    reason,
    metadata
  )
  SELECT
    u.id,
    COALESCE(u.scheduled_by, '00000000-0000-0000-0000-000000000000'::uuid),
    'publish',
    NULL,
    u.scheduled_for,
    'scheduled',
    'published',
    'Publicação automática por cron',
    '{}'::jsonb
  FROM updated u;

  GET DIAGNOSTICS v_published_count = ROW_COUNT;
  RETURN v_published_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Restrict RPC to service role only (avoid frontend misuse)
REVOKE ALL ON FUNCTION public.publish_due_articles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_due_articles() TO service_role;

-- Schedule pg_cron job (idempotent)
DO $$
DECLARE
  v_job_exists boolean := false;
  v_command text := $cmd$SELECT public.publish_due_articles()$cmd$;
BEGIN
  -- If a job already exists for this command, skip
  SELECT EXISTS (
    SELECT 1 FROM cron.job WHERE command = v_command
  ) INTO v_job_exists;

  IF NOT v_job_exists THEN
    PERFORM cron.schedule(
      'publish_due_articles_every_minute',
      '* * * * *',
      v_command
    );
  END IF;
END;
$$;