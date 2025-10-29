-- Adiciona coluna is_featured_manual para controle manual de destaques
-- Esta coluna permite que admins marquem artigos como destaque fixo (Hero)

ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_featured_manual boolean DEFAULT false;

-- Adiciona comentário para documentar o propósito da coluna
COMMENT ON COLUMN articles.is_featured_manual IS 'Controle manual para marcar artigo como destaque fixo (Hero) - apenas admins podem alterar';

-- Cria índice para otimizar consultas que filtram por is_featured_manual
CREATE INDEX IF NOT EXISTS idx_articles_is_featured_manual ON articles(is_featured_manual) WHERE is_featured_manual = true;