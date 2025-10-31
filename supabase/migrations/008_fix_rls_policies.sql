-- Fix RLS Policies for admin_users
-- =====================================================

-- Drop existing policy
DROP POLICY IF EXISTS "admin_users_service_all" ON admin_users;

-- Create more permissive policy for testing and development
CREATE POLICY "admin_users_anon_read" ON admin_users
    FOR SELECT USING (true);

CREATE POLICY "admin_users_anon_insert" ON admin_users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "admin_users_anon_update" ON admin_users
    FOR UPDATE USING (true);

CREATE POLICY "admin_users_anon_delete" ON admin_users
    FOR DELETE USING (true);

-- Ensure the table exists and has proper structure
-- This is just a safety check
DO $$
BEGIN
    -- Check if admin_users table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users' AND table_schema = 'public') THEN
        RAISE NOTICE 'admin_users table does not exist!';
    ELSE
        RAISE NOTICE 'admin_users table exists and policies updated';
    END IF;
END $$;