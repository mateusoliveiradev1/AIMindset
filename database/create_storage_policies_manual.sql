-- INSTRUÇÕES PARA CORRIGIR O ERRO DE RLS POLICY NO SUPABASE STORAGE
-- Execute este SQL no painel do Supabase (SQL Editor)

-- 1. Primeiro, verificar se RLS está habilitado na tabela storage.objects
-- (Normalmente já está habilitado por padrão)

-- 2. Criar política para permitir upload (INSERT) para usuários autenticados
CREATE POLICY "Allow authenticated users to upload to articles bucket" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'articles');

-- 3. Criar política para permitir leitura pública (SELECT) das imagens
CREATE POLICY "Allow public read access to articles bucket" 
ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'articles');

-- 4. Opcional: Política para permitir UPDATE (caso necessário)
CREATE POLICY "Allow authenticated users to update articles bucket" 
ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'articles')
WITH CHECK (bucket_id = 'articles');

-- 5. Opcional: Política para permitir DELETE (caso necessário)
CREATE POLICY "Allow authenticated users to delete from articles bucket" 
ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'articles');

-- 6. Garantir que o bucket seja público para leitura
UPDATE storage.buckets 
SET public = true 
WHERE id = 'articles';

-- COMO EXECUTAR:
-- 1. Acesse https://supabase.com/dashboard
-- 2. Selecione seu projeto
-- 3. Vá em "SQL Editor" no menu lateral
-- 4. Cole este código e execute
-- 5. Teste o upload de imagem novamente