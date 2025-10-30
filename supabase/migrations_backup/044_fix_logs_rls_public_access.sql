-- =====================================================
-- CORREÇÃO DAS POLÍTICAS RLS PARA TABELAS DE LOGS
-- Permitir acesso público aos logs (painel administrativo)
-- =====================================================

-- 1. REMOVER POLÍTICAS RESTRITIVAS EXISTENTES
-- =====================================================

DROP POLICY IF EXISTS "authenticated_backend_logs_policy" ON backend_logs;
DROP POLICY IF EXISTS "authenticated_app_logs_policy" ON app_logs;
DROP POLICY IF EXISTS "authenticated_system_logs_policy" ON system_logs;

-- 2. CRIAR POLÍTICAS PÚBLICAS PARA ACESSO AOS LOGS
-- =====================================================

-- Política para backend_logs - acesso público para leitura
CREATE POLICY "public_backend_logs_policy" ON backend_logs
    FOR SELECT USING (true);

-- Política para app_logs - acesso público para leitura
CREATE POLICY "public_app_logs_policy" ON app_logs
    FOR SELECT USING (true);

-- Política para system_logs - acesso público para leitura
CREATE POLICY "public_system_logs_policy" ON system_logs
    FOR SELECT USING (true);

-- Políticas para inserção (apenas para service_role)
CREATE POLICY "service_role_backend_logs_insert" ON backend_logs
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_role_app_logs_insert" ON app_logs
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_role_system_logs_insert" ON system_logs
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- 3. GARANTIR QUE RLS ESTÁ HABILITADO
-- =====================================================

ALTER TABLE backend_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- 4. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON POLICY "public_backend_logs_policy" ON backend_logs IS 
'Permite leitura pública dos logs de backend para painel administrativo';

COMMENT ON POLICY "public_app_logs_policy" ON app_logs IS 
'Permite leitura pública dos logs de aplicação para painel administrativo';

COMMENT ON POLICY "public_system_logs_policy" ON system_logs IS 
'Permite leitura pública dos logs de sistema para painel administrativo';

-- 5. VERIFICAÇÃO FINAL
-- =====================================================

SELECT 'Políticas RLS públicas criadas com sucesso para tabelas de logs' as status;