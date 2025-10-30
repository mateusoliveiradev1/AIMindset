#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Supabase
const SUPABASE_URL = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Lista de tabelas principais (sem as de backup)
const MAIN_TABLES = [
  'admin_users', 'alert_subscribers', 'alert_subscriptions', 'app_logs', 
  'articles', 'backend_logs', 'categories', 'comments', 'contacts', 
  'cookie_preferences', 'email_automations', 'email_templates', 'feedbacks', 
  'newsletter_campaigns', 'newsletter_logs', 'newsletter_subscribers', 
  'newsletter_templates', 'privacy_requests', 'rate_limits', 
  'security_audit_logs', 'seo_metadata', 'system_logs', 'user_profiles'
];

async function createBackup() {
  console.log('🚀 Iniciando backup do banco de dados...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups');
  
  // Criar diretório se não existir
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log('📁 Diretório de backup criado');
  }
  
  const backupFile = path.join(backupDir, `database-backup-${timestamp}.sql`);
  
  let backupSQL = '';
  
  // Cabeçalho
  backupSQL += `-- =====================================================\n`;
  backupSQL += `-- BACKUP COMPLETO DO BANCO DE DADOS\n`;
  backupSQL += `-- Data: ${new Date().toISOString()}\n`;
  backupSQL += `-- =====================================================\n\n`;
  
  let totalRecords = 0;
  let processedTables = 0;
  
  for (const tableName of MAIN_TABLES) {
    try {
      console.log(`🔄 Processando: ${tableName}`);
      
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' });
      
      if (error) {
        console.log(`❌ Erro em ${tableName}: ${error.message}`);
        backupSQL += `-- ERRO na tabela ${tableName}: ${error.message}\n\n`;
        continue;
      }
      
      const recordCount = count || 0;
      console.log(`✅ ${tableName}: ${recordCount} registros`);
      
      backupSQL += `-- Tabela: ${tableName} (${recordCount} registros)\n`;
      
      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        backupSQL += `DELETE FROM ${tableName};\n`;
        
        for (const row of data) {
          const values = columns.map(col => {
            const value = row[col];
            if (value === null) return 'NULL';
            if (typeof value === 'string') {
              return `'${value.replace(/'/g, "''")}'`;
            }
            if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
            if (value instanceof Date) return `'${value.toISOString()}'`;
            if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
            return value;
          });
          
          backupSQL += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
        }
      } else {
        backupSQL += `-- Tabela ${tableName} está vazia\n`;
      }
      
      backupSQL += '\n';
      totalRecords += recordCount;
      processedTables++;
      
    } catch (err) {
      console.log(`❌ Erro ao processar ${tableName}: ${err.message}`);
      backupSQL += `-- ERRO na tabela ${tableName}: ${err.message}\n\n`;
    }
  }
  
  // Estatísticas
  backupSQL += `-- =====================================================\n`;
  backupSQL += `-- ESTATÍSTICAS DO BACKUP\n`;
  backupSQL += `-- Tabelas processadas: ${processedTables}/${MAIN_TABLES.length}\n`;
  backupSQL += `-- Total de registros: ${totalRecords}\n`;
  backupSQL += `-- Data: ${new Date().toISOString()}\n`;
  backupSQL += `-- =====================================================\n`;
  
  // Salvar arquivo
  fs.writeFileSync(backupFile, backupSQL);
  
  const fileSize = fs.statSync(backupFile).size;
  
  console.log('\n🎉 BACKUP CONCLUÍDO!');
  console.log(`📁 Arquivo: ${backupFile}`);
  console.log(`📊 Tabelas: ${processedTables}/${MAIN_TABLES.length}`);
  console.log(`📈 Registros: ${totalRecords}`);
  console.log(`💾 Tamanho: ${(fileSize / 1024).toFixed(2)} KB`);
  
  return {
    file: backupFile,
    tables: processedTables,
    records: totalRecords,
    size: fileSize
  };
}

// Executar
createBackup().catch(console.error);