import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Interfaces para tipagem
interface BackupResult {
  success: boolean;
  message: string;
  records_affected?: number;
  details?: {
    articles: number;
    comments: number;
    feedbacks: number;
    backend_logs?: number;
    app_logs?: number;
    system_logs?: number;
  };
  error?: string;
}

interface BackupLog {
  id: string;
  action_type: 'backup' | 'restore';
  created_at: string;
  records_affected: number;
  details: string;
  success: boolean;
}

/**
 * Hook personalizado para gerenciar operações de backup e restauração
 * Integração completa com Supabase RPC Functions
 */
export const useBackup = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<BackupLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Buscar logs de backup
   */
  const fetchLogs = useCallback(async (limit: number = 10) => {
    try {
      console.log('🔍 [DEBUG] Buscando logs de backup...');
      
      const { data, error: rpcError } = await supabase.rpc('get_backup_logs', { 
        limit_count: limit 
      });
      
      if (rpcError) {
        console.error('❌ [DEBUG] Erro RPC ao buscar logs:', rpcError);
        throw new Error(rpcError.message || 'Erro ao buscar logs');
      }
      
      console.log('✅ [DEBUG] Logs encontrados:', data?.length || 0);
      console.log('📋 [DEBUG] Dados dos logs:', data);
      setLogs(data || []);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao buscar logs';
      console.error('❌ [DEBUG] Erro ao buscar logs:', error);
      setError(errorMessage);
    }
  }, []);

  /**
   * Criar backup completo de todos os dados
   */
  const createBackup = useCallback(async (): Promise<BackupResult> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 [DEBUG] Iniciando backup completo...');
      
      const { data, error: rpcError } = await supabase.rpc('backup_all_data');
      
      if (rpcError) {
        console.error('❌ [DEBUG] Erro RPC ao criar backup:', rpcError);
        throw new Error(rpcError.message || 'Erro ao executar função de backup');
      }
      
      if (!data) {
        throw new Error('Nenhum dado retornado pela função de backup');
      }
      
      console.log('✅ [DEBUG] Backup concluído:', data);
      
      // Processar o resultado da RPC com suporte a logs
      const processedResult: BackupResult = {
        success: data.success,
        message: data.success ? 'Backup criado com sucesso!' : 'Erro ao criar backup',
        records_affected: data.details ? 
          (data.details.articles || 0) + 
          (data.details.comments || 0) + 
          (data.details.feedbacks || 0) +
          (data.details.backend_logs || 0) +
          (data.details.app_logs || 0) +
          (data.details.system_logs || 0) : 0,
        details: data.details ? {
          articles: data.details.articles || 0,
          comments: data.details.comments || 0,
          feedbacks: data.details.feedbacks || 0,
          backend_logs: data.details.backend_logs || 0,
          app_logs: data.details.app_logs || 0,
          system_logs: data.details.system_logs || 0
        } : undefined,
        error: data.error
      };
      
      console.log('📊 [DEBUG] Resultado processado:', processedResult);
      
      // Atualizar logs após backup bem-sucedido
      if (processedResult.success) {
        console.log('🔄 [DEBUG] Atualizando logs após backup...');
        await fetchLogs();
        console.log('✅ [DEBUG] Logs atualizados com sucesso');
      }
      
      return processedResult;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao criar backup';
      console.error('❌ [DEBUG] Erro ao criar backup:', error);
      setError(errorMessage);
      
      return {
        success: false,
        message: 'Erro ao criar backup',
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [fetchLogs]);

  /**
   * Restaurar dados do último backup
   */
  const restoreBackup = useCallback(async (): Promise<BackupResult> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Iniciando restauração do backup...');
      
      const { data, error: rpcError } = await supabase.rpc('restore_from_backup');
      
      if (rpcError) {
        console.error('Erro RPC ao restaurar backup:', rpcError);
        throw new Error(rpcError.message || 'Erro ao executar função de restauração');
      }
      
      if (!data) {
        throw new Error('Nenhum dado retornado pela função de restauração');
      }
      
      console.log('Restauração concluída:', data);
      
      // Atualizar logs após restauração
      if (data.success) {
        await fetchLogs();
      }
      
      return data as BackupResult;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao restaurar backup';
      console.error('Erro ao restaurar backup:', error);
      setError(errorMessage);
      
      return {
        success: false,
        message: 'Erro ao restaurar backup',
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obter informações do último backup realizado
   */
  const getLastBackup = useCallback(() => {
    const lastBackup = logs.find(log => log.action_type === 'backup' && log.success);
    return lastBackup ? new Date(lastBackup.created_at) : null;
  }, [logs]);

  /**
   * Obter informações da última restauração realizada
   */
  const getLastRestore = useCallback(() => {
    const lastRestore = logs.find(log => log.action_type === 'restore' && log.success);
    return lastRestore ? new Date(lastRestore.created_at) : null;
  }, [logs]);

  /**
   * Verificar se existe backup disponível para restauração
   */
  const hasBackupAvailable = useCallback(() => {
    return logs.some(log => log.action_type === 'backup' && log.success);
  }, [logs]);

  /**
   * Obter estatísticas dos logs
   */
  const getBackupStats = useCallback(() => {
    const totalBackups = logs.filter(log => log.action_type === 'backup').length;
    const successfulBackups = logs.filter(log => log.action_type === 'backup' && log.success).length;
    const totalRestores = logs.filter(log => log.action_type === 'restore').length;
    const successfulRestores = logs.filter(log => log.action_type === 'restore' && log.success).length;
    
    return {
      totalBackups,
      successfulBackups,
      totalRestores,
      successfulRestores,
      successRate: totalBackups > 0 ? (successfulBackups / totalBackups) * 100 : 0
    };
  }, [logs]);

  /**
   * Limpar erro atual
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Estados
    loading,
    logs,
    error,
    
    // Ações principais
    createBackup,
    restoreBackup,
    fetchLogs,
    
    // Utilitários
    getLastBackup,
    getLastRestore,
    hasBackupAvailable,
    getBackupStats,
    clearError
  };
};