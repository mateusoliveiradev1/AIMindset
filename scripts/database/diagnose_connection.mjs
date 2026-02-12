import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fallback credentials from src/lib/supabase.ts (GARANTIR que estamos usando o mesmo)
const EMERGENCY_SUPABASE_URL = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const EMERGENCY_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabaseUrl = process.env.SUPABASE_URL || EMERGENCY_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || EMERGENCY_SUPABASE_ANON_KEY;

console.log('--- DIAGNÓSTICO DE CONEXÃO ---');
console.log('URL:', supabaseUrl);
console.log('Key (prefix):', supabaseKey ? supabaseKey.substring(0, 15) + '...' : 'MISSING');

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log('\n1. Testando conexão básica (SELECT count from articles)...');
  const { data: articles, error: articlesError } = await supabase.from('articles').select('count').limit(1);
  if (articlesError) {
    console.error('❌ Erro ao conectar na tabela articles:', articlesError.message);
  } else {
    console.log('✅ Conexão OK. Artigos encontrados (ou tabela vazia).');
  }

  console.log('\n2. Verificando tabela user_profiles...');
  const { data: profiles, error: profilesError } = await supabase.from('user_profiles').select('*').limit(1);
  
  if (profilesError) {
    console.error('❌ ERRO CRÍTICO: Tabela user_profiles inacessível/inexistente:', profilesError.message);
    console.error('Detalhes:', profilesError);
  } else {
    console.log('✅ Tabela user_profiles acessível via API.');
    console.log('   Registros encontrados:', profiles.length);
  }

  console.log('\n3. Verificando SCHEMA e TRIGGERS (via RPC execute_sql)...');
  // Vamos tentar listar as tabelas do schema public via SQL direto para ter certeza
  const listTablesSQL = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  
  const { data: tablesData, error: tablesError } = await supabase.rpc('execute_sql', { sql_query: listTablesSQL });

  if (tablesError) {
    console.error('⚠️ Não foi possível listar tabelas via RPC (execute_sql pode não existir):', tablesError.message);
  } else {
    console.log('✅ Tabelas no schema public:');
    // O retorno do execute_sql é JSON, mas pode vir encapsulado. Vamos tentar parsear.
    // Dependendo da implementação do execute_sql, ele retorna rows direto ou objeto.
    console.log(JSON.stringify(tablesData, null, 2));
    
    // Verificar se user_profiles está na lista
    // Assumindo que o retorno seja array de objetos
    // Se for string JSON, precisaria de parse.
  }

  console.log('\n4. Verificando Triggers na tabela auth.users...');
  // Triggers em auth.users muitas vezes causam esse erro ao tentar inserir em public.user_profiles
  const listTriggersSQL = `
    SELECT 
      event_object_schema as table_schema,
      event_object_table as table_name,
      trigger_schema,
      trigger_name,
      event_manipulation as event,
      action_statement as definition
    FROM information_schema.triggers
    WHERE event_object_schema = 'auth' AND event_object_table = 'users';
  `;
  
  const { data: triggersData, error: triggersError } = await supabase.rpc('execute_sql', { sql_query: listTriggersSQL });
  
  if (triggersError) {
    console.error('⚠️ Erro ao listar triggers:', triggersError.message);
  } else {
    console.log('✅ Triggers em auth.users:');
    console.log(JSON.stringify(triggersData, null, 2));
  }
}

diagnose();
