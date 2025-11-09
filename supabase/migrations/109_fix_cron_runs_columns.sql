-- Migration: Use correct column names (start_time/end_time) in get_cron_runs

CREATE EXTENSION IF NOT EXISTS pg_cron;

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
  SELECT r.jobid::int AS jobid,
         r.status::text AS status,
         r.start_time AS run_started,
         r.end_time AS run_ended,
         r.return_message
    FROM cron.job_run_details r
   ORDER BY r.start_time DESC
   LIMIT COALESCE(get_cron_runs.limit_count, 20);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.get_cron_runs(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cron_runs(integer) TO authenticated, service_role, postgres;