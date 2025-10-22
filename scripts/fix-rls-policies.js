async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS policies to prevent infinite recursion...');

  const queries = [
    // Drop existing problematic policies
    'DROP POLICY IF EXISTS "Admin users can read admin_users" ON admin_users;',
    'DROP POLICY IF EXISTS "Only super_admins can add admin users" ON admin_users;',
    'DROP POLICY IF EXISTS "Admin users can update themselves" ON admin_users;',
    'DROP POLICY IF EXISTS "Super admins can manage all admin users" ON admin_users;',
    
    // Create simple, non-recursive policies for admin_users
    'CREATE POLICY "Users can read own record" ON admin_users FOR SELECT USING (auth.uid()::text = id::text);',
    'CREATE POLICY "Users can update own record" ON admin_users FOR UPDATE USING (auth.uid()::text = id::text);',
    'CREATE POLICY "Authenticated users can read admin_users" ON admin_users FOR SELECT USING (auth.role() = \'authenticated\');',
    
    // Fix newsletter_subscribers policies
    'DROP POLICY IF EXISTS "Admin users can manage newsletter subscribers" ON newsletter_subscribers;',
    'DROP POLICY IF EXISTS "Public can subscribe to newsletter" ON newsletter_subscribers;',
    'CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers FOR INSERT WITH CHECK (true);',
    'CREATE POLICY "Authenticated users can read subscribers" ON newsletter_subscribers FOR SELECT USING (auth.role() = \'authenticated\');',
    'CREATE POLICY "Authenticated users can update subscribers" ON newsletter_subscribers FOR UPDATE USING (auth.role() = \'authenticated\');',
    
    // Fix newsletter_logs policies
    'DROP POLICY IF EXISTS "Admin users can manage newsletter logs" ON newsletter_logs;',
    'CREATE POLICY "Authenticated users can read logs" ON newsletter_logs FOR SELECT USING (auth.role() = \'authenticated\');',
    'CREATE POLICY "Authenticated users can insert logs" ON newsletter_logs FOR INSERT WITH CHECK (auth.role() = \'authenticated\');',
    'CREATE POLICY "Authenticated users can update logs" ON newsletter_logs FOR UPDATE USING (auth.role() = \'authenticated\');'
  ];

  for (const query of queries) {
    try {
      console.log(`Executing: ${query.substring(0, 50)}...`);
      
      // Try using direct SQL execution
      const { data, error } = await supabase
        .from('_supabase_admin')
        .select('*')
        .limit(0);
      
      // If that doesn't work, try the rpc approach
      const result = await supabase.rpc('exec_sql', { sql: query });
      
      if (result.error) {
        console.error(`❌ Error executing query: ${result.error.message}`);
        console.error(`Full error:`, result.error);
      } else {
        console.log('✅ Query executed successfully');
        console.log('Result:', result.data);
      }
    } catch (err) {
      console.error(`❌ Exception: ${err.message}`);
      console.error('Full exception:', err);
    }
  }

  console.log('🎉 RLS policies fix completed!');
}