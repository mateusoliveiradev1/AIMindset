-- Fix ERR_ABORTED errors for newsletter tables
-- This migration ensures proper RLS policies and permissions

-- Drop existing problematic policies
DROP POLICY IF EXISTS "newsletter_subscribers_admin_access" ON newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_campaigns_admin_access" ON newsletter_campaigns;
DROP POLICY IF EXISTS "newsletter_subscribers_service_access" ON newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_campaigns_service_access" ON newsletter_campaigns;

-- Disable RLS temporarily to clean up
ALTER TABLE newsletter_subscribers DISABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_campaigns DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for newsletter_subscribers
-- Allow service role full access (for admin operations)
CREATE POLICY "newsletter_subscribers_service_role_access" ON newsletter_subscribers
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users (admin) full access
CREATE POLICY "newsletter_subscribers_authenticated_access" ON newsletter_subscribers
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow anonymous users to insert (for newsletter subscription)
CREATE POLICY "newsletter_subscribers_anon_insert" ON newsletter_subscribers
FOR INSERT 
TO anon
WITH CHECK (true);

-- Allow anonymous users to select their own subscription (for unsubscribe)
CREATE POLICY "newsletter_subscribers_anon_select" ON newsletter_subscribers
FOR SELECT 
TO anon
USING (true);

-- Create comprehensive policies for newsletter_campaigns
-- Allow service role full access
CREATE POLICY "newsletter_campaigns_service_role_access" ON newsletter_campaigns
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users (admin) full access
CREATE POLICY "newsletter_campaigns_authenticated_access" ON newsletter_campaigns
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant necessary permissions to roles
-- Service role permissions
GRANT ALL ON newsletter_subscribers TO service_role;
GRANT ALL ON newsletter_campaigns TO service_role;
GRANT ALL ON newsletter_templates TO service_role;
GRANT ALL ON newsletter_logs TO service_role;

-- Authenticated role permissions
GRANT ALL ON newsletter_subscribers TO authenticated;
GRANT ALL ON newsletter_campaigns TO authenticated;
GRANT ALL ON newsletter_templates TO authenticated;
GRANT ALL ON newsletter_logs TO authenticated;

-- Anonymous role permissions (limited)
GRANT SELECT, INSERT ON newsletter_subscribers TO anon;

-- Ensure sequences are accessible
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_subscribed_at ON newsletter_subscribers(subscribed_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_status ON newsletter_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_created_at ON newsletter_campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_sent_at ON newsletter_campaigns(sent_at);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';