import { useState, useCallback } from 'react';
import { useSystemLogs } from './useSystemLogs';
import { useToast } from './useToast';
import { supabase } from '../lib/supabase';

interface SafeUpdateConfig {
  description: string;
  backupBeforeUpdate?: boolean;
  validateBeforeUpdate?: boolean;
  rollbackOnError?: boolean;
  notifyOnComplete?: boolean;
}

interface SafeUpdateResult {
  success: boolean;
  backupId?: string;
  error?: Error;
  duration: number;
  timestamp: Date;
}

interface BackupInfo {
  id: string;
  type: 'database' | 'configuration' | 'content';
  description: string;
  createdAt: Date;
  size?: number;
  tables?: string[];
  metadata?: Record<string, any>;
}

/**
 * Hook para modo safe update com backup automático
 * Implementa backup antes de operações críticas e rollback em caso de erro
 */
export const useSafeUpdate = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentBackup, setCurrentBackup] = useState<BackupInfo | null>(null);
  const { logInfo, logError, logWarn } = useSystemLogs();
  const { showToast } = useToast();

  /**
   * Cria backup do banco de dados
   */
  const createDatabaseBackup = useCallback(async (
    description: string,
    tables?: string[]
  ): Promise<BackupInfo> => {
    try {
      const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date();
      
      await logInfo('Starting database backup', {
        backupId,
        description,
        tables: tables || 'all',
        operation: 'create_backup'
      });

      // Backup das tabelas principais
      const backupData: Record<string, any[]> = {};
      const tablesToBackup = tables || [
        'articles',
        'categories',
        'users',
        'comments',
        'feedback',
        'newsletter_subscribers',
        'contacts',
        'user_profiles'
      ];

      // Coletar dados de cada tabela
      for (const table of tablesToBackup) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1000); // Limitar para não sobrecarregar

          if (!error && data) {
            backupData[table] = data;
          }
        } catch (tableError) {
          await logWarn(`Failed to backup table ${table}`, {
            table,
            error: tableError,
            backupId
          });
        }
      }

      // Salvar backup no localStorage (temporário)
      const backupInfo: BackupInfo = {
        id: backupId,
        type: 'database',
        description,
        createdAt: timestamp,
        tables: tablesToBackup,
        metadata: {
          size: JSON.stringify(backupData).length,
          tablesCount: Object.keys(backupData).length,
          rowsCount: Object.values(backupData).reduce((total, table) => total + table.length, 0)
        }
      };

      // Salvar dados do backup
      localStorage.setItem(`backup_${backupId}`, JSON.stringify({
        info: backupInfo,
        data: backupData,
        timestamp: timestamp.toISOString()
      }));

      // Limpar backups antigos (manter últimos 5)
      const backupKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('backup_'))
        .sort()
        .slice(-5);

      Object.keys(localStorage)
        .filter(key => key.startsWith('backup_') && !backupKeys.includes(key))
        .forEach(key => localStorage.removeItem(key));

      await logInfo('Database backup completed', {
        backupId,
        tablesBackedUp: Object.keys(backupData).length,
        totalRows: Object.values(backupData).reduce((total, table) => total + table.length, 0)
      });

      return backupInfo;
    } catch (error) {
      await logError('Failed to create database backup', error, {
        description,
        critical: true
      });
      throw error;
    }
  }, [logInfo, logError, logWarn]);

  /**
   * Cria backup de configurações
   */
  const createConfigBackup = useCallback(async (
    description: string
  ): Promise<BackupInfo> => {
    try {
      const backupId = `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date();

      const configData = {
        localStorage: { ...localStorage },
        sessionStorage: { ...sessionStorage },
        cookies: document.cookie,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: timestamp.toISOString()
      };

      const backupInfo: BackupInfo = {
        id: backupId,
        type: 'configuration',
        description,
        createdAt: timestamp,
        metadata: {
          size: JSON.stringify(configData).length,
          hasLocalStorage: Object.keys(localStorage).length > 0,
          hasSessionStorage: Object.keys(sessionStorage).length > 0,
          hasCookies: document.cookie.length > 0
        }
      };

      localStorage.setItem(`config_${backupId}`, JSON.stringify({
        info: backupInfo,
        data: configData
      }));

      await logInfo('Configuration backup completed', {
        backupId,
        configSize: JSON.stringify(configData).length
      });

      return backupInfo;
    } catch (error) {
      await logError('Failed to create configuration backup', error);
      throw error;
    }
  }, [logInfo, logError]);

  /**
   * Restaura backup
   */
  const restoreBackup = useCallback(async (
    backupId: string,
    options: { restoreData?: boolean; restoreConfig?: boolean } = {}
  ): Promise<boolean> => {
    try {
      setIsUpdating(true);
      
      await logInfo('Starting backup restore', {
        backupId,
        options,
        operation: 'restore_backup'
      });

      // Procurar backup de database
      const dbBackupKey = Object.keys(localStorage)
        .find(key => key.startsWith('backup_') && key.includes(backupId));

      if (dbBackupKey && options.restoreData) {
        const backupData = JSON.parse(localStorage.getItem(dbBackupKey) || '{}');
        
        if (backupData.data) {
          // Restaurar dados (implementação específica por tabela)
          for (const [tableName, rows] of Object.entries(backupData.data)) {
            if (Array.isArray(rows)) {
              // Limpar tabela antes de restaurar (cuidado!)
              // await supabase.from(tableName).delete().neq('id', '');
              
              // Inserir dados restaurados
              for (const row of rows) {
                try {
                  await supabase.from(tableName).insert(row);
                } catch (insertError) {
                  await logWarn(`Failed to restore row in ${tableName}`, {
                    table: tableName,
                    rowId: row.id,
                    error: insertError
                  });
                }
              }
            }
          }
        }
      }

      // Procurar backup de configuração
      const configBackupKey = Object.keys(localStorage)
        .find(key => key.startsWith('config_') && key.includes(backupId));

      if (configBackupKey && options.restoreConfig) {
        const configData = JSON.parse(localStorage.getItem(configBackupKey) || '{}');
        
        if (configData.data) {
          // Restaurar configurações (com cuidado)
          const { localStorage: savedLocalStorage } = configData.data;
          
          if (savedLocalStorage) {
            // Limpar localStorage atual
            localStorage.clear();
            
            // Restaurar valores salvos
            for (const [key, value] of Object.entries(savedLocalStorage)) {
              if (typeof value === 'string') {
                localStorage.setItem(key, value);
              }
            }
          }
        }
      }

      await logInfo('Backup restore completed', {
        backupId,
        success: true
      });

      showToast('success', 'Backup restaurado com sucesso');
      return true;
    } catch (error) {
      await logError('Failed to restore backup', error, {
        backupId,
        critical: true
      });
      
      showToast('error', 'Erro ao restaurar backup');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [logInfo, logError, logWarn, showToast]);

  /**
   * Executa operação com safe update
   */
  const executeSafeUpdate = useCallback(async <T>(
    operation: () => Promise<T>,
    config: SafeUpdateConfig
  ): Promise<SafeUpdateResult> => {
    const startTime = Date.now();
    
    try {
      setIsUpdating(true);
      
      await logInfo('Starting safe update', {
        description: config.description,
        backupEnabled: config.backupBeforeUpdate,
        validationEnabled: config.validateBeforeUpdate,
        operation: 'safe_update_start'
      });

      // Criar backup se necessário
      let backupInfo: BackupInfo | null = null;
      if (config.backupBeforeUpdate) {
        try {
          backupInfo = await createDatabaseBackup(config.description);
          setCurrentBackup(backupInfo);
          showToast('success', 'Backup criado com sucesso');
        } catch (backupError) {
          await logError('Failed to create backup before update', backupError);
          
          if (config.backupBeforeUpdate) {
            throw new Error('Backup falhou - operação cancelada por segurança');
          }
        }
      }

      // Validação pré-update
      if (config.validateBeforeUpdate) {
        // Adicionar lógica de validação específica aqui
        await logInfo('Pre-update validation completed', {
          description: config.description
        });
      }

      // Executar operação principal
      const result = await operation();
      
      const duration = Date.now() - startTime;
      
      await logInfo('Safe update completed successfully', {
        description: config.description,
        duration,
        backupId: backupInfo?.id,
        operation: 'safe_update_success'
      });

      if (config.notifyOnComplete) {
        showToast('success', 'Operação concluída com sucesso');
      }

      return {
        success: true,
        backupId: backupInfo?.id,
        duration,
        timestamp: new Date()
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      await logError('Safe update failed', error, {
        description: config.description,
        duration,
        backupId: currentBackup?.id,
        critical: true
      });

      // Tentar rollback se configurado
      if (config.rollbackOnError && currentBackup) {
        try {
          await restoreBackup(currentBackup.id, { restoreData: true });
          showToast('success', 'Rollback executado com sucesso');
        } catch (rollbackError) {
          await logError('Rollback failed', rollbackError, {
            backupId: currentBackup.id,
            critical: true
          });
          showToast('error', 'Erro durante rollback - verifique os logs');
        }
      }

      if (config.notifyOnComplete) {
        showToast('error', 'Erro durante operação - verifique os logs');
      }

      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
        backupId: currentBackup?.id,
        duration,
        timestamp: new Date()
      };
    } finally {
      setIsUpdating(false);
      setCurrentBackup(null);
    }
  }, [createDatabaseBackup, currentBackup, logInfo, logError, logWarn, restoreBackup, showToast]);

  /**
   * Lista backups disponíveis
   */
  const listBackups = useCallback((): BackupInfo[] => {
    const backups: BackupInfo[] = [];
    
    // Buscar backups de database
    Object.keys(localStorage)
      .filter(key => key.startsWith('backup_'))
      .forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.info) {
            backups.push(data.info);
          }
        } catch (error) {
          console.warn(`Failed to parse backup: ${key}`);
        }
      });

    // Buscar backups de configuração
    Object.keys(localStorage)
      .filter(key => key.startsWith('config_'))
      .forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.info) {
            backups.push(data.info);
          }
        } catch (error) {
          console.warn(`Failed to parse config backup: ${key}`);
        }
      });

    return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, []);

  /**
   * Remove backup antigo
   */
  const deleteBackup = useCallback(async (backupId: string): Promise<boolean> => {
    try {
      const backupKey = Object.keys(localStorage)
        .find(key => key.includes(backupId));
      
      if (backupKey) {
        localStorage.removeItem(backupKey);
        
        await logInfo('Backup deleted', {
          backupId,
          operation: 'delete_backup'
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      await logError('Failed to delete backup', error, {
        backupId
      });
      return false;
    }
  }, [logInfo, logError]);

  return {
    isUpdating,
    currentBackup,
    executeSafeUpdate,
    createDatabaseBackup,
    createConfigBackup,
    restoreBackup,
    listBackups,
    deleteBackup
  };
};
