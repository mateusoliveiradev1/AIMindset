-- =====================================================
-- CORREÇÃO DAS POLÍTICAS RLS PARA TABELAS DE LOGS
-- Permitir acesso para usuários autenticados (sem necessidade de admin_users)
-- =====================================================

-- 1. REMOVER POLÍTICAS RESTRITIVAS EXISTENTES
-- =====================================================

DROP POLICY IF EXISTS "admin_only_backend_logs_policy" ON backend_logs;
DROP POLICY IF EXISTS "admin_only_app_logs_policy" ON app_logs;
DROP POLICY IF EXISTS "admin_only_system_logs_policy" ON system_logs;

-- 2. CRIAR POLÍTICAS MAIS PERMISSIVAS PARA USUÁRIOS AUTENTICADOS
-- =====================================================

-- Política para backend_logs - usuários autenticados podem acessar
CREATE POLICY "authenticated_backend_logs_policy" ON backend_logs
    FOR ALL USING (
        auth.role() = 'authenticated'
    );

-- Política para app_logs - usuários autenticados podem acessar
CREATE POLICY "authenticated_app_logs_policy" ON app_logs
    FOR ALL USING (
        auth.role() = 'authenticated'
    );

-- Política para system_logs - usuários autenticados podem acessar
CREATE POLICY "authenticated_system_logs_policy" ON system_logs
    FOR ALL USING (
        auth.role() = 'authenticated'
    );

-- 3. GARANTIR QUE RLS ESTÁ HABILITADO
-- =====================================================

ALTER TABLE backend_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- 4. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON POLICY "authenticated_backend_logs_policy" ON backend_logs IS 
'Permite acesso total aos logs de backend para usuários autenticados';

COMMENT ON POLICY "authenticated_app_logs_policy" ON app_logs IS 
'Permite acesso total aos logs de aplicação para usuários autenticados';

COMMENT ON POLICY "authenticated_system_logs_policy" ON system_logs IS 
'Permite acesso total aos logs de sistema para usuários autenticados';

-- 5. VERIFICAÇÃO FINAL
-- =====================================================

SELECT 'Políticas RLS atualizadas com sucesso para tabelas de logs' as status;