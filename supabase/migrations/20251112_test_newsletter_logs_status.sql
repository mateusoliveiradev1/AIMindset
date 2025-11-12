DO $$
BEGIN
  BEGIN
    INSERT INTO newsletter_logs (event_type, event_data, status)
    VALUES ('system_error', '{}'::jsonb, 'success');
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Unexpected failure for valid status: %', SQLERRM;
  END;

  BEGIN
    INSERT INTO newsletter_logs (event_type, event_data, status)
    VALUES ('system_error', '{}'::jsonb, 'pending');
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Unexpected failure for valid status: %', SQLERRM;
  END;

  BEGIN
    INSERT INTO newsletter_logs (event_type, event_data, status)
    VALUES ('system_error', '{}'::jsonb, 'error');
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Unexpected failure for valid status: %', SQLERRM;
  END;

  BEGIN
    INSERT INTO newsletter_logs (event_type, event_data, status)
    VALUES ('system_error', '{}'::jsonb, 'failed');
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Unexpected failure for valid status: %', SQLERRM;
  END;

  BEGIN
    INSERT INTO newsletter_logs (event_type, event_data, status)
    VALUES ('system_error', '{}'::jsonb, 'sent');
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Expected failure for invalid status: %', SQLERRM;
  END;

  BEGIN
    INSERT INTO newsletter_logs (event_type, event_data, status)
    VALUES ('system_error', '{}'::jsonb, 'scheduled');
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Expected failure for invalid status: %', SQLERRM;
  END;
END $$;

