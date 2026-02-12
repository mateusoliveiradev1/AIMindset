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

async function investigateTriggers() {
  console.log('--- INVESTIGAÇÃO DE TRIGGERS ---');

  // 1. Listar Triggers em auth.users
  console.log('\n1. Buscando triggers na tabela auth.users...');
  const triggersQuery = `
    SELECT 
      trigger_name,
      event_manipulation,
      action_statement
    FROM information_schema.triggers
    WHERE event_object_schema = 'auth' 
    AND event_object_table = 'users'
  `;
  
  // Usar execute_sql que agora retorna JSON
  const { data: triggersResult, error: triggersError } = await supabase.rpc('execute_sql', { sql_query: triggersQuery });

  if (triggersError) {
    console.error('❌ Erro ao listar triggers:', triggersError.message);
  } else {
    // triggersResult deve ser o array direto
    const triggersData = triggersResult;
    console.log('✅ Triggers encontrados:', JSON.stringify(triggersData, null, 2));
    
    if (Array.isArray(triggersData)) {
      for (const trigger of triggersData) {
        // Extrair nome da função
        const match = trigger.action_statement.match(/EXECUTE (?:PROCEDURE|FUNCTION) ([\w\.]+)\(/i);
        
        if (match && match[1]) {
          const functionName = match[1];
          console.log(`\n🔍 Analisando função: ${functionName}`);
          
          // Buscar definição
          const funcQuery = `SELECT pg_get_functiondef('${functionName}'::regproc) as definition`;
          const { data: funcResult, error: funcError } = await supabase.rpc('execute_sql', { sql_query: funcQuery });
          
          if (funcResult && funcResult[0]) {
             const def = funcResult[0].definition;
             console.log('📜 Definição da função (início):');
             console.log(def.substring(0, 500) + '...');
             
             if (!def.includes('SET search_path')) {
               console.warn('⚠️ ALERTA: Função sem search_path definido!');
               console.warn('Isso pode causar o erro "relation does not exist" se a tabela estiver em public.');
               
               // Se detectarmos isso, vamos gerar o script de correção
               console.log(`\n🚨 AÇÃO NECESSÁRIA: Corrigir função ${functionName}`);
               console.log(`Script sugerido:`);
               console.log(`ALTER FUNCTION ${functionName}() SET search_path = public, extensions;`);
             } else {
               console.log('✅ search_path está definido.');
             }
          } else {
            console.log('❌ Não foi possível ler a definição da função.', funcError ? funcError.message : '');
          }
        }
      }
    } else {
        console.log('Nenhum trigger encontrado ou formato inesperado:', triggersData);
    }
  }
}

investigateTriggers();
