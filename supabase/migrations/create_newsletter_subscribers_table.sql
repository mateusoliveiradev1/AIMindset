-- Criar tabela de inscritos da newsletter
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'unsubscribed')),
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    source VARCHAR(50) DEFAULT 'website' CHECK (source IN ('website', 'manual', 'import', 'api')),
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    last_email_opened_at TIMESTAMP WITH TIME ZONE,
    last_email_clicked_at TIMESTAMP WITH TIME ZONE,
    total_emails_opened INTEGER DEFAULT 0,
    total_emails_clicked INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_subscribed_at ON newsletter_subscribers(subscribed_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_source ON newsletter_subscribers(source);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_tags ON newsletter_subscribers USING GIN(tags);

-- Inserir alguns dados de exemplo
INSERT INTO newsletter_subscribers (email, name, status, source, subscribed_at, total_emails_opened, total_emails_clicked) VALUES
('joao@example.com', 'João Silva', 'active', 'website', NOW() - INTERVAL '30 days', 15, 3),
('maria@example.com', 'Maria Santos', 'active', 'website', NOW() - INTERVAL '15 days', 8, 2),
('pedro@example.com', 'Pedro Costa', 'active', 'manual', NOW() - INTERVAL '7 days', 5, 1),
('ana@example.com', 'Ana Oliveira', 'inactive', 'website', NOW() - INTERVAL '60 days', 2, 0),
('carlos@example.com', 'Carlos Ferreira', 'unsubscribed', 'import', NOW() - INTERVAL '90 days', 10, 2),
('lucia@example.com', 'Lúcia Rodrigues', 'active', 'website', NOW() - INTERVAL '3 days', 3, 1),
('rafael@example.com', 'Rafael Almeida', 'active', 'api', NOW() - INTERVAL '1 day', 1, 0),
('fernanda@example.com', 'Fernanda Lima', 'active', 'website', NOW() - INTERVAL '45 days', 20, 5),
('gustavo@example.com', 'Gustavo Pereira', 'active', 'manual', NOW() - INTERVAL '20 days', 12, 3),
('camila@example.com', 'Camila Souza', 'active', 'website', NOW() - INTERVAL '10 days', 7, 1)
ON CONFLICT (email) DO NOTHING;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_newsletter_subscribers_updated_at
    BEFORE UPDATE ON newsletter_subscribers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();