-- Dropar funções existentes e recriar com assinaturas corretas
DROP FUNCTION IF EXISTS insert_app_log(text,text,text,jsonb,text);
DROP FUNCTION IF EXISTS insert_system_log(text,text,jsonb);
DROP FUNCTION IF EXISTS insert_backend_log(text,text,uuid,jsonb,jsonb,text);

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

-- Conceder permissões
GRANT EXECUTE ON FUNCTION insert_app_log TO authenticated;
GRANT EXECUTE ON FUNCTION insert_system_log TO authenticated;
GRANT EXECUTE ON FUNCTION insert_backend_log TO authenticated;