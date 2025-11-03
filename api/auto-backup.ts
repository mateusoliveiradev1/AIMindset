import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface BackupResult {
  success: boolean;
  message: string;
  records_affected?: number;
  backup_id?: string;
  details?: any;
  error?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Permitir apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    console.log('🚀 [AUTO-BACKUP] Iniciando backup automático...');
    
    // Verificar se é uma chamada autorizada
    const authHeader = req.headers.authorization;
    const body = req.body || {};
    
    // Log da requisição
    console.log('📋 [AUTO-BACKUP] Dados da requisição:', {
      triggered_by: body.triggered_by || 'unknown',
      timestamp: body.timestamp || new Date().toISOString(),
      auth_present: !!authHeader
    });

    // Criar cliente Supabase com service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Log início do backup
    await supabase.from('system_logs').insert({
      type: 'backup_start',
      message: 'Iniciando backup automático via API',
      context: {
        triggered_by: body.triggered_by || 'api_call',
        timestamp: new Date().toISOString(),
        method: 'vercel_api'
      }
    });

    // Executar função de backup
    console.log('💾 [AUTO-BACKUP] Executando função backup_all_data...');
    const { data: backupResult, error: backupError } = await supabase
      .rpc('backup_all_data');

    if (backupError) {
      console.error('❌ [AUTO-BACKUP] Erro no backup:', backupError);
      
      // Log do erro
      await supabase.from('system_logs').insert({
        type: 'backup_error',
        message: 'Falha no backup automático',
        context: {
          error: backupError.message,
          code: backupError.code,
          details: backupError.details,
          timestamp: new Date().toISOString(),
          method: 'vercel_api'
        }
      });

      // Enviar alerta de falha
      await sendBackupFailureAlert(supabase, backupError);

      return res.status(500).json({
        success: false,
        message: 'Falha no backup automático',
        error: backupError.message
      });
    }

    console.log('✅ [AUTO-BACKUP] Backup concluído com sucesso:', backupResult);

    // Log de sucesso
    await supabase.from('system_logs').insert({
      type: 'backup_success',
      message: 'Backup automático concluído com sucesso',
      context: {
        ...backupResult,
        timestamp: new Date().toISOString(),
        method: 'vercel_api'
      }
    });

    // Enviar alerta de sucesso
    await sendBackupSuccessAlert(supabase, backupResult);

    // Executar limpeza de backups antigos
    await cleanupOldBackups(supabase);

    return res.json({
      success: true,
      message: 'Backup automático concluído com sucesso',
      ...backupResult
    });

  } catch (error: any) {
    console.error('💥 [AUTO-BACKUP] Erro crítico:', error);
    
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Log do erro crítico
      await supabase.from('system_logs').insert({
        type: 'backup_critical_error',
        message: 'Erro crítico no sistema de backup automático',
        context: {
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
          method: 'vercel_api'
        }
      });

      // Enviar alerta crítico
      await sendCriticalBackupAlert(supabase, error);
    } catch (logError) {
      console.error('❌ [AUTO-BACKUP] Falha ao registrar erro:', logError);
    }

    return res.status(500).json({
      success: false,
      message: 'Erro crítico no sistema de backup',
      error: error.message
    });
  }
}

// Função para enviar alerta de falha no backup
async function sendBackupFailureAlert(supabase: any, error: any) {
  try {
    console.log('📧 [AUTO-BACKUP] Enviando alerta de falha...');
    
    const { data: subscribers } = await supabase
      .from('alert_subscriptions')
      .select('email')
      .eq('active', true);

    if (subscribers && subscribers.length > 0) {
      const emails = subscribers.map((sub: any) => sub.email);
      
      await supabase.rpc('call_nodejs_email_endpoint', {
        alert_data: {
          type: 'backup_failure',
          source: 'auto_backup_system',
          message: 'Falha no backup automático do sistema',
          details: {
            error: error.message,
            code: error.code,
            timestamp: new Date().toISOString(),
            next_attempt: 'Em 1 hora (retry automático)'
          }
        },
        recipients_emails: emails
      });
    }
  } catch (alertError) {
    console.error('❌ [AUTO-BACKUP] Falha ao enviar alerta:', alertError);
  }
}

// Função para enviar alerta de sucesso no backup
async function sendBackupSuccessAlert(supabase: any, result: any) {
  try {
    console.log('📧 [AUTO-BACKUP] Enviando alerta de sucesso...');
    
    const { data: subscribers } = await supabase
      .from('alert_subscriptions')
      .select('email')
      .eq('active', true);

    if (subscribers && subscribers.length > 0) {
      const emails = subscribers.map((sub: any) => sub.email);
      
      await supabase.rpc('call_nodejs_email_endpoint', {
        alert_data: {
          type: 'backup_success',
          source: 'auto_backup_system',
          message: 'Backup automático concluído com sucesso',
          details: {
            records_affected: result.records_affected || 0,
            backup_id: result.backup_id,
            timestamp: new Date().toISOString(),
            next_backup: 'Próximo backup em 24 horas'
          }
        },
        recipients_emails: emails
      });
    }
  } catch (alertError) {
    console.error('❌ [AUTO-BACKUP] Falha ao enviar alerta de sucesso:', alertError);
  }
}

// Função para enviar alerta crítico
async function sendCriticalBackupAlert(supabase: any, error: any) {
  try {
    console.log('🚨 [AUTO-BACKUP] Enviando alerta crítico...');
    
    const { data: subscribers } = await supabase
      .from('alert_subscriptions')
      .select('email')
      .eq('active', true);

    if (subscribers && subscribers.length > 0) {
      const emails = subscribers.map((sub: any) => sub.email);
      
      await supabase.rpc('call_nodejs_email_endpoint', {
        alert_data: {
          type: 'critical_error',
          source: 'auto_backup_system',
          message: 'ERRO CRÍTICO: Sistema de backup automático falhou',
          details: {
            error: error.message,
            stack: error.stack?.substring(0, 500),
            timestamp: new Date().toISOString(),
            action_required: 'Verificação manual necessária'
          }
        },
        recipients_emails: emails
      });
    }
  } catch (alertError) {
    console.error('❌ [AUTO-BACKUP] Falha ao enviar alerta crítico:', alertError);
  }
}

// Função para limpeza de backups antigos
async function cleanupOldBackups(supabase: any) {
  try {
    console.log('🧹 [AUTO-BACKUP] Iniciando limpeza de backups antigos...');
    
    // Manter apenas os últimos 15 dias de backups completos
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 15);
    
    // Deletar backups antigos
    const { data: deletedBackups, error: deleteError } = await supabase
      .from('backup_articles')
      .delete()
      .lt('backup_created_at', cutoffDate.toISOString());

    if (deleteError) {
      console.error('❌ [AUTO-BACKUP] Erro na limpeza:', deleteError);
    } else {
      console.log('✅ [AUTO-BACKUP] Limpeza concluída');
      
      // Log da limpeza
      await supabase.from('system_logs').insert({
        type: 'backup_cleanup',
        message: 'Limpeza de backups antigos concluída',
        context: {
          cutoff_date: cutoffDate.toISOString(),
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (cleanupError) {
    console.error('❌ [AUTO-BACKUP] Erro na limpeza:', cleanupError);
  }
}