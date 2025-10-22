-- Verificar e corrigir políticas RLS para newsletter_logs
-- Permitir leitura para usuários autenticados (admin)

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Allow authenticated users to read newsletter_logs" ON newsletter_logs;
DROP POLICY IF EXISTS "Allow service role to manage newsletter_logs" ON newsletter_logs;

-- Criar política para leitura por usuários autenticados
CREATE POLICY "Allow authenticated users to read newsletter_logs" ON newsletter_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Criar política para service role gerenciar tudo
CREATE POLICY "Allow service role to manage newsletter_logs" ON newsletter_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Garantir que RLS está habilitado
ALTER TABLE newsletter_logs ENABLE ROW LEVEL SECURITY;