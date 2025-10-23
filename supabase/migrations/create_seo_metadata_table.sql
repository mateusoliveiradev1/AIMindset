-- Criar tabela seo_metadata para gerenciar metadados SEO
CREATE TABLE IF NOT EXISTS seo_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_type TEXT NOT NULL CHECK (page_type IN ('home', 'article', 'category', 'about', 'contact', 'newsletter')),
  page_slug TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  og_image TEXT,
  canonical_url TEXT NOT NULL,
  schema_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(page_type, page_slug)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_seo_metadata_page_type ON seo_metadata(page_type);
CREATE INDEX IF NOT EXISTS idx_seo_metadata_page_slug ON seo_metadata(page_slug);
CREATE INDEX IF NOT EXISTS idx_seo_metadata_canonical_url ON seo_metadata(canonical_url);

-- RLS (Row Level Security)
ALTER TABLE seo_metadata ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "seo_metadata_select_policy" ON seo_metadata
  FOR SELECT USING (true);

CREATE POLICY "seo_metadata_insert_policy" ON seo_metadata
  FOR INSERT WITH CHECK (true);

CREATE POLICY "seo_metadata_update_policy" ON seo_metadata
  FOR UPDATE USING (true);

CREATE POLICY "seo_metadata_delete_policy" ON seo_metadata
  FOR DELETE USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_seo_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER seo_metadata_updated_at_trigger
  BEFORE UPDATE ON seo_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_seo_metadata_updated_at();

-- Função para gerar metadados SEO automaticamente para artigos
CREATE OR REPLACE FUNCTION generate_article_seo_metadata()
RETURNS TRIGGER AS $$
DECLARE
  article_category_name TEXT;
  article_keywords TEXT[];
BEGIN
  -- Buscar nome da categoria
  SELECT name INTO article_category_name
  FROM categories
  WHERE id = NEW.category_id;
  
  -- Gerar keywords baseadas nas tags do artigo
  IF NEW.tags IS NOT NULL AND NEW.tags != '' THEN
    article_keywords := string_to_array(NEW.tags, ',');
    -- Limpar espaços em branco
    article_keywords := array(SELECT trim(unnest(article_keywords)));
  ELSE
    article_keywords := ARRAY[]::TEXT[];
  END IF;
  
  -- Adicionar keywords padrão
  article_keywords := article_keywords || ARRAY['inteligência artificial', 'IA', 'produtividade'];
  
  -- Inserir ou atualizar metadados SEO
  INSERT INTO seo_metadata (
    page_type,
    page_slug,
    title,
    description,
    keywords,
    og_image,
    canonical_url,
    schema_data
  ) VALUES (
    'article',
    NEW.slug,
    NEW.title || ' | AIMindset',
    COALESCE(NEW.excerpt, 'Leia sobre ' || NEW.title || ' no AIMindset'),
    article_keywords,
    NEW.featured_image,
    'https://aimindset.com.br/artigo/' || NEW.slug,
    jsonb_build_object(
      '@context', 'https://schema.org',
      '@type', 'BlogPosting',
      'headline', NEW.title,
      'description', COALESCE(NEW.excerpt, ''),
      'image', NEW.featured_image,
      'author', jsonb_build_object(
        '@type', 'Organization',
        'name', 'AIMindset',
        'url', 'https://aimindset.com.br'
      ),
      'publisher', jsonb_build_object(
        '@type', 'Organization',
        'name', 'AIMindset',
        'url', 'https://aimindset.com.br',
        'logo', jsonb_build_object(
          '@type', 'ImageObject',
          'url', 'https://aimindset.com.br/logo.png'
        )
      ),
      'datePublished', NEW.created_at,
      'dateModified', COALESCE(NEW.updated_at, NEW.created_at),
      'mainEntityOfPage', jsonb_build_object(
        '@type', 'WebPage',
        '@id', 'https://aimindset.com.br/artigo/' || NEW.slug
      ),
      'url', 'https://aimindset.com.br/artigo/' || NEW.slug
    )
  )
  ON CONFLICT (page_type, page_slug)
  DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    keywords = EXCLUDED.keywords,
    og_image = EXCLUDED.og_image,
    canonical_url = EXCLUDED.canonical_url,
    schema_data = EXCLUDED.schema_data,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar metadados SEO automaticamente para artigos
CREATE TRIGGER articles_seo_metadata_trigger
  AFTER INSERT OR UPDATE ON articles
  FOR EACH ROW
  WHEN (NEW.status = 'published')
  EXECUTE FUNCTION generate_article_seo_metadata();

-- Função para gerar metadados SEO automaticamente para categorias
CREATE OR REPLACE FUNCTION generate_category_seo_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir ou atualizar metadados SEO
  INSERT INTO seo_metadata (
    page_type,
    page_slug,
    title,
    description,
    keywords,
    canonical_url,
    schema_data
  ) VALUES (
    'category',
    NEW.slug,
    NEW.name || ' | AIMindset',
    COALESCE(NEW.description, 'Artigos sobre ' || NEW.name || ' - Descubra conteúdos relacionados a ' || NEW.name),
    ARRAY[NEW.name, 'categoria', 'artigos', 'inteligência artificial'],
    'https://aimindset.com.br/categoria/' || NEW.slug,
    jsonb_build_object(
      '@context', 'https://schema.org',
      '@type', 'CollectionPage',
      'name', NEW.name,
      'description', COALESCE(NEW.description, ''),
      'url', 'https://aimindset.com.br/categoria/' || NEW.slug,
      'mainEntity', jsonb_build_object(
        '@type', 'ItemList',
        'name', 'Artigos sobre ' || NEW.name,
        'description', COALESCE(NEW.description, '')
      )
    )
  )
  ON CONFLICT (page_type, page_slug)
  DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    keywords = EXCLUDED.keywords,
    canonical_url = EXCLUDED.canonical_url,
    schema_data = EXCLUDED.schema_data,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar metadados SEO automaticamente para categorias
CREATE TRIGGER categories_seo_metadata_trigger
  AFTER INSERT OR UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION generate_category_seo_metadata();

-- Inserir metadados SEO padrão para páginas estáticas
INSERT INTO seo_metadata (page_type, title, description, keywords, canonical_url, schema_data) VALUES
('home', 'AIMindset - Inteligência Artificial e Produtividade', 'Descubra como a IA pode transformar sua produtividade. Artigos, dicas e insights sobre inteligência artificial aplicada ao dia a dia.', ARRAY['inteligência artificial', 'IA', 'produtividade', 'tecnologia', 'automação'], 'https://aimindset.com.br', 
  jsonb_build_object(
    '@context', 'https://schema.org',
    '@type', 'WebSite',
    'name', 'AIMindset',
    'description', 'Descubra como a IA pode transformar sua produtividade. Artigos, dicas e insights sobre inteligência artificial aplicada ao dia a dia.',
    'url', 'https://aimindset.com.br',
    'potentialAction', jsonb_build_object(
      '@type', 'SearchAction',
      'target', 'https://aimindset.com.br/busca?q={search_term_string}',
      'query-input', 'required name=search_term_string'
    )
  )
),
('about', 'Sobre | AIMindset', 'Conheça a missão do AIMindset em democratizar o conhecimento sobre inteligência artificial e produtividade.', ARRAY['sobre', 'missão', 'inteligência artificial', 'equipe'], 'https://aimindset.com.br/sobre',
  jsonb_build_object(
    '@context', 'https://schema.org',
    '@type', 'AboutPage',
    'name', 'Sobre AIMindset',
    'description', 'Conheça a missão do AIMindset em democratizar o conhecimento sobre inteligência artificial e produtividade.',
    'url', 'https://aimindset.com.br/sobre'
  )
),
('contact', 'Contato | AIMindset', 'Entre em contato conosco. Tire suas dúvidas sobre inteligência artificial e produtividade.', ARRAY['contato', 'suporte', 'dúvidas', 'ajuda'], 'https://aimindset.com.br/contato',
  jsonb_build_object(
    '@context', 'https://schema.org',
    '@type', 'ContactPage',
    'name', 'Contato AIMindset',
    'description', 'Entre em contato conosco. Tire suas dúvidas sobre inteligência artificial e produtividade.',
    'url', 'https://aimindset.com.br/contato'
  )
),
('newsletter', 'Newsletter | AIMindset', 'Assine nossa newsletter e receba as últimas novidades sobre inteligência artificial e produtividade.', ARRAY['newsletter', 'assinatura', 'novidades', 'email'], 'https://aimindset.com.br/newsletter',
  jsonb_build_object(
    '@context', 'https://schema.org',
    '@type', 'WebPage',
    'name', 'Newsletter AIMindset',
    'description', 'Assine nossa newsletter e receba as últimas novidades sobre inteligência artificial e produtividade.',
    'url', 'https://aimindset.com.br/newsletter'
  )
)
ON CONFLICT (page_type, page_slug) DO NOTHING;

-- Conceder permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON seo_metadata TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON seo_metadata TO authenticated;