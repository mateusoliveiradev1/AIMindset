-- Migration: Add slug column to articles table
-- This migration adds a slug column for SEO-friendly URLs

-- Add slug column to articles table
ALTER TABLE articles ADD COLUMN slug VARCHAR(255);

-- Create unique index on slug column
CREATE UNIQUE INDEX articles_slug_unique ON articles(slug);

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convert title to lowercase and replace spaces/special chars with hyphens
    base_slug := lower(trim(title));
    base_slug := regexp_replace(base_slug, '[áàâãä]', 'a', 'g');
    base_slug := regexp_replace(base_slug, '[éèêë]', 'e', 'g');
    base_slug := regexp_replace(base_slug, '[íìîï]', 'i', 'g');
    base_slug := regexp_replace(base_slug, '[óòôõö]', 'o', 'g');
    base_slug := regexp_replace(base_slug, '[úùûü]', 'u', 'g');
    base_slug := regexp_replace(base_slug, '[ç]', 'c', 'g');
    base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(base_slug, '-');
    
    -- Ensure slug is not empty
    IF base_slug = '' THEN
        base_slug := 'artigo';
    END IF;
    
    -- Check for uniqueness and add counter if needed
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM articles WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Generate slugs for existing articles
UPDATE articles 
SET slug = generate_slug(title) 
WHERE slug IS NULL;

-- Make slug column NOT NULL after populating existing records
ALTER TABLE articles ALTER COLUMN slug SET NOT NULL;

-- Add comment to the column
COMMENT ON COLUMN articles.slug IS 'SEO-friendly URL slug generated from title';