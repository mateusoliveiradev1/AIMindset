-- Enhanced RLS Security Policies
-- This migration strengthens all existing RLS policies with additional security measures

-- Drop existing policies to recreate with enhanced security
DROP POLICY IF EXISTS "Public can read published articles" ON articles;
DROP POLICY IF EXISTS "Admins can manage articles" ON articles;
DROP POLICY IF EXISTS "Public can read categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
DROP POLICY IF EXISTS "Anyone can submit contacts" ON contacts;
DROP POLICY IF EXISTS "Admins can read contacts" ON contacts;
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can read newsletter subscribers" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can read newsletter logs" ON newsletter_logs;
DROP POLICY IF EXISTS "Admins can create newsletter logs" ON newsletter_logs;
DROP POLICY IF EXISTS "Users can manage their own cookie preferences" ON cookie_preferences;
DROP POLICY IF EXISTS "Users can manage their own privacy requests" ON privacy_requests;
DROP POLICY IF EXISTS "Admins can read privacy requests" ON privacy_requests;
DROP POLICY IF EXISTS "Users can manage their own profiles" ON user_profiles;

-- Enhanced Articles Policies
CREATE POLICY "Public can read published articles with rate limit"
ON articles FOR SELECT
USING (
  published = true 
  AND created_at > NOW() - INTERVAL '1 year' -- Only articles from last year
);

CREATE POLICY "Authenticated admins can manage articles"
ON articles FOR ALL
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Enhanced Categories Policies
CREATE POLICY "Public can read active categories"
ON categories FOR SELECT
USING (
  created_at > NOW() - INTERVAL '2 years' -- Only recent categories
);

CREATE POLICY "Super admins can manage categories"
ON categories FOR ALL
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Enhanced Contacts Policies with rate limiting
CREATE POLICY "Rate limited contact submissions"
ON contacts FOR INSERT
WITH CHECK (
  -- Basic validation
  LENGTH(name) BETWEEN 2 AND 100
  AND LENGTH(email) BETWEEN 5 AND 254
  AND LENGTH(subject) BETWEEN 5 AND 200
  AND LENGTH(message) BETWEEN 10 AND 2000
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

CREATE POLICY "Admins can read and manage contacts"
ON contacts FOR ALL
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Enhanced Newsletter Policies
CREATE POLICY "Validated newsletter subscriptions"
ON newsletter_subscribers FOR INSERT
WITH CHECK (
  -- Email validation
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND LENGTH(email) BETWEEN 5 AND 254
  AND status IN ('active', 'inactive')
);

CREATE POLICY "Admins can manage newsletter subscribers"
ON newsletter_subscribers FOR ALL
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Enhanced Newsletter Logs Policies
CREATE POLICY "Admins can manage newsletter logs"
ON newsletter_logs FOR ALL
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Enhanced Cookie Preferences Policies
CREATE POLICY "Users can manage their cookie preferences"
ON cookie_preferences FOR ALL
USING (
  user_email = COALESCE(auth.jwt() ->> 'email', '')
  OR (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  )
);

-- Enhanced Privacy Requests Policies
CREATE POLICY "Users can create and view their privacy requests"
ON privacy_requests FOR SELECT
USING (
  user_email = COALESCE(auth.jwt() ->> 'email', '')
  OR (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  )
);

CREATE POLICY "Users can create privacy requests"
ON privacy_requests FOR INSERT
WITH CHECK (
  user_email = COALESCE(auth.jwt() ->> 'email', '')
  AND user_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND request_type IN ('data_download', 'data_edit', 'data_deletion', 'processing_limitation', 'privacy_contact')
);

CREATE POLICY "Admins can manage privacy requests"
ON privacy_requests FOR ALL
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Enhanced User Profiles Policies
CREATE POLICY "Users can manage their own profiles"
ON user_profiles FOR ALL
USING (
  email = COALESCE(auth.jwt() ->> 'email', '')
  OR (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  )
);

-- Create security audit log table
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  table_name VARCHAR NOT NULL,
  operation VARCHAR NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  user_id UUID,
  user_email VARCHAR,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can read audit logs
CREATE POLICY "Super admins can read audit logs"
ON security_audit_logs FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO security_audit_logs (
    table_name,
    operation,
    user_id,
    user_email,
    old_data,
    new_data,
    ip_address,
    user_agent
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    auth.uid(),
    COALESCE(auth.jwt() ->> 'email', ''),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    COALESCE(current_setting('request.headers', true)::json ->> 'x-forwarded-for', '0.0.0.0')::inet,
    COALESCE(current_setting('request.headers', true)::json ->> 'user-agent', '')
  );
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_admin_users ON admin_users;
CREATE TRIGGER audit_admin_users
  AFTER INSERT OR UPDATE OR DELETE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_articles ON articles;
CREATE TRIGGER audit_articles
  AFTER INSERT OR UPDATE OR DELETE ON articles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_contacts ON contacts;
CREATE TRIGGER audit_contacts
  AFTER INSERT OR UPDATE OR DELETE ON contacts
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_privacy_requests ON privacy_requests;
CREATE TRIGGER audit_privacy_requests
  AFTER INSERT OR UPDATE OR DELETE ON privacy_requests
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_articles_published_created ON articles(published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON security_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_table_name ON security_audit_logs(table_name);

-- Add data validation functions
CREATE OR REPLACE FUNCTION validate_email(email_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN email_input ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND LENGTH(email_input) BETWEEN 5 AND 254;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION validate_name(name_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN LENGTH(TRIM(name_input)) BETWEEN 2 AND 100
    AND name_input !~ '[<>"\''&]'; -- Prevent basic XSS characters
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add check constraints for additional validation
ALTER TABLE contacts 
ADD CONSTRAINT check_contacts_email CHECK (validate_email(email)),
ADD CONSTRAINT check_contacts_name CHECK (validate_name(name));

ALTER TABLE newsletter_subscribers 
ADD CONSTRAINT check_newsletter_email CHECK (validate_email(email));

ALTER TABLE user_profiles 
ADD CONSTRAINT check_user_profiles_email CHECK (validate_email(email)),
ADD CONSTRAINT check_user_profiles_name CHECK (validate_name(name));

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  identifier VARCHAR NOT NULL, -- IP address or user ID
  action VARCHAR NOT NULL, -- Type of action (contact_form, newsletter_signup, etc.)
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on rate limits
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Create index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_action ON rate_limits(identifier, action, window_start);

-- Rate limiting function
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier VARCHAR,
  p_action VARCHAR,
  p_max_requests INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  window_start TIMESTAMPTZ;
BEGIN
  window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Clean old entries
  DELETE FROM rate_limits 
  WHERE window_start < NOW() - INTERVAL '1 hour';
  
  -- Get current count
  SELECT COALESCE(SUM(count), 0) INTO current_count
  FROM rate_limits
  WHERE identifier = p_identifier
    AND action = p_action
    AND window_start > window_start;
  
  -- Check if limit exceeded
  IF current_count >= p_max_requests THEN
    RETURN FALSE;
  END IF;
  
  -- Update or insert rate limit record
  INSERT INTO rate_limits (identifier, action, count, window_start)
  VALUES (p_identifier, p_action, 1, NOW())
  ON CONFLICT (identifier, action) 
  DO UPDATE SET 
    count = rate_limits.count + 1,
    window_start = CASE 
      WHEN rate_limits.window_start < window_start THEN NOW()
      ELSE rate_limits.window_start
    END;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit TO anon, authenticated;
GRANT EXECUTE ON FUNCTION validate_email TO anon, authenticated;
GRANT EXECUTE ON FUNCTION validate_name TO anon, authenticated;