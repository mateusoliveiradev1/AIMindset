-- Corrigir políticas RLS para seo_metadata
-- Permitir leitura pública sem autenticação

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "seo_metadata_select_policy" ON seo_metadata;
DROP POLICY IF EXISTS "seo_metadata_insert_policy" ON seo_metadata;
DROP POLICY IF EXISTS "seo_metadata_update_policy" ON seo_metadata;
DROP POLICY IF EXISTS "seo_metadata_delete_policy" ON seo_metadata;
DROP POLICY IF EXISTS "Enable read access for all users" ON seo_metadata;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON seo_metadata;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON seo_metadata;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON seo_metadata;

-- Criar política de leitura pública (sem autenticação necessária)
CREATE POLICY "seo_metadata_public_read" ON seo_metadata
    FOR SELECT
    USING (true);

-- Criar política de inserção para usuários autenticados
CREATE POLICY "seo_metadata_authenticated_insert" ON seo_metadata
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Criar política de atualização para usuários autenticados
CREATE POLICY "seo_metadata_authenticated_update" ON seo_metadata
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Criar política de exclusão para usuários autenticados
CREATE POLICY "seo_metadata_authenticated_delete" ON seo_metadata
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Garantir que RLS está habilitado
ALTER TABLE seo_metadata ENABLE ROW LEVEL SECURITY;

-- Inserir alguns dados de exemplo se a tabela estiver vazia
INSERT INTO seo_metadata (page_type, page_slug, title, description, canonical_url, keywords)
VALUES 
    ('category', 'futuro', 'Futuro - AIMindset', 'Explore as tendências e inovações que moldarão o futuro da tecnologia e sociedade.', 'https://aimindset.com/category/futuro', ARRAY['futuro', 'tecnologia', 'inovação', 'tendências']),
    ('category', 'tecnologia', 'Tecnologia - AIMindset', 'Descubra as últimas novidades em tecnologia, gadgets e inovações digitais.', 'https://aimindset.com/category/tecnologia', ARRAY['tecnologia', 'gadgets', 'digital', 'inovação']),
    ('category', 'produtividade', 'Produtividade - AIMindset', 'Dicas e ferramentas para aumentar sua produtividade pessoal e profissional.', 'https://aimindset.com/category/produtividade', ARRAY['produtividade', 'ferramentas', 'eficiência', 'organização']),
    ('category', 'ia-tecnologia', 'IA & Tecnologia - AIMindset', 'Explore o mundo da Inteligência Artificial e suas aplicações tecnológicas.', 'https://aimindset.com/category/ia-tecnologia', ARRAY['inteligência artificial', 'IA', 'machine learning', 'tecnologia']),
    ('category', 'inteligencia-artificial', 'Inteligência Artificial - AIMindset', 'Tudo sobre IA, machine learning e o futuro da inteligência artificial.', 'https://aimindset.com/category/inteligencia-artificial', ARRAY['inteligência artificial', 'IA', 'machine learning', 'deep learning']),
    ('category', 'inovacao', 'Inovação - AIMindset', 'Descubra as inovações que estão transformando o mundo dos negócios e tecnologia.', 'https://aimindset.com/category/inovacao', ARRAY['inovação', 'startup', 'empreendedorismo', 'disrupção']),
    ('category', 'negocios', 'Negócios - AIMindset', 'Estratégias, insights e tendências do mundo dos negócios e empreendedorismo.', 'https://aimindset.com/category/negocios', ARRAY['negócios', 'empreendedorismo', 'estratégia', 'gestão']),
    ('category', 'educacao', 'Educação - AIMindset', 'Transformação digital na educação e novas metodologias de aprendizagem.', 'https://aimindset.com/category/educacao', ARRAY['educação', 'aprendizagem', 'ensino', 'digital'])
ON CONFLICT (page_type, page_slug) DO NOTHING;