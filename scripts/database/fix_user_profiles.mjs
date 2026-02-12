import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fallback credentials from src/lib/supabase.ts
const EMERGENCY_SUPABASE_URL = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const EMERGENCY_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabaseUrl = process.env.SUPABASE_URL || EMERGENCY_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || EMERGENCY_SUPABASE_ANON_KEY;

console.log('Using Supabase URL:', supabaseUrl);
console.log('Using Supabase Key length:', supabaseKey ? supabaseKey.length : 0);

const supabase = createClient(
  supabaseUrl, 
  supabaseKey
);

async function fixUserProfiles() {
  console.log('🔧 Iniciando correção da tabela user_profiles...\n');
  
  // 1. Verificar se a tabela já existe
  const { error: checkError } = await supabase.from('user_profiles').select('count', { count: 'exact', head: true });
  
  if (!checkError) {
    console.log('✅ Tabela user_profiles já existe e está acessível.');
    // Mesmo existindo, vamos verificar se tem a coluna avatar_url
    // Infelizmente não dá pra checar colunas facilmente via client padrão sem query direta
    // Mas vamos tentar rodar o SQL de qualquer forma pois ele usa IF NOT EXISTS
  } else {
    console.log('⚠️ Tabela user_profiles não encontrada ou inacessível. Tentando criar...');
  }

  // 2. Ler o arquivo SQL
  const sqlPath = path.join(__dirname, 'fix_user_profiles_manual.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  try {
    // 3. Tentar executar via RPC 'execute_sql' (se existir no banco)
    const { data, error } = await supabase.rpc('execute_sql', { sql_query: sqlContent });

    if (error) {
      console.error('❌ Erro ao tentar executar via RPC:', error.message);
      console.log('\n⚠️ A função RPC "execute_sql" pode não estar habilitada no seu banco.');
      console.log('👉 Por favor, execute o SQL manualmente no Painel do Supabase.');
      console.log(`\nConteúdo do arquivo: ${sqlPath}`);
    } else {
      console.log('✅ Script SQL executado com sucesso via RPC!');
    }

  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
  }

  // 4. Verificação final
  console.log('\n🔍 Verificando status final...');
  const { data: finalCheck, error: finalError } = await supabase.from('user_profiles').select('count', { count: 'exact', head: true });
  
  if (!finalError) {
    console.log('🎉 SUCESSO! A tabela user_profiles está ativa.');
  } else {
    console.log('❌ A tabela ainda não está acessível. Verifique o painel do Supabase.');
    console.log('Erro:', finalError.message);
    console.log('\n📋 SQL PARA EXECUÇÃO MANUAL:');
    console.log('----------------------------------------');
    console.log(sqlContent);
    console.log('----------------------------------------');
  }
}

fixUserProfiles();
