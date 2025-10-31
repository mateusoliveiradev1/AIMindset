import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAdminUsersSystem() {
  console.log('\n🔍 Testando Sistema de Usuários Administrativos...');
  let successCount = 0;
  let totalTests = 0;

  // Teste 1: Listar usuários administrativos
  totalTests++;
  try {
    const { data: adminUsers, error } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    console.log(`✅ Listar usuários administrativos: OK (${adminUsers.length} usuários)`);
    successCount++;
  } catch (error) {
    console.log(`❌ Erro ao listar usuários administrativos: ${error.message}`);
  }

  // Teste 2: Criar usuário administrativo
  totalTests++;
  try {
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .insert({
        email: 'admin.teste@aimindset.com',
        name: 'Admin Teste',
        role: 'admin'
      })
      .select()
      .single();

    if (error) throw error;
    console.log('✅ Criar usuário administrativo: OK');
    successCount++;

    // Teste 3: Ler usuário administrativo
    totalTests++;
    const { data: readAdmin, error: readError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', adminUser.id)
      .single();

    if (readError) throw readError;
    console.log('✅ Ler usuário administrativo: OK');
    successCount++;

    // Teste 4: Atualizar usuário administrativo
    totalTests++;
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({ 
        name: 'Admin Teste Atualizado',
        role: 'super_admin'
      })
      .eq('id', adminUser.id);

    if (updateError) throw updateError;
    console.log('✅ Atualizar usuário administrativo: OK');
    successCount++;

    // Teste 5: Deletar usuário administrativo
    totalTests++;
    const { error: deleteError } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', adminUser.id);

    if (deleteError) throw deleteError;
    console.log('✅ Deletar usuário administrativo: OK');
    successCount++;

  } catch (error) {
    console.log(`❌ Erro no sistema de usuários administrativos: ${error.message}`);
  }

  return { successCount, totalTests };
}

async function testUserProfilesSystem() {
  console.log('\n🔍 Testando Sistema de Perfis de Usuário...');
  let successCount = 0;
  let totalTests = 0;

  // Teste 1: Criar perfil de usuário
  totalTests++;
  try {
    const { data: userProfile, error } = await supabase
      .from('user_profiles')
      .insert({
        name: 'João Silva',
        email: 'joao.silva@teste.com',
        newsletter_preference: true
      })
      .select()
      .single();

    if (error) throw error;
    console.log('✅ Criar perfil de usuário: OK');
    successCount++;

    // Teste 2: Ler perfil de usuário
    totalTests++;
    const { data: readProfile, error: readError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userProfile.id)
      .single();

    if (readError) throw readError;
    console.log('✅ Ler perfil de usuário: OK');
    successCount++;

    // Teste 3: Atualizar perfil de usuário
    totalTests++;
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        name: 'João Silva Atualizado',
        newsletter_preference: false
      })
      .eq('id', userProfile.id);

    if (updateError) throw updateError;
    console.log('✅ Atualizar perfil de usuário: OK');
    successCount++;

    // Teste 4: Listar perfis de usuário
    totalTests++;
    const { data: profiles, error: listError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (listError) throw listError;
    console.log('✅ Listar perfis de usuário: OK');
    successCount++;

    // Teste 5: Deletar perfil de usuário
    totalTests++;
    const { error: deleteError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userProfile.id);

    if (deleteError) throw deleteError;
    console.log('✅ Deletar perfil de usuário: OK');
    successCount++;

  } catch (error) {
    console.log(`❌ Erro no sistema de perfis de usuário: ${error.message}`);
  }

  return { successCount, totalTests };
}

async function testAuthUsersSystem() {
  console.log('\n🔍 Testando Sistema de Autenticação (Auth Users)...');
  let successCount = 0;
  let totalTests = 0;

  // Teste 1: Listar perfis de usuário (user_profiles)
  totalTests++;
  try {
    const { data: userProfiles, error } = await supabase
      .from('user_profiles')
      .select('id, email, name, created_at')
      .limit(10);

    if (error) throw error;
    console.log(`✅ Listar perfis de usuário: OK (${userProfiles.length} usuários)`);
    successCount++;
  } catch (error) {
    console.log(`❌ Erro ao listar perfis de usuário: ${error.message}`);
  }

  // Teste 2: Verificar estrutura da tabela user_profiles
  totalTests++;
  try {
    const { data: userProfile, error } = await supabase
      .from('user_profiles')
      .select('id, email, name, newsletter_preference, created_at, updated_at')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    console.log('✅ Verificar estrutura user_profiles: OK');
    successCount++;
  } catch (error) {
    console.log(`❌ Erro na estrutura user_profiles: ${error.message}`);
  }

  return { successCount, totalTests };
}

async function testUserValidations() {
  console.log('\n🔍 Testando Validações de Usuário...');
  let successCount = 0;
  let totalTests = 0;

  // Teste 1: Validação de email inválido (validate_email function)
  totalTests++;
  try {
    const { error } = await supabase
      .from('user_profiles')
      .insert({
        name: 'Teste Validação',
        email: 'email-invalido-sem-arroba'
      });

    if (error && (error.message.includes('check constraint') || error.message.includes('violates check') || error.message.includes('validate_email'))) {
      console.log('✅ Validação de email inválido: OK');
      successCount++;
    } else {
      console.log('❌ Validação de email inválido deveria ter falhado');
    }
  } catch (error) {
    console.log(`❌ Erro na validação de email: ${error.message}`);
  }

  // Teste 2: Validação de nome inválido (validate_name function)
  totalTests++;
  try {
    const { error } = await supabase
      .from('user_profiles')
      .insert({
        name: '', // Nome vazio
        email: 'teste.nome@aimindset.com'
      });

    if (error && (error.message.includes('check constraint') || error.message.includes('violates check') || error.message.includes('validate_name'))) {
      console.log('✅ Validação de nome inválido: OK');
      successCount++;
    } else {
      console.log('❌ Validação de nome inválido deveria ter falhado');
    }
  } catch (error) {
    console.log(`❌ Erro na validação de nome: ${error.message}`);
  }

  // Teste 3: Validação de role de admin (CHECK constraint)
  totalTests++;
  try {
    const { error } = await supabase
      .from('admin_users')
      .insert({
        email: 'admin.role.teste@aimindset.com',
        name: 'Admin Teste',
        role: 'role_invalida'
      });

    if (error && (error.message.includes('check constraint') || error.message.includes('violates check'))) {
      console.log('✅ Validação de role inválida: OK');
      successCount++;
    } else {
      console.log('❌ Validação de role deveria ter falhado');
    }
  } catch (error) {
    console.log(`❌ Erro na validação de role: ${error.message}`);
  }

  return { successCount, totalTests };
}

async function testUserStats() {
  console.log('\n🔍 Testando Estatísticas de Usuários...');
  let successCount = 0;
  let totalTests = 0;

  // Teste 1: Contar usuários administrativos por role
  totalTests++;
  try {
    const { count: adminCount, error: adminError } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    const { count: superAdminCount, error: superError } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'super_admin');

    if (adminError || superError) throw adminError || superError;
    console.log(`✅ Contar usuários por role: OK (${adminCount} admins, ${superAdminCount} super_admins)`);
    successCount++;
  } catch (error) {
    console.log(`❌ Erro ao contar usuários por role: ${error.message}`);
  }

  // Teste 2: Contar perfis com newsletter ativa
  totalTests++;
  try {
    const { count, error } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('newsletter_preference', true);

    if (error) throw error;
    console.log(`✅ Contar perfis com newsletter: OK (${count} usuários)`);
    successCount++;
  } catch (error) {
    console.log(`❌ Erro ao contar perfis com newsletter: ${error.message}`);
  }

  return { successCount, totalTests };
}

async function main() {
  console.log('🚀 Iniciando testes do Sistema de Usuários e Autenticação...\n');

  const adminResult = await testAdminUsersSystem();
  const profilesResult = await testUserProfilesSystem();
  const authResult = await testAuthUsersSystem();
  const validationsResult = await testUserValidations();
  const statsResult = await testUserStats();

  const totalSuccess = adminResult.successCount + profilesResult.successCount + 
                      authResult.successCount + validationsResult.successCount + 
                      statsResult.successCount;
  const totalTests = adminResult.totalTests + profilesResult.totalTests + 
                     authResult.totalTests + validationsResult.totalTests + 
                     statsResult.totalTests;
  const successRate = ((totalSuccess / totalTests) * 100).toFixed(1);

  console.log('\n📊 RESUMO DOS TESTES:');
  console.log(`Usuários Administrativos: ${adminResult.successCount}/${adminResult.totalTests} (${((adminResult.successCount / adminResult.totalTests) * 100).toFixed(1)}%)`);
  console.log(`Perfis de Usuário: ${profilesResult.successCount}/${profilesResult.totalTests} (${((profilesResult.successCount / profilesResult.totalTests) * 100).toFixed(1)}%)`);
  console.log(`Sistema de Autenticação: ${authResult.successCount}/${authResult.totalTests} (${((authResult.successCount / authResult.totalTests) * 100).toFixed(1)}%)`);
  console.log(`Validações: ${validationsResult.successCount}/${validationsResult.totalTests} (${((validationsResult.successCount / validationsResult.totalTests) * 100).toFixed(1)}%)`);
  console.log(`Estatísticas: ${statsResult.successCount}/${statsResult.totalTests} (${((statsResult.successCount / statsResult.totalTests) * 100).toFixed(1)}%)`);
  console.log(`\n🎯 TOTAL: ${totalSuccess}/${totalTests} testes passaram (${successRate}%)`);

  if (successRate === '100.0') {
    console.log('✅ Todos os sistemas de usuários estão funcionando perfeitamente!');
  } else {
    console.log('⚠️  Alguns sistemas de usuários precisam de atenção.');
  }
}

main().catch(console.error);