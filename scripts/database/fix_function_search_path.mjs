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

async function fixFunction() {
  console.log('--- CORRIGINDO SEARCH_PATH DA FUNÇÃO ---');
  
  // Script de correção
  const fixSQL = `
    ALTER FUNCTION public.sync_user_profile_with_auth() 
    SET search_path = public, extensions, pg_temp;
  `;
  
  console.log('1. Aplicando correção na função sync_user_profile_with_auth()...');
  console.log('   SQL:', fixSQL.trim());
  
  const { data, error } = await supabase.rpc('execute_sql', { sql_query: fixSQL });
  
  if (error) {
    console.error('❌ Erro ao aplicar correção:', error.message);
  } else {
    console.log('✅ Correção aplicada com sucesso!');
    console.log('   A função agora tem search_path explícito.');
  }

  // Verificação
  console.log('\n2. Verificando a definição atualizada via pg_proc.proconfig...');
  const verifySQL = `SELECT proconfig FROM pg_proc WHERE proname = 'sync_user_profile_with_auth'`;
  
  const { data: verifyData } = await supabase.rpc('execute_sql', { sql_query: verifySQL });
  
  if (verifyData && verifyData[0]) {
      const config = verifyData[0].proconfig;
      console.log('Configuração encontrada:', config);
      
      if (config && config.some(c => c.includes('search_path=public'))) {
          console.log('🎉 SUCESSO! O search_path foi definido corretamente.');
      } else {
          console.error('⚠️ AVISO: O search_path ainda não aparece na configuração.');
      }
  } else {
      console.log('❌ Não foi possível ler a configuração da função.');
  }
}

fixFunction();
