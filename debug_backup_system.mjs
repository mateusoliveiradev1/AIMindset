import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Definida' : '❌ Não definida');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Definida' : '❌ Não definida');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 DIAGNÓSTICO COMPLETO DO SISTEMA DE BACKUP');
console.log('='.repeat(50));

async function diagnosticarSistemaBackup() {
  try {
    // 1. Testar conexão básica
    console.log('\n1️⃣ TESTANDO CONEXÃO COM SUPABASE...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('articles')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Erro de conexão:', connectionError.message);
      return;
    }
    console.log('✅ Conexão com Supabase funcionando');

    // 2. Verificar tabelas existentes
    console.log('\n2️⃣ VERIFICANDO TABELAS EXISTENTES...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_names');
    
    if (tablesError) {
      console.log('⚠️ Não foi possível listar tabelas via RPC, tentando método alternativo...');
      
      // Verificar tabelas principais individualmente
      const tablesToCheck = ['articles', 'comments', 'feedbacks', 'backup_articles', 'backup_comments', 'backup_feedbacks', 'backup_logs'];
      
      for (const table of tablesToCheck) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          if (error) {
            console.log(`❌ Tabela '${table}': ${error.message}`);
          } else {
            console.log(`✅ Tabela '${table}': Existe`);
          }
        } catch (err) {
          console.log(`❌ Tabela '${table}': Erro ao verificar`);
        }
      }
    } else {
      console.log('✅ Tabelas encontradas:', tables);
    }

    // 3. Verificar dados nas tabelas originais
    console.log('\n3️⃣ VERIFICANDO DADOS NAS TABELAS ORIGINAIS...');
    
    const { data: articlesCount, error: articlesError } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true });
    
    const { data: commentsCount, error: commentsError } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true });
    
    const { data: feedbacksCount, error: feedbacksError } = await supabase
      .from('feedbacks')
      .select('*', { count: 'exact', head: true });

    console.log('📊 Contagem de registros:');
    console.log(`   Articles: ${articlesError ? 'Erro' : articlesCount?.length || 0}`);
    console.log(`   Comments: ${commentsError ? 'Erro' : commentsCount?.length || 0}`);
    console.log(`   Feedbacks: ${feedbacksError ? 'Erro' : feedbacksCount?.length || 0}`);

    // 4. Testar funções RPC de backup
    console.log('\n4️⃣ TESTANDO FUNÇÕES RPC DE BACKUP...');
    
    // Testar se a função backup_all_data existe
    console.log('🔍 Testando função backup_all_data...');
    try {
      const { data: backupResult, error: backupError } = await supabase
        .rpc('backup_all_data');
      
      if (backupError) {
        console.error('❌ Erro na função backup_all_data:', backupError);
        console.error('   Código:', backupError.code);
        console.error('   Detalhes:', backupError.details);
        console.error('   Hint:', backupError.hint);
        console.error('   Mensagem:', backupError.message);
      } else {
        console.log('✅ Função backup_all_data executada com sucesso!');
        console.log('📋 Resultado:', JSON.stringify(backupResult, null, 2));
      }
    } catch (err) {
      console.error('❌ Erro ao executar backup_all_data:', err.message);
    }

    // 5. Verificar logs de backup
    console.log('\n5️⃣ VERIFICANDO LOGS DE BACKUP...');
    try {
      const { data: logs, error: logsError } = await supabase
        .from('backup_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (logsError) {
        console.error('❌ Erro ao buscar logs:', logsError.message);
      } else {
        console.log('📝 Últimos 5 logs de backup:');
        logs.forEach((log, index) => {
          console.log(`   ${index + 1}. ${log.created_at} - ${log.action_type} - ${log.success ? '✅' : '❌'}`);
          if (log.details) {
            console.log(`      Detalhes: ${log.details}`);
          }
        });
      }
    } catch (err) {
      console.error('❌ Erro ao verificar logs:', err.message);
    }

    // 6. Testar função de restauração
    console.log('\n6️⃣ TESTANDO FUNÇÃO DE RESTAURAÇÃO...');
    try {
      const { data: restoreResult, error: restoreError } = await supabase
        .rpc('restore_from_backup');
      
      if (restoreError) {
        console.error('❌ Erro na função restore_from_backup:', restoreError);
        console.error('   Código:', restoreError.code);
        console.error('   Detalhes:', restoreError.details);
        console.error('   Hint:', restoreError.hint);
      } else {
        console.log('✅ Função restore_from_backup existe e pode ser executada');
        console.log('📋 Resultado:', JSON.stringify(restoreResult, null, 2));
      }
    } catch (err) {
      console.error('❌ Erro ao testar restore_from_backup:', err.message);
    }

    // 7. Verificar permissões RLS
    console.log('\n7️⃣ VERIFICANDO PERMISSÕES RLS...');
    try {
      // Tentar inserir um log de teste
      const { data: testLog, error: testLogError } = await supabase
        .from('backup_logs')
        .insert({
          action_type: 'backup',
          records_affected: 0,
          details: 'Teste de diagnóstico',
          success: true
        })
        .select();
      
      if (testLogError) {
        console.error('❌ Erro ao inserir log de teste:', testLogError.message);
      } else {
        console.log('✅ Permissões RLS funcionando para backup_logs');
        
        // Remover o log de teste
        await supabase
          .from('backup_logs')
          .delete()
          .eq('id', testLog[0].id);
      }
    } catch (err) {
      console.error('❌ Erro ao testar permissões RLS:', err.message);
    }

  } catch (error) {
    console.error('❌ Erro geral no diagnóstico:', error);
  }
}

// Executar diagnóstico
diagnosticarSistemaBackup()
  .then(() => {
    console.log('\n' + '='.repeat(50));
    console.log('🏁 DIAGNÓSTICO CONCLUÍDO');
    console.log('='.repeat(50));
  })
  .catch(error => {
    console.error('❌ Erro fatal no diagnóstico:', error);
  });