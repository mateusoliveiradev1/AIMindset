-- Create newsletter_campaigns table
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'scheduled')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_at TIMESTAMPTZ,
  template_id UUID
);

-- Create newsletter_templates table
CREATE TABLE IF NOT EXISTS newsletter_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  preview_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update newsletter_logs table to include new fields
ALTER TABLE newsletter_logs 
ADD COLUMN IF NOT EXISTS campaign_id UUID,
ADD COLUMN IF NOT EXISTS sent_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS opened_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicked_count INTEGER DEFAULT 0;

-- Update status check constraint to include new statuses
ALTER TABLE newsletter_logs 
DROP CONSTRAINT IF EXISTS newsletter_logs_status_check;

ALTER TABLE newsletter_logs 
ADD CONSTRAINT newsletter_logs_status_check 
CHECK (status IN ('sent', 'failed', 'scheduled', 'draft'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_status ON newsletter_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_sent_at ON newsletter_campaigns(sent_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_created_at ON newsletter_campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_templates_created_at ON newsletter_templates(created_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_campaign_id ON newsletter_logs(campaign_id);

-- Enable RLS
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access
CREATE POLICY "Admin can manage campaigns" ON newsletter_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Admin can manage templates" ON newsletter_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Insert some default templates
INSERT INTO newsletter_templates (name, subject, content, preview_text) VALUES
(
  'Boas-vindas',
  'Bem-vindo(a) ao AIMindset!',
  '<h1>Bem-vindo(a) ao AIMindset!</h1>
   <p>Olá {{name}},</p>
   <p>É com grande prazer que damos as boas-vindas à nossa comunidade dedicada à Inteligência Artificial!</p>
   <p>Aqui você encontrará:</p>
   <ul>
     <li>Artigos exclusivos sobre IA</li>
     <li>Tendências e novidades do mercado</li>
     <li>Dicas práticas para implementação</li>
     <li>Cases de sucesso reais</li>
   </ul>
   <p>Fique atento(a) aos nossos próximos conteúdos!</p>
   <p>Atenciosamente,<br>Equipe AIMindset</p>',
  'Seja bem-vindo(a) à nossa comunidade de IA!'
),
(
  'Novo Artigo',
  'Novo artigo publicado: {{article_title}}',
  '<h1>Novo Artigo Disponível!</h1>
   <p>Olá {{name}},</p>
   <p>Acabamos de publicar um novo artigo que pode interessar você:</p>
   <h2>{{article_title}}</h2>
   <p>{{article_excerpt}}</p>
   <a href="{{article_url}}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">Ler Artigo Completo</a>
   <p>Não perca essa oportunidade de se manter atualizado!</p>
   <p>Atenciosamente,<br>Equipe AIMindset</p>',
  'Confira nosso mais recente conteúdo sobre IA'
),
(
  'Newsletter Semanal',
  'Resumo Semanal AIMindset - {{week_date}}',
  '<h1>Resumo da Semana</h1>
   <p>Olá {{name}},</p>
   <p>Aqui está o resumo dos principais conteúdos desta semana:</p>
   <div style="border-left: 4px solid #3b82f6; padding-left: 16px; margin: 20px 0;">
     <h3>Artigos em Destaque</h3>
     {{featured_articles}}
   </div>
   <div style="border-left: 4px solid #10b981; padding-left: 16px; margin: 20px 0;">
     <h3>Tendências da Semana</h3>
     {{weekly_trends}}
   </div>
   <p>Continue acompanhando nossos conteúdos para se manter sempre atualizado!</p>
   <p>Atenciosamente,<br>Equipe AIMindset</p>',
  'Confira os destaques da semana em IA'
)
ON CONFLICT DO NOTHING;