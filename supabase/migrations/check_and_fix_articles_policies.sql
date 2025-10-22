-- Verificar e corrigir políticas RLS para a tabela articles
-- Este script garante que as operações UPDATE funcionem corretamente

-- Primeiro, vamos ver as políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'articles';

-- Remover políticas existentes que podem estar causando problemas
DROP POLICY IF EXISTS "Enable read access for all users" ON articles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON articles;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON articles;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON articles;

-- Criar políticas mais permissivas para operações CRUD
-- Política para SELECT (leitura)
CREATE POLICY "articles_select_policy" ON articles
    FOR SELECT USING (true);

-- Política para INSERT (criação)
CREATE POLICY "articles_insert_policy" ON articles
    FOR INSERT WITH CHECK (true);

-- Política para UPDATE (atualização) - CRÍTICA para resolver o problema
CREATE POLICY "articles_update_policy" ON articles
    FOR UPDATE USING (true) WITH CHECK (true);

-- Política para DELETE (exclusão)
CREATE POLICY "articles_delete_policy" ON articles
    FOR DELETE USING (true);

-- Garantir que RLS está habilitado
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Verificar se as políticas foram criadas corretamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'articles'
ORDER BY policyname;