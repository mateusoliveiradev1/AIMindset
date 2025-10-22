-- Fix infinite recursion in RLS policies
-- Execute this directly in Supabase SQL Editor

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Admin users can read admin_users" ON admin_users;
DROP POLICY IF EXISTS "Only super_admins can add admin users" ON admin_users;
DROP POLICY IF EXISTS "Admin users can update themselves" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage all admin users" ON admin_users;

-- Create simple, non-recursive policies for admin_users
CREATE POLICY "Users can read own record" ON admin_users
FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own record" ON admin_users
FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Authenticated users can read admin_users" ON admin_users
FOR SELECT USING (auth.role() = 'authenticated');

-- Fix newsletter_subscribers policies
DROP POLICY IF EXISTS "Admin users can manage newsletter subscribers" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Public can subscribe to newsletter" ON newsletter_subscribers;

CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers
FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can read subscribers" ON newsletter_subscribers
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update subscribers" ON newsletter_subscribers
FOR UPDATE USING (auth.role() = 'authenticated');

-- Fix newsletter_logs policies
DROP POLICY IF EXISTS "Admin users can manage newsletter logs" ON newsletter_logs;

CREATE POLICY "Authenticated users can read logs" ON newsletter_logs
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert logs" ON newsletter_logs
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update logs" ON newsletter_logs
FOR UPDATE USING (auth.role() = 'authenticated');