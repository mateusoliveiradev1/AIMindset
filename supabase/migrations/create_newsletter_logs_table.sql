-- Criar tabela de logs da newsletter
CREATE TABLE IF NOT EXISTS newsletter_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
  automation_id UUID REFERENCES email_automations(id) ON DELETE CASCADE,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  
  -- Tipo de evento
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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_campaign_id ON newsletter_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_subscriber_id ON newsletter_logs(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_automation_id ON newsletter_logs(automation_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_event_type ON newsletter_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_status ON newsletter_logs(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_created_at ON newsletter_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_user_id ON newsletter_logs(user_id);

-- Índice composto para consultas comuns
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_campaign_event ON newsletter_logs(campaign_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_logs_subscriber_event ON newsletter_logs(subscriber_id, event_type, created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE newsletter_logs ENABLE ROW LEVEL SECURITY;

-- Política para admins
CREATE POLICY "Admins can manage all logs" ON newsletter_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Política para leitura de logs próprios
CREATE POLICY "Users can view their own logs" ON newsletter_logs
  FOR SELECT USING (user_id = auth.uid());

-- Função para limpar logs antigos (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_newsletter_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM newsletter_logs 
  WHERE created_at < NOW() - INTERVAL '6 months'
  AND event_type NOT IN ('campaign_sent', 'automation_sent'); -- Manter logs importantes
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE newsletter_logs IS 'Logs de auditoria e eventos da newsletter';
COMMENT ON COLUMN newsletter_logs.event_type IS 'Tipo de evento registrado';
COMMENT ON COLUMN newsletter_logs.event_data IS 'Dados adicionais do evento em formato JSON';
COMMENT ON COLUMN newsletter_logs.status IS 'Status do processamento do evento';