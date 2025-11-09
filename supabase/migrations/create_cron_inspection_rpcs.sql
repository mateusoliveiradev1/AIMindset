-- Migration: Create RPCs to inspect pg_cron jobs and runs, and fix permissions

-- Ensure pg_cron extension exists
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant execute to postgres for publish_due_articles so cron can run it
GRANT EXECUTE ON FUNCTION public.publish_due_articles() TO postgres;

-- RPC: get_cron_jobs
DROP FUNCTION IF EXISTS public.get_cron_jobs();
CREATE OR REPLACE FUNCTION public.get_cron_jobs()
RETURNS TABLE (
  id int,
  schedule text,
  command text,
  active boolean
)
AS $$
BEGIN
  RETURN QUERY
  SELECT j.jobid, j.schedule, j.command, j.active FROM cron.job j;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: get_cron_runs
DROP FUNCTION IF EXISTS public.get_cron_runs(integer);
CREATE OR REPLACE FUNCTION public.get_cron_runs(limit_count integer DEFAULT 20)
RETURNS TABLE (
  jobid int,
  status text,
  run_started timestamptz,
  run_ended timestamptz,
  return_message text
)
AS $$
BEGIN
  RETURN QUERY
  SELECT r.jobid, r.status, r.run_started, r.run_ended, r.return_message
    FROM cron.job_run_details r
    ORDER BY r.run_started DESC
    LIMIT COALESCE(limit_count, 20);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Restrict to service role for now
REVOKE ALL ON FUNCTION public.get_cron_jobs() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_cron_runs(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cron_jobs() TO service_role, postgres;
GRANT EXECUTE ON FUNCTION public.get_cron_runs(integer) TO service_role, postgres;

-- Ensure the job is active
DO $$
DECLARE
  v_job_id int;
  v_active boolean;
  v_command text := 'SELECT public.publish_due_articles()';
BEGIN
  SELECT jobid, active INTO v_job_id, v_active FROM cron.job WHERE command = v_command LIMIT 1;
  IF v_job_id IS NOT NULL AND v_active IS FALSE THEN
    PERFORM cron.alter_job(v_job_id, active := TRUE);
  END IF;
END;
$$;