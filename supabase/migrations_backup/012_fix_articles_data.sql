-- Correção de dados dos artigos
-- Corrigir títulos vazios ou genéricos

DO $$ 
DECLARE 
    article_record RECORD;
    new_title TEXT;
    new_slug TEXT;
    counter INTEGER := 1;
BEGIN
    -- Buscar artigos com problemas
    FOR article_record IN 
        SELECT id, title, slug, excerpt, content 
        FROM articles 
        WHERE title IS NULL 
           OR title = '' 
           OR title = 'artigo'
           OR slug IS NULL 
           OR slug = ''
           OR excerpt IS NULL 
           OR excerpt = ''
           OR content IS NULL 
           OR content = ''
    LOOP
        -- Gerar novo título se necessário
        IF article_record.title IS NULL OR article_record.title = '' OR article_record.title = 'artigo' THEN
            new_title := 'Artigo sobre Inteligência Artificial #' || counter;
        ELSE
            new_title := article_record.title;
        END IF;
        
        -- Gerar novo slug se necessário
        IF article_record.slug IS NULL OR article_record.slug = '' THEN
            new_slug := 'artigo-ia-' || counter;
        ELSE
            new_slug := article_record.slug;
        END IF;
        
        -- Atualizar artigo
        UPDATE articles 
        SET 
            title = CASE 
                WHEN title IS NULL OR title = '' OR title = 'artigo' 
                THEN new_title 
                ELSE title 
            END,
            slug = CASE 
                WHEN slug IS NULL OR slug = '' 
                THEN new_slug 
                ELSE slug 
            END,
            excerpt = CASE 
                WHEN excerpt IS NULL OR excerpt = '' 
                THEN 'Descubra insights valiosos sobre inteligência artificial e como ela pode transformar sua produtividade e trabalho no futuro digital.'
                ELSE excerpt 
            END,
            content = CASE 
                WHEN content IS NULL OR content = '' 
                THEN '<h2>Conteúdo sobre Inteligência Artificial</h2><p>Este artigo explora os conceitos fundamentais da inteligência artificial e suas aplicações práticas no mundo moderno.</p><p>A IA está revolucionando diversos setores, desde a automação de processos até a criação de soluções inovadoras para problemas complexos.</p>'
                ELSE content 
            END,
            updated_at = NOW()
        WHERE id = article_record.id;
        
        counter := counter + 1;
    END LOOP;
    
    RAISE NOTICE 'Correção de dados concluída. % artigos processados.', counter - 1;
END $$;

-- Garantir que todos os artigos tenham dados mínimos
UPDATE articles 
SET 
    title = COALESCE(NULLIF(title, ''), 'Artigo sobre IA'),
    excerpt = COALESCE(NULLIF(excerpt, ''), 'Descubra insights sobre inteligência artificial.'),
    content = COALESCE(NULLIF(content, ''), '<p>Conteúdo sobre inteligência artificial.</p>'),
    updated_at = NOW()
WHERE title IS NULL 
   OR title = '' 
   OR excerpt IS NULL 
   OR excerpt = '' 
   OR content IS NULL 
   OR content = '';