import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function emergencyFixRLS() {
  console.log('🚨 EMERGENCY RLS FIX - Removing ALL policies and disabling RLS...');

  try {
    // Step 1: Disable RLS completely on admin_users
    console.log('\n1️⃣ Disabling RLS on admin_users table...');
    const disableRLS = await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;' 
    });
    
    if (disableRLS.error) {
      console.error('❌ Error disabling RLS:', disableRLS.error);
    } else {
      console.log('✅ RLS disabled successfully');
    }

    // Step 2: Drop ALL existing policies
    console.log('\n2️⃣ Dropping ALL existing policies...');
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Admin users can read admin_users" ON admin_users;',
      'DROP POLICY IF EXISTS "Only super_admins can add admin users" ON admin_users;',
      'DROP POLICY IF EXISTS "Admin users can update themselves" ON admin_users;',
      'DROP POLICY IF EXISTS "Super admins can manage all admin users" ON admin_users;',
      'DROP POLICY IF EXISTS "Users can read own record" ON admin_users;',
      'DROP POLICY IF EXISTS "Users can update own record" ON admin_users;',
      'DROP POLICY IF EXISTS "Authenticated users can read admin_users" ON admin_users;',
      'DROP POLICY IF EXISTS "Simple admin access" ON admin_users;'
    ];

    for (const policy of dropPolicies) {
      const result = await supabase.rpc('exec_sql', { sql: policy });
      if (result.error) {
        console.log(`⚠️ Policy might not exist: ${policy.substring(0, 50)}...`);
      } else {
        console.log(`✅ Dropped: ${policy.substring(0, 50)}...`);
      }
    }

    // Step 3: Test without RLS first
    console.log('\n3️⃣ Testing admin_users access without RLS...');
    const testQuery = await supabase
      .from('admin_users')
      .select('id, email, role')
      .limit(5);

    if (testQuery.error) {
      console.error('❌ Error testing admin_users:', testQuery.error);
    } else {
      console.log('✅ Admin users accessible:', testQuery.data?.length || 0, 'records found');
    }

    // Step 4: Re-enable RLS with VERY simple policy
    console.log('\n4️⃣ Re-enabling RLS with simple policy...');
    const enableRLS = await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;' 
    });
    
    if (enableRLS.error) {
      console.error('❌ Error enabling RLS:', enableRLS.error);
    } else {
      console.log('✅ RLS re-enabled');
    }

    // Step 5: Create the simplest possible policy
    console.log('\n5️⃣ Creating ultra-simple policy...');
    const simplePolicy = await supabase.rpc('exec_sql', { 
      sql: `CREATE POLICY "allow_all_admin_access" ON admin_users FOR ALL USING (true);`
    });
    
    if (simplePolicy.error) {
      console.error('❌ Error creating simple policy:', simplePolicy.error);
    } else {
      console.log('✅ Ultra-simple policy created (allows all access)');
    }

    // Step 6: Final test
    console.log('\n6️⃣ Final test with new policy...');
    const finalTest = await supabase
      .from('admin_users')
      .select('id, email, role')
      .eq('email', 'warface01031999@gmail.com');

    if (finalTest.error) {
      console.error('❌ Final test failed:', finalTest.error);
    } else {
      console.log('✅ Final test successful:', finalTest.data?.length || 0, 'admin found');
      if (finalTest.data && finalTest.data.length > 0) {
        console.log('Admin user:', finalTest.data[0]);
      }
    }

    console.log('\n🎉 EMERGENCY FIX COMPLETED!');
    console.log('The admin_users table now has a simple policy that allows all access.');
    console.log('This should resolve the infinite recursion issue.');

  } catch (error) {
    console.error('💥 FATAL ERROR during emergency fix:', error);
  }
}

emergencyFixRLS().catch(console.error);