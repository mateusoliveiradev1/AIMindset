-- CORREÇÃO DEFINITIVA DAS POLÍTICAS RLS PARA NEWSLETTER_CAMPAIGNS
-- Resolver erros ERR_ABORTED e Failed to fetch

-- 1. Remover todas as políticas existentes
DROP POLICY IF EXISTS "newsletter_campaigns_select_policy" ON newsletter_campaigns;
DROP POLICY IF EXISTS "newsletter_campaigns_insert_policy" ON newsletter_campaigns;
DROP POLICY IF EXISTS "newsletter_campaigns_update_policy" ON newsletter_campaigns;
DROP POLICY IF EXISTS "newsletter_campaigns_delete_policy" ON newsletter_campaigns;
DROP POLICY IF EXISTS "Enable read access for all users" ON newsletter_campaigns;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON newsletter_campaigns;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON newsletter_campaigns;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON newsletter_campaigns;

-- 2. Desabilitar RLS temporariamente para limpeza
ALTER TABLE newsletter_campaigns DISABLE ROW LEVEL SECURITY;

-- 3. Reabilitar RLS
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas mais permissivas para resolver os erros de acesso
-- Política de SELECT: Permitir leitura para todos (incluindo anônimos)
CREATE POLICY "newsletter_campaigns_select_all" ON newsletter_campaigns
    FOR SELECT
    USING (true);

-- Política de INSERT: Permitir inserção para usuários autenticados e service role
CREATE POLICY "newsletter_campaigns_insert_auth" ON newsletter_campaigns
    FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role' OR 
        auth.role() = 'authenticated' OR
        auth.uid() IS NOT NULL
    );

-- Política de UPDATE: Permitir atualização para usuários autenticados e service role
CREATE POLICY "newsletter_campaigns_update_auth" ON newsletter_campaigns
    FOR UPDATE
    USING (
        auth.role() = 'service_role' OR 
        auth.role() = 'authenticated' OR
        auth.uid() IS NOT NULL
    );

-- Política de DELETE: Permitir exclusão para usuários autenticados e service role
CREATE POLICY "newsletter_campaigns_delete_auth" ON newsletter_campaigns
    FOR DELETE
    USING (
        auth.role() = 'service_role' OR 
        auth.role() = 'authenticated' OR
        auth.uid() IS NOT NULL
    );

-- 5. Garantir que a tabela tenha permissões adequadas
GRANT ALL ON newsletter_campaigns TO postgres;
GRANT ALL ON newsletter_campaigns TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON newsletter_campaigns TO authenticated;
GRANT SELECT ON newsletter_campaigns TO anon;

-- 6. Verificar se as políticas foram criadas corretamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'newsletter_campaigns'
ORDER BY policyname;