-- Corrigir políticas RLS para tabelas newsletter_logs, newsletter_subscribers e contacts

-- 1. Criar tabela newsletter_logs se não existir
CREATE TABLE IF NOT EXISTS public.newsletter_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recipients_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela newsletter_subscribers se não existir
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela contacts se não existir
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived'))
);

-- 4. Habilitar RLS nas tabelas
ALTER TABLE public.newsletter_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- 5. Remover políticas existentes se houver
DROP POLICY IF EXISTS "Allow public read newsletter_logs" ON public.newsletter_logs;
DROP POLICY IF EXISTS "Allow public insert newsletter_logs" ON public.newsletter_logs;
DROP POLICY IF EXISTS "Allow public update newsletter_logs" ON public.newsletter_logs;
DROP POLICY IF EXISTS "Allow public read newsletter_subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow public insert newsletter_subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow public update newsletter_subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow public read contacts" ON public.contacts;
DROP POLICY IF EXISTS "Allow public insert contacts" ON public.contacts;
DROP POLICY IF EXISTS "Allow public update contacts" ON public.contacts;

-- 6. Criar políticas RLS permissivas para acesso público
-- Newsletter Logs
CREATE POLICY "Allow public read newsletter_logs" ON public.newsletter_logs 
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert newsletter_logs" ON public.newsletter_logs 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update newsletter_logs" ON public.newsletter_logs 
    FOR UPDATE USING (true);

-- Newsletter Subscribers
CREATE POLICY "Allow public read newsletter_subscribers" ON public.newsletter_subscribers 
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert newsletter_subscribers" ON public.newsletter_subscribers 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update newsletter_subscribers" ON public.newsletter_subscribers 
    FOR UPDATE USING (true);

-- Contacts
CREATE POLICY "Allow public read contacts" ON public.contacts 
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert contacts" ON public.contacts 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update contacts" ON public.contacts 
    FOR UPDATE USING (true);

-- 7. Conceder permissões para as roles anon e authenticated
-- Newsletter Logs
GRANT SELECT ON public.newsletter_logs TO anon;
GRANT INSERT ON public.newsletter_logs TO anon;
GRANT UPDATE ON public.newsletter_logs TO anon;
GRANT SELECT ON public.newsletter_logs TO authenticated;
GRANT ALL PRIVILEGES ON public.newsletter_logs TO authenticated;

-- Newsletter Subscribers
GRANT SELECT ON public.newsletter_subscribers TO anon;
GRANT INSERT ON public.newsletter_subscribers TO anon;
GRANT UPDATE ON public.newsletter_subscribers TO anon;
GRANT SELECT ON public.newsletter_subscribers TO authenticated;
GRANT ALL PRIVILEGES ON public.newsletter_subscribers TO authenticated;

-- Contacts
GRANT SELECT ON public.contacts TO anon;
GRANT INSERT ON public.contacts TO anon;
GRANT UPDATE ON public.contacts TO anon;
GRANT SELECT ON public.contacts TO authenticated;
GRANT ALL PRIVILEGES ON public.contacts TO authenticated;