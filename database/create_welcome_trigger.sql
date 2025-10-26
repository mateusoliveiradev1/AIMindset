-- Função para envio automático de boas-vindas
CREATE OR REPLACE FUNCTION send_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
    welcome_campaign_id UUID;
    campaign_subject TEXT;
    campaign_content TEXT;
BEGIN
    -- Buscar campanha de boas-vindas ativa
    SELECT id, subject, content 
    INTO welcome_campaign_id, campaign_subject, campaign_content
    FROM newsletter_campaigns 
    WHERE metadata->>'is_welcome' = 'true' 
    AND metadata->>'auto_send' = 'true'
    AND status = 'sent'
    LIMIT 1;
    
    -- Se encontrou campanha de boas-vindas
    IF welcome_campaign_id IS NOT NULL THEN
        -- Inserir log de envio
        INSERT INTO newsletter_logs (
            id,
            subscriber_id,
            campaign_id,
            email_type,
            status,
            sent_at,
            created_at,
            metadata
        ) VALUES (
            gen_random_uuid(),
            NEW.id,
            welcome_campaign_id,
            'welcome',
            'sent',
            NOW(),
            NOW(),
            jsonb_build_object(
                'email', NEW.email,
                'campaign_name', 'Boas-vindas ao AIMindset',
                'auto_sent', true
            )
        );
        
        -- Atualizar subscriber para marcar que recebeu boas-vindas
        UPDATE newsletter_subscribers 
        SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
            'welcome_sent', true,
            'welcome_sent_at', NOW()::text,
            'welcome_campaign_id', welcome_campaign_id::text
        )
        WHERE id = NEW.id;
        
        -- Log de sucesso
        RAISE NOTICE 'Email de boas-vindas enviado para: %', NEW.email;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_send_welcome_email ON newsletter_subscribers;

-- Criar trigger para novos inscritos
CREATE TRIGGER trigger_send_welcome_email
    AFTER INSERT ON newsletter_subscribers
    FOR EACH ROW
    WHEN (NEW.status = 'active')
    EXECUTE FUNCTION send_welcome_email();