-- Regenerar metadados SEO para todos os artigos
-- Limpar SEO antigo e regenerar com dados atualizados

-- Primeiro, limpar metadados SEO existentes para artigos
DELETE FROM seo_metadata WHERE page_type = 'article';

-- Regenerar SEO para todos os artigos publicados
DO $$ 
DECLARE 
    article_record RECORD;
    seo_title TEXT;
    seo_description TEXT;
    seo_keywords TEXT[];
    canonical_url TEXT;
    schema_data JSONB;
BEGIN
    -- Processar cada artigo publicado
    FOR article_record IN 
        SELECT id, title, excerpt, content, slug, tags, image_url, created_at, updated_at
        FROM articles 
        WHERE published = true
        ORDER BY created_at DESC
    LOOP
        -- Gerar título SEO otimizado
        seo_title := article_record.title || ' | AIMindset - Inteligência Artificial';
        
        -- Gerar descrição SEO
        IF article_record.excerpt IS NOT NULL AND LENGTH(article_record.excerpt) > 50 THEN
            seo_description := LEFT(article_record.excerpt, 150);
        ELSE
            -- Extrair texto do conteúdo HTML
            seo_description := LEFT(
                REGEXP_REPLACE(
                    REGEXP_REPLACE(article_record.content, '<[^>]*>', ' ', 'g'),
                    '\s+', ' ', 'g'
                ), 150
            );
        END IF;
        
        -- Adicionar call-to-action
        IF LENGTH(seo_description) < 130 THEN
            seo_description := seo_description || ' Descubra mais sobre IA e tecnologia.';
        END IF;
        
        -- Gerar keywords
        seo_keywords := ARRAY['inteligência artificial', 'IA', 'tecnologia', 'futuro digital'];
        
        -- Adicionar tags como keywords se existirem
        IF article_record.tags IS NOT NULL AND article_record.tags != '' THEN
            seo_keywords := seo_keywords || string_to_array(
                LOWER(REGEXP_REPLACE(article_record.tags, '\s*,\s*', ',', 'g')), 
                ','
            );
        END IF;
        
        -- URL canônica
        canonical_url := 'https://aimindset.com.br/artigo/' || article_record.slug;
        
        -- Schema.org JSON-LD
        schema_data := jsonb_build_object(
            '@context', 'https://schema.org',
            '@type', 'Article',
            'headline', article_record.title,
            'description', seo_description,
            'author', jsonb_build_object(
                '@type', 'Organization',
                'name', 'AIMindset',
                'url', 'https://aimindset.com.br'
            ),
            'publisher', jsonb_build_object(
                '@type', 'Organization',
                'name', 'AIMindset',
                'logo', jsonb_build_object(
                    '@type', 'ImageObject',
                    'url', 'https://aimindset.com.br/logo.png'
                )
            ),
            'datePublished', article_record.created_at,
            'dateModified', article_record.updated_at,
            'mainEntityOfPage', jsonb_build_object(
                '@type', 'WebPage',
                '@id', canonical_url
            ),
            'image', COALESCE(article_record.image_url, 'https://aimindset.com.br/og-image.jpg'),
            'keywords', array_to_string(seo_keywords, ', ')
        );
        
        -- Inserir metadados SEO
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
            article_record.slug,
            seo_title,
            seo_description,
            seo_keywords,
            COALESCE(article_record.image_url, 'https://aimindset.com.br/og-image.jpg'),
            canonical_url,
            schema_data,
            NOW(),
            NOW()
        );
        
    END LOOP;
    
    RAISE NOTICE 'SEO regenerado para todos os artigos publicados.';
END $$;

-- Atualizar SEO da página inicial se não existir
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
    'home',
    NULL,
    'AIMindset - Portal de Inteligência Artificial e Tecnologia do Futuro',
    'Descubra o futuro da inteligência artificial com artigos, tutoriais e insights sobre IA, machine learning, automação e tecnologias emergentes. Transforme sua produtividade com IA.',
    ARRAY['inteligência artificial', 'IA', 'machine learning', 'automação', 'tecnologia', 'futuro digital', 'produtividade', 'inovação'],
    'https://aimindset.com.br/og-image.jpg',
    'https://aimindset.com.br',
    '{"@context": "https://schema.org", "@type": "WebSite", "name": "AIMindset", "url": "https://aimindset.com.br", "description": "Portal de Inteligência Artificial e Tecnologia"}',
    NOW(),
    NOW()
) ON CONFLICT (page_type, page_slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    keywords = EXCLUDED.keywords,
    updated_at = NOW();