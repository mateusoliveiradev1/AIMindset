-- Migration: Fix cron inspection RPCs types/casts to match result structure

-- Ensure pg_cron extension is available
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Fix get_cron_jobs: cast jobid to int and align return columns
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
  SELECT j.jobid::int AS id, j.schedule, j.command, j.active
    FROM cron.job j
   ORDER BY j.jobid ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix get_cron_runs: cast jobid to int and align return columns
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
         r.run_started,
         r.run_ended,
         r.return_message
    FROM cron.job_run_details r
   ORDER BY r.run_started DESC
   LIMIT COALESCE(get_cron_runs.limit_count, 20);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Permissions for authenticated users to inspect cron
REVOKE ALL ON FUNCTION public.get_cron_jobs() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_cron_runs(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cron_jobs() TO authenticated, service_role, postgres;
GRANT EXECUTE ON FUNCTION public.get_cron_runs(integer) TO authenticated, service_role, postgres;