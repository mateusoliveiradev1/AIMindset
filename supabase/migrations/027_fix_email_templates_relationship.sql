-- Corrigir relacionamento entre newsletter_logs e email_templates

-- 1. Adicionar foreign key constraint entre newsletter_logs.template_id e email_templates.id
ALTER TABLE newsletter_logs 
ADD CONSTRAINT fk_newsletter_logs_template_id 
FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE SET NULL;

-- 2. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_template_id_fk ON newsletter_logs(template_id);

-- 3. Comentário para documentação
COMMENT ON CONSTRAINT fk_newsletter_logs_template_id ON newsletter_logs IS 'Foreign key para relacionar logs com templates de email';