-- scripts/database/create_programmatic_pages.sql

-- Tabela para armazenar definições de páginas pSEO (Programmatic SEO)
CREATE TABLE IF NOT EXISTS public.programmatic_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name TEXT NOT NULL, -- Ex: "Comparison: {tool1} vs {tool2}"
    slug TEXT UNIQUE NOT NULL,
    page_type TEXT NOT NULL, -- Ex: "comparison", "listicle", "guide"
    variables JSONB DEFAULT '{}', -- Variáveis usadas no template
    content TEXT, -- Conteúdo gerado pelo Gemini
    meta_title TEXT,
    meta_description TEXT,
    keywords TEXT[],
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.programmatic_pages ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
-- Todos podem ver páginas publicadas
CREATE POLICY "Public can view published pSEO pages" ON public.programmatic_pages
    FOR SELECT USING (is_published = true);

-- Apenas admins podem fazer tudo
CREATE POLICY "Admins have full access to pSEO pages" ON public.programmatic_pages
    FOR ALL USING (auth.role() = 'authenticated');

-- Trigger para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_programmatic_pages_updated_at
    BEFORE UPDATE ON public.programmatic_pages
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
