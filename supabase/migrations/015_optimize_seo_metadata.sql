-- Otimização completa dos metadados SEO
-- Criado em: 2025-01-20

-- 1. Atualizar SEO para artigos com conteúdo curto
UPDATE seo_metadata 
SET 
  title = 'Automação com IA: 10 Ferramentas Revolucionárias para Transformar Seu Trabalho em 2025',
  description = 'Descubra as 10 melhores ferramentas de automação baseadas em IA que estão revolucionando o mercado de trabalho. Aumente sua produtividade, reduza tarefas repetitivas e transforme sua carreira com inteligência artificial.',
  keywords = ARRAY['automação com ia', 'ferramentas de automação', 'inteligência artificial', 'produtividade', 'tecnologia 2025', 'ai tools', 'automação de processos', 'eficiência no trabalho', 'inovação tecnológica', 'transformação digital'],
  canonical_url = 'https://aimindset.com.br/artigo/automacao-ia-10-ferramentas-revolucionar-trabalho',
  schema_data = jsonb_build_object(
    '@context', 'https://schema.org',
    '@type', 'Article',
    'headline', 'Automação com IA: 10 Ferramentas Revolucionárias para Transformar Seu Trabalho em 2025',
    'description', 'Descubra as 10 melhores ferramentas de automação baseadas em IA que estão revolucionando o mercado de trabalho. Aumente sua produtividade, reduza tarefas repetitivas e transforme sua carreira com inteligência artificial.',
    'author', jsonb_build_object(
      '@type', 'Person',
      'name', 'AIMindset Team',
      'url', 'https://aimindset.com.br/sobre'
    ),
    'publisher', jsonb_build_object(
      '@type', 'Organization',
      'name', 'AIMindset',
      'logo', jsonb_build_object(
        '@type', 'ImageObject',
        'url', 'https://aimindset.com.br/logo.png'
      )
    ),
    'mainEntityOfPage', jsonb_build_object(
      '@type', 'WebPage',
      '@id', 'https://aimindset.com.br/artigo/automacao-ia-10-ferramentas-revolucionar-trabalho'
    ),
    'url', 'https://aimindset.com.br/artigo/automacao-ia-10-ferramentas-revolucionar-trabalho',
    'keywords', 'automação com ia, ferramentas de automação, inteligência artificial, produtividade, tecnologia 2025'
  ),
  updated_at = NOW()
WHERE page_type = 'article' AND page_slug = 'automacao-ia-10-ferramentas-revolucionar-trabalho';

UPDATE seo_metadata 
SET 
  title = 'Machine Learning para Iniciantes: Guia Completo e Prático 2025',
  description = 'Aprenda Machine Learning do zero com nosso guia completo para iniciantes. Inclui Python, algoritmos, projetos práticos e tudo que você precisa para começar sua jornada na inteligência artificial.',
  keywords = ARRAY['machine learning iniciantes', 'aprendizado de máquina', 'python machine learning', 'algoritmos ml', 'guia machine learning', 'ia para iniciantes', 'ciência de dados', 'deep learning', 'tutorial ml', 'curso machine learning'],
  canonical_url = 'https://aimindset.com.br/artigo/machine-learning-iniciantes-guia-completo-2025',
  schema_data = jsonb_build_object(
    '@context', 'https://schema.org',
    '@type', 'Article',
    'headline', 'Machine Learning para Iniciantes: Guia Completo e Prático 2025',
    'description', 'Aprenda Machine Learning do zero com nosso guia completo para iniciantes. Inclui Python, algoritmos, projetos práticos e tudo que você precisa para começar sua jornada na inteligência artificial.',
    'author', jsonb_build_object(
      '@type', 'Person',
      'name', 'AIMindset Team',
      'url', 'https://aimindset.com.br/sobre'
    ),
    'publisher', jsonb_build_object(
      '@type', 'Organization',
      'name', 'AIMindset',
      'logo', jsonb_build_object(
        '@type', 'ImageObject',
        'url', 'https://aimindset.com.br/logo.png'
      )
    ),
    'mainEntityOfPage', jsonb_build_object(
      '@type', 'WebPage',
      '@id', 'https://aimindset.com.br/artigo/machine-learning-iniciantes-guia-completo-2025'
    ),
    'url', 'https://aimindset.com.br/artigo/machine-learning-iniciantes-guia-completo-2025',
    'keywords', 'machine learning iniciantes, aprendizado de máquina, python machine learning, algoritmos ml'
  ),
  updated_at = NOW()
WHERE page_type = 'article' AND page_slug = 'machine-learning-iniciantes-guia-completo-2025';

-- 2. Otimizar SEO da página inicial
UPDATE seo_metadata 
SET 
  title = 'AIMindset - Portal de Inteligência Artificial e Produtividade Digital',
  description = 'Descubra o futuro da inteligência artificial no AIMindset. Tutoriais, ferramentas, dicas de produtividade e as últimas tendências em IA para transformar sua vida pessoal e profissional.',
  keywords = ARRAY['inteligência artificial', 'aimindset', 'produtividade digital', 'ferramentas de ia', 'chatgpt', 'machine learning', 'automação', 'tecnologia', 'inovação', 'ai tools', 'tutoriais ia', 'dicas produtividade'],
  canonical_url = 'https://aimindset.com.br',
  schema_data = jsonb_build_object(
    '@context', 'https://schema.org',
    '@type', 'WebSite',
    'name', 'AIMindset',
    'description', 'Portal de Inteligência Artificial e Produtividade Digital',
    'url', 'https://aimindset.com.br',
    'publisher', jsonb_build_object(
      '@type', 'Organization',
      'name', 'AIMindset',
      'logo', jsonb_build_object(
        '@type', 'ImageObject',
        'url', 'https://aimindset.com.br/logo.png'
      )
    ),
    'potentialAction', jsonb_build_object(
      '@type', 'SearchAction',
      'target', 'https://aimindset.com.br/buscar?q={search_term_string}',
      'query-input', 'required name=search_term_string'
    ),
    'sameAs', jsonb_build_array(
      'https://twitter.com/aimindset',
      'https://linkedin.com/company/aimindset',
      'https://instagram.com/aimindset'
    )
  ),
  updated_at = NOW()
WHERE page_type = 'home' AND page_slug IS NULL;

-- 3. Melhorar SEO das categorias principais
UPDATE seo_metadata 
SET 
  title = 'Inteligência Artificial - Guias, Tutoriais e Tendências IA | AIMindset',
  description = 'Explore o mundo da inteligência artificial com nossos guias completos, tutoriais práticos e análises das últimas tendências em IA. Aprenda sobre ChatGPT, machine learning, deep learning e muito mais.',
  keywords = ARRAY['inteligência artificial', 'ia tutoriais', 'chatgpt', 'machine learning', 'deep learning', 'redes neurais', 'algoritmos ia', 'automação inteligente', 'processamento linguagem natural', 'visão computacional', 'ia generativa'],
  canonical_url = 'https://aimindset.com.br/categoria/inteligencia-artificial',
  schema_data = jsonb_build_object(
    '@context', 'https://schema.org',
    '@type', 'CollectionPage',
    'name', 'Inteligência Artificial - AIMindset',
    'description', 'Explore o mundo da inteligência artificial com nossos guias completos, tutoriais práticos e análises das últimas tendências em IA.',
    'url', 'https://aimindset.com.br/categoria/inteligencia-artificial',
    'mainEntity', jsonb_build_object(
      '@type', 'ItemList',
      'name', 'Artigos sobre Inteligência Artificial'
    )
  ),
  updated_at = NOW()
WHERE page_type = 'category' AND page_slug = 'inteligencia-artificial';

UPDATE seo_metadata 
SET 
  title = 'Produtividade Digital - Ferramentas e Técnicas para Máxima Eficiência | AIMindset',
  description = 'Descubra as melhores ferramentas, técnicas e estratégias para aumentar sua produtividade digital. Aprenda automação, gestão de tempo, organização pessoal e muito mais.',
  keywords = ARRAY['produtividade digital', 'ferramentas produtividade', 'automação pessoal', 'gestão tempo', 'organização pessoal', 'eficiência trabalho', 'apps produtividade', 'técnicas produtividade', 'workflow otimizado', 'produtividade ia'],
  canonical_url = 'https://aimindset.com.br/categoria/produtividade',
  schema_data = jsonb_build_object(
    '@context', 'https://schema.org',
    '@type', 'CollectionPage',
    'name', 'Produtividade Digital - AIMindset',
    'description', 'Descubra as melhores ferramentas, técnicas e estratégias para aumentar sua produtividade digital.',
    'url', 'https://aimindset.com.br/categoria/produtividade',
    'mainEntity', jsonb_build_object(
      '@type', 'ItemList',
      'name', 'Artigos sobre Produtividade Digital'
    )
  ),
  updated_at = NOW()
WHERE page_type = 'category' AND page_slug = 'produtividade';

-- 4. Otimizar páginas institucionais
UPDATE seo_metadata 
SET 
  title = 'Sobre o AIMindset - Democratizando a Inteligência Artificial',
  description = 'Conheça a missão do AIMindset: democratizar o conhecimento sobre inteligência artificial e ajudar pessoas a serem mais produtivas. Nossa equipe, valores e visão para o futuro da IA.',
  keywords = ARRAY['sobre aimindset', 'missão aimindset', 'equipe aimindset', 'democratizar ia', 'educação inteligência artificial', 'valores aimindset', 'visão futuro ia', 'portal ia brasil'],
  canonical_url = 'https://aimindset.com.br/sobre',
  schema_data = jsonb_build_object(
    '@context', 'https://schema.org',
    '@type', 'AboutPage',
    'name', 'Sobre o AIMindset',
    'description', 'Conheça a missão do AIMindset: democratizar o conhecimento sobre inteligência artificial e ajudar pessoas a serem mais produtivas.',
    'url', 'https://aimindset.com.br/sobre',
    'mainEntity', jsonb_build_object(
      '@type', 'Organization',
      'name', 'AIMindset',
      'description', 'Portal dedicado à democratização do conhecimento sobre inteligência artificial',
      'url', 'https://aimindset.com.br',
      'foundingDate', '2024',
      'knowsAbout', jsonb_build_array(
        'Inteligência Artificial',
        'Machine Learning',
        'Produtividade Digital',
        'Automação',
        'ChatGPT'
      )
    )
  ),
  updated_at = NOW()
WHERE page_type = 'about' AND page_slug = 'home';

-- 5. Criar SEO otimizado para artigos que ainda não têm metadados
INSERT INTO seo_metadata (page_type, page_slug, title, description, keywords, canonical_url, schema_data, created_at, updated_at)
SELECT 
  'article' as page_type,
  a.slug as page_slug,
  CASE 
    WHEN a.slug = 'automacao-ia-10-ferramentas-revolucionar-trabalho' THEN 'Automação com IA: 10 Ferramentas Revolucionárias para Transformar Seu Trabalho em 2025'
    WHEN a.slug = 'machine-learning-iniciantes-guia-completo-2025' THEN 'Machine Learning para Iniciantes: Guia Completo e Prático 2025'
    ELSE a.title || ' | AIMindset'
  END as title,
  CASE 
    WHEN a.slug = 'automacao-ia-10-ferramentas-revolucionar-trabalho' THEN 'Descubra as 10 melhores ferramentas de automação baseadas em IA que estão revolucionando o mercado de trabalho. Aumente sua produtividade, reduza tarefas repetitivas e transforme sua carreira com inteligência artificial.'
    WHEN a.slug = 'machine-learning-iniciantes-guia-completo-2025' THEN 'Aprenda Machine Learning do zero com nosso guia completo para iniciantes. Inclui Python, algoritmos, projetos práticos e tudo que você precisa para começar sua jornada na inteligência artificial.'
    ELSE LEFT(a.excerpt, 155) || '...'
  END as description,
  CASE 
    WHEN a.slug = 'automacao-ia-10-ferramentas-revolucionar-trabalho' THEN ARRAY['automação com ia', 'ferramentas de automação', 'inteligência artificial', 'produtividade', 'tecnologia 2025', 'ai tools', 'automação de processos', 'eficiência no trabalho', 'inovação tecnológica', 'transformação digital']
    WHEN a.slug = 'machine-learning-iniciantes-guia-completo-2025' THEN ARRAY['machine learning iniciantes', 'aprendizado de máquina', 'python machine learning', 'algoritmos ml', 'guia machine learning', 'ia para iniciantes', 'ciência de dados', 'deep learning', 'tutorial ml', 'curso machine learning']
    ELSE string_to_array(COALESCE(a.tags, 'inteligência artificial,produtividade,tecnologia'), ',')
  END as keywords,
  'https://aimindset.com.br/artigo/' || a.slug as canonical_url,
  jsonb_build_object(
    '@context', 'https://schema.org',
    '@type', 'Article',
    'headline', a.title,
    'description', LEFT(a.excerpt, 155),
    'author', jsonb_build_object(
      '@type', 'Person',
      'name', 'AIMindset Team',
      'url', 'https://aimindset.com.br/sobre'
    ),
    'publisher', jsonb_build_object(
      '@type', 'Organization',
      'name', 'AIMindset',
      'logo', jsonb_build_object(
        '@type', 'ImageObject',
        'url', 'https://aimindset.com.br/logo.png'
      )
    ),
    'datePublished', a.created_at,
    'dateModified', COALESCE(a.updated_at, a.created_at),
    'mainEntityOfPage', jsonb_build_object(
      '@type', 'WebPage',
      '@id', 'https://aimindset.com.br/artigo/' || a.slug
    ),
    'url', 'https://aimindset.com.br/artigo/' || a.slug,
    'keywords', COALESCE(a.tags, 'inteligência artificial,produtividade,tecnologia')
  ) as schema_data,
  NOW() as created_at,
  NOW() as updated_at
FROM articles a
WHERE a.published = true 
  AND NOT EXISTS (
    SELECT 1 FROM seo_metadata s 
    WHERE s.page_type = 'article' AND s.page_slug = a.slug
  );

-- 6. Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_seo_metadata_page_type_slug ON seo_metadata(page_type, page_slug);
CREATE INDEX IF NOT EXISTS idx_seo_metadata_updated_at ON seo_metadata(updated_at);

-- 7. Atualizar timestamp de modificação
UPDATE seo_metadata SET updated_at = NOW() WHERE updated_at < NOW() - INTERVAL '1 day';

-- Comentário final
-- Esta migração otimiza completamente o SEO do site:
-- - Melhora títulos e descrições dos artigos
-- - Adiciona keywords estratégicas
-- - Implementa Schema.org completo
-- - Otimiza páginas institucionais
-- - Cria metadados para artigos sem SEO
-- - Adiciona índices para performance