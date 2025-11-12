DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'newsletter_logs_status_check'
      AND table_name = 'newsletter_logs'
  ) THEN
    ALTER TABLE newsletter_logs DROP CONSTRAINT newsletter_logs_status_check;
  END IF;
END $$;

ALTER TABLE newsletter_logs
ADD CONSTRAINT newsletter_logs_status_check
CHECK (status IN ('success','error','pending','failed'));

CREATE OR REPLACE FUNCTION send_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
  welcome_campaign_id UUID;
  v_subject TEXT;
BEGIN
  SELECT id, subject INTO welcome_campaign_id, v_subject
  FROM newsletter_campaigns
  WHERE status = 'sent'
  ORDER BY created_at DESC
  LIMIT 1;

  IF welcome_campaign_id IS NOT NULL THEN
    BEGIN
      INSERT INTO newsletter_logs (
        campaign_id,
        subscriber_id,
        event_type,
        event_data,
        status,
        created_at
      ) VALUES (
        welcome_campaign_id,
        NEW.id,
        'subscriber_added',
        jsonb_build_object('email', NEW.email, 'campaign_subject', v_subject),
        'success',
        NOW()
      );
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'send_welcome_email log insert failed: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_send_welcome_email ON newsletter_subscribers;
CREATE TRIGGER trigger_send_welcome_email
  AFTER INSERT ON newsletter_subscribers
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION send_welcome_email();

