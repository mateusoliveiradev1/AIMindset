-- =====================================================
-- Teste das Migrações Consolidadas - AIMindset
-- Data: 2025-10-30
-- Descrição: Script para testar todas as migrações consolidadas
-- =====================================================

-- =====================================================
-- TESTE 1: VERIFICAR TABELAS PRINCIPAIS
-- =====================================================

-- Verificar se todas as tabelas principais existem
DO $$
DECLARE
    table_count INTEGER;
    expected_tables TEXT[] := ARRAY[
        'categories', 'admin_users', 'articles', 'comments', 'feedbacks', 'contacts',
        'newsletter_subscribers', 'newsletter_campaigns', 'email_templates', 'email_automations',
        'app_logs', 'system_logs', 'backend_logs', 'security_audit_logs',
        'seo_metadata', 'user_profiles', 'cookie_preferences', 'privacy_requests', 'rate_limits',
        'alert_subscriptions', 'backup_logs', 'backup_articles', 'backup_comments', 'backup_feedbacks'
    ];
    missing_tables TEXT[] := '{}';
    current_table TEXT;
BEGIN
    -- Verificar cada tabela esperada
    FOREACH current_table IN ARRAY expected_tables
    LOOP
        SELECT COUNT(*)
        INTO table_count
        FROM information_schema.tables t
        WHERE t.table_schema = 'public'
        AND t.table_name = current_table;
        
        IF table_count = 0 THEN
            missing_tables := array_append(missing_tables, current_table);
        END IF;
    END LOOP;
    
    -- Log do resultado
    INSERT INTO system_logs (type, message, context)
    VALUES (
        'test_migration',
        CASE 
            WHEN array_length(missing_tables, 1) IS NULL THEN 'Todas as tabelas principais foram criadas com sucesso'
            ELSE format('Tabelas faltando: %s', array_to_string(missing_tables, ', '))
        END,
        jsonb_build_object(
            'test', 'table_creation',
            'expected_count', array_length(expected_tables, 1),
            'missing_tables', missing_tables,
            'success', (array_length(missing_tables, 1) IS NULL)
        )
    );
END $$;

-- =====================================================
-- TESTE 2: VERIFICAR FUNÇÕES RPC
-- =====================================================

DO $$
DECLARE
    function_count INTEGER;
    expected_functions TEXT[] := ARRAY[
        'insert_app_log', 'insert_system_log', 'insert_backend_log', 'get_logs_stats', 'cleanup_old_logs',
        'call_nodejs_email_endpoint', 'send_alert_direct', 'test_alert_system', 'test_alert_system_simple',
        'backup_all_data', 'restore_from_backup', 'list_backups', 'get_backup_logs'
    ];
    missing_functions TEXT[] := '{}';
    function_name TEXT;
BEGIN
    -- Verificar cada função esperada
    FOREACH function_name IN ARRAY expected_functions
    LOOP
        SELECT COUNT(*)
        INTO function_count
        FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND routine_name = function_name
        AND routine_type = 'FUNCTION';
        
        IF function_count = 0 THEN
            missing_functions := array_append(missing_functions, function_name);
        END IF;
    END LOOP;
    
    -- Log do resultado
    INSERT INTO system_logs (type, message, context)
    VALUES (
        'test_migration',
        CASE 
            WHEN array_length(missing_functions, 1) IS NULL THEN 'Todas as funções RPC foram criadas com sucesso'
            ELSE format('Funções faltando: %s', array_to_string(missing_functions, ', '))
        END,
        jsonb_build_object(
            'test', 'function_creation',
            'expected_count', array_length(expected_functions, 1),
            'missing_functions', missing_functions,
            'success', (array_length(missing_functions, 1) IS NULL)
        )
    );
END $$;

-- =====================================================
-- TESTE 3: VERIFICAR TRIGGERS
-- =====================================================

DO $$
DECLARE
    trigger_count INTEGER;
    expected_triggers TEXT[] := ARRAY[
        'update_categories_updated_at', 'update_admin_users_updated_at', 'update_articles_updated_at',
        'update_comments_updated_at', 'update_contacts_updated_at', 'trigger_app_logs_alert', 'trigger_system_logs_alert'
    ];
    missing_triggers TEXT[] := '{}';
    trigger_name TEXT;
BEGIN
    -- Verificar cada trigger esperado
    FOREACH trigger_name IN ARRAY expected_triggers
    LOOP
        SELECT COUNT(*)
        INTO trigger_count
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        AND trigger_name = trigger_name;
        
        IF trigger_count = 0 THEN
            missing_triggers := array_append(missing_triggers, trigger_name);
        END IF;
    END LOOP;
    
    -- Log do resultado
    INSERT INTO system_logs (type, message, context)
    VALUES (
        'test_migration',
        CASE 
            WHEN array_length(missing_triggers, 1) IS NULL THEN 'Todos os triggers foram criados com sucesso'
            ELSE format('Triggers faltando: %s', array_to_string(missing_triggers, ', '))
        END,
        jsonb_build_object(
            'test', 'trigger_creation',
            'expected_count', array_length(expected_triggers, 1),
            'missing_triggers', missing_triggers,
            'success', (array_length(missing_triggers, 1) IS NULL)
        )
    );
END $$;

-- =====================================================
-- TESTE 4: TESTAR FUNCIONALIDADES BÁSICAS
-- =====================================================

-- Teste de inserção de categoria
DO $$
DECLARE
    test_category_id UUID;
BEGIN
    INSERT INTO categories (name, description)
    VALUES ('Teste Migração', 'Categoria de teste para validar migrações')
    RETURNING id INTO test_category_id;
    
    INSERT INTO system_logs (type, message, context)
    VALUES (
        'test_migration',
        'Teste de inserção de categoria executado com sucesso',
        jsonb_build_object(
            'test', 'category_insertion',
            'category_id', test_category_id,
            'success', true
        )
    );
    
    -- Limpar dados de teste
    DELETE FROM categories WHERE id = test_category_id;
    
EXCEPTION
    WHEN OTHERS THEN
        INSERT INTO system_logs (type, message, context)
        VALUES (
            'test_migration',
            format('Erro no teste de inserção de categoria: %s', SQLERRM),
            jsonb_build_object(
                'test', 'category_insertion',
                'error', SQLERRM,
                'success', false
            )
        );
END $$;

-- Teste do sistema de alertas
DO $$
DECLARE
    alert_result jsonb;
BEGIN
    SELECT test_alert_system_simple('test_migration', 'Teste das migrações consolidadas')
    INTO alert_result;
    
    INSERT INTO system_logs (type, message, context)
    VALUES (
        'test_migration',
        'Teste do sistema de alertas executado',
        jsonb_build_object(
            'test', 'alert_system',
            'result', alert_result,
            'success', (alert_result->>'success')::boolean
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        INSERT INTO system_logs (type, message, context)
        VALUES (
            'test_migration',
            format('Erro no teste do sistema de alertas: %s', SQLERRM),
            jsonb_build_object(
                'test', 'alert_system',
                'error', SQLERRM,
                'success', false
            )
        );
END $$;

-- Teste do sistema de backup
DO $$
DECLARE
    backup_result jsonb;
    logs_result jsonb;
BEGIN
    -- Testar função de logs de backup
    SELECT get_backup_logs(5) INTO logs_result;
    
    INSERT INTO system_logs (type, message, context)
    VALUES (
        'test_migration',
        'Teste do sistema de backup (logs) executado',
        jsonb_build_object(
            'test', 'backup_system_logs',
            'logs_count', jsonb_array_length(logs_result),
            'success', true
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        INSERT INTO system_logs (type, message, context)
        VALUES (
            'test_migration',
            format('Erro no teste do sistema de backup: %s', SQLERRM),
            jsonb_build_object(
                'test', 'backup_system',
                'error', SQLERRM,
                'success', false
            )
        );
END $$;

-- =====================================================
-- TESTE 5: VERIFICAR RLS (ROW LEVEL SECURITY)
-- =====================================================

DO $$
DECLARE
    rls_enabled_count INTEGER;
    expected_rls_tables TEXT[] := ARRAY[
        'categories', 'admin_users', 'articles', 'comments', 'feedbacks', 'contacts',
        'newsletter_subscribers', 'alert_subscriptions', 'backup_logs', 'backup_articles'
    ];
    tables_without_rls TEXT[] := '{}';
    table_name TEXT;
    rls_enabled BOOLEAN;
BEGIN
    -- Verificar RLS em cada tabela
    FOREACH table_name IN ARRAY expected_rls_tables
    LOOP
        SELECT relrowsecurity
        INTO rls_enabled
        FROM pg_class
        WHERE relname = table_name
        AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
        
        IF NOT COALESCE(rls_enabled, false) THEN
            tables_without_rls := array_append(tables_without_rls, table_name);
        END IF;
    END LOOP;
    
    -- Log do resultado
    INSERT INTO system_logs (type, message, context)
    VALUES (
        'test_migration',
        CASE 
            WHEN array_length(tables_without_rls, 1) IS NULL THEN 'RLS habilitado em todas as tabelas necessárias'
            ELSE format('Tabelas sem RLS: %s', array_to_string(tables_without_rls, ', '))
        END,
        jsonb_build_object(
            'test', 'rls_verification',
            'expected_count', array_length(expected_rls_tables, 1),
            'tables_without_rls', tables_without_rls,
            'success', (array_length(tables_without_rls, 1) IS NULL)
        )
    );
END $$;

-- =====================================================
-- RESUMO DOS TESTES
-- =====================================================

-- Gerar resumo final dos testes
INSERT INTO system_logs (type, message, context)
VALUES (
    'test_migration',
    'Teste completo das migrações consolidadas finalizado',
    jsonb_build_object(
        'test', 'migration_test_summary',
        'migrations_tested', jsonb_build_array(
            '001_initial_schema.sql',
            '002_rpc_functions.sql', 
            '003_triggers_and_policies.sql',
            '004_alert_system.sql',
            '005_backup_system.sql'
        ),
        'test_categories', jsonb_build_array(
            'table_creation',
            'function_creation',
            'trigger_creation',
            'basic_functionality',
            'rls_verification'
        ),
        'timestamp', NOW()
    )
);

-- Mostrar resultados dos testes
SELECT 
    type,
    message,
    context->>'test' as test_name,
    context->>'success' as success,
    created_at
FROM system_logs 
WHERE type = 'test_migration'
AND created_at >= NOW() - INTERVAL '1 minute'
ORDER BY created_at DESC;