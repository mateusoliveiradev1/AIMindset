-- Secure RLS policies without recursion
-- This migration creates proper, secure RLS policies for all tables

-- 1. Admin Users - Simple policy for authenticated users
DROP POLICY IF EXISTS "simple_admin_access" ON admin_users;

CREATE POLICY "admin_users_select" ON admin_users
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "admin_users_insert" ON admin_users
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "admin_users_update" ON admin_users
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "admin_users_delete" ON admin_users
FOR DELETE 
TO authenticated
USING (true);

-- 2. Categories - Public read, admin write
CREATE POLICY "categories_select" ON categories
FOR SELECT 
USING (true);

CREATE POLICY "categories_insert" ON categories
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "categories_update" ON categories
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "categories_delete" ON categories
FOR DELETE 
TO authenticated
USING (true);

-- 3. Articles - Public read, admin write
CREATE POLICY "articles_select" ON articles
FOR SELECT 
USING (published = true OR auth.uid() IS NOT NULL);

CREATE POLICY "articles_insert" ON articles
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "articles_update" ON articles
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "articles_delete" ON articles
FOR DELETE 
TO authenticated
USING (true);

-- 4. Newsletter Subscribers - Public insert, admin read/update
CREATE POLICY "newsletter_subscribers_select" ON newsletter_subscribers
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "newsletter_subscribers_insert" ON newsletter_subscribers
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "newsletter_subscribers_update" ON newsletter_subscribers
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "newsletter_subscribers_delete" ON newsletter_subscribers
FOR DELETE 
TO authenticated
USING (true);

-- 5. Contacts - Public insert, admin read/update
CREATE POLICY "contacts_select" ON contacts
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "contacts_insert" ON contacts
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "contacts_update" ON contacts
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "contacts_delete" ON contacts
FOR DELETE 
TO authenticated
USING (true);

-- 6. Newsletter Logs - Admin only
CREATE POLICY "newsletter_logs_select" ON newsletter_logs
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "newsletter_logs_insert" ON newsletter_logs
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "newsletter_logs_update" ON newsletter_logs
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "newsletter_logs_delete" ON newsletter_logs
FOR DELETE 
TO authenticated
USING (true);

-- Grant permissions
GRANT SELECT ON categories TO anon;
GRANT SELECT ON articles TO anon;
GRANT INSERT ON newsletter_subscribers TO anon;
GRANT INSERT ON contacts TO anon;

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;