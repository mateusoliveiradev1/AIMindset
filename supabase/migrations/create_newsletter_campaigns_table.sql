-- Criar tabela de campanhas da newsletter
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    template_id UUID REFERENCES email_templates(id),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    recipient_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    unsubscribed_count INTEGER DEFAULT 0,
    open_rate DECIMAL(5,2) DEFAULT 0,
    click_rate DECIMAL(5,2) DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    unsubscribe_rate DECIMAL(5,2) DEFAULT 0,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tags TEXT[],
    metadata JSONB DEFAULT '{}'
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_status ON newsletter_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_created_at ON newsletter_campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_sent_at ON newsletter_campaigns(sent_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_scheduled_at ON newsletter_campaigns(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_created_by ON newsletter_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_tags ON newsletter_campaigns USING GIN(tags);

-- Inserir algumas campanhas de exemplo
INSERT INTO newsletter_campaigns (name, subject, content, status, sent_at, recipient_count, delivered_count, opened_count, clicked_count, open_rate, click_rate, created_by) VALUES
('Bem-vindos ao AIMindset', 'Bem-vindo à nossa comunidade!', '<h1>Bem-vindo!</h1><p>Obrigado por se inscrever em nossa newsletter.</p>', 'sent', NOW() - INTERVAL '7 days', 150, 145, 72, 15, 49.66, 10.34, 'admin'),
('Novidades da Semana', 'As últimas novidades em IA', '<h1>Novidades da Semana</h1><p>Confira as últimas tendências em inteligência artificial.</p>', 'sent', NOW() - INTERVAL '3 days', 148, 142, 68, 12, 47.89, 8.45, 'admin'),
('Dicas de Produtividade', 'Como ser mais produtivo com IA', '<h1>Dicas de Produtividade</h1><p>Aprenda a usar IA para aumentar sua produtividade.</p>', 'sent', NOW() - INTERVAL '1 day', 152, 148, 74, 18, 50.00, 12.16, 'admin'),
('Newsletter Semanal', 'Sua dose semanal de conhecimento', '<h1>Newsletter Semanal</h1><p>Conteúdo exclusivo sobre IA e tecnologia.</p>', 'scheduled', NOW() + INTERVAL '2 days', 155, 0, 0, 0, 0, 0, 'admin'),
('Promoção Especial', 'Oferta limitada - 50% de desconto', '<h1>Promoção Especial</h1><p>Aproveite nossa oferta especial por tempo limitado.</p>', 'draft', NULL, 0, 0, 0, 0, 0, 0, 'admin')
ON CONFLICT DO NOTHING;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_newsletter_campaigns_updated_at
    BEFORE UPDATE ON newsletter_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();