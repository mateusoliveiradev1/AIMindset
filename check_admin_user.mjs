import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAndCreateAdmin() {
  try {
    console.log('🔍 Verificando usuário admin...');
    
    // Verificar se existe usuário admin
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', 'warface01031999@gmail.com');

    if (adminError) {
      console.error('❌ Erro ao verificar admin_users:', adminError);
    } else {
      console.log('📋 Admin users encontrados:', adminUsers);
    }

    // Verificar se existe usuário auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao listar usuários auth:', authError);
    } else {
      const targetUser = authUsers.users.find(u => u.email === 'warface01031999@gmail.com');
      console.log('🔐 Usuário auth encontrado:', targetUser ? 'SIM' : 'NÃO');
      if (targetUser) {
        console.log('   ID:', targetUser.id);
        console.log('   Email:', targetUser.email);
        console.log('   Confirmado:', targetUser.email_confirmed_at ? 'SIM' : 'NÃO');
      }
    }

    // Se não existe usuário auth, criar
    if (!authUsers.users.find(u => u.email === 'warface01031999@gmail.com')) {
      console.log('🚀 Criando usuário auth...');
      
      const { data: newAuthUser, error: createAuthError } = await supabase.auth.admin.createUser({
        email: 'warface01031999@gmail.com',
        password: '46257688884@Mateus',
        email_confirm: true
      });

      if (createAuthError) {
        console.error('❌ Erro ao criar usuário auth:', createAuthError);
      } else {
        console.log('✅ Usuário auth criado:', newAuthUser.user.email);
        
        // Criar entrada na tabela admin_users
        const { data: newAdminUser, error: createAdminError } = await supabase
          .from('admin_users')
          .insert({
            id: newAuthUser.user.id,
            email: newAuthUser.user.email,
            name: 'Super Admin',
            role: 'super_admin'
          })
          .select();

        if (createAdminError) {
          console.error('❌ Erro ao criar admin_user:', createAdminError);
        } else {
          console.log('✅ Admin user criado:', newAdminUser);
        }
      }
    }

    // Se não existe entrada na tabela admin_users, criar
    if (!adminUsers || adminUsers.length === 0) {
      const authUser = authUsers.users.find(u => u.email === 'warface01031999@gmail.com');
      if (authUser) {
        console.log('🚀 Criando entrada admin_users...');
        
        const { data: newAdminUser, error: createAdminError } = await supabase
          .from('admin_users')
          .insert({
            id: authUser.id,
            email: authUser.email,
            name: 'Super Admin',
            role: 'super_admin'
          })
          .select();

        if (createAdminError) {
          console.error('❌ Erro ao criar admin_user:', createAdminError);
        } else {
          console.log('✅ Admin user criado:', newAdminUser);
        }
      }
    }

    console.log('✅ Verificação concluída!');
    console.log('📧 Email: warface01031999@gmail.com');
    console.log('🔑 Senha: 46257688884@Mateus');
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

checkAndCreateAdmin();