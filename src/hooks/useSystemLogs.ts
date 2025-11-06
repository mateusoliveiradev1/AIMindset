import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './useToast';

// Tipos para logs técnicos expandidos
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
export type LogSource = 'api' | 'database' | 'auth' | 'backup' | 'security' | 'performance' | 'user_action';

export interface SystemLog {
  id?: string;
  timestamp: Date;
  level: LogLevel;
  source: LogSource;
  message: string;
  details?: Record<string, any>;
  userId?: string;
  userEmail?: string;
  responseTime?: number;
  statusCode?: number;
  endpoint?: string;
  method?: string;
  ipAddress?: string;
  userAgent?: string;
  stackTrace?: string;
  environment: 'development' | 'production';
  version: string;
}

export interface LogFilter {
  level?: LogLevel[];
  source?: LogSource[];
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface LogMetrics {
  totalLogs: number;
  errorCount: number;
  warnCount: number;
  avgResponseTime: number;
  errorRate: number;
  topErrors: Array<{ message: string; count: number }>;
  recentErrors: SystemLog[];
}

/**
 * Hook para System Logs expandido com monitoramento de erros técnicos
 * Implementa logging estruturado para o painel admin
 */
export const useSystemLogs = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [metrics, setMetrics] = useState<LogMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  /**
   * Envia log para o banco de dados
   */
  const sendLog = useCallback(async (log: Omit<SystemLog, 'id'>) => {
    try {
      const environment = log.environment || (import.meta.env.PROD ? 'production' : 'development');
      const version = log.version || import.meta.env.VITE_APP_VERSION || '1.0.0';

      const context: Record<string, any> = {
        ...(log.details || {}),
        source: log.source,
        endpoint: log.endpoint,
        method: log.method,
        responseTime: log.responseTime,
        statusCode: log.statusCode,
        userId: log.userId,
        userEmail: log.userEmail,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        stackTrace: log.stackTrace,
        environment,
        version,
      };

      const payload = {
        type: log.level,
        message: log.message,
        context,
        created_at: (log.timestamp ?? new Date()).toISOString(),
      };

      // Enviar via endpoint server-side para evitar RLS
      const response = await fetch('/api/system-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.warn('Envio de log via API falhou:', response.status, errText);
        // Fallback local
        try {
          const fallbackLogs = JSON.parse(localStorage.getItem('fallback_logs') || '[]');
          fallbackLogs.push({ ...payload, failed_at: new Date().toISOString() });
          localStorage.setItem('fallback_logs', JSON.stringify(fallbackLogs));
        } catch (fallbackError) {
          console.error('Erro no fallback de logs:', fallbackError);
        }
      }
    } catch (err) {
      console.error('Erro crítico ao enviar log:', err);
    }
  }, []);

  /**
   * Log de erro com contexto completo
   */
  const logError = useCallback(async (
    message: string,
    error: Error | unknown,
    context: Record<string, any> = {}
  ) => {
    const errorLog: Omit<SystemLog, 'id'> = {
      timestamp: new Date(),
      level: 'error',
      source: 'api',
      message,
      details: {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        ...context
      },
      stackTrace: error instanceof Error ? error.stack : undefined,
      environment: import.meta.env.PROD ? 'production' : 'development',
      version: import.meta.env.VITE_APP_VERSION || '1.0.0'
    };

    // Adicionar informações do usuário se disponível
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        errorLog.userId = user.id;
        errorLog.userEmail = user.email || undefined;
      }
    } catch {
      // Ignorar erro ao obter usuário
    }

    await sendLog(errorLog);

    // Notificar admin em caso de erro crítico
    if (context.critical) {
      showToast('error', 'Erro crítico detectado. Verifique os logs.');
    }
  }, [sendLog, showToast]);

  /**
   * Log de warning
   */
  const logWarn = useCallback(async (
    message: string,
    context: Record<string, any> = {}
  ) => {
    const warnLog: Omit<SystemLog, 'id'> = {
      timestamp: new Date(),
      level: 'warn',
      source: context.source || 'api',
      message,
      details: context,
      environment: import.meta.env.PROD ? 'production' : 'development',
      version: import.meta.env.VITE_APP_VERSION || '1.0.0'
    };

    await sendLog(warnLog);
  }, [sendLog]);

  /**
   * Log de informação
   */
  const logInfo = useCallback(async (
    message: string,
    context: Record<string, any> = {}
  ) => {
    const infoLog: Omit<SystemLog, 'id'> = {
      timestamp: new Date(),
      level: 'info',
      source: context.source || 'api',
      message,
      details: context,
      environment: import.meta.env.PROD ? 'production' : 'development',
      version: import.meta.env.VITE_APP_VERSION || '1.0.0'
    };

    await sendLog(infoLog);
  }, [sendLog]);

  /**
   * Log de performance
   */
  const logPerformance = useCallback(async (
    endpoint: string,
    method: string,
    responseTime: number,
    statusCode?: number,
    additionalContext: Record<string, any> = {}
  ) => {
    const perfLog: Omit<SystemLog, 'id'> = {
      timestamp: new Date(),
      level: responseTime > 5000 ? 'warn' : 'info', // Warning se > 5s
      source: 'performance',
      message: `Performance: ${method} ${endpoint} - ${responseTime}ms`,
      endpoint,
      method,
      responseTime,
      statusCode,
      details: additionalContext,
      environment: import.meta.env.PROD ? 'production' : 'development',
      version: import.meta.env.VITE_APP_VERSION || '1.0.0'
    };

    await sendLog(perfLog);

    // Alertar se response time estiver anormal
    if (responseTime > 10000) {
      showToast('warning', 'Tempo de resposta muito alto detectado');
    }
  }, [sendLog, showToast]);

  /**
   * Log de ação do usuário
   */
  const logUserAction = useCallback(async (
    action: string,
    resource: string,
    details: Record<string, any> = {}
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const actionLog: Omit<SystemLog, 'id'> = {
        timestamp: new Date(),
        level: 'info',
        source: 'user_action',
        message: `User action: ${action} on ${resource}`,
        userId: user?.id,
        userEmail: user?.email || undefined,
        details: {
          action,
          resource,
          ...details
        },
        environment: import.meta.env.PROD ? 'production' : 'development',
        version: import.meta.env.VITE_APP_VERSION || '1.0.0'
      };

      await sendLog(actionLog);
    } catch (error) {
      console.error('Erro ao logar ação do usuário:', error);
    }
  }, [sendLog]);

  /**
   * Busca logs com filtros
   */
  const fetchLogs = useCallback(async (filter: LogFilter = {}) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filter.level && filter.level.length > 0) {
        // Schema usa 'type' em vez de 'level'
        query = query.in('type', filter.level);
      }

      // Removido filtro por 'source' (pode estar dentro de context)
      if (filter.source && filter.source.length > 0) {
        query = query.in('source', filter.source);
      }

      if (filter.startDate) {
        query = query.gte('created_at', filter.startDate.toISOString());
      }

      if (filter.endDate) {
        query = query.lte('created_at', filter.endDate.toISOString());
      }

      if (filter.userId) {
        query = query.eq('user_id', filter.userId);
      }

      if (filter.search) {
        // Evitar referenciar colunas inexistentes; buscar apenas por mensagem
        query = query.ilike('message', `%${filter.search}%`);
      }

      if (filter.limit) {
        query = query.limit(filter.limit);
      }

      if (filter.offset) {
        query = query.range(filter.offset, filter.offset + (filter.limit || 50) - 1);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      const logsData: SystemLog[] = (data || []).map((raw: any) => ({
        // mapear para o formato SystemLog de forma tolerante ao schema
        id: raw.id,
        timestamp: new Date(raw.timestamp || raw.created_at),
        level: (raw.level || raw.type || 'info') as LogLevel,
        source: raw.source as LogSource,
        message: raw.message,
        details: (() => {
          try {
            if (raw.details) return typeof raw.details === 'string' ? JSON.parse(raw.details) : raw.details;
            if (raw.context) return typeof raw.context === 'string' ? JSON.parse(raw.context) : raw.context;
          } catch {
            return undefined;
          }
          return undefined;
        })(),
        userId: raw.user_id || raw.userId,
        userEmail: raw.user_email || raw.userEmail,
        responseTime: raw.response_time || raw.responseTime,
        statusCode: raw.status_code || raw.statusCode,
        endpoint: raw.endpoint,
        method: raw.method,
        ipAddress: raw.ip_address || raw.ipAddress,
        userAgent: raw.user_agent || raw.userAgent,
        stackTrace: raw.stack_trace || raw.stackTrace,
        environment: raw.environment || (import.meta.env.PROD ? 'production' : 'development'),
        version: raw.version || import.meta.env.VITE_APP_VERSION || '1.0.0',
      }));

      setLogs(logsData);
      return logsData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar logs';
      setError(errorMessage);
      showToast('error', errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  /**
   * Calcula métricas dos logs
   */
  const calculateMetrics = useCallback(async (filter: LogFilter = {}) => {
    try {
      // Buscar logs dos últimos 7 dias para métricas
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const logsData = await fetchLogs({
        ...filter,
        startDate: sevenDaysAgo,
        limit: 1000
      });

      const totalLogs = logsData.length;
      const errorLogs = logsData.filter(log => log.level === 'error');
      const warnLogs = logsData.filter(log => log.level === 'warn');
      
      // Calcular tempo médio de resposta
      const responseTimes = logsData
        .filter(log => log.responseTime)
        .map(log => log.responseTime!);
      
      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

      // Top erros mais frequentes
      const errorCounts = errorLogs.reduce((acc, log) => {
        const key = log.message;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topErrors = Object.entries(errorCounts)
        .map(([message, count]) => ({ message, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const metrics: LogMetrics = {
        totalLogs,
        errorCount: errorLogs.length,
        warnCount: warnLogs.length,
        avgResponseTime: Math.round(avgResponseTime),
        errorRate: totalLogs > 0 ? (errorLogs.length / totalLogs) * 100 : 0,
        topErrors,
        recentErrors: errorLogs.slice(0, 5)
      };

      setMetrics(metrics);
      return metrics;
    } catch (err) {
      console.error('Erro ao calcular métricas:', err);
      return null;
    }
  }, [fetchLogs]);

  /**
   * Limpa logs antigos (mantém últimos 30 dias)
   */
  const cleanupOldLogs = useCallback(async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { error: deleteError } = await supabase
        .from('system_logs')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());

      if (deleteError) {
        throw deleteError;
      }

      showToast('success', 'Logs antigos limpos com sucesso');
      await logInfo('System cleanup completed', { 
        deletedBefore: thirtyDaysAgo.toISOString(),
        operation: 'cleanup_old_logs'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao limpar logs';
      showToast('error', errorMessage);
      await logError('Failed to cleanup old logs', err);
    }
  }, [logInfo, logError, showToast]);

  /**
   * Exporta logs para análise
   */
  const exportLogs = useCallback(async (filter: LogFilter = {}) => {
    try {
      const logsData = await fetchLogs({ ...filter, limit: 10000 });
      
      const csvContent = [
        ['Timestamp', 'Level', 'Source', 'Message', 'User', 'Details'].join(','),
        ...logsData.map(log => [
          log.timestamp.toISOString(),
          log.level,
          log.source,
          `"${log.message.replace(/"/g, '""')}"`,
          log.userEmail || log.userId || '',
          log.details ? `"${JSON.stringify(log.details).replace(/"/g, '""')}"` : ''
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('success', 'Logs exportados com sucesso');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao exportar logs';
      showToast('error', errorMessage);
    }
  }, [fetchLogs, showToast]);

  return {
    logs,
    metrics,
    loading,
    error,
    sendLog,
    logError,
    logWarn,
    logInfo,
    logPerformance,
    logUserAction,
    fetchLogs,
    calculateMetrics,
    cleanupOldLogs,
    exportLogs
  };
};

/**
 * Utilitário para capturar e logar erros não tratados
 */
export const setupGlobalErrorLogging = () => {
  // Capturar erros globais
  window.addEventListener('error', async (event) => {
    const { useSystemLogs } = await import('./useSystemLogs');
    const { logError } = useSystemLogs();
    
    await logError('Global error caught', event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      critical: true
    });
  });

  // Capturar promises rejeitadas
  window.addEventListener('unhandledrejection', async (event) => {
    const { useSystemLogs } = await import('./useSystemLogs');
    const { logError } = useSystemLogs();
    
    await logError('Unhandled promise rejection', event.reason, {
      critical: true
    });
  });
};

/**
 * Interceptor para requests HTTP com logging automático
 */
export const setupRequestLogging = () => {
  const originalFetch = window.fetch;
  
  window.fetch = async (...args) => {
    const startTime = performance.now();
    const [url, options] = args;
    const method = options?.method || 'GET';
    
    try {
      const response = await originalFetch(...args);
      const responseTime = performance.now() - startTime;
      
      // Log performance para requests lentos (> 2s)
      if (responseTime > 2000) {
        const { useSystemLogs } = await import('./useSystemLogs');
        const { logPerformance } = useSystemLogs();
        
        await logPerformance(
          url.toString(),
          method,
          responseTime,
          response.status,
          { slow_request: true }
        );
      }
      
      // Log errors 4xx/5xx
      if (!response.ok) {
        const { useSystemLogs } = await import('./useSystemLogs');
        const { logError } = useSystemLogs();
        
        await logError(`HTTP ${response.status} error`, new Error(`Request failed: ${response.statusText}`), {
          url: url.toString(),
          method,
          statusCode: response.status,
          responseTime,
          critical: response.status >= 500
        });
      }
      
      return response;
    } catch (error) {
      const responseTime = performance.now() - startTime;
      const { useSystemLogs } = await import('./useSystemLogs');
      const { logError } = useSystemLogs();
      
      await logError('Network request failed', error, {
        url: url.toString(),
        method,
        responseTime,
        critical: true
      });
      
      throw error;
    }
  };
};