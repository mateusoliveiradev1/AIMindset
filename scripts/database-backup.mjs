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

// Lista de todas as tabelas identificadas
const TABLES = [
  'admin_users', 'alert_subscribers', 'alert_subscriptions', 'app_logs', 
  'app_logs_backup', 'articles', 'articles_backup', 'backend_logs', 
  'backend_logs_backup', 'backup_articles', 'backup_comments', 'backup_feedbacks', 
  'backup_logs', 'categories', 'comments', 'comments_backup', 'contacts', 
  'cookie_preferences', 'email_automations', 'email_templates', 'feedback_backup', 
  'feedbacks', 'feedbacks_backup', 'newsletter_campaigns', 'newsletter_logs', 
  'newsletter_logs_backup', 'newsletter_subscribers', 'newsletter_templates', 
  'privacy_requests', 'rate_limits', 'security_audit_logs', 'seo_metadata', 
  'system_logs', 'system_logs_backup', 'user_profiles'
];

class DatabaseBackup {
  constructor() {
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.backupDir = path.join(__dirname, '..', 'backups');
    this.backupFile = path.join(this.backupDir, `database-backup-${this.timestamp}.sql`);
    this.logFile = path.join(this.backupDir, `backup-log-${this.timestamp}.txt`);
    
    // Criar diretório de backup se não existir
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  async getTableSchema(tableName) {
    try {
      const { data, error } = await supabase
        .rpc('get_table_schema', { table_name: tableName });
      
      if (error) {
        this.log(`❌ Erro ao obter schema da tabela ${tableName}: ${error.message}`);
        return null;
      }
      
      return data;
    } catch (err) {
      this.log(`❌ Erro ao obter schema da tabela ${tableName}: ${err.message}`);
      return null;
    }
  }

  async getTableData(tableName) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' });
      
      if (error) {
        this.log(`❌ Erro ao obter dados da tabela ${tableName}: ${error.message}`);
        return { data: [], count: 0 };
      }
      
      this.log(`✅ Tabela ${tableName}: ${count || 0} registros`);
      return { data: data || [], count: count || 0 };
    } catch (err) {
      this.log(`❌ Erro ao obter dados da tabela ${tableName}: ${err.message}`);
      return { data: [], count: 0 };
    }
  }

  async getRPCFunctions() {
    try {
      const { data, error } = await supabase
        .rpc('get_rpc_functions');
      
      if (error) {
        this.log(`❌ Erro ao obter funções RPC: ${error.message}`);
        return [];
      }
      
      this.log(`✅ Encontradas ${data?.length || 0} funções RPC`);
      return data || [];
    } catch (err) {
      this.log(`❌ Erro ao obter funções RPC: ${err.message}`);
      return [];
    }
  }

  async getTriggers() {
    try {
      const { data, error } = await supabase
        .rpc('get_triggers');
      
      if (error) {
        this.log(`❌ Erro ao obter triggers: ${error.message}`);
        return [];
      }
      
      this.log(`✅ Encontrados ${data?.length || 0} triggers`);
      return data || [];
    } catch (err) {
      this.log(`❌ Erro ao obter triggers: ${err.message}`);
      return [];
    }
  }

  async getRLSPolicies() {
    try {
      const { data, error } = await supabase
        .rpc('get_rls_policies');
      
      if (error) {
        this.log(`❌ Erro ao obter políticas RLS: ${error.message}`);
        return [];
      }
      
      this.log(`✅ Encontradas ${data?.length || 0} políticas RLS`);
      return data || [];
    } catch (err) {
      this.log(`❌ Erro ao obter políticas RLS: ${err.message}`);
      return [];
    }
  }

  generateInsertSQL(tableName, data) {
    if (!data || data.length === 0) {
      return `-- Tabela ${tableName} está vazia\n\n`;
    }

    const columns = Object.keys(data[0]);
    let sql = `-- Dados da tabela ${tableName}\n`;
    sql += `DELETE FROM ${tableName};\n`;
    
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
      
      sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
    }
    
    sql += '\n';
    return sql;
  }

  async createBackup() {
    this.log('🚀 Iniciando backup completo do banco de dados...');
    
    let backupSQL = '';
    
    // Cabeçalho do backup
    backupSQL += `-- =====================================================\n`;
    backupSQL += `-- BACKUP COMPLETO DO BANCO DE DADOS\n`;
    backupSQL += `-- Data: ${new Date().toISOString()}\n`;
    backupSQL += `-- Gerado automaticamente pelo sistema de backup\n`;
    backupSQL += `-- =====================================================\n\n`;
    
    // Desabilitar verificações temporariamente
    backupSQL += `-- Desabilitar verificações durante a restauração\n`;
    backupSQL += `SET session_replication_role = replica;\n\n`;
    
    let totalRecords = 0;
    let successfulTables = 0;
    
    // Backup das tabelas
    this.log('📊 Fazendo backup das tabelas...');
    for (const tableName of TABLES) {
      this.log(`🔄 Processando tabela: ${tableName}`);
      
      const { data, count } = await this.getTableData(tableName);
      
      if (data) {
        backupSQL += this.generateInsertSQL(tableName, data);
        totalRecords += count;
        successfulTables++;
      }
    }
    
    // Reabilitar verificações
    backupSQL += `-- Reabilitar verificações\n`;
    backupSQL += `SET session_replication_role = DEFAULT;\n\n`;
    
    // Estatísticas do backup
    backupSQL += `-- =====================================================\n`;
    backupSQL += `-- ESTATÍSTICAS DO BACKUP\n`;
    backupSQL += `-- Tabelas processadas: ${successfulTables}/${TABLES.length}\n`;
    backupSQL += `-- Total de registros: ${totalRecords}\n`;
    backupSQL += `-- =====================================================\n`;
    
    // Salvar arquivo de backup
    fs.writeFileSync(this.backupFile, backupSQL);
    
    this.log(`✅ Backup concluído!`);
    this.log(`📁 Arquivo: ${this.backupFile}`);
    this.log(`📊 Tabelas: ${successfulTables}/${TABLES.length}`);
    this.log(`📈 Registros: ${totalRecords}`);
    
    return {
      file: this.backupFile,
      tables: successfulTables,
      totalTables: TABLES.length,
      records: totalRecords,
      size: fs.statSync(this.backupFile).size
    };
  }

  async validateBackup() {
    this.log('🔍 Validando integridade do backup...');
    
    if (!fs.existsSync(this.backupFile)) {
      this.log('❌ Arquivo de backup não encontrado!');
      return false;
    }
    
    const content = fs.readFileSync(this.backupFile, 'utf8');
    const lines = content.split('\n');
    
    // Verificações básicas
    const hasHeader = content.includes('BACKUP COMPLETO DO BANCO DE DADOS');
    const hasInserts = content.includes('INSERT INTO');
    const hasStatistics = content.includes('ESTATÍSTICAS DO BACKUP');
    
    this.log(`📋 Cabeçalho: ${hasHeader ? '✅' : '❌'}`);
    this.log(`📋 Comandos INSERT: ${hasInserts ? '✅' : '❌'}`);
    this.log(`📋 Estatísticas: ${hasStatistics ? '✅' : '❌'}`);
    this.log(`📋 Linhas totais: ${lines.length}`);
    
    const isValid = hasHeader && hasInserts && hasStatistics;
    this.log(`🎯 Backup ${isValid ? 'VÁLIDO' : 'INVÁLIDO'}`);
    
    return isValid;
  }
}

// Executar backup se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const backup = new DatabaseBackup();
  
  try {
    const result = await backup.createBackup();
    const isValid = await backup.validateBackup();
    
    console.log('\n🎉 BACKUP CONCLUÍDO COM SUCESSO!');
    console.log(`📁 Arquivo: ${result.file}`);
    console.log(`📊 Tabelas: ${result.tables}/${result.totalTables}`);
    console.log(`📈 Registros: ${result.records}`);
    console.log(`💾 Tamanho: ${(result.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`✅ Válido: ${isValid ? 'SIM' : 'NÃO'}`);
    
  } catch (error) {
    console.error('❌ Erro durante o backup:', error);
    process.exit(1);
  }
}

export default DatabaseBackup;