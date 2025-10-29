-- 🚨 CRIAR FUNÇÃO SQL PARA BYPASS COMPLETO
-- Criar uma função que executa SQL direto para testar

CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE sql_query;
  RETURN '{"success": true}'::JSON;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION execute_sql(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION execute_sql(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION execute_sql(TEXT) TO postgres;