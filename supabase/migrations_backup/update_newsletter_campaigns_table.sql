-- Adicionar colunas que estão faltando na tabela newsletter_campaigns
ALTER TABLE newsletter_campaigns 
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS recipient_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivered_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bounced_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unsubscribed_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS open_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS click_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS bounce_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS unsubscribe_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Renomear sent_count para recipient_count se necessário
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'newsletter_campaigns' AND column_name = 'sent_count') THEN
        ALTER TABLE newsletter_campaigns RENAME COLUMN sent_count TO recipient_count_old;
    END IF;
END $$;

-- Atualizar o check constraint do status para incluir todos os status
ALTER TABLE newsletter_campaigns DROP CONSTRAINT IF EXISTS newsletter_campaigns_status_check;
ALTER TABLE newsletter_campaigns ADD CONSTRAINT newsletter_campaigns_status_check 
CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled'));

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_status ON newsletter_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_created_at ON newsletter_campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_sent_at ON newsletter_campaigns(sent_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_scheduled_at ON newsletter_campaigns(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_created_by ON newsletter_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_tags ON newsletter_campaigns USING GIN(tags);

-- Atualizar registros existentes com valores padrão
UPDATE newsletter_campaigns 
SET 
    name = COALESCE(name, 'Campanha sem nome'),
    created_by = COALESCE(created_by, 'admin'),
    updated_at = COALESCE(updated_at, created_at),
    recipient_count = COALESCE(recipient_count, 0),
    delivered_count = COALESCE(delivered_count, 0),
    bounced_count = COALESCE(bounced_count, 0),
    unsubscribed_count = COALESCE(unsubscribed_count, 0),
    open_rate = COALESCE(open_rate, 0),
    click_rate = COALESCE(click_rate, 0),
    bounce_rate = COALESCE(bounce_rate, 0),
    unsubscribe_rate = COALESCE(unsubscribe_rate, 0)
WHERE name IS NULL OR created_by IS NULL OR updated_at IS NULL;

-- Inserir algumas campanhas de exemplo se não existirem
INSERT INTO newsletter_campaigns (name, subject, content, status, sent_at, recipient_count, delivered_count, opened_count, clicked_count, open_rate, click_rate, created_by) VALUES
('Bem-vindos ao AIMindset', 'Bem-vindo à nossa comunidade!', '<h1>Bem-vindo!</h1><p>Obrigado por se inscrever em nossa newsletter.</p>', 'sent', NOW() - INTERVAL '7 days', 150, 145, 72, 15, 49.66, 10.34, 'admin'),
('Novidades da Semana', 'As últimas novidades em IA', '<h1>Novidades da Semana</h1><p>Confira as últimas tendências em inteligência artificial.</p>', 'sent', NOW() - INTERVAL '3 days', 148, 142, 68, 12, 47.89, 8.45, 'admin'),
('Dicas de Produtividade', 'Como ser mais produtivo com IA', '<h1>Dicas de Produtividade</h1><p>Aprenda a usar IA para aumentar sua produtividade.</p>', 'sent', NOW() - INTERVAL '1 day', 152, 148, 74, 18, 50.00, 12.16, 'admin'),
('Newsletter Semanal', 'Sua dose semanal de conhecimento', '<h1>Newsletter Semanal</h1><p>Conteúdo exclusivo sobre IA e tecnologia.</p>', 'scheduled', NOW() + INTERVAL '2 days', 155, 0, 0, 0, 0, 0, 'admin'),
('Promoção Especial', 'Oferta limitada - 50% de desconto', '<h1>Promoção Especial</h1><p>Aproveite nossa oferta especial por tempo limitado.</p>', 'draft', NULL, 0, 0, 0, 0, 0, 0, 'admin')
ON CONFLICT (id) DO NOTHING;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_newsletter_campaigns_updated_at
    BEFORE UPDATE ON newsletter_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();