-- =====================================================
-- Sistema de Logs Completo + Alertas Automáticos
-- AIMindset - Migração 001
-- =====================================================

-- 1. TABELA BACKEND_LOGS
-- Registra mudanças nas tabelas do banco de dados
CREATE TABLE IF NOT EXISTS backend_logs (
    id BIGSERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    record_id BIGINT,
    old_data JSONB,
    new_data JSONB,
    performed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance da tabela backend_logs
CREATE INDEX IF NOT EXISTS idx_backend_logs_table_name ON backend_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_backend_logs_created_at ON backend_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backend_logs_action ON backend_logs(action);
CREATE INDEX IF NOT EXISTS idx_backend_logs_record_id ON backend_logs(record_id);

-- 2. TABELA APP_LOGS
-- Registra eventos da aplicação (frontend/admin)
CREATE TABLE IF NOT EXISTS app_logs (
    id BIGSERIAL PRIMARY KEY,
    level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error')),
    source TEXT NOT NULL,
    action TEXT NOT NULL,
    details JSONB,
    user_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance da tabela app_logs
CREATE INDEX IF NOT EXISTS idx_app_logs_level ON app_logs(level);
CREATE INDEX IF NOT EXISTS idx_app_logs_source ON app_logs(source);
CREATE INDEX IF NOT EXISTS idx_app_logs_created_at ON app_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_logs_user_id ON app_logs(user_id);

-- 3. TABELA SYSTEM_LOGS
-- Registra eventos do sistema (API, builds, integrações)
CREATE TABLE IF NOT EXISTS system_logs (
    id BIGSERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    context JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance da tabela system_logs
CREATE INDEX IF NOT EXISTS idx_system_logs_type ON system_logs(type);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);

-- 4. TABELA ALERT_SUBSCRIPTIONS
-- Armazena e-mails para receber alertas automáticos
CREATE TABLE IF NOT EXISTS alert_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance da tabela alert_subscriptions
CREATE INDEX IF NOT EXISTS idx_alert_subscriptions_email ON alert_subscriptions(email);

-- =====================================================
-- PERMISSÕES SUPABASE (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE backend_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_subscriptions ENABLE ROW LEVEL SECURITY;

-- Permissões básicas para anon (leitura)
GRANT SELECT ON backend_logs TO anon;
GRANT SELECT ON app_logs TO anon;
GRANT SELECT ON system_logs TO anon;
GRANT SELECT ON alert_subscriptions TO anon;

-- Permissões completas para authenticated (admin)
GRANT ALL PRIVILEGES ON backend_logs TO authenticated;
GRANT ALL PRIVILEGES ON app_logs TO authenticated;
GRANT ALL PRIVILEGES ON system_logs TO authenticated;
GRANT ALL PRIVILEGES ON alert_subscriptions TO authenticated;

-- Permissões para sequences
GRANT USAGE, SELECT ON SEQUENCE backend_logs_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE app_logs_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE system_logs_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE alert_subscriptions_id_seq TO authenticated;

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Política para backend_logs: apenas admins autenticados podem acessar
CREATE POLICY "Admin access to backend_logs" ON backend_logs
    FOR ALL USING (auth.role() = 'authenticated');

-- Política para app_logs: apenas admins autenticados podem acessar
CREATE POLICY "Admin access to app_logs" ON app_logs
    FOR ALL USING (auth.role() = 'authenticated');

-- Política para system_logs: apenas admins autenticados podem acessar
CREATE POLICY "Admin access to system_logs" ON system_logs
    FOR ALL USING (auth.role() = 'authenticated');

-- Política para alert_subscriptions: apenas admins autenticados podem acessar
CREATE POLICY "Admin access to alert_subscriptions" ON alert_subscriptions
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- INSERIR E-MAIL PADRÃO PARA ALERTAS
-- =====================================================

-- Inserir e-mail padrão do administrador (se não existir)
INSERT INTO alert_subscriptions (email) 
VALUES ('admin@aimindset.com') 
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE backend_logs IS 'Registra todas as mudanças nas tabelas principais do banco de dados';
COMMENT ON TABLE app_logs IS 'Registra eventos da aplicação frontend e painel administrativo';
COMMENT ON TABLE system_logs IS 'Registra eventos do sistema como erros de API, builds e integrações';
COMMENT ON TABLE alert_subscriptions IS 'Armazena e-mails cadastrados para receber alertas automáticos';

COMMENT ON COLUMN backend_logs.table_name IS 'Nome da tabela que foi alterada';
COMMENT ON COLUMN backend_logs.action IS 'Tipo de ação: INSERT, UPDATE ou DELETE';
COMMENT ON COLUMN backend_logs.record_id IS 'ID do registro que foi alterado';
COMMENT ON COLUMN backend_logs.old_data IS 'Dados anteriores (para UPDATE e DELETE)';
COMMENT ON COLUMN backend_logs.new_data IS 'Dados novos (para INSERT e UPDATE)';
COMMENT ON COLUMN backend_logs.performed_by IS 'Usuário que realizou a ação';

COMMENT ON COLUMN app_logs.level IS 'Nível do log: info, warn ou error';
COMMENT ON COLUMN app_logs.source IS 'Origem do evento (ex: admin_panel, homepage)';
COMMENT ON COLUMN app_logs.action IS 'Ação executada (ex: publish_article, login)';
COMMENT ON COLUMN app_logs.details IS 'Dados adicionais em formato JSON';
COMMENT ON COLUMN app_logs.user_id IS 'ID do usuário admin (opcional)';

COMMENT ON COLUMN system_logs.type IS 'Tipo do log (deploy, api_error, build, integration)';
COMMENT ON COLUMN system_logs.message IS 'Mensagem principal do evento';
COMMENT ON COLUMN system_logs.context IS 'Contexto adicional em formato JSON';