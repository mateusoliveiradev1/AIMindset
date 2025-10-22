import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function directFixRLS() {
  console.log('🚨 DIRECT RLS FIX - Using direct SQL execution...');

  try {
    // Test connection first
    console.log('\n🔍 Testing connection...');
    const { data: testData, error: testError } = await supabase
      .from('admin_users')
      .select('count', { count: 'exact', head: true });
    
    if (testError) {
      console.error('❌ Connection test failed:', testError);
      return;
    }
    console.log('✅ Connection successful');

    // Step 1: Disable RLS completely
    console.log('\n1️⃣ Disabling RLS on admin_users...');
    const { data: disableData, error: disableError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;'
    });
    
    if (disableError) {
      console.error('❌ Failed to disable RLS:', disableError);
    } else {
      console.log('✅ RLS disabled successfully');
    }

    // Step 2: Drop all policies
    console.log('\n2️⃣ Dropping all existing policies...');
    const dropSQL = `
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
    `;
    
    const { data: dropData, error: dropError } = await supabase.rpc('exec_sql', {
      sql: dropSQL
    });
    
    if (dropError) {
      console.error('❌ Failed to drop policies:', dropError);
    } else {
      console.log('✅ All policies dropped');
    }

    // Step 3: Test access without RLS
    console.log('\n3️⃣ Testing access without RLS...');
    const { data: testAccess, error: accessError } = await supabase
      .from('admin_users')
      .select('id, email, role')
      .limit(3);
    
    if (accessError) {
      console.error('❌ Access test failed:', accessError);
    } else {
      console.log('✅ Access test successful:', testAccess?.length || 0, 'records');
    }

    // Step 4: Re-enable RLS
    console.log('\n4️⃣ Re-enabling RLS...');
    const { data: enableData, error: enableError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;'
    });
    
    if (enableError) {
      console.error('❌ Failed to enable RLS:', enableError);
    } else {
      console.log('✅ RLS re-enabled');
    }

    // Step 5: Create simple policy
    console.log('\n5️⃣ Creating simple policy...');
    const { data: policyData, error: policyError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE POLICY "simple_admin_policy" ON admin_users FOR ALL USING (true);'
    });
    
    if (policyError) {
      console.error('❌ Failed to create policy:', policyError);
    } else {
      console.log('✅ Simple policy created');
    }

    // Step 6: Final test
    console.log('\n6️⃣ Final test...');
    const { data: finalData, error: finalError } = await supabase
      .from('admin_users')
      .select('id, email, role')
      .eq('email', 'warface01031999@gmail.com');
    
    if (finalError) {
      console.error('❌ Final test failed:', finalError);
    } else {
      console.log('✅ Final test successful:', finalData?.length || 0, 'admin found');
      if (finalData && finalData.length > 0) {
        console.log('Admin found:', finalData[0]);
      }
    }

    console.log('\n🎉 DIRECT FIX COMPLETED!');

  } catch (error) {
    console.error('💥 FATAL ERROR:', error);
  }
}

directFixRLS().catch(console.error);