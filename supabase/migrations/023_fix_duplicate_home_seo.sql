-- Corrigir registros duplicados na tabela seo_metadata para page_type='home'

-- 1. Primeiro, vamos identificar e manter apenas o registro mais recente
WITH duplicates AS (
  SELECT 
    id,
    page_type,
    page_slug,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY page_type, COALESCE(page_slug, '') 
      ORDER BY created_at DESC
    ) as rn
  FROM seo_metadata
  WHERE page_type = 'home' AND page_slug IS NULL
)
DELETE FROM seo_metadata 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- 2. Verificar se ainda existem duplicatas e remover se necessário
DELETE FROM seo_metadata a
WHERE a.page_type = 'home' 
  AND a.page_slug IS NULL
  AND EXISTS (
    SELECT 1 FROM seo_metadata b 
    WHERE b.page_type = a.page_type 
      AND b.page_slug IS NULL 
      AND b.id > a.id
  );

-- 3. Garantir que não haverá duplicatas futuras criando um índice único
CREATE UNIQUE INDEX IF NOT EXISTS idx_seo_metadata_unique_page 
ON seo_metadata (page_type, COALESCE(page_slug, ''));

-- 4. Comentário para documentar a correção
COMMENT ON INDEX idx_seo_metadata_unique_page IS 'Previne registros duplicados na tabela seo_metadata para a mesma combinação de page_type e page_slug';