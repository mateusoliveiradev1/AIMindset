-- Corrigir políticas RLS para o bucket 'articles' no Supabase Storage
-- Este script resolve o erro: "new row violates row-level security policy"

-- 1. Habilitar RLS na tabela storage.objects (se não estiver habilitado)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Política para permitir INSERT (upload) para usuários autenticados
CREATE POLICY "Allow authenticated users to upload to articles bucket" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'articles');

-- 3. Política para permitir SELECT (leitura) pública das imagens
CREATE POLICY "Allow public read access to articles bucket" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'articles');

-- 4. Política para permitir UPDATE para usuários autenticados (caso necessário)
CREATE POLICY "Allow authenticated users to update articles bucket" ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'articles')
WITH CHECK (bucket_id = 'articles');

-- 5. Política para permitir DELETE para usuários autenticados (caso necessário)
CREATE POLICY "Allow authenticated users to delete from articles bucket" ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'articles');

-- 6. Garantir que o bucket 'articles' seja público para leitura
UPDATE storage.buckets 
SET public = true 
WHERE id = 'articles';