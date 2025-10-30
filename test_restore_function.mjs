#!/usr/bin/env node

/**
 * Teste da função restore_from_backup corrigida
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

console.log('🧪 TESTE DA FUNÇÃO restore_from_backup CORRIGIDA');
console.log('='.repeat(60));

async function testRestoreFunction() {
  try {
    console.log('\n1. 🔍 Verificando se existe backup...');
    
    const { data: backupCheck, error: backupError } = await supabase
      .from('backup_articles')
      .select('*')
      .limit(1);
    
    if (backupError) {
      console.error('❌ Erro ao verificar backup:', backupError);
      return;
    }
    
    if (!backupCheck || backupCheck.length === 0) {
      console.log('⚠️ Nenhum backup encontrado. Criando backup primeiro...');
      
      const { data: backupResult, error: createError } = await supabase.rpc('backup_all_data');
      
      if (createError) {
        console.error('❌ Erro ao criar backup:', createError);
        return;
      }
      
      console.log('✅ Backup criado:', backupResult);
    } else {
      console.log('✅ Backup encontrado:', backupCheck.length, 'registros');
    }
    
    console.log('\n2. 🚀 Executando função restore_from_backup...');
    
    const { data, error } = await supabase.rpc('restore_from_backup');
    
    if (error) {
      console.error('❌ Erro na função de restauração:', error);
      console.error('   Código:', error.code);
      console.error('   Mensagem:', error.message);
      console.error('   Detalhes:', error.details);
      return;
    }
    
    console.log('✅ Função executada com sucesso!');
    console.log('📊 Resultado:', JSON.stringify(data, null, 2));
    
    // Aguardar um pouco para garantir que o log foi inserido
    console.log('\n3. ⏳ Aguardando 2 segundos...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar se o log foi inserido
    console.log('\n4. 🔍 Verificando logs após restauração...');
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
    
    console.log('\n5. 🔍 Verificando dados restaurados...');
    
    // Verificar artigos
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true });
    
    // Verificar comentários
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true });
    
    // Verificar feedbacks
    const { data: feedbacks, error: feedbacksError } = await supabase
      .from('feedbacks')
      .select('*', { count: 'exact', head: true });
    
    console.log('📊 Dados após restauração:');
    console.log(`   Articles: ${articlesError ? 'Erro' : articles?.length || 0}`);
    console.log(`   Comments: ${commentsError ? 'Erro' : comments?.length || 0}`);
    console.log(`   Feedbacks: ${feedbacksError ? 'Erro' : feedbacks?.length || 0}`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testRestoreFunction()
  .then(() => {
    console.log('\n✅ Teste concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });