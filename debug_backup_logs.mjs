#!/usr/bin/env node

/**
 * Script de Debug - Sistema de Logs de Backup
 * Verifica se os logs estão sendo salvos e se a função get_backup_logs funciona
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

console.log('🔍 DIAGNÓSTICO DO SISTEMA DE LOGS DE BACKUP');
console.log('='.repeat(50));

async function debugBackupLogs() {
  try {
    // 0. Verificar status de autenticação
    console.log('\n0. 🔐 Verificando status de autenticação...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Erro ao verificar autenticação:', authError);
    } else if (user) {
      console.log(`✅ Usuário autenticado: ${user.email} (ID: ${user.id})`);
    } else {
      console.log('⚠️ Usuário não autenticado - tentando fazer login...');
      
      // Tentar fazer login com credenciais de admin (se existirem)
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@aimindset.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword
      });
      
      if (loginError) {
        console.error('❌ Erro ao fazer login:', loginError);
        console.log('⚠️ Continuando sem autenticação...');
      } else {
        console.log(`✅ Login realizado com sucesso: ${loginData.user?.email}`);
      }
    }

    // 1. Verificar se a tabela backup_logs existe e tem dados
    console.log('\n1. 📊 Verificando dados na tabela backup_logs...');
    const { data: logsData, error: logsError } = await supabase
      .from('backup_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (logsError) {
      console.error('❌ Erro ao buscar logs:', logsError);
    } else {
      console.log(`✅ Logs encontrados na tabela: ${logsData?.length || 0}`);
      if (logsData && logsData.length > 0) {
        console.log('📋 Últimos logs:');
        logsData.slice(0, 3).forEach((log, index) => {
          console.log(`   ${index + 1}. ${log.action_type} - ${log.created_at} - ${log.records_affected} registros - Sucesso: ${log.success}`);
        });
      }
    }

    // 2. Testar a função RPC get_backup_logs
    console.log('\n2. 🔧 Testando função RPC get_backup_logs...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_backup_logs', { 
      limit_count: 10 
    });

    if (rpcError) {
      console.error('❌ Erro na função RPC get_backup_logs:', rpcError);
    } else {
      console.log(`✅ Função RPC funcionando: ${rpcData?.length || 0} logs retornados`);
      if (rpcData && rpcData.length > 0) {
        console.log('📋 Logs via RPC:');
        rpcData.slice(0, 3).forEach((log, index) => {
          console.log(`   ${index + 1}. ${log.action_type} - ${log.created_at} - ${log.records_affected} registros - Sucesso: ${log.success}`);
        });
      }
    }

    // 3. Verificar se há logs de backup recentes
    console.log('\n3. 🕐 Verificando logs de backup recentes (últimas 24h)...');
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: recentLogs, error: recentError } = await supabase
      .from('backup_logs')
      .select('*')
      .eq('action_type', 'backup')
      .gte('created_at', oneDayAgo.toISOString())
      .order('created_at', { ascending: false });

    if (recentError) {
      console.error('❌ Erro ao buscar logs recentes:', recentError);
    } else {
      console.log(`✅ Logs de backup nas últimas 24h: ${recentLogs?.length || 0}`);
      if (recentLogs && recentLogs.length > 0) {
        console.log('📋 Backups recentes:');
        recentLogs.forEach((log, index) => {
          console.log(`   ${index + 1}. ${log.created_at} - ${log.records_affected} registros - Detalhes: ${log.details}`);
        });
      }
    }

    // 4. Testar inserção manual de log para verificar se funciona
    console.log('\n4. 🧪 Testando inserção manual de log...');
    const testLog = {
      action_type: 'backup',
      records_affected: 999,
      details: 'Teste de inserção manual - debug',
      success: true
    };

    const { data: insertData, error: insertError } = await supabase
      .from('backup_logs')
      .insert([testLog])
      .select();

    if (insertError) {
      console.error('❌ Erro ao inserir log de teste:', insertError);
    } else {
      console.log('✅ Log de teste inserido com sucesso:', insertData?.[0]?.id);
      
      // Remover o log de teste
      if (insertData?.[0]?.id) {
        await supabase
          .from('backup_logs')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🗑️ Log de teste removido');
      }
    }

  } catch (error) {
    console.error('❌ Erro geral no diagnóstico:', error);
  }
}

// Executar diagnóstico
debugBackupLogs()
  .then(() => {
    console.log('\n✅ Diagnóstico concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });