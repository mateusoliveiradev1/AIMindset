-- Corrigir políticas RLS para seo_metadata
-- Permitir leitura pública para metadados SEO

-- Verificar políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'seo_metadata';

-- Remover políticas restritivas existentes
DROP POLICY IF EXISTS "Enable read access for all users" ON seo_metadata;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON seo_metadata;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON seo_metadata;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON seo_metadata;

-- Criar política para leitura pública (sem autenticação necessária)
CREATE POLICY "seo_metadata_select_all" ON seo_metadata
    FOR SELECT USING (true);

-- Criar política para inserção por usuários autenticados
CREATE POLICY "seo_metadata_insert_auth" ON seo_metadata
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Criar política para atualização por usuários autenticados
CREATE POLICY "seo_metadata_update_auth" ON seo_metadata
    FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Criar política para exclusão por usuários autenticados
CREATE POLICY "seo_metadata_delete_auth" ON seo_metadata
    FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Garantir que RLS está habilitado
ALTER TABLE seo_metadata ENABLE ROW LEVEL SECURITY;

-- Verificar se as políticas foram aplicadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'seo_metadata'
ORDER BY policyname;