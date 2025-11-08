import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRLSPolicies() {
  console.log('🔍 Testando políticas RLS para tabelas de logs...\n');

  try {
    // 1. Verificar usuários admin
    console.log('1. Verificando usuários admin...');
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('*');
    
    if (adminError) {
      console.error('❌ Erro ao buscar admin_users:', adminError.message);
    } else {
      console.log('✅ Admin users encontrados:', adminUsers?.length || 0);
      if (adminUsers && adminUsers.length > 0) {
        console.log('   Admins:', adminUsers.map(u => u.email).join(', '));
      }
    }

    // 2. Verificar autenticação atual
    console.log('\n2. Verificando autenticação atual...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Erro de autenticação:', authError.message);
    } else if (user) {
      console.log('✅ Usuário autenticado:', user.email);
    } else {
      console.log('⚠️  Nenhum usuário autenticado');
    }

    // 3. Testar acesso direto às tabelas de logs
    console.log('\n3. Testando acesso às tabelas de logs...');
    
    const tables = ['system_logs', 'app_logs', 'backend_logs'];
    
    for (const table of tables) {
      console.log(`\n   Testando ${table}:`);
      
      // Contar registros
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error(`   ❌ Erro ao contar ${table}:`, countError.message);
      } else {
        console.log(`   📊 Total de registros em ${table}: ${count}`);
      }
      
      // Buscar alguns registros
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(5);
      
      if (error) {
        console.error(`   ❌ Erro ao buscar ${table}:`, error.message);
      } else {
        console.log(`   ✅ Registros retornados de ${table}: ${data?.length || 0}`);
      }
    }

    // 4. Testar funções RPC
    console.log('\n4. Testando funções RPC...');
    
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_system_logs_stats');
    
    if (statsError) {
      console.error('   ❌ Erro na função get_system_logs_stats:', statsError.message);
    } else {
      console.log('   ✅ Função get_system_logs_stats funcionando:', statsData);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testRLSPolicies();