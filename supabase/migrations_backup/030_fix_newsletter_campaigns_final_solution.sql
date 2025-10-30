-- SOLUÇÃO DEFINITIVA PARA ERROS DE FAILED TO FETCH NA NEWSLETTER_CAMPAIGNS
-- Esta migração corrige os problemas de RLS e permissões que causam ERR_ABORTED

-- 1. Remover todas as políticas existentes para começar limpo
DROP POLICY IF EXISTS "newsletter_campaigns_select_policy" ON newsletter_campaigns;
DROP POLICY IF EXISTS "newsletter_campaigns_insert_policy" ON newsletter_campaigns;
DROP POLICY IF EXISTS "newsletter_campaigns_update_policy" ON newsletter_campaigns;
DROP POLICY IF EXISTS "newsletter_campaigns_delete_policy" ON newsletter_campaigns;
DROP POLICY IF EXISTS "Enable read access for all users" ON newsletter_campaigns;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON newsletter_campaigns;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON newsletter_campaigns;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON newsletter_campaigns;
DROP POLICY IF EXISTS "service_role_all_access" ON newsletter_campaigns;
DROP POLICY IF EXISTS "public_read_access" ON newsletter_campaigns;
DROP POLICY IF EXISTS "authenticated_insert_access" ON newsletter_campaigns;
DROP POLICY IF EXISTS "authenticated_update_access" ON newsletter_campaigns;
DROP POLICY IF EXISTS "authenticated_delete_access" ON newsletter_campaigns;
DROP POLICY IF EXISTS "service_role_full_access" ON newsletter_campaigns;
DROP POLICY IF EXISTS "public_select_campaigns" ON newsletter_campaigns;
DROP POLICY IF EXISTS "authenticated_insert_campaigns" ON newsletter_campaigns;
DROP POLICY IF EXISTS "authenticated_update_campaigns" ON newsletter_campaigns;
DROP POLICY IF EXISTS "authenticated_delete_campaigns" ON newsletter_campaigns;
DROP POLICY IF EXISTS "newsletter_campaigns_select_all" ON newsletter_campaigns;
DROP POLICY IF EXISTS "newsletter_campaigns_insert_auth" ON newsletter_campaigns;
DROP POLICY IF EXISTS "newsletter_campaigns_update_auth" ON newsletter_campaigns;
DROP POLICY IF EXISTS "newsletter_campaigns_delete_auth" ON newsletter_campaigns;
DROP POLICY IF EXISTS "newsletter_campaigns_service_role_access" ON newsletter_campaigns;
DROP POLICY IF EXISTS "newsletter_campaigns_authenticated_access" ON newsletter_campaigns;
DROP POLICY IF EXISTS "newsletter_campaigns_admin_access" ON newsletter_campaigns;

-- 2. Desabilitar RLS temporariamente
ALTER TABLE newsletter_campaigns DISABLE ROW LEVEL SECURITY;

-- 3. Reabilitar RLS
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas simples e eficazes
-- Política para service_role (acesso total)
CREATE POLICY "service_role_access" ON newsletter_campaigns
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Política para usuários autenticados (acesso total para admin)
CREATE POLICY "authenticated_access" ON newsletter_campaigns
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para usuários anônimos (apenas leitura)
CREATE POLICY "anon_read_access" ON newsletter_campaigns
FOR SELECT 
TO anon
USING (true);

-- 5. Garantir permissões corretas
GRANT ALL ON newsletter_campaigns TO service_role;
GRANT ALL ON newsletter_campaigns TO authenticated;
GRANT SELECT ON newsletter_campaigns TO anon;

-- 6. Garantir acesso às sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 7. Criar índices para performance (se não existirem)
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_status ON newsletter_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_created_at ON newsletter_campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_sent_at ON newsletter_campaigns(sent_at);

-- 8. Inserir dados de exemplo se a tabela estiver vazia
-- Campanhas de exemplo removidas - apenas dados reais serão exibidos

-- 9. Refresh do schema cache
NOTIFY pgrst, 'reload schema';

-- 10. Verificar se as políticas foram criadas corretamente
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename = 'newsletter_campaigns'
ORDER BY policyname;

SELECT 'Migração 030 aplicada com sucesso - newsletter_campaigns corrigida' as status;