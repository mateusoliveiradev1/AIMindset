-- =====================================================
-- Sistema de Logs - Função Genérica e Triggers
-- AIMindset - Migração 002
-- =====================================================

-- =====================================================
-- FUNÇÃO GENÉRICA PARA TRIGGERS DE BACKEND LOGS
-- =====================================================

CREATE OR REPLACE FUNCTION log_backend_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se a tabela backend_logs existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backend_logs') THEN
        RAISE NOTICE 'Tabela backend_logs não encontrada. Pulando log.';
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Registrar DELETE
    IF TG_OP = 'DELETE' THEN
        INSERT INTO backend_logs (table_name, action, record_id, old_data, performed_by)
        VALUES (
            TG_TABLE_NAME, 
            TG_OP, 
            OLD.id, 
            row_to_json(OLD)::jsonb, 
            COALESCE(current_setting('app.current_user', true), current_user)
        );
        RETURN OLD;
    
    -- Registrar UPDATE
    ELSIF TG_OP = 'UPDATE' THEN
        -- Só registrar se houve mudança real nos dados
        IF row_to_json(OLD)::jsonb != row_to_json(NEW)::jsonb THEN
            INSERT INTO backend_logs (table_name, action, record_id, old_data, new_data, performed_by)
            VALUES (
                TG_TABLE_NAME, 
                TG_OP, 
                NEW.id, 
                row_to_json(OLD)::jsonb, 
                row_to_json(NEW)::jsonb, 
                COALESCE(current_setting('app.current_user', true), current_user)
            );
        END IF;
        RETURN NEW;
    
    -- Registrar INSERT
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO backend_logs (table_name, action, record_id, new_data, performed_by)
        VALUES (
            TG_TABLE_NAME, 
            TG_OP, 
            NEW.id, 
            row_to_json(NEW)::jsonb, 
            COALESCE(current_setting('app.current_user', true), current_user)
        );
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- APLICAR TRIGGERS NAS TABELAS PRINCIPAIS
-- =====================================================

-- Verificar se as tabelas existem antes de criar os triggers

-- TRIGGER PARA TABELA ARTICLES
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'articles') THEN
        -- Remover trigger existente se houver
        DROP TRIGGER IF EXISTS articles_log_trigger ON articles;
        
        -- Criar novo trigger
        CREATE TRIGGER articles_log_trigger
            AFTER INSERT OR UPDATE OR DELETE ON articles
            FOR EACH ROW EXECUTE FUNCTION log_backend_changes();
            
        RAISE NOTICE 'Trigger criado para tabela articles';
    ELSE
        RAISE NOTICE 'Tabela articles não encontrada. Trigger não criado.';
    END IF;
END $$;

-- TRIGGER PARA TABELA COMMENTS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments') THEN
        -- Remover trigger existente se houver
        DROP TRIGGER IF EXISTS comments_log_trigger ON comments;
        
        -- Criar novo trigger
        CREATE TRIGGER comments_log_trigger
            AFTER INSERT OR UPDATE OR DELETE ON comments
            FOR EACH ROW EXECUTE FUNCTION log_backend_changes();
            
        RAISE NOTICE 'Trigger criado para tabela comments';
    ELSE
        RAISE NOTICE 'Tabela comments não encontrada. Trigger não criado.';
    END IF;
END $$;

-- TRIGGER PARA TABELA FEEDBACKS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feedbacks') THEN
        -- Remover trigger existente se houver
        DROP TRIGGER IF EXISTS feedbacks_log_trigger ON feedbacks;
        
        -- Criar novo trigger
        CREATE TRIGGER feedbacks_log_trigger
            AFTER INSERT OR UPDATE OR DELETE ON feedbacks
            FOR EACH ROW EXECUTE FUNCTION log_backend_changes();
            
        RAISE NOTICE 'Trigger criado para tabela feedbacks';
    ELSE
        RAISE NOTICE 'Tabela feedbacks não encontrada. Trigger não criado.';
    END IF;
END $$;

-- TRIGGER PARA TABELA USER_PROFILES
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        -- Remover trigger existente se houver
        DROP TRIGGER IF EXISTS user_profiles_log_trigger ON user_profiles;
        
        -- Criar novo trigger
        CREATE TRIGGER user_profiles_log_trigger
            AFTER INSERT OR UPDATE OR DELETE ON user_profiles
            FOR EACH ROW EXECUTE FUNCTION log_backend_changes();
            
        RAISE NOTICE 'Trigger criado para tabela user_profiles';
    ELSE
        RAISE NOTICE 'Tabela user_profiles não encontrada. Trigger não criado.';
    END IF;
END $$;

-- =====================================================
-- FUNÇÃO PARA INSERIR LOGS DE APP (VIA RPC)
-- =====================================================

CREATE OR REPLACE FUNCTION insert_app_log(
    p_level TEXT,
    p_source TEXT,
    p_action TEXT,
    p_details JSONB DEFAULT NULL,
    p_user_id TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    log_id BIGINT;
BEGIN
    -- Validar nível do log
    IF p_level NOT IN ('info', 'warn', 'error') THEN
        RAISE EXCEPTION 'Nível inválido. Use: info, warn ou error';
    END IF;
    
    -- Inserir log
    INSERT INTO app_logs (level, source, action, details, user_id)
    VALUES (p_level, p_source, p_action, p_details, p_user_id)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNÇÃO PARA INSERIR LOGS DE SISTEMA (VIA RPC)
-- =====================================================

CREATE OR REPLACE FUNCTION insert_system_log(
    p_type TEXT,
    p_message TEXT,
    p_context JSONB DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    log_id BIGINT;
BEGIN
    -- Inserir log
    INSERT INTO system_logs (type, message, context)
    VALUES (p_type, p_message, p_context)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION log_backend_changes() IS 'Função genérica para registrar mudanças nas tabelas principais do banco de dados';
COMMENT ON FUNCTION insert_app_log(TEXT, TEXT, TEXT, JSONB, TEXT) IS 'Função RPC para inserir logs de aplicação via JavaScript';
COMMENT ON FUNCTION insert_system_log(TEXT, TEXT, JSONB) IS 'Função RPC para inserir logs de sistema via JavaScript';

-- =====================================================
-- TESTE BÁSICO DAS FUNÇÕES
-- =====================================================

-- Inserir log de teste para verificar se as funções estão funcionando
SELECT insert_app_log('info', 'migration', 'system_setup', '{"migration": "002_create_triggers_and_functions"}'::jsonb);
SELECT insert_system_log('migration', 'Triggers e funções de log criados com sucesso', '{"version": "002"}'::jsonb);