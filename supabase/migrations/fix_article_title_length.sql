-- Alterar coluna title de character varying para text para evitar truncamento
ALTER TABLE articles ALTER COLUMN title TYPE text;

-- Alterar coluna slug de character varying para text para evitar truncamento
ALTER TABLE articles ALTER COLUMN slug TYPE text;

-- Adicionar comentário explicativo
COMMENT ON COLUMN articles.title IS 'Article title - changed from varchar to text to prevent truncation';
COMMENT ON COLUMN articles.slug IS 'SEO-friendly URL slug - changed from varchar to text to prevent truncation';