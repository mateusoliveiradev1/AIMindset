-- Criar tabela para templates de email
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  template_type VARCHAR(50) DEFAULT 'custom' CHECK (template_type IN ('welcome', 'onboarding', 'newsletter', 'notification', 'custom')),
  variables JSONB DEFAULT '[]', -- Array de variáveis disponíveis no template
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_email_templates_template_type ON email_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_templates_created_at ON email_templates(created_at);

-- Inserir templates padrão
INSERT INTO email_templates (name, description, subject, content, template_type, variables) VALUES
(
  'Template de Boas-vindas',
  'Template padrão para emails de boas-vindas',
  'Bem-vindo(a) ao {{site_name}}! 🚀',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #333; margin-bottom: 10px;">Bem-vindo(a) ao {{site_name}}!</h1>
      <p style="color: #666; font-size: 16px;">Sua jornada na Inteligência Artificial começa agora</p>
    </div>
    
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; margin-bottom: 30px;">
      <h2 style="margin-top: 0;">Olá, {{user_name}}!</h2>
      <p>É com grande alegria que te damos as boas-vindas à nossa comunidade de entusiastas de Inteligência Artificial!</p>
    </div>
    
    <div style="margin-bottom: 30px;">
      <h3 style="color: #333;">O que você encontrará aqui:</h3>
      <ul style="color: #666; line-height: 1.6;">
        <li>📚 Artigos exclusivos sobre IA e tecnologia</li>
        <li>🔬 Análises aprofundadas das últimas tendências</li>
        <li>💡 Insights práticos para aplicar IA no seu dia a dia</li>
        <li>🎯 Conteúdo curado especialmente para você</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{site_url}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">Explorar Conteúdo</a>
    </div>
    
    <div style="border-top: 1px solid #eee; padding-top: 20px; color: #666; font-size: 14px;">
      <p>Fique atento(a) ao seu email - em breve você receberá nosso primeiro conteúdo exclusivo!</p>
      <p>Abraços,<br><strong>Equipe {{site_name}}</strong></p>
    </div>
  </div>',
  'welcome',
  '["user_name", "site_name", "site_url"]'
),
(
  'Template de Newsletter',
  'Template padrão para campanhas de newsletter',
  '{{newsletter_title}} - {{site_name}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #333; margin-bottom: 10px;">{{newsletter_title}}</h1>
      <p style="color: #666; font-size: 16px;">{{newsletter_date}}</p>
    </div>
    
    <div style="margin-bottom: 30px;">
      <p style="color: #666; font-size: 16px; line-height: 1.6;">Olá, {{user_name}}!</p>
      <div style="color: #333; line-height: 1.6;">
        {{newsletter_content}}
      </div>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 30px 0;">
      <h3 style="color: #333; margin-top: 0;">Destaques desta edição:</h3>
      {{newsletter_highlights}}
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{site_url}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">Ler no Site</a>
    </div>
    
    <div style="border-top: 1px solid #eee; padding-top: 20px; color: #666; font-size: 14px; text-align: center;">
      <p>Você está recebendo este email porque se inscreveu em nossa newsletter.</p>
      <p><a href="{{unsubscribe_url}}" style="color: #666;">Cancelar inscrição</a></p>
    </div>
  </div>',
  'newsletter',
  '["user_name", "newsletter_title", "newsletter_date", "newsletter_content", "newsletter_highlights", "site_name", "site_url", "unsubscribe_url"]'
),
(
  'Template de Novo Artigo',
  'Template para notificação de novos artigos',
  'Novo artigo: {{article_title}} - {{site_name}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #333; margin-bottom: 10px;">Novo artigo publicado! 📝</h1>
    </div>
    
    <div style="margin-bottom: 30px;">
      <p style="color: #666; font-size: 16px;">Olá, {{user_name}}!</p>
      <p style="color: #666; font-size: 16px;">Temos uma novidade fresquinha para você! Acabamos de publicar um novo artigo:</p>
    </div>
    
    <div style="border: 1px solid #eee; border-radius: 10px; overflow: hidden; margin: 30px 0;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; color: white;">
        <h2 style="margin: 0; font-size: 24px;">{{article_title}}</h2>
      </div>
      <div style="padding: 20px;">
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">{{article_excerpt}}</p>
        <div style="color: #999; font-size: 14px; margin-bottom: 20px;">
          <span>📂 {{article_category}}</span> • 
          <span>📅 {{article_date}}</span> • 
          <span>⏱️ {{reading_time}} min de leitura</span>
        </div>
        <a href="{{article_url}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Ler Artigo Completo</a>
      </div>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 30px 0;">
      <p style="color: #666; margin: 0;">💡 <strong>Dica:</strong> Este artigo aborda temas importantes sobre {{article_category}} e traz insights valiosos para sua jornada na IA.</p>
    </div>
    
    <div style="border-top: 1px solid #eee; padding-top: 20px; color: #666; font-size: 14px; text-align: center;">
      <p>Não perca essa oportunidade de expandir seus conhecimentos!</p>
      <p>Abraços,<br><strong>Equipe {{site_name}}</strong></p>
      <p style="margin-top: 20px;"><a href="{{unsubscribe_url}}" style="color: #666;">Cancelar inscrição</a></p>
    </div>
  </div>',
  'notification',
  '["user_name", "article_title", "article_excerpt", "article_category", "article_date", "article_url", "reading_time", "site_name", "unsubscribe_url"]'
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_email_templates_updated_at 
    BEFORE UPDATE ON email_templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();