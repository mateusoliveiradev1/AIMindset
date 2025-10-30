-- =====================================================
-- Script para Mover Migrações Antigas - AIMindset
-- Data: 2025-10-30
-- Descrição: Documentação das migrações antigas que devem ser movidas
-- =====================================================

-- IMPORTANTE: Este arquivo documenta as migrações que devem ser movidas
-- para a pasta migrations_backup após a consolidação ser testada e aprovada.

-- =====================================================
-- MIGRAÇÕES CONSOLIDADAS (MANTER)
-- =====================================================
-- Estas migrações devem permanecer ativas:
-- - 001_initial_schema.sql
-- - 002_rpc_functions.sql  
-- - 003_triggers_and_policies.sql
-- - 004_alert_system.sql
-- - 005_backup_system.sql

-- =====================================================
-- MIGRAÇÕES ANTIGAS PARA MOVER (85+ arquivos)
-- =====================================================
-- Todas as migrações na pasta supabase/migrations/ devem ser movidas
-- para supabase/migrations_backup/ após os testes serem aprovados.

-- Lista das principais migrações que serão movidas:
-- - 001_initial_schema.sql (original)
-- - 002_create_admin_users.sql
-- - 003_create_articles.sql
-- - 004_create_comments.sql
-- - 005_create_feedbacks.sql
-- - 006_create_contacts.sql
-- - 007_create_newsletter_subscribers.sql
-- - 008_create_newsletter_campaigns.sql
-- - 009_create_email_templates.sql
-- - 010_create_email_automations.sql
-- - 011_create_app_logs.sql
-- - 012_create_system_logs.sql
-- - 013_create_backend_logs.sql
-- - 014_create_rich_articles_content.sql
-- - 015_create_seo_metadata.sql
-- - 016_create_user_profiles.sql
-- - 017_create_cookie_preferences.sql
-- - 018_create_privacy_requests.sql
-- - 019_create_security_audit_logs.sql
-- - 020_create_rate_limits.sql
-- - 021_create_newsletter_logs_table.sql
-- - 022_add_newsletter_logs_rls.sql
-- - 023_create_logging_functions.sql
-- - 024_create_newsletter_functions.sql
-- - 025_create_article_functions.sql
-- - 026_create_comment_functions.sql
-- - 027_create_feedback_functions.sql
-- - 028_create_contact_functions.sql
-- - 029_create_seo_functions.sql
-- - 030_create_user_functions.sql
-- - 031_create_cookie_functions.sql
-- - 032_create_privacy_functions.sql
-- - 033_create_security_functions.sql
-- - 034_fix_ambiguous_columns.sql
-- - 035_fix_backup_system.sql
-- - 036_fix_delete_where_clause.sql
-- - 037_fix_restore_truncate.sql
-- - 038_fix_restore_disable_rls.sql
-- - 039_fix_restore_upsert.sql
-- - 040_fix_restore_latest_backup.sql
-- - 041_create_logging_functions.sql
-- - 042_create_alert_system.sql
-- - 043_create_backup_system.sql
-- - 044_fix_alert_triggers.sql
-- - 045_fix_alert_triggers_v2.sql
-- - 046_fix_alert_triggers_final.sql
-- - 047_create_alert_subscribers.sql
-- - 048_fix_alert_system.sql
-- - 049_fix_backup_system.sql
-- - 050_fix_backup_function.sql
-- - 051_fix_backup_function_final.sql
-- - 052_fix_backup_function_with_logs.sql
-- - 053_fix_backup_system_v2.sql
-- - 054_fix_backup_system_v3.sql
-- - 055_recreate_backup_tables.sql
-- - 056_fix_restore_function.sql
-- - 057_fix_restore_function_status_column.sql
-- - 058_fix_restore_function_status_column_v2.sql
-- - 059_fix_backup_logs_rls.sql
-- - 060_switch_to_nodejs_email.sql
-- - 061_consolidate_feedback_tables_fixed.sql
-- - 062_cleanup_duplicate_feedback_table_fixed.sql
-- - 063_emergency_fix_articles_table.sql
-- - 064_backup_system_setup.sql
-- - 065_diagnose_test_function.sql
-- - 066_create_alert_subscribers.sql
-- - 067_check_rpc_functions.sql
-- - 068_fix_permissions_and_test.sql
-- - 069_debug_functions.sql
-- - 070_debug_functions.sql
-- - 071_fix_alert_system_final.sql
-- - 072_clean_and_fix_alerts.sql
-- - 073_check_existing_functions.sql
-- - 074_check_functions_corrected.sql
-- - 075_recreate_alert_functions_final.sql
-- - 076_fix_alert_functions_status_column.sql
-- - 077_debug_alert_system_complete.sql
-- - 078_fix_pg_net_issue.sql
-- - 079_fix_frontend_rpc_calls.sql
-- - 080_drop_and_recreate_rpc_functions.sql
-- - 081_fix_http_call_real.sql
-- - 082_fix_pg_net_usage.sql
-- - 083_fix_pg_net_usage.sql
-- - 084_fix_pg_net_correct_syntax.sql
-- - 085_alternative_email_solution.sql

-- =====================================================
-- COMANDO PARA MOVER AS MIGRAÇÕES
-- =====================================================
-- Execute estes comandos no PowerShell após os testes serem aprovados:

-- 1. Criar pasta de backup:
-- New-Item -ItemType Directory -Path "supabase\migrations_backup" -Force

-- 2. Mover todas as migrações antigas:
-- Move-Item -Path "supabase\migrations\*.sql" -Destination "supabase\migrations_backup\" -Force

-- 3. Mover as migrações consolidadas para a pasta principal:
-- Move-Item -Path "supabase\migrations_consolidated\00*.sql" -Destination "supabase\migrations\" -Force

-- =====================================================
-- VERIFICAÇÃO PÓS-MIGRAÇÃO
-- =====================================================
-- Após mover as migrações, verificar:
-- 1. Pasta migrations/ deve conter apenas as 5 migrações consolidadas
-- 2. Pasta migrations_backup/ deve conter todas as migrações antigas
-- 3. Sistema deve continuar funcionando normalmente
-- 4. Testes devem passar com as novas migrações

-- =====================================================
-- LOG DA OPERAÇÃO
-- =====================================================
INSERT INTO system_logs (type, message, context)
VALUES (
    'migration_consolidation',
    'Documentação para movimentação de migrações antigas criada',
    jsonb_build_object(
        'action', 'documentation_created',
        'consolidated_migrations', 5,
        'old_migrations_to_move', '85+',
        'backup_folder', 'supabase/migrations_backup',
        'status', 'ready_for_execution'
    )
);