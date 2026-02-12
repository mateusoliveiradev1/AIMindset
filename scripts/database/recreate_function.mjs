import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fallback credentials from src/lib/supabase.ts
const EMERGENCY_SUPABASE_URL = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const EMERGENCY_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const supabaseUrl = process.env.SUPABASE_URL || EMERGENCY_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || EMERGENCY_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function recreateFunction() {
  console.log('--- RECRIAÇÃO DE FUNÇÃO COM SEARCH_PATH ---');
  
  const functionName = 'sync_user_profile_with_auth';
  console.log(`1. Obtendo definição atual de ${functionName}...`);
  
  const getDefSQL = `SELECT pg_get_functiondef('${functionName}'::regproc) as definition`;
  const { data: defData, error: defError } = await supabase.rpc('execute_sql', { sql_query: getDefSQL });
  
  if (defError || !defData || !defData[0]) {
    console.error('❌ Falha ao obter definição:', defError?.message);
    return;
  }
  
  let definition = defData[0].definition;
  
  // Verificar se já tem search_path
  if (definition.includes('SET search_path')) {
    console.log('✅ Função já possui search_path definido.');
    // Mesmo assim vamos forçar update para garantir que está correto
  }
  
  // Modificar a definição para incluir search_path
  // Estratégia: Inserir "SET search_path = public, extensions, pg_temp" antes de "AS $function$" ou "AS $$"
  // Geralmente pg_get_functiondef retorna algo como:
  // CREATE OR REPLACE FUNCTION public.foo() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $function$ ...
  
  console.log('2. Modificando definição para incluir search_path...');
  
  // Se não tiver search_path, adicionar
  if (!definition.includes('SET search_path')) {
    // Tentar encontrar o ponto de inserção ideal
    // Padrão: SECURITY DEFINER ... AS
    if (definition.includes('SECURITY DEFINER')) {
      definition = definition.replace(
        'SECURITY DEFINER', 
        'SECURITY DEFINER SET search_path = public, extensions, pg_temp'
      );
    } else {
      // Se não for security definer (o que seria estranho para um trigger de auth), 
      // adicionar logo antes do AS
      // Mas triggers de auth DEVEM ser security definer.
      console.warn('⚠️ Função não é SECURITY DEFINER? Adicionando mesmo assim.');
      // Fallback regex
      definition = definition.replace(/\sAS\s+\$/, ' SET search_path = public, extensions, pg_temp AS $');
    }
  } else {
    // Se já tiver, garantir que public está lá
     console.log('⚠️ Já tem search_path, mantendo como está (assumindo que o ALTER anterior funcionou mas pg_proc não mostrou).');
     // Se quisermos forçar, teríamos que substituir o existente.
  }
  
  console.log('Nova definição (início):');
  console.log(definition.substring(0, 300) + '...');
  
  console.log('3. Executando recriação...');
  const { error: recreateError } = await supabase.rpc('execute_sql', { sql_query: definition });
  
  if (recreateError) {
    console.error('❌ Erro ao recriar função:', recreateError.message);
  } else {
    console.log('✅ Função recriada com sucesso!');
  }
  
  // Verificação final via proconfig
  console.log('\n4. Verificação final via pg_proc.proconfig...');
  const verifySQL = `SELECT proconfig FROM pg_proc WHERE proname = '${functionName}'`;
  const { data: verifyData } = await supabase.rpc('execute_sql', { sql_query: verifySQL });
  
  if (verifyData && verifyData[0]) {
      console.log('Configuração atual:', verifyData[0].proconfig);
  }
}

recreateFunction();
