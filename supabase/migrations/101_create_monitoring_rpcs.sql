-- Migration: Create monitoring RPCs (get_article_by_id, get_system_logs, get_cron_job_status)

-- get_article_by_id: return article as jsonb (or null)
DROP FUNCTION IF EXISTS public.get_article_by_id(uuid);
CREATE OR REPLACE FUNCTION public.get_article_by_id(article_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_article jsonb;
BEGIN
  SELECT to_jsonb(a) INTO v_article
    FROM public.articles a
   WHERE a.id = get_article_by_id.article_id;

  RETURN v_article; -- may be null if not found
END;
$$;

REVOKE ALL ON FUNCTION public.get_article_by_id(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_article_by_id(uuid) TO authenticated, service_role, postgres;

-- get_system_logs: filter and return logs as jsonb array
DROP FUNCTION IF EXISTS public.get_system_logs(text, integer, text);
CREATE OR REPLACE FUNCTION public.get_system_logs(
  level text DEFAULT NULL,
  limit_count integer DEFAULT 50,
  component text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_logs jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(to_jsonb(l) ORDER BY l.created_at DESC), '[]'::jsonb) INTO v_logs
    FROM public.system_logs l
   WHERE (level IS NULL OR l.level = level)
     AND (component IS NULL OR l.component = component)
   LIMIT COALESCE(limit_count, 50);

  RETURN v_logs;
END;
$$;

REVOKE ALL ON FUNCTION public.get_system_logs(text, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_system_logs(text, integer, text) TO authenticated, service_role, postgres;

-- get_cron_job_status: summary of pg_cron jobs
DROP FUNCTION IF EXISTS public.get_cron_job_status();
CREATE OR REPLACE FUNCTION public.get_cron_job_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_jobs jsonb;
  v_runs jsonb;
BEGIN
  -- jobs summary
  SELECT COALESCE(jsonb_agg(to_jsonb(j)), '[]'::jsonb) INTO v_jobs
    FROM (
      SELECT jobid, schedule, command, active
        FROM cron.job
       ORDER BY jobid ASC
    ) j;

  -- recent runs
  SELECT COALESCE(jsonb_agg(to_jsonb(r)), '[]'::jsonb) INTO v_runs
    FROM (
      SELECT jobid, status, run_started, run_ended, return_message
        FROM cron.job_run_details
       ORDER BY run_started DESC
       LIMIT 20
    ) r;

  RETURN jsonb_build_object('jobs', v_jobs, 'runs', v_runs);
END;
$$;

REVOKE ALL ON FUNCTION public.get_cron_job_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cron_job_status() TO service_role, postgres;