-- Migration: Add admin RPCs to introspect functions and reload PostgREST schema

-- RPC: get_function_info(fn_name)
DROP FUNCTION IF EXISTS public.get_function_info(text);
CREATE OR REPLACE FUNCTION public.get_function_info(fn_name text)
RETURNS TABLE (
  proname text,
  schema_name text,
  argnames text[],
  argtypes text,
  rettype text,
  volatility text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.proname,
    n.nspname AS schema_name,
    p.proargnames,
    pg_get_function_argument_types(p.oid) AS argtypes,
    pg_get_function_result(p.oid) AS rettype,
    CASE p.provolatile WHEN 'i' THEN 'immutable' WHEN 's' THEN 'stable' ELSE 'volatile' END AS volatility
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = fn_name;
END;
$$;

REVOKE ALL ON FUNCTION public.get_function_info(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_function_info(text) TO service_role, postgres;

-- RPC: refresh_postgrest_schema
DROP FUNCTION IF EXISTS public.refresh_postgrest_schema();
CREATE OR REPLACE FUNCTION public.refresh_postgrest_schema()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
  RETURN 'ok';
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_postgrest_schema() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_postgrest_schema() TO service_role, postgres;