-- Corrigir estrutura da tabela newsletter_logs para compatibilidade com o código

-- 1. Fazer backup dos dados existentes se houver
CREATE TABLE IF NOT EXISTS newsletter_logs_backup AS 
SELECT * FROM newsletter_logs;

-- 2. Remover a tabela atual
DROP TABLE IF EXISTS newsletter_logs CASCADE;

-- 3. Recriar a tabela com a estrutura correta
CREATE TABLE newsletter_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
  automation_id UUID, -- Referência para automações (tabela pode não existir ainda)
  template_id UUID, -- Referência para templates (tabela pode não existir ainda)
  
  -- Tipo de evento (OBRIGATÓRIO)
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'campaign_sent', 'campaign_opened', 'campaign_clicked', 'campaign_bounced', 'campaign_unsubscribed',
    'automation_sent', 'automation_opened', 'automation_clicked', 'automation_bounced',
    'subscriber_added', 'subscriber_removed', 'subscriber_updated',
    'template_created', 'template_updated', 'template_deleted',
    'system_error', 'api_call'
  )),
  
  -- Detalhes do evento
  event_data JSONB DEFAULT '{}',
  
  -- Informações de contexto
  user_agent TEXT,
  ip_address INET,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Status e resultado
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'error', 'pending', 'failed')),
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_campaign_id ON newsletter_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_subscriber_id ON newsletter_logs(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_automation_id ON newsletter_logs(automation_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_event_type ON newsletter_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_status ON newsletter_logs(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_created_at ON newsletter_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_user_id ON newsletter_logs(user_id);

-- Índices compostos para consultas comuns
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_campaign_event ON newsletter_logs(campaign_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_subscriber_event ON newsletter_logs(subscriber_id, event_type, created_at DESC);

-- 5. Habilitar RLS
ALTER TABLE newsletter_logs ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS
-- Política para admins
CREATE POLICY "Admins can manage all logs" ON newsletter_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );

-- Política para leitura de logs próprios
CREATE POLICY "Users can view their own logs" ON newsletter_logs
  FOR SELECT USING (user_id = auth.uid());

-- 7. Inserir alguns dados de exemplo para teste
INSERT INTO newsletter_logs (event_type, event_data, status, error_message) VALUES
('system_error', '{"message": "Teste de log de sistema"}', 'success', NULL),
('api_call', '{"endpoint": "/api/newsletter", "method": "GET"}', 'success', NULL);

-- 8. Comentários para documentação
COMMENT ON TABLE newsletter_logs IS 'Logs de auditoria e eventos da newsletter - estrutura corrigida';
COMMENT ON COLUMN newsletter_logs.event_type IS 'Tipo de evento registrado (obrigatório)';
COMMENT ON COLUMN newsletter_logs.event_data IS 'Dados adicionais do evento em formato JSON';
COMMENT ON COLUMN newsletter_logs.status IS 'Status do processamento do evento';
COMMENT ON COLUMN newsletter_logs.campaign_id IS 'Referência para campanha relacionada';
COMMENT ON COLUMN newsletter_logs.subscriber_id IS 'Referência para inscrito relacionado';