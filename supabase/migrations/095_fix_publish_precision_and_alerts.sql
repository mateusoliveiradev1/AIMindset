-- Migration: Improve publish precision to exact minute (UTC) and add overdue alerts

-- Ensure pg_cron is available
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Recreate publish_due_articles with minute precision and UTC timezone
DROP FUNCTION IF EXISTS public.publish_due_articles();
CREATE OR REPLACE FUNCTION public.publish_due_articles()
RETURNS integer
AS $$
DECLARE
  v_published_count integer := 0;
  v_now_min timestamptz := date_trunc('minute', now());
BEGIN
  -- Update due articles to published, considering exact minute
  WITH due AS (
    SELECT a.id,
           a.scheduled_for,
           a.scheduling_status,
           a.published,
           a.scheduled_by
    FROM public.articles a
    WHERE a.scheduling_status = 'scheduled'
      AND a.scheduled_for IS NOT NULL
      AND a.scheduled_for <= v_now_min
      AND COALESCE(a.published, false) = false
    FOR UPDATE SKIP LOCKED
  ), updated AS (
    UPDATE public.articles a
       SET published = true,
           scheduling_status = 'published',
           updated_at = v_now_min,
           original_publish_date = COALESCE(a.original_publish_date, v_now_min)
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
    jsonb_build_object('published_at', v_now_min)
  FROM updated u;

  GET DIAGNOSTICS v_published_count = ROW_COUNT;
  RETURN v_published_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
SET timezone = 'UTC';

-- Restrict RPC to service role only (avoid frontend misuse)
REVOKE ALL ON FUNCTION public.publish_due_articles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_due_articles() TO service_role, postgres;

-- Adjust schedule_article to snap to minute and UTC timezone
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
    RETURN (false, article_id, NULL, 'not_authenticated');
  END IF;

  -- Lock and fetch current article state
  SELECT * INTO v_old FROM articles WHERE id = schedule_article.article_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN (false, article_id, NULL, 'article_not_found');
  END IF;

  -- Snap requested date to the minute
  v_scheduled_min := date_trunc('minute', scheduled_date);

  -- Server-side validations (mirror frontend) using minute precision
  IF v_scheduled_min < date_trunc('minute', now() + interval '5 minutes') THEN
    RETURN (false, article_id, NULL, 'scheduled_date_too_soon');
  END IF;

  IF v_scheduled_min > date_trunc('minute', now() + interval '365 days') THEN
    RETURN (false, article_id, NULL, 'scheduled_date_too_far');
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

  RETURN (true, v_updated.id, 'Artigo agendado com sucesso', NULL);
EXCEPTION WHEN OTHERS THEN
  RETURN (false, article_id, NULL, SQLERRM);
END;
$func$;

GRANT EXECUTE ON FUNCTION public.schedule_article(uuid, timestamptz, text, jsonb) TO authenticated;

-- Create overdue alert function: log articles >5 minutes late
DROP FUNCTION IF EXISTS public.alert_overdue_publications();
CREATE OR REPLACE FUNCTION public.alert_overdue_publications()
RETURNS integer
AS $$
DECLARE
  v_count integer := 0;
  v_now timestamptz := now();
BEGIN
  WITH overdue AS (
    SELECT a.id, a.scheduled_for
      FROM public.articles a
     WHERE a.scheduling_status = 'scheduled'
       AND COALESCE(a.published, false) = false
       AND a.scheduled_for IS NOT NULL
       AND a.scheduled_for <= v_now - interval '5 minutes'
  ), ins AS (
    INSERT INTO public.article_scheduling_logs(
      article_id, user_id, action,
      old_scheduled_for, new_scheduled_for,
      old_status, new_status, reason, metadata
    )
    SELECT o.id,
           '00000000-0000-0000-0000-000000000000'::uuid,
           'overdue_alert',
           NULL,
           o.scheduled_for,
           'scheduled',
           'scheduled',
           'Atraso na publicação automática (>5 minutos)',
           jsonb_build_object('checked_at', v_now,
                              'delay_minutes', EXTRACT(EPOCH FROM (v_now - o.scheduled_for)) / 60.0)
      FROM overdue o
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_count FROM ins;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
SET timezone = 'UTC';

REVOKE ALL ON FUNCTION public.alert_overdue_publications() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.alert_overdue_publications() TO service_role, postgres;

-- Ensure cron jobs are scheduled correctly and active
DO $$
DECLARE
  v_publish_command text := 'SELECT public.publish_due_articles()';
  v_alert_command text := 'SELECT public.alert_overdue_publications()';
  v_publish_job int;
  v_alert_job int;
BEGIN
  -- Publish job every minute
  SELECT jobid INTO v_publish_job FROM cron.job WHERE command = v_publish_command LIMIT 1;
  IF v_publish_job IS NULL THEN
    PERFORM cron.schedule('publish_due_articles_every_minute', '* * * * *', v_publish_command);
  ELSE
    -- Ensure schedule and activation
    PERFORM cron.alter_job(v_publish_job, schedule := '* * * * *', active := TRUE);
  END IF;

  -- Alert job every 5 minutes
  SELECT jobid INTO v_alert_job FROM cron.job WHERE command = v_alert_command LIMIT 1;
  IF v_alert_job IS NULL THEN
    PERFORM cron.schedule('alert_overdue_publications_every_5_minutes', '*/5 * * * *', v_alert_command);
  ELSE
    PERFORM cron.alter_job(v_alert_job, schedule := '*/5 * * * *', active := TRUE);
  END IF;
END;
$$;