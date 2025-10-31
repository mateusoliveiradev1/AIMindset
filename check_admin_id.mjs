import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAdminUser() {
  try {
    console.log('🔍 Buscando usuário admin...');
    
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email, name, role')
      .eq('email', 'admin@aimindset.com')
      .single();

    if (error) {
      console.error('❌ Erro ao buscar admin:', error.message);
      return null;
    }

    if (data) {
      console.log('✅ Admin encontrado:');
      console.log(`   ID: ${data.id}`);
      console.log(`   Email: ${data.email}`);
      console.log(`   Nome: ${data.name}`);
      console.log(`   Role: ${data.role}`);
      return data.id;
    }

    console.log('❌ Admin não encontrado');
    return null;
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return null;
  }
}

getAdminUser();