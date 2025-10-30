-- =====================================================
-- AIMindset Triggers and RLS Policies - Consolidated Migration
-- Data: 2025-10-30
-- Descrição: Triggers e políticas RLS essenciais consolidadas
-- =====================================================

-- =====================================================
-- FUNÇÕES AUXILIARES PARA TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para auditoria de segurança
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO security_audit_logs (
        event_type,
        user_id,
        details
    ) VALUES (
        TG_OP || '_' || TG_TABLE_NAME,
        COALESCE(auth.uid()::text, 'system'),
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'old_data', CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
            'new_data', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
        )
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Trigger para categories
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para admin_users
CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON admin_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para articles
CREATE TRIGGER update_articles_updated_at 
    BEFORE UPDATE ON articles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para comments
CREATE TRIGGER update_comments_updated_at 
    BEFORE UPDATE ON comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para contacts
CREATE TRIGGER update_contacts_updated_at 
    BEFORE UPDATE ON contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para newsletter_campaigns
CREATE TRIGGER update_newsletter_campaigns_updated_at 
    BEFORE UPDATE ON newsletter_campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para email_templates
CREATE TRIGGER update_email_templates_updated_at 
    BEFORE UPDATE ON email_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para email_automations
CREATE TRIGGER update_email_automations_updated_at 
    BEFORE UPDATE ON email_automations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para seo_metadata
CREATE TRIGGER update_seo_metadata_updated_at 
    BEFORE UPDATE ON seo_metadata 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para user_profiles
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para cookie_preferences
CREATE TRIGGER update_cookie_preferences_updated_at 
    BEFORE UPDATE ON cookie_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGERS DE AUDITORIA
-- =====================================================

-- Auditoria para admin_users
CREATE TRIGGER audit_admin_users
    AFTER INSERT OR UPDATE OR DELETE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Auditoria para articles
CREATE TRIGGER audit_articles
    AFTER INSERT OR UPDATE OR DELETE ON articles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Auditoria para contacts
CREATE TRIGGER audit_contacts
    AFTER INSERT OR UPDATE OR DELETE ON contacts
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =====================================================
-- HABILITAR ROW LEVEL SECURITY
-- =====================================================

-- Habilitar RLS para todas as tabelas principais
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backend_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cookie_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_subscriptions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS - TABELAS PÚBLICAS
-- =====================================================

-- Categories - Leitura pública, escrita apenas para admins
CREATE POLICY "categories_public_read" ON categories
    FOR SELECT USING (true);

CREATE POLICY "categories_admin_write" ON categories
    FOR ALL USING (auth.role() = 'service_role');

-- Articles - Artigos publicados são públicos
CREATE POLICY "articles_public_read_published" ON articles
    FOR SELECT USING (published = true);

CREATE POLICY "articles_admin_all" ON articles
    FOR ALL USING (auth.role() = 'service_role');

-- Comments - Leitura pública, inserção pública, edição restrita
CREATE POLICY "comments_public_read" ON comments
    FOR SELECT USING (true);

CREATE POLICY "comments_public_insert" ON comments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "comments_admin_all" ON comments
    FOR ALL USING (auth.role() = 'service_role');

-- Feedbacks - Leitura pública, inserção pública
CREATE POLICY "feedbacks_public_read" ON feedbacks
    FOR SELECT USING (true);

CREATE POLICY "feedbacks_public_insert" ON feedbacks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "feedbacks_admin_all" ON feedbacks
    FOR ALL USING (auth.role() = 'service_role');

-- Contacts - Inserção pública, leitura apenas para admins
CREATE POLICY "contacts_public_insert" ON contacts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "contacts_admin_read" ON contacts
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "contacts_admin_update" ON contacts
    FOR UPDATE USING (auth.role() = 'service_role');

-- =====================================================
-- POLÍTICAS RLS - NEWSLETTER E EMAIL
-- =====================================================

-- Newsletter Subscribers - Inserção pública, gestão por admins
CREATE POLICY "newsletter_subscribers_public_insert" ON newsletter_subscribers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "newsletter_subscribers_admin_all" ON newsletter_subscribers
    FOR ALL USING (auth.role() = 'service_role');

-- Newsletter Campaigns - Apenas admins
CREATE POLICY "newsletter_campaigns_admin_all" ON newsletter_campaigns
    FOR ALL USING (auth.role() = 'service_role');

-- Email Templates - Apenas admins
CREATE POLICY "email_templates_admin_all" ON email_templates
    FOR ALL USING (auth.role() = 'service_role');

-- Email Automations - Apenas admins
CREATE POLICY "email_automations_admin_all" ON email_automations
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- POLÍTICAS RLS - LOGS E AUDITORIA
-- =====================================================

-- App Logs - Leitura pública, inserção por autenticados
CREATE POLICY "app_logs_public_read" ON app_logs
    FOR SELECT USING (true);

CREATE POLICY "app_logs_authenticated_insert" ON app_logs
    FOR INSERT WITH CHECK (auth.role() IS NOT NULL);

-- System Logs - Leitura pública, inserção por sistema
CREATE POLICY "system_logs_public_read" ON system_logs
    FOR SELECT USING (true);

CREATE POLICY "system_logs_service_insert" ON system_logs
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Backend Logs - Apenas service role
CREATE POLICY "backend_logs_service_all" ON backend_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Security Audit Logs - Apenas super admins
CREATE POLICY "security_audit_logs_admin_read" ON security_audit_logs
    FOR SELECT USING (auth.role() = 'service_role');

-- =====================================================
-- POLÍTICAS RLS - SISTEMA E CONFIGURAÇÃO
-- =====================================================

-- SEO Metadata - Leitura pública, escrita por admins
CREATE POLICY "seo_metadata_public_read" ON seo_metadata
    FOR SELECT USING (true);

CREATE POLICY "seo_metadata_admin_write" ON seo_metadata
    FOR ALL USING (auth.role() = 'service_role');

-- User Profiles - Acesso público
CREATE POLICY "user_profiles_public_access" ON user_profiles
    FOR ALL USING (true);

-- Cookie Preferences - Acesso público
CREATE POLICY "cookie_preferences_public_access" ON cookie_preferences
    FOR ALL USING (true);

-- =====================================================
-- POLÍTICAS RLS - ALERTAS
-- =====================================================

-- Alert Subscribers - Apenas admins
CREATE POLICY "alert_subscribers_admin_all" ON alert_subscribers
    FOR ALL USING (auth.role() = 'service_role');

-- Alert Subscriptions - Apenas admins
CREATE POLICY "alert_subscriptions_admin_all" ON alert_subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- POLÍTICAS RLS - ADMIN USERS
-- =====================================================

-- Admin Users - Apenas service role
CREATE POLICY "admin_users_service_all" ON admin_users
    FOR ALL USING (auth.role() = 'service_role');