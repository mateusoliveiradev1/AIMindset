-- Corrigir configuração do bucket 'articles' para permitir uploads
-- Este script resolve o erro de RLS policy no upload

-- Garantir que o bucket 'articles' seja público para leitura
UPDATE storage.buckets 
SET public = true 
WHERE id = 'articles';

-- Inserir políticas RLS para o bucket articles (usando INSERT INTO ao invés de CREATE POLICY)
-- Política para upload (INSERT) por usuários autenticados
INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition, command, roles)
VALUES (
  'articles_upload_policy',
  'articles',
  'Allow authenticated users to upload to articles bucket',
  'bucket_id = ''articles''',
  'bucket_id = ''articles''',
  'INSERT',
  '{authenticated}'
) ON CONFLICT (id) DO NOTHING;

-- Política para leitura pública (SELECT)
INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition, command, roles)
VALUES (
  'articles_read_policy',
  'articles',
  'Allow public read access to articles bucket',
  'bucket_id = ''articles''',
  NULL,
  'SELECT',
  '{public, authenticated}'
) ON CONFLICT (id) DO NOTHING;