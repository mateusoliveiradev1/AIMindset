-- Atualizar tabela seo_metadata para incluir novos tipos de página
-- e criar triggers para automação de SEO

-- 1. Atualizar constraint para incluir novos tipos de página
ALTER TABLE seo_metadata 
DROP CONSTRAINT IF EXISTS seo_metadata_page_type_check;

ALTER TABLE seo_metadata 
ADD CONSTRAINT seo_metadata_page_type_check 
CHECK (page_type = ANY (ARRAY[
  'home'::text, 
  'article'::text, 
  'category'::text, 
  'about'::text, 
  'contact'::text, 
  'newsletter'::text, 
  'privacy'::text,
  'all_articles'::text,
  'admin'::text
]));

-- 2. Criar função para gerar SEO automático para artigos
CREATE OR REPLACE FUNCTION generate_article_seo()
RETURNS TRIGGER AS $$
DECLARE
  article_keywords text[];
  article_description text;
  article_title text;
  canonical_url text;
  og_image_url text;
  schema_data jsonb;
BEGIN
  -- Gerar título SEO
  article_title := NEW.title || ' | AIMindset';
  
  -- Gerar descrição SEO (usar excerpt ou truncar conteúdo)
  IF NEW.excerpt IS NOT NULL AND LENGTH(NEW.excerpt) > 0 THEN
    article_description := NEW.excerpt;
  ELSE
    -- Extrair primeiros 150 caracteres do conteúdo, removendo HTML
    article_description := LEFT(
      REGEXP_REPLACE(NEW.content, '<[^>]*>', ' ', 'g'), 
      150
    ) || '...';
  END IF;
  
  -- Adicionar call-to-action se houver espaço
  IF LENGTH(article_description) < 130 THEN
    article_description := article_description || ' Leia mais no AIMindset.';
  END IF;
  
  -- Gerar keywords (usar tags ou palavras do título)
  IF NEW.tags IS NOT NULL AND LENGTH(NEW.tags) > 0 THEN
    -- Converter tags em array
    article_keywords := string_to_array(NEW.tags, ',');
    -- Limpar espaços em branco
    FOR i IN 1..array_length(article_keywords, 1) LOOP
      article_keywords[i] := trim(article_keywords[i]);
    END LOOP;
  ELSE
    -- Usar palavras do título como keywords
    article_keywords := string_to_array(
      lower(regexp_replace(NEW.title, '[^\w\s]', ' ', 'g')), 
      ' '
    );
  END IF;
  
  -- Adicionar keywords padrão
  article_keywords := article_keywords || ARRAY[
    'inteligência artificial', 
    'IA', 
    'produtividade', 
    'automação', 
    'tecnologia'
  ];
  
  -- Remover duplicatas e limitar a 10 keywords
  article_keywords := (
    SELECT ARRAY(
      SELECT DISTINCT unnest(article_keywords) 
      LIMIT 10
    )
  );
  
  -- Gerar URL canônica
  canonical_url := 'https://aimindset.com.br/artigo/' || NEW.slug;
  
  -- Definir imagem OG
  og_image_url := COALESCE(
    NEW.image_url,
    'https://aimindset.com.br/api/og?title=' || encode(NEW.title::bytea, 'escape') || '&type=article'
  );
  
  -- Gerar Schema.org JSON-LD
  schema_data := jsonb_build_object(
    '@context', 'https://schema.org',
    '@type', 'BlogPosting',
    'headline', NEW.title,
    'description', article_description,
    'image', og_image_url,
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
      '@id', canonical_url
    ),
    'url', canonical_url,
    'keywords', array_to_string(article_keywords, ', ')
  );
  
  -- Inserir ou atualizar metadados SEO
  INSERT INTO seo_metadata (
    page_type,
    page_slug,
    title,
    description,
    keywords,
    og_image,
    canonical_url,
    schema_data,
    created_at,
    updated_at
  ) VALUES (
    'article',
    NEW.slug,
    article_title,
    article_description,
    article_keywords,
    og_image_url,
    canonical_url,
    schema_data,
    NOW(),
    NOW()
  )
  ON CONFLICT (page_type, COALESCE(page_slug, ''))
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

-- 3. Criar trigger para novos artigos
DROP TRIGGER IF EXISTS trigger_generate_article_seo ON articles;
CREATE TRIGGER trigger_generate_article_seo
  AFTER INSERT OR UPDATE ON articles
  FOR EACH ROW
  WHEN (NEW.published = true)
  EXECUTE FUNCTION generate_article_seo();

-- 4. Criar função para atualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS trigger_update_seo_metadata_updated_at ON seo_metadata;
CREATE TRIGGER trigger_update_seo_metadata_updated_at
  BEFORE UPDATE ON seo_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_seo_metadata_page_type_slug 
ON seo_metadata (page_type, page_slug);

CREATE INDEX IF NOT EXISTS idx_seo_metadata_updated_at 
ON seo_metadata (updated_at DESC);

-- 7. Inserir metadados SEO para páginas estáticas (se não existirem)
INSERT INTO seo_metadata (page_type, page_slug, title, description, keywords, canonical_url, schema_data)
VALUES 
  (
    'newsletter', 
    NULL, 
    'Newsletter AIMindset - Receba Conteúdo Exclusivo sobre IA',
    'Inscreva-se na newsletter da AIMindset e receba semanalmente conteúdo exclusivo sobre Inteligência Artificial, Machine Learning e tecnologia.',
    ARRAY['newsletter', 'inscrição', 'conteúdo exclusivo', 'inteligência artificial', 'IA', 'machine learning'],
    'https://aimindset.com.br/newsletter',
    jsonb_build_object(
      '@context', 'https://schema.org',
      '@type', 'WebPage',
      'name', 'Newsletter AIMindset',
      'description', 'Inscreva-se na newsletter da AIMindset e receba conteúdo exclusivo sobre IA',
      'url', 'https://aimindset.com.br/newsletter'
    )
  ),
  (
    'all_articles', 
    NULL, 
    'Todos os Artigos sobre IA e Machine Learning | AIMindset',
    'Explore nossa biblioteca completa de artigos sobre Inteligência Artificial, Machine Learning, Deep Learning e tecnologia. Conteúdo atualizado regularmente.',
    ARRAY['artigos IA', 'machine learning', 'deep learning', 'biblioteca', 'inteligência artificial', 'tecnologia'],
    'https://aimindset.com.br/artigos',
    jsonb_build_object(
      '@context', 'https://schema.org',
      '@type', 'CollectionPage',
      'name', 'Todos os Artigos - AIMindset',
      'description', 'Biblioteca completa de artigos sobre Inteligência Artificial e tecnologia',
      'url', 'https://aimindset.com.br/artigos'
    )
  ),
  (
    'admin', 
    NULL, 
    'Painel Administrativo - AIMindset',
    'Área administrativa do AIMindset',
    ARRAY['admin', 'painel'],
    'https://aimindset.com.br/admin',
    jsonb_build_object(
      '@context', 'https://schema.org',
      '@type', 'WebPage',
      'name', 'Painel Administrativo',
      'description', 'Área administrativa do AIMindset',
      'url', 'https://aimindset.com.br/admin'
    )
  )
ON CONFLICT (page_type, COALESCE(page_slug, '')) DO NOTHING;

-- 8. Comentários para documentação
COMMENT ON FUNCTION generate_article_seo() IS 'Gera automaticamente metadados SEO para artigos publicados';
COMMENT ON TRIGGER trigger_generate_article_seo ON articles IS 'Trigger que executa geração automática de SEO quando artigo é publicado';
COMMENT ON INDEX idx_seo_metadata_page_type_slug IS 'Índice para busca eficiente de metadados SEO por tipo e slug';