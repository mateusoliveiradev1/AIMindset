-- Corrigir relacionamento entre newsletter_logs e email_automations

-- 1. Adicionar foreign key constraint entre newsletter_logs.automation_id e email_automations.id
ALTER TABLE newsletter_logs 
ADD CONSTRAINT fk_newsletter_logs_automation_id 
FOREIGN KEY (automation_id) REFERENCES email_automations(id) ON DELETE SET NULL;

-- 2. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_automation_id_fk ON newsletter_logs(automation_id);

-- 3. Comentário para documentação
COMMENT ON CONSTRAINT fk_newsletter_logs_automation_id ON newsletter_logs IS 'Foreign key para relacionar logs com automações de email';