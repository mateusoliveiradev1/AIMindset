-- Migration: Enhance get_cron_runs to include jobname and job_id alias
-- Also add get_cron_runs_by_job(job_id, limit_count) for direct filtering

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Replace get_cron_runs to include jobname and job_id alias
DROP FUNCTION IF EXISTS public.get_cron_runs(integer);
CREATE OR REPLACE FUNCTION public.get_cron_runs(limit_count integer DEFAULT 20)
RETURNS TABLE (
  jobid int,
  job_id int,
  jobname text,
  status text,
  run_started timestamptz,
  run_ended timestamptz,
  return_message text
)
AS $$
BEGIN
  RETURN QUERY
  SELECT r.jobid::int AS jobid,
         r.jobid::int AS job_id,
         j.jobname::text AS jobname,
         r.status::text AS status,
         r.start_time AS run_started,
         r.end_time AS run_ended,
         r.return_message
    FROM cron.job_run_details r
    LEFT JOIN cron.job j ON j.jobid = r.jobid
   ORDER BY r.start_time DESC
   LIMIT COALESCE(get_cron_runs.limit_count, 20);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.get_cron_runs(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cron_runs(integer) TO authenticated, service_role, postgres;

-- New helper RPC: get_cron_runs_by_job
DROP FUNCTION IF EXISTS public.get_cron_runs_by_job(integer, integer);
CREATE OR REPLACE FUNCTION public.get_cron_runs_by_job(target_job_id integer, limit_count integer DEFAULT 20)
RETURNS TABLE (
  jobid int,
  job_id int,
  jobname text,
  status text,
  run_started timestamptz,
  run_ended timestamptz,
  return_message text
)
AS $$
BEGIN
  RETURN QUERY
  SELECT r.jobid::int AS jobid,
         r.jobid::int AS job_id,
         j.jobname::text AS jobname,
         r.status::text AS status,
         r.start_time AS run_started,
         r.end_time AS run_ended,
         r.return_message
    FROM cron.job_run_details r
    LEFT JOIN cron.job j ON j.jobid = r.jobid
   WHERE r.jobid = get_cron_runs_by_job.target_job_id
   ORDER BY r.start_time DESC
   LIMIT COALESCE(get_cron_runs_by_job.limit_count, 20);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.get_cron_runs_by_job(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cron_runs_by_job(integer, integer) TO authenticated, service_role, postgres;