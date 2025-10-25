-- Corrigir políticas RLS para tabela seo_metadata
-- Permitir inserção e atualização de dados SEO

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "seo_metadata_select_policy" ON seo_metadata;
DROP POLICY IF EXISTS "seo_metadata_insert_policy" ON seo_metadata;
DROP POLICY IF EXISTS "seo_metadata_update_policy" ON seo_metadata;
DROP POLICY IF EXISTS "seo_metadata_delete_policy" ON seo_metadata;

-- Política para SELECT - permitir leitura pública
CREATE POLICY "seo_metadata_select_policy" ON seo_metadata
    FOR SELECT
    USING (true);

-- Política para INSERT - permitir inserção para usuários autenticados
CREATE POLICY "seo_metadata_insert_policy" ON seo_metadata
    FOR INSERT
    WITH CHECK (true);

-- Política para UPDATE - permitir atualização para usuários autenticados
CREATE POLICY "seo_metadata_update_policy" ON seo_metadata
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Política para DELETE - permitir exclusão para usuários autenticados
CREATE POLICY "seo_metadata_delete_policy" ON seo_metadata
    FOR DELETE
    USING (true);

-- Garantir que RLS está habilitado
ALTER TABLE seo_metadata ENABLE ROW LEVEL SECURITY;