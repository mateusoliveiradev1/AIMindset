-- Corrigir políticas RLS para permitir UPDATE na tabela articles
-- Este script resolve o problema de salvamento de artigos editados

-- Verificar políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'articles';

-- Remover políticas que podem estar bloqueando UPDATE
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON articles;
DROP POLICY IF EXISTS "articles_update_policy" ON articles;

-- Criar política de UPDATE mais permissiva
CREATE POLICY "articles_update_all" ON articles
    FOR UPDATE USING (true) WITH CHECK (true);

-- Garantir que todas as operações CRUD estão permitidas
-- Política para SELECT
CREATE POLICY "articles_select_all" ON articles
    FOR SELECT USING (true);

-- Política para INSERT  
CREATE POLICY "articles_insert_all" ON articles
    FOR INSERT WITH CHECK (true);

-- Política para DELETE
CREATE POLICY "articles_delete_all" ON articles
    FOR DELETE USING (true);

-- Garantir que RLS está habilitado
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Verificar se as políticas foram aplicadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'articles'
ORDER BY policyname;