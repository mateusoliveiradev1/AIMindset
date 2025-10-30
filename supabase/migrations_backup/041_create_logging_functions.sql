-- Criar funções RPC para logging
-- Essas funções permitem inserir logs de forma segura através do frontend

-- Função para inserir logs de aplicação
CREATE OR REPLACE FUNCTION insert_app_log(
  p_level text,
  p_source text,
  p_action text,
  p_details jsonb DEFAULT NULL,
  p_user_id text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO app_logs (level, source, action, details, user_id)
  VALUES (p_level, p_source, p_action, p_details, p_user_id);
END;
$$;

-- Função para inserir logs de sistema
CREATE OR REPLACE FUNCTION insert_system_log(
  p_type text,
  p_message text,
  p_context jsonb DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO system_logs (type, message, context)
  VALUES (p_type, p_message, p_context);
END;
$$;

-- Função para inserir logs de backend (manual)
CREATE OR REPLACE FUNCTION insert_backend_log(
  p_table_name text,
  p_action text,
  p_record_id uuid DEFAULT NULL,
  p_old_data jsonb DEFAULT NULL,
  p_new_data jsonb DEFAULT NULL,
  p_performed_by text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO backend_logs (table_name, action, record_id, old_data, new_data, performed_by)
  VALUES (p_table_name, p_action, p_record_id, p_old_data, p_new_data, p_performed_by);
END;
$$;

-- Função para obter estatísticas de logs
CREATE OR REPLACE FUNCTION get_logs_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  app_count integer;
  system_count integer;
  backend_count integer;
  result jsonb;
BEGIN
  -- Contar logs de aplicação
  SELECT COUNT(*) INTO app_count FROM app_logs;
  
  -- Contar logs de sistema
  SELECT COUNT(*) INTO system_count FROM system_logs;
  
  -- Contar logs de backend
  SELECT COUNT(*) INTO backend_count FROM backend_logs;
  
  -- Montar resultado
  result := jsonb_build_object(
    'app_logs', app_count,
    'system_logs', system_count,
    'backend_logs', backend_count,
    'total', app_count + system_count + backend_count,
    'last_updated', now()
  );
  
  RETURN result;
END;
$$;

-- Função para limpar logs antigos (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_logs(days_to_keep integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  app_deleted integer;
  system_deleted integer;
  backend_deleted integer;
  cutoff_date timestamp with time zone;
BEGIN
  cutoff_date := now() - (days_to_keep || ' days')::interval;
  
  -- Deletar logs antigos
  DELETE FROM app_logs WHERE created_at < cutoff_date;
  GET DIAGNOSTICS app_deleted = ROW_COUNT;
  
  DELETE FROM system_logs WHERE created_at < cutoff_date;
  GET DIAGNOSTICS system_deleted = ROW_COUNT;
  
  DELETE FROM backend_logs WHERE created_at < cutoff_date;
  GET DIAGNOSTICS backend_deleted = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'app_logs_deleted', app_deleted,
    'system_logs_deleted', system_deleted,
    'backend_logs_deleted', backend_deleted,
    'total_deleted', app_deleted + system_deleted + backend_deleted,
    'cutoff_date', cutoff_date
  );
END;
$$;

-- Conceder permissões para usuários autenticados
GRANT EXECUTE ON FUNCTION insert_app_log TO authenticated;
GRANT EXECUTE ON FUNCTION insert_system_log TO authenticated;
GRANT EXECUTE ON FUNCTION insert_backend_log TO authenticated;
GRANT EXECUTE ON FUNCTION get_logs_stats TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_logs TO authenticated;