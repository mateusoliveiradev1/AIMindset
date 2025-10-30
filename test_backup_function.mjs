#!/usr/bin/env node

/**
 * Teste direto da função backup_all_data
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TESTE DA FUNÇÃO backup_all_data');
console.log('='.repeat(50));

async function testBackupFunction() {
  try {
    console.log('\n1. 🚀 Executando função backup_all_data...');
    
    const { data, error } = await supabase.rpc('backup_all_data');
    
    if (error) {
      console.error('❌ Erro na função:', error);
      return;
    }
    
    console.log('✅ Função executada com sucesso!');
    console.log('📊 Resultado:', JSON.stringify(data, null, 2));
    
    // Aguardar um pouco para garantir que o log foi inserido
    console.log('\n2. ⏳ Aguardando 2 segundos...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar se o log foi inserido
    console.log('\n3. 🔍 Verificando logs após backup...');
    const { data: logs, error: logsError } = await supabase.rpc('get_backup_logs', { 
      limit_count: 5 
    });
    
    if (logsError) {
      console.error('❌ Erro ao buscar logs:', logsError);
    } else {
      console.log(`✅ Logs encontrados: ${logs?.length || 0}`);
      if (logs && logs.length > 0) {
        console.log('📋 Últimos logs:');
        logs.forEach((log, index) => {
          console.log(`   ${index + 1}. ${log.action_type} - ${log.created_at} - ${log.records_affected} registros - Sucesso: ${log.success}`);
          if (log.details) {
            console.log(`      Detalhes: ${log.details}`);
          }
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testBackupFunction()
  .then(() => {
    console.log('\n✅ Teste concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });