-- Emergency fix for articles table - complete rebuild
-- This will completely fix the boolean type issue

-- First, backup existing data
CREATE TABLE IF NOT EXISTS articles_backup AS SELECT * FROM articles;

-- Drop the problematic table completely
DROP TABLE IF EXISTS articles CASCADE;

-- Recreate the articles table with proper structure
CREATE TABLE articles (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    title text NOT NULL,
    excerpt text NOT NULL,
    content text NOT NULL,
    image_url text,
    category_id uuid REFERENCES categories(id),
    author_id uuid REFERENCES admin_users(id),
    published boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    slug text NOT NULL UNIQUE,
    tags text
);

-- Enable RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Create simple policy for all operations
CREATE POLICY "Enable all operations for articles" ON articles
    FOR ALL USING (true) WITH CHECK (true);

-- Restore data from backup if it exists
INSERT INTO articles (id, title, excerpt, content, image_url, category_id, author_id, published, created_at, updated_at, slug, tags)
SELECT 
    id, 
    title, 
    excerpt, 
    content, 
    image_url, 
    category_id, 
    author_id, 
    CASE 
        WHEN published::text = 'true' OR published::text = '1' THEN true
        ELSE false
    END as published,
    created_at, 
    updated_at, 
    slug, 
    tags
FROM articles_backup
WHERE EXISTS (SELECT 1 FROM articles_backup);

-- Drop backup table
DROP TABLE IF EXISTS articles_backup;

-- Create or replace the safe update function
CREATE OR REPLACE FUNCTION update_article_published_safe(
    article_id uuid,
    new_published boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE articles 
    SET 
        published = new_published,
        updated_at = now()
    WHERE id = article_id;
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to update article: %', SQLERRM;
END;
$$;

-- Grant permissions
GRANT ALL ON articles TO authenticated;
GRANT ALL ON articles TO service_role;
GRANT ALL ON articles TO anon;
GRANT EXECUTE ON FUNCTION update_article_published_safe(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION update_article_published_safe(uuid, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION update_article_published_safe(uuid, boolean) TO anon;