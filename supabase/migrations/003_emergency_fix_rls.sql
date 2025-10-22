-- Emergency fix for infinite recursion in admin_users RLS policies
-- This migration completely removes all existing policies and creates a simple one

-- Step 1: Disable RLS temporarily
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies on admin_users
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'admin_users'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON admin_users';
        RAISE NOTICE 'Dropped policy: %', policy_name;
    END LOOP;
END $$;

-- Step 3: Re-enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create a simple, non-recursive policy
CREATE POLICY "simple_admin_access" ON admin_users
FOR ALL 
USING (true);

-- Step 5: Grant necessary permissions
GRANT ALL ON admin_users TO authenticated;
GRANT ALL ON admin_users TO anon;

-- Verification query (commented out for migration)
-- SELECT * FROM admin_users WHERE email = 'warface01031999@gmail.com';