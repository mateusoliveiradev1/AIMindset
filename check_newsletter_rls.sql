-- Verificar políticas RLS das tabelas newsletter_subscribers e newsletter_campaigns
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename IN ('newsletter_subscribers', 'newsletter_campaigns') 
ORDER BY tablename, policyname;

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('newsletter_subscribers', 'newsletter_campaigns');

-- Verificar dados existentes nas tabelas
SELECT 'newsletter_subscribers' as table_name, COUNT(*) as total_rows FROM newsletter_subscribers
UNION ALL
SELECT 'newsletter_campaigns' as table_name, COUNT(*) as total_rows FROM newsletter_campaigns;

-- Verificar estrutura das tabelas
\d newsletter_subscribers;
\d newsletter_campaigns;