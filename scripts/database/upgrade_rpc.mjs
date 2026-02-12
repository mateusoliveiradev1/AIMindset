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

async function upgradeRPC() {
  console.log('--- ATUALIZANDO RPC execute_sql ---');
  
  // Função que retorna JSON com resultados
  const upgradeFunctionSQL = `
    CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
    RETURNS JSON
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
        result JSON;
    BEGIN
        EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (%s) t', sql_query) INTO result;
        RETURN result;
    EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object('error', SQLERRM);
    END;
    $$;
    
    NOTIFY pgrst, 'reload config';
  `;
  
  console.log('1. Executando upgrade da função...');
  
  try {
    const { error: createError } = await supabase.rpc('execute_sql', { sql_query: upgradeFunctionSQL });
    
    if (createError) {
      console.error('❌ Falha ao atualizar função:', createError.message);
    } else {
      console.log('✅ Função execute_sql atualizada com sucesso!');
      console.log('   Agora ela retorna os resultados das queries.');
    }
  } catch (e) {
    console.error('❌ Erro inesperado ao chamar RPC:', e.message);
  }
}

upgradeRPC();
