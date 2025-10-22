import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSuperAdmin() {
  try {
    console.log('Creating super admin user...');
    
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'warface01031999@gmail.com',
      password: '46257688884@Mateus',
      email_confirm: true
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return;
    }

    console.log('Auth user created successfully:', authData.user.email);
    console.log('Super admin account created successfully!');
    console.log('Email: warface01031999@gmail.com');
    console.log('Password: 46257688884@Mateus');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createSuperAdmin();