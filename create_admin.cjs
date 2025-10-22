const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  try {
    console.log('Checking if admin user exists...');
    
    // First, check if user already exists in auth
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }
    
    const existingUser = existingUsers.users.find(user => user.email === 'warface01031999@gmail.com');
    
    let userId;
    
    if (existingUser) {
      console.log('Auth user already exists:', existingUser.email);
      userId = existingUser.id;
      
      // Update password for existing user
      console.log('Updating password for existing user...');
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: 'admin123456789' }
      );
      
      if (updateError) {
        console.error('Error updating password:', updateError);
      } else {
        console.log('Password updated successfully');
      }
    } else {
      // Create the auth user
      console.log('Creating auth user...');
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'warface01031999@gmail.com',
        password: 'admin123456789',
        email_confirm: true
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        return;
      }

      console.log('Auth user created:', authData.user?.email);
      userId = authData.user.id;
    }

    // Check if admin record exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', 'warface01031999@gmail.com')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking admin user:', checkError);
      return;
    }

    if (existingAdmin) {
      console.log('Admin user record already exists:', existingAdmin);
      console.log('✅ Admin user is ready!');
      return;
    }

    // Insert into admin_users table
    console.log('Creating admin user record...');
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .insert([
        {
          id: userId,
          email: 'warface01031999@gmail.com',
          name: 'Admin User',
          role: 'admin',
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (adminError) {
      console.error('Error creating admin user record:', adminError);
      return;
    }

    console.log('Admin user record created:', adminData);
    console.log('✅ Admin user created successfully!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createAdminUser();