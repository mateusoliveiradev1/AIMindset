DO $$
DECLARE v_email TEXT := 'welcome_test_' || to_char(NOW(), 'YYYYMMDDHH24MISS') || '@example.com';
BEGIN
  INSERT INTO newsletter_subscribers (email, status)
  VALUES (v_email, 'active');

  RAISE NOTICE 'Inserted subscriber: %', v_email;

  PERFORM 1; -- placeholder
END $$;

SELECT id, event_type, status, event_data->>'email' AS email
FROM newsletter_logs
WHERE event_type = 'subscriber_added'
ORDER BY created_at DESC
LIMIT 5;

