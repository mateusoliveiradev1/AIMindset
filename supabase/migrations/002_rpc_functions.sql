-- =====================================================
-- AIMindset RPC Functions - Consolidated Migration
-- Data: 2025-10-30
-- Descrição: Funções RPC essenciais consolidadas
-- =====================================================

-- =====================================================
-- FUNÇÕES DE LOGGING
-- =====================================================

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

-- Função para limpar logs antigos
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

-- =====================================================
-- FUNÇÕES DE ALERTAS (SIMPLIFICADAS)
-- =====================================================

-- Função para chamar endpoint Node.js para envio de emails
CREATE OR REPLACE FUNCTION call_nodejs_email_endpoint(
    recipients jsonb,
    alert_data jsonb
)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    -- Registrar tentativa de envio nos logs
    INSERT INTO system_logs (type, message, context)
    VALUES (
        'email_request',
        'Solicitação de envio de email via Node.js',
        jsonb_build_object(
            'recipients', recipients,
            'alert_data', alert_data,
            'timestamp', now()
        )
    );
    
    -- Retornar sucesso (o endpoint Node.js processará o email)
    result := jsonb_build_object(
        'success', true,
        'message', 'Email registrado para processamento via Node.js',
        'method', 'nodejs_endpoint'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para enviar alerta direto
CREATE OR REPLACE FUNCTION send_alert_direct(
    p_email text,
    p_subject text,
    p_message text,
    p_details jsonb DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
    alert_data jsonb;
    recipients jsonb;
BEGIN
    -- Construir dados do alerta
    alert_data := jsonb_build_object(
        'type', 'manual',
        'source', 'rpc_direct',
        'subject', p_subject,
        'message', p_message,
        'details', COALESCE(p_details, '{}'::jsonb),
        'timestamp', now()::text
    );
    
    -- Lista de destinatários
    recipients := jsonb_build_array(p_email);
    
    -- Chamar função de envio
    result := call_nodejs_email_endpoint(recipients, alert_data);
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNÇÕES DE NEWSLETTER
-- =====================================================

-- Função para limpar logs antigos da newsletter
CREATE OR REPLACE FUNCTION cleanup_old_newsletter_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM newsletter_logs 
  WHERE created_at < NOW() - INTERVAL '6 months'
  AND status NOT IN ('sent', 'delivered'); -- Manter logs importantes
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNÇÕES DE ARTIGOS E CONTEÚDO
-- =====================================================

-- Função para obter artigos publicados com paginação
CREATE OR REPLACE FUNCTION get_published_articles(
    page_size integer DEFAULT 10,
    page_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    title varchar,
    excerpt text,
    slug varchar,
    image_url text,
    tags text[],
    category_name varchar,
    author_name varchar,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.title,
        a.excerpt,
        a.slug,
        a.image_url,
        a.tags,
        c.name as category_name,
        au.name as author_name,
        a.created_at,
        a.updated_at
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN admin_users au ON a.author_id = au.id
    WHERE a.published = true
    ORDER BY a.created_at DESC
    LIMIT page_size OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter artigo por slug
CREATE OR REPLACE FUNCTION get_article_by_slug(article_slug text)
RETURNS TABLE (
    id uuid,
    title varchar,
    excerpt text,
    content text,
    slug varchar,
    image_url text,
    tags text[],
    category_name varchar,
    category_slug varchar,
    author_name varchar,
    published boolean,
    is_featured boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.title,
        a.excerpt,
        a.content,
        a.slug,
        a.image_url,
        a.tags,
        c.name as category_name,
        c.slug as category_slug,
        au.name as author_name,
        a.published,
        a.is_featured,
        a.created_at,
        a.updated_at
    FROM articles a
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN admin_users au ON a.author_id = au.id
    WHERE a.slug = article_slug AND a.published = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNÇÕES DE COMENTÁRIOS E FEEDBACK
-- =====================================================

-- Função para obter comentários de um artigo
CREATE OR REPLACE FUNCTION get_article_comments(
    article_id uuid,
    page_size integer DEFAULT 10,
    page_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    author_name varchar,
    content text,
    likes integer,
    replies integer,
    created_at timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.author_name,
        c.content,
        c.likes,
        c.replies,
        c.created_at
    FROM comments c
    WHERE c.article_id = get_article_comments.article_id
    ORDER BY c.created_at DESC
    LIMIT page_size OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PERMISSÕES
-- =====================================================

-- Conceder permissões para usuários autenticados
GRANT EXECUTE ON FUNCTION insert_app_log TO authenticated;
GRANT EXECUTE ON FUNCTION insert_system_log TO authenticated;
GRANT EXECUTE ON FUNCTION insert_backend_log TO authenticated;
GRANT EXECUTE ON FUNCTION get_logs_stats TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_logs TO authenticated;
GRANT EXECUTE ON FUNCTION send_alert_direct TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_newsletter_logs TO authenticated;

-- Conceder permissões para usuários anônimos (funções públicas)
GRANT EXECUTE ON FUNCTION get_published_articles TO anon;
GRANT EXECUTE ON FUNCTION get_article_by_slug TO anon;
GRANT EXECUTE ON FUNCTION get_article_comments TO anon;