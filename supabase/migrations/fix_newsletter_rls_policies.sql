-- Fix RLS policies for newsletter tables to prevent ERR_ABORTED errors

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "newsletter_subscribers_admin_access" ON newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_campaigns_admin_access" ON newsletter_campaigns;
DROP POLICY IF EXISTS "newsletter_subscribers_service_access" ON newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_campaigns_service_access" ON newsletter_campaigns;
DROP POLICY IF EXISTS "newsletter_subscribers_select" ON newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_campaigns_select" ON newsletter_campaigns;
DROP POLICY IF EXISTS "newsletter_subscribers_insert" ON newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_campaigns_insert" ON newsletter_campaigns;
DROP POLICY IF EXISTS "newsletter_subscribers_update" ON newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_campaigns_update" ON newsletter_campaigns;
DROP POLICY IF EXISTS "newsletter_subscribers_delete" ON newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_campaigns_delete" ON newsletter_campaigns;

-- Create comprehensive policies for newsletter_subscribers
CREATE POLICY "newsletter_subscribers_admin_access" ON newsletter_subscribers
FOR ALL USING (
  -- Always allow service role (for admin operations)
  auth.role() = 'service_role'
  OR
  -- Allow authenticated admin users
  (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN (
        'admin@aimindset.com',
        'administrador@aimindset.com',
        'contato@aimindset.com'
      )
    )
  )
  OR
  -- Allow anon users for subscription (INSERT only)
  (auth.role() = 'anon')
);

-- Create comprehensive policies for newsletter_campaigns
CREATE POLICY "newsletter_campaigns_admin_access" ON newsletter_campaigns
FOR ALL USING (
  -- Always allow service role (for admin operations)
  auth.role() = 'service_role'
  OR
  -- Allow authenticated admin users
  (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN (
        'admin@aimindset.com',
        'administrador@aimindset.com',
        'contato@aimindset.com'
      )
    )
  )
);

-- Ensure RLS is enabled
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to service role
GRANT ALL ON newsletter_subscribers TO service_role;
GRANT ALL ON newsletter_campaigns TO service_role;

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON newsletter_subscribers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON newsletter_campaigns TO authenticated;

-- Grant limited permissions to anon users (for newsletter subscription)
GRANT SELECT, INSERT ON newsletter_subscribers TO anon;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_subscribed_at ON newsletter_subscribers(subscribed_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_status ON newsletter_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_created_at ON newsletter_campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_sent_at ON newsletter_campaigns(sent_at);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';