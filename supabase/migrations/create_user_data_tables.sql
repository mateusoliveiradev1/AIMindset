-- Criar tabela para perfis de usuário
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    newsletter_preference BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela para preferências de cookies
CREATE TABLE IF NOT EXISTS cookie_preferences (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    essential BOOLEAN DEFAULT true,
    analytics BOOLEAN DEFAULT false,
    marketing BOOLEAN DEFAULT false,
    personalization BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_email)
);

-- Criar tabela para solicitações de privacidade
CREATE TABLE IF NOT EXISTS privacy_requests (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('data_download', 'data_edit', 'data_deletion', 'processing_limitation', 'privacy_contact')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    request_data JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security) para as tabelas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cookie_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_requests ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS básicas (permitir acesso público por enquanto)
CREATE POLICY "Allow public access to user_profiles" ON user_profiles FOR ALL USING (true);
CREATE POLICY "Allow public access to cookie_preferences" ON cookie_preferences FOR ALL USING (true);
CREATE POLICY "Allow public access to privacy_requests" ON privacy_requests FOR ALL USING (true);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_cookie_preferences_user_email ON cookie_preferences(user_email);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_user_email ON privacy_requests(user_email);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_type ON privacy_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_status ON privacy_requests(status);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para atualizar updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cookie_preferences_updated_at BEFORE UPDATE ON cookie_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_privacy_requests_updated_at BEFORE UPDATE ON privacy_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();