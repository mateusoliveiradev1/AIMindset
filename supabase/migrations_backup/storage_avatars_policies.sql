-- Policies para permitir upload/leitura no bucket 'avatars'
-- Sem criar funções Vercel; apenas configuração no Supabase

-- Leitura pública (útil para exibir avatar)
CREATE POLICY "avatars_select_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Inserção por usuários autenticados
CREATE POLICY "avatars_insert_authenticated"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Atualização por usuários autenticados
CREATE POLICY "avatars_update_authenticated"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- Remoção por usuários autenticados
CREATE POLICY "avatars_delete_authenticated"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars');