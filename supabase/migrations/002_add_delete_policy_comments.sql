-- Adicionar política de DELETE para comentários
-- Permitir que qualquer usuário autenticado possa deletar comentários (para administradores)

CREATE POLICY "Allow authenticated delete comments" ON public.comments 
    FOR DELETE USING (true);

-- Comentário: Esta política permite que usuários autenticados deletem comentários
-- Em um ambiente de produção, você pode querer restringir isso apenas para administradores
-- usando uma verificação de role ou uma tabela de permissões