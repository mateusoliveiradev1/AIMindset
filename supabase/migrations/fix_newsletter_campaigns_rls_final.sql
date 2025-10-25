-- CORREÇÃO FINAL DAS POLÍTICAS RLS PARA NEWSLETTER_CAMPAIGNS
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
DROP POLICY IF EXISTS "service_role_all_access" ON newsletter_campaigns;
DROP POLICY IF EXISTS "public_read_access" ON newsletter_campaigns;
DROP POLICY IF EXISTS "authenticated_insert_access" ON newsletter_campaigns;
DROP POLICY IF EXISTS "authenticated_update_access" ON newsletter_campaigns;
DROP POLICY IF EXISTS "authenticated_delete_access" ON newsletter_campaigns;

-- 2. Desabilitar RLS temporariamente
ALTER TABLE newsletter_campaigns DISABLE ROW LEVEL SECURITY;

-- 3. Reabilitar RLS
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas simples e funcionais

-- Política para service_role (acesso total)
CREATE POLICY "service_role_full_access" ON newsletter_campaigns
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Política para leitura pública (anon e authenticated)
CREATE POLICY "public_select_campaigns" ON newsletter_campaigns
FOR SELECT
TO anon, authenticated
USING (true);

-- Política para inserção (authenticated apenas)
CREATE POLICY "authenticated_insert_campaigns" ON newsletter_campaigns
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para atualização (authenticated apenas)
CREATE POLICY "authenticated_update_campaigns" ON newsletter_campaigns
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para exclusão (authenticated apenas)
CREATE POLICY "authenticated_delete_campaigns" ON newsletter_campaigns
FOR DELETE
TO authenticated
USING (true);

-- 5. Garantir permissões nas sequências
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 6. Garantir permissões na tabela
GRANT SELECT ON newsletter_campaigns TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON newsletter_campaigns TO authenticated;
GRANT ALL ON newsletter_campaigns TO service_role;

-- 7. Inserir dados de teste se não existirem
INSERT INTO newsletter_campaigns (
  subject, 
  content, 
  status, 
  recipient_count, 
  opened_count, 
  clicked_count, 
  sent_at, 
  created_at,
  name,
  created_by
)
SELECT 
  'Newsletter de Boas-vindas',
  'Conteúdo da newsletter de boas-vindas sobre IA e tecnologia',
  'sent',
  150,
  75,
  25,
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '7 days',
  'Campanha de Boas-vindas',
  'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM newsletter_campaigns WHERE subject = 'Newsletter de Boas-vindas'
);

INSERT INTO newsletter_campaigns (
  subject, 
  content, 
  status, 
  recipient_count, 
  opened_count, 
  clicked_count, 
  sent_at, 
  created_at,
  name,
  created_by
)
SELECT 
  'Newsletter Semanal - Tendências IA',
  'Conteúdo sobre as últimas tendências em inteligência artificial',
  'sent',
  180,
  90,
  35,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day',
  'Newsletter Semanal',
  'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM newsletter_campaigns WHERE subject = 'Newsletter Semanal - Tendências IA'
);

INSERT INTO newsletter_campaigns (
  subject, 
  content, 
  status, 
  recipient_count, 
  opened_count, 
  clicked_count, 
  sent_at, 
  created_at,
  name,
  created_by
)
SELECT 
  'Rascunho Newsletter',
  'Conteúdo em rascunho para próxima newsletter',
  'draft',
  0,
  0,
  0,
  NULL,
  NOW(),
  'Rascunho Mensal',
  'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM newsletter_campaigns WHERE subject = 'Rascunho Newsletter'
);

-- 8. Verificar se tudo está funcionando
SELECT 'Políticas RLS criadas com sucesso para newsletter_campaigns' as status;
SELECT COUNT(*) as total_campaigns FROM newsletter_campaigns;