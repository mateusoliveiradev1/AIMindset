-- =====================================================
-- AIMindset Database Schema - Consolidated Migration
-- Data: 2025-10-30
-- Descrição: Schema inicial consolidado com todas as tabelas principais
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELAS PRINCIPAIS
-- =====================================================

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  slug VARCHAR(255) UNIQUE,
  tags TEXT[],
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  author_name VARCHAR(255) NOT NULL,
  author_email VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feedbacks table
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  user_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELAS DE NEWSLETTER E EMAIL
-- =====================================================

-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

-- Create newsletter_campaigns table
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'scheduled')),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_automations table
CREATE TABLE IF NOT EXISTS email_automations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  trigger_event VARCHAR(100) NOT NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELAS DE LOGS E AUDITORIA
-- =====================================================

-- Create app_logs table
CREATE TABLE IF NOT EXISTS app_logs (
  id SERIAL PRIMARY KEY,
  level VARCHAR(20) NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
  source VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system_logs table
CREATE TABLE IF NOT EXISTS system_logs (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create backend_logs table
CREATE TABLE IF NOT EXISTS backend_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  table_name VARCHAR(100) NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  performed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create security_audit_logs table
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  user_id TEXT,
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELAS DE SISTEMA E CONFIGURAÇÃO
-- =====================================================

-- Create seo_metadata table
CREATE TABLE IF NOT EXISTS seo_metadata (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  page_path VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  keywords TEXT[],
  og_title VARCHAR(255),
  og_description TEXT,
  og_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cookie_preferences table
CREATE TABLE IF NOT EXISTS cookie_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  analytics BOOLEAN DEFAULT false,
  marketing BOOLEAN DEFAULT false,
  functional BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create alert_subscribers table
CREATE TABLE IF NOT EXISTS alert_subscribers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create alert_subscriptions table
CREATE TABLE IF NOT EXISTS alert_subscriptions (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para articles
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);

-- Índices para comments
CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Índices para feedbacks
CREATE INDEX IF NOT EXISTS idx_feedbacks_article_id ON feedbacks(article_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at DESC);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_app_logs_created_at ON app_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_logs_level ON app_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_type ON system_logs(type);

-- Índices para newsletter
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON newsletter_subscribers(status);

-- =====================================================
-- INSERIR DADOS INICIAIS
-- =====================================================

-- Insert default categories
INSERT INTO categories (name, slug, description) VALUES
  ('Inteligência Artificial', 'inteligencia-artificial', 'Artigos sobre IA, machine learning e tecnologias emergentes'),
  ('Tecnologia', 'tecnologia', 'Novidades e tendências em tecnologia'),
  ('Inovação', 'inovacao', 'Inovações e startups que estão mudando o mundo'),
  ('Futuro', 'futuro', 'Visões e previsões sobre o futuro da tecnologia'),
  ('Negócios', 'negocios', 'Como a tecnologia está transformando os negócios'),
  ('Educação', 'educacao', 'Tecnologia na educação e aprendizado'),
  ('Saúde', 'saude', 'Inovações tecnológicas na área da saúde'),
  ('Sustentabilidade', 'sustentabilidade', 'Tecnologia verde e sustentável')
ON CONFLICT (slug) DO NOTHING;

-- Insert default admin user
INSERT INTO admin_users (email, name, role) VALUES
  ('admin@aimindset.com', 'Admin AIMindset', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- Insert default email templates
INSERT INTO email_templates (name, subject, content, variables) VALUES
  ('welcome', 'Bem-vindo ao AIMindset!', 'Olá {{name}}, bem-vindo à nossa newsletter!', '{"name": "string"}'),
  ('newsletter', 'Newsletter AIMindset', 'Confira as últimas novidades: {{content}}', '{"content": "string"}'),
  ('alert', 'Alerta do Sistema', 'Alerta: {{message}}', '{"message": "string"}')
ON CONFLICT (name) DO NOTHING;

-- Insert default alert subscribers
INSERT INTO alert_subscribers (email) VALUES
  ('admin@aimindset.com'),
  ('alerts@aimindset.com')
ON CONFLICT (email) DO NOTHING;