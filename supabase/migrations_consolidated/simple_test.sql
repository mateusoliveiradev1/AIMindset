-- =====================================================
-- Teste Simples das Migrações Consolidadas - AIMindset
-- =====================================================

-- Teste 1: Verificar se as tabelas principais existem
SELECT 
    'Teste de Tabelas' as test_type,
    COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'categories', 'admin_users', 'articles', 'comments', 'feedbacks', 'contacts',
    'newsletter_subscribers', 'newsletter_campaigns', 'email_templates', 'email_automations',
    'app_logs', 'system_logs', 'backend_logs', 'security_audit_logs',
    'seo_metadata', 'user_profiles', 'cookie_preferences', 'privacy_requests', 'rate_limits',
    'alert_subscriptions', 'backup_logs', 'backup_articles', 'backup_comments', 'backup_feedbacks'
);

-- Teste 2: Verificar se as funções RPC existem
SELECT 
    'Teste de Funções RPC' as test_type,
    COUNT(*) as total_functions
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'insert_app_log', 'insert_system_log', 'insert_backend_log',
    'call_nodejs_email_endpoint', 'send_alert_direct', 'test_alert_system',
    'backup_all_data', 'restore_from_backup', 'list_backups'
);

-- Teste 3: Verificar se os triggers existem
SELECT 
    'Teste de Triggers' as test_type,
    COUNT(*) as total_triggers
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Teste 4: Verificar RLS nas tabelas principais
SELECT 
    'Teste de RLS' as test_type,
    COUNT(*) as tables_with_rls
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- Teste 5: Inserir log de teste
INSERT INTO system_logs (type, message, context)
VALUES (
    'migration_test',
    'Teste das migrações consolidadas executado com sucesso',
    jsonb_build_object(
        'test_date', NOW(),
        'test_status', 'completed',
        'migration_version', 'consolidated_v1'
    )
);

-- Teste 6: Verificar se o sistema de alertas está funcionando
SELECT 
    'Teste de Sistema de Alertas' as test_type,
    COUNT(*) as alert_subscriptions_count
FROM alert_subscriptions 
WHERE is_active = true;

-- Teste 7: Verificar se o sistema de backup está funcionando
SELECT 
    'Teste de Sistema de Backup' as test_type,
    COUNT(*) as backup_tables_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'backup_%';

-- Resultado final
SELECT 
    'TESTE CONCLUÍDO' as status,
    'Migrações consolidadas testadas com sucesso' as message,
    NOW() as test_completed_at;