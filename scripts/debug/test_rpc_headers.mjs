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

console.log('--- TESTE DE RPC COM HEADERS ---');
console.log('URL:', supabaseUrl);
console.log('Key (prefix):', supabaseKey ? supabaseKey.substring(0, 15) + '...' : 'MISSING');

// Criar cliente com a mesma configuração do frontend
const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        'x-client-info': 'aimindset-app-test',
        'apikey': supabaseKey
      }
    }
});

async function testRPC() {
  console.log('\n1. Chamando RPC get_next_scheduled_article...');
  
  try {
    const { data, error } = await supabase.rpc('get_next_scheduled_article');
    
    if (error) {
      console.error('❌ Erro na RPC:', error);
      console.error('Code:', error.code);
      console.error('Details:', error.details);
      console.error('Hint:', error.hint);
      console.error('Message:', error.message);
    } else {
      console.log('✅ RPC executada com sucesso!');
      console.log('   Dados retornados:', data ? JSON.stringify(data, null, 2) : 'Nenhum dado (null)');
    }
  } catch (e) {
    console.error('❌ Erro inesperado:', e.message);
  }
}

testRPC();
