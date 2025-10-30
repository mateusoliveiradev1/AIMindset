-- AIMindset Database Schema
-- Initial migration with all tables, RLS policies, indexes, and triggers

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_users table
CREATE TABLE admin_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create articles table
CREATE TABLE articles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create newsletter_subscribers table
CREATE TABLE newsletter_subscribers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

-- Create contacts table
CREATE TABLE contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create newsletter_logs table
CREATE TABLE newsletter_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  recipients_count INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error_message TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_articles_category_id ON articles(category_id);
CREATE INDEX idx_articles_author_id ON articles(author_id);
CREATE INDEX idx_articles_published ON articles(published);
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_subscribers_status ON newsletter_subscribers(status);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_created_at ON contacts(created_at DESC);
CREATE INDEX idx_newsletter_logs_sent_at ON newsletter_logs(sent_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Categories are editable by admins only" ON categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );

-- RLS Policies for admin_users
CREATE POLICY "Admin users are viewable by authenticated admins" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Admin users are editable by super admins only" ON admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email' 
      AND admin_users.role = 'super_admin'
    )
  );

-- RLS Policies for articles
CREATE POLICY "Published articles are viewable by everyone" ON articles
  FOR SELECT USING (published = true OR EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = auth.jwt() ->> 'email'
  ));

CREATE POLICY "Articles are editable by admins only" ON articles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );

-- RLS Policies for newsletter_subscribers
CREATE POLICY "Newsletter subscribers can be inserted by anyone" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Newsletter subscribers are viewable by admins only" ON newsletter_subscribers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Newsletter subscribers are editable by admins only" ON newsletter_subscribers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );

-- RLS Policies for contacts
CREATE POLICY "Contacts can be inserted by anyone" ON contacts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Contacts are viewable by admins only" ON contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Contacts are editable by admins only" ON contacts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );

-- RLS Policies for newsletter_logs
CREATE POLICY "Newsletter logs are viewable by admins only" ON newsletter_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Newsletter logs are insertable by admins only" ON newsletter_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial categories
INSERT INTO categories (name, slug, description) VALUES
  ('Inteligência Artificial', 'inteligencia-artificial', 'Artigos sobre IA, machine learning e tecnologias emergentes'),
  ('Tecnologia', 'tecnologia', 'Novidades e tendências em tecnologia'),
  ('Inovação', 'inovacao', 'Inovações e descobertas que moldam o futuro'),
  ('Negócios', 'negocios', 'Estratégias de negócios e empreendedorismo'),
  ('Educação', 'educacao', 'Educação e desenvolvimento pessoal');

-- Insert super admin user
INSERT INTO admin_users (email, name, role) VALUES
  ('warface01031999@gmail.com', 'Super Admin', 'super_admin');

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON categories TO anon;
GRANT SELECT ON articles TO anon;
GRANT INSERT ON newsletter_subscribers TO anon;
GRANT INSERT ON contacts TO anon;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;