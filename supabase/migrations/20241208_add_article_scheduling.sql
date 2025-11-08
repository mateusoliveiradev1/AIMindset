-- Migration: Adicionar sistema de agendamento de artigos com auditoria
-- Data: 2024-12-08

-- Adicionar campos de agendamento na tabela articles
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS scheduled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS scheduling_reason TEXT,
ADD COLUMN IF NOT EXISTS scheduling_status VARCHAR(50) DEFAULT 'draft' CHECK (scheduling_status IN ('draft', 'scheduled', 'published', 'cancelled')),
ADD COLUMN IF NOT EXISTS original_publish_date TIMESTAMP WITH TIME ZONE;

-- Criar índice para melhorar performance de consultas por data de agendamento
CREATE INDEX IF NOT EXISTS idx_articles_scheduled_for ON public.articles(scheduled_for) WHERE scheduling_status = 'scheduled';

-- Criar índice para consultar artigos por status de agendamento
CREATE INDEX IF NOT EXISTS idx_articles_scheduling_status ON public.articles(scheduling_status);

-- Adicionar comentários descritivos
COMMENT ON COLUMN public.articles.scheduled_for IS 'Data e hora agendadas para publicação do artigo';
COMMENT ON COLUMN public.articles.scheduled_by IS 'ID do usuário que agendou a publicação';
COMMENT ON COLUMN public.articles.scheduling_reason IS 'Motivo/justificativa para o agendamento';
COMMENT ON COLUMN public.articles.scheduling_status IS 'Status do agendamento: draft, scheduled, published, cancelled';
COMMENT ON COLUMN public.articles.original_publish_date IS 'Data original de publicação antes do agendamento';

-- Criar tabela de logs de auditoria para rastrear alterações
CREATE TABLE IF NOT EXISTS public.article_scheduling_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action VARCHAR(50) NOT NULL CHECK (action IN ('schedule', 'reschedule', 'cancel', 'publish', 'draft')),
    old_scheduled_for TIMESTAMP WITH TIME ZONE,
    new_scheduled_for TIMESTAMP WITH TIME ZONE,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Criar índices para logs
CREATE INDEX IF NOT EXISTS idx_scheduling_logs_article_id ON public.article_scheduling_logs(article_id);
CREATE INDEX IF NOT EXISTS idx_scheduling_logs_user_id ON public.article_scheduling_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduling_logs_created_at ON public.article_scheduling_logs(created_at DESC);

-- Adicionar comentários na tabela de logs
COMMENT ON TABLE public.article_scheduling_logs IS 'Tabela de auditoria para rastrear alterações no agendamento de artigos';
COMMENT ON COLUMN public.article_scheduling_logs.action IS 'Ação realizada: schedule, reschedule, cancel, publish, draft';
COMMENT ON COLUMN public.article_scheduling_logs.old_scheduled_for IS 'Data de agendamento anterior';
COMMENT ON COLUMN public.article_scheduling_logs.new_scheduled_for IS 'Nova data de agendamento';
COMMENT ON COLUMN public.article_scheduling_logs.old_status IS 'Status anterior';
COMMENT ON COLUMN public.article_scheduling_logs.new_status IS 'Novo status';
COMMENT ON COLUMN public.article_scheduling_logs.reason IS 'Motivo da alteração';
COMMENT ON COLUMN public.article_scheduling_logs.metadata IS 'Dados adicionais em formato JSON';

-- Criar função para registrar logs automaticamente
CREATE OR REPLACE FUNCTION public.log_article_scheduling_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Registrar log quando houver mudança no agendamento
    IF (OLD.scheduled_for IS DISTINCT FROM NEW.scheduled_for) OR 
       (OLD.scheduling_status IS DISTINCT FROM NEW.scheduling_status) THEN
        
        INSERT INTO public.article_scheduling_logs (
            article_id,
            user_id,
            action,
            old_scheduled_for,
            new_scheduled_for,
            old_status,
            new_status,
            reason,
            metadata,
            ip_address,
            user_agent
        ) VALUES (
            NEW.id,
            auth.uid(),
            CASE 
                WHEN OLD.scheduling_status = 'draft' AND NEW.scheduling_status = 'scheduled' THEN 'schedule'
                WHEN OLD.scheduling_status = 'scheduled' AND NEW.scheduling_status = 'scheduled' THEN 'reschedule'
                WHEN NEW.scheduling_status = 'cancelled' THEN 'cancel'
                WHEN NEW.scheduling_status = 'published' THEN 'publish'
                WHEN NEW.scheduling_status = 'draft' THEN 'draft'
                ELSE 'unknown'
            END,
            OLD.scheduled_for,
            NEW.scheduled_for,
            OLD.scheduling_status,
            NEW.scheduling_status,
            NEW.scheduling_reason,
            jsonb_build_object(
                'session_id', current_setting('app.session_id', true),
                'user_email', (SELECT email FROM auth.users WHERE id = auth.uid())
            ),
            current_setting('app.ip_address', true)::INET,
            current_setting('app.user_agent', true)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para executar a função de log
DROP TRIGGER IF EXISTS trigger_log_article_scheduling ON public.articles;
CREATE TRIGGER trigger_log_article_scheduling
    AFTER UPDATE ON public.articles
    FOR EACH ROW
    EXECUTE FUNCTION public.log_article_scheduling_change();

-- Grant permissions
GRANT SELECT ON public.article_scheduling_logs TO anon, authenticated;
GRANT INSERT ON public.article_scheduling_logs TO authenticated;