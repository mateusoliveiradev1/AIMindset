-- Função para enviar email de boas-vindas automaticamente
CREATE OR REPLACE FUNCTION send_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
    welcome_campaign_id UUID;
BEGIN
    -- Buscar a campanha de boas-vindas ativa
    SELECT id INTO welcome_campaign_id
    FROM newsletter_campaigns
    WHERE metadata->>'is_welcome' = 'true'
    AND status = 'sent'
    LIMIT 1;
    
    -- Se encontrou uma campanha de boas-vindas, criar log de envio
    IF welcome_campaign_id IS NOT NULL THEN
        INSERT INTO newsletter_logs (
            subject,
            content,
            recipients_count,
            sent_at,
            status,
            campaign_id,
            sent_count,
            opened_count,
            clicked_count
        )
        SELECT 
            subject,
            content,
            1,
            NOW(),
            'sent',
            id,
            1,
            0,
            0
        FROM newsletter_campaigns
        WHERE id = welcome_campaign_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para novos inscritos
DROP TRIGGER IF EXISTS trigger_send_welcome_email ON newsletter_subscribers;
CREATE TRIGGER trigger_send_welcome_email
    AFTER INSERT ON newsletter_subscribers
    FOR EACH ROW
    EXECUTE FUNCTION send_welcome_email();