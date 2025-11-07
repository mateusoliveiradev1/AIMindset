import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useSystemLogs } from './useSystemLogs';
import { queryMetricsTracker } from '@/utils/queryMetrics';
import { useCache } from './useCache';

interface QueryConfig {
  enabled?: boolean;
  staleTime?: number; // Tempo em ms antes de considerar dados stale
  cacheTime?: number; // Tempo em ms para manter dados em cache
  retry?: number;
  retryDelay?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  dedupingInterval?: number; // Intervalo para deduplicar queries idênticas
  optimizeIndexes?: boolean; // Habilitar otimização de índices
}

interface QueryState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isStale: boolean;
  lastFetchTime: number | null;
  fetchCount: number;
}

interface QueryMetrics {
  queryKey: string;
  executionTime: number;
  dataSize: number;
  cacheHit: boolean;
  deduped: boolean;
  timestamp: number;
}

/**
 * Hook para otimizar queries Supabase com cache TTL, deduplicação e índices
 */
export const useOptimizedQuery = <T = any>(
  queryKey: string,
  queryFn: () => Promise<{ data: T; error: any }>,
  config: QueryConfig = {}
) => {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutos padrão
    cacheTime = 10 * 60 * 1000, // 10 minutos padrão
    retry = 3,
    retryDelay = 1000,
    refetchOnWindowFocus = false,
    refetchOnReconnect = true,
    dedupingInterval = 2000,
    optimizeIndexes = true
  } = config;

  const [state, setState] = useState<QueryState<T>>({
    data: null,
    isLoading: false,
    error: null,
    isStale: false,
    lastFetchTime: null,
    fetchCount: 0
  });

  // Implementa cache interno com TTL
  const cacheRef = useRef<Map<string, { data: T; timestamp: number; expiresAt: number }>>(new Map());

  const getCachedData = (key: string) => {
    const record = cacheRef.current.get(key);
    if (!record) return null;
    return {
      data: record.data,
      timestamp: record.timestamp,
      isExpired: () => Date.now() > record.expiresAt,
      isStale: (staleMs: number) => Date.now() - record.timestamp > staleMs
    };
  };

  const setCachedData = (key: string, data: T, ttlMs: number) => {
    const now = Date.now();
    cacheRef.current.set(key, { data, timestamp: now, expiresAt: now + ttlMs });
  };

  const invalidateCache = (key: string) => {
    cacheRef.current.delete(key);
  };

  const { logInfo, logError, logWarn } = useSystemLogs();
  
  // Refs para controle interno
  const abortControllerRef = useRef<AbortController | null>(null);
  const dedupeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeQueriesRef = useRef<Map<string, Promise<any>>>(new Map());
  const metricsRef = useRef<QueryMetrics[]>([]);

  /**
   * Otimiza índices da query baseado no padrão de uso
   */
  const optimizeQueryIndexes = useCallback(async (
    tableName: string,
    queryPattern: any
  ): Promise<void> => {
    if (!optimizeIndexes) return;

    try {
      // Analisar padrão de query para sugerir índices
      const suggestions = [];
      
      if (queryPattern.select) {
        // Queries com filtros frequentes
        if (queryPattern.eq) {
          suggestions.push(`Índice em ${tableName}(${Object.keys(queryPattern.eq).join(', ')})`);
        }
        
        if (queryPattern.order) {
          suggestions.push(`Índice em ${tableName}(${queryPattern.order.column})`);
        }
        
        if (queryPattern.range) {
          suggestions.push(`Índice em ${tableName}(${Object.keys(queryPattern.range).join(', ')})`);
        }
      }

      if (suggestions.length > 0) {
        await logInfo('Query index optimization suggestions', {
          tableName,
          suggestions,
          queryPattern
        });
      }
    } catch (error) {
      await logWarn('Failed to optimize query indexes', {
        tableName,
        error
      });
    }
  }, [optimizeIndexes, logInfo, logWarn]);

  /**
   * Deduplica queries idênticas em curto período
   */
  const dedupeQuery = useCallback(async (
    key: string,
    queryPromise: Promise<any>
  ): Promise<any> => {
    const existingQuery = activeQueriesRef.current.get(key);
    
    if (existingQuery) {
      await logInfo('Query deduplicated', {
        queryKey: key,
        dedupingInterval
      });
      
      return existingQuery;
    }

    // Registrar query ativa
    activeQueriesRef.current.set(key, queryPromise);
    
    // Limpar após intervalo de deduplicação
    if (dedupeTimeoutRef.current) {
      clearTimeout(dedupeTimeoutRef.current);
    }
    
    dedupeTimeoutRef.current = setTimeout(() => {
      activeQueriesRef.current.delete(key);
    }, dedupingInterval);

    try {
      const result = await queryPromise;
      return result;
    } finally {
      // Garantir limpeza
      activeQueriesRef.current.delete(key);
    }
  }, [dedupingInterval, logInfo]);

  /**
   * Executa query com cache e otimizações
   */
  const fetchQuery = useCallback(async (): Promise<T | null> => {
    if (!enabled) {
      await logInfo('Query disabled by config', { queryKey });
      return null;
    }

    const startTime = performance.now();
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Abortar query anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();

      // Verificar cache primeiro
      const cachedData = getCachedData(queryKey);
      const now = Date.now();
      
      if (cachedData && !cachedData.isExpired()) {
        const dataSize = JSON.stringify(cachedData.data).length;
        const executionTime = performance.now() - startTime;
        
        setState(prev => ({
          ...prev,
          data: cachedData.data,
          isLoading: false,
          isStale: cachedData.isStale(staleTime),
          lastFetchTime: now,
          fetchCount: prev.fetchCount + 1
        }));

        // Registrar métricas
        metricsRef.current.push({
          queryKey,
          executionTime,
          dataSize,
          cacheHit: true,
          deduped: false,
          timestamp: now
        });

        // Registrar métricas locais
        queryMetricsTracker.record(queryKey, executionTime, dataSize);

        await logInfo('Query served from cache', {
          queryKey,
          cacheAge: now - cachedData.timestamp,
          isStale: cachedData.isStale(staleTime),
          dataSize
        });

        return cachedData.data;
      }

      // Criar query promise para deduplicação
      const queryPromise = (async () => {
        let retryCount = 0;
        let lastError: Error | null = null;

        while (retryCount <= retry) {
          try {
            // Executar query real
            const result = await queryFn();
            
            if (result.error) {
              throw new Error(result.error.message || 'Query error');
            }

            const executionTime = performance.now() - startTime;
            const dataSize = JSON.stringify(result.data).length;

            // Cachear resultado
            setCachedData(queryKey, result.data, cacheTime);

            setState(prev => ({
              ...prev,
              data: result.data,
              isLoading: false,
              isStale: false,
              lastFetchTime: now,
              fetchCount: prev.fetchCount + 1
            }));

            // Registrar métricas
            metricsRef.current.push({
              queryKey,
              executionTime,
              dataSize,
              cacheHit: false,
              deduped: false,
              timestamp: now
            });

            // Registrar métricas locais
            queryMetricsTracker.record(queryKey, executionTime, dataSize);

            // Otimizar índices se aplicável
            if (optimizeIndexes && queryKey.includes('from_')) {
              const tableMatch = queryKey.match(/from_(\w+)/);
              if (tableMatch) {
                await optimizeQueryIndexes(tableMatch[1], { select: true });
              }
            }

            await logInfo('Query executed successfully', {
              queryKey,
              executionTime,
              dataSize,
              retryCount,
              cacheTime
            });

            return result.data;
          } catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown error');
            retryCount++;

            await logError(`Query failed (attempt ${retryCount})`, lastError, {
              queryKey,
              retryCount,
              maxRetries: retry
            });

            if (retryCount <= retry) {
              // Aguardar antes de retry
              await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
            }
          }
        }

        // Todas as tentativas falharam
        throw lastError;
      })();

      // Aplicar deduplicação
      const result = await dedupeQuery(queryKey, queryPromise);
      return result;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      const errorObj = error instanceof Error ? error : new Error('Unknown error');

      setState(prev => ({
        ...prev,
        data: null,
        isLoading: false,
        error: errorObj
      }));

      await logError('Query failed after all retries', errorObj, {
        queryKey,
        executionTime,
        retryAttempts: retry
      });

      return null;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [
    enabled, queryKey, staleTime, cacheTime, retry, retryDelay,
    getCachedData, setCachedData, dedupeQuery, optimizeQueryIndexes,
    logInfo, logError
  ]);

  /**
   * Invalida cache da query
   */
  const invalidateQuery = useCallback(async (): Promise<void> => {
    invalidateCache(queryKey);
    
    await logInfo('Query cache invalidated', { queryKey });
    
    // Opcionalmente refetch
    await fetchQuery();
  }, [queryKey, invalidateCache, fetchQuery, logInfo]);

  /**
   * Refetch dados (força nova busca)
   */
  const refetch = useCallback(async (): Promise<void> => {
    await logInfo('Manual refetch triggered', { queryKey });
    await fetchQuery();
  }, [queryKey, fetchQuery, logInfo]);

  /**
   * Obtém métricas de performance
   */
  const getQueryMetrics = useCallback(() => {
    const recentMetrics = metricsRef.current.slice(-10); // Últimas 10 queries
    
    const totalQueries = recentMetrics.length;
    const cacheHitRate = totalQueries > 0 
      ? (recentMetrics.filter(m => m.cacheHit).length / totalQueries) * 100 
      : 0;
    
    const avgExecutionTime = totalQueries > 0
      ? recentMetrics.reduce((sum, m) => sum + m.executionTime, 0) / totalQueries
      : 0;
    
    const dedupeRate = totalQueries > 0
      ? (recentMetrics.filter(m => m.deduped).length / totalQueries) * 100
      : 0;

    return {
      totalQueries,
      cacheHitRate,
      avgExecutionTime,
      dedupeRate,
      recentMetrics
    };
  }, []);

  /**
   * Cleanup de recursos
   */
  const cleanup = useCallback(() => {
    // Abortar query em andamento
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Limpar timeouts
    if (dedupeTimeoutRef.current) {
      clearTimeout(dedupeTimeoutRef.current);
    }

    // Limpar queries ativas
    activeQueriesRef.current.clear();

    logInfo('Query cleanup completed', { queryKey });
  }, [queryKey, logInfo]);

  // Efeitos para refetch automático
  useEffect(() => {
    if (!enabled) return;

    // Refetch on window focus
    const handleFocus = () => {
      if (refetchOnWindowFocus && state.lastFetchTime) {
        const timeSinceLastFetch = Date.now() - state.lastFetchTime;
        if (timeSinceLastFetch > staleTime) {
          fetchQuery();
        }
      }
    };

    // Refetch on reconnect
    const handleOnline = () => {
      if (refetchOnReconnect) {
        fetchQuery();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
      window.addEventListener('online', handleOnline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('online', handleOnline);
      }
    };
  }, [
    enabled, refetchOnWindowFocus, refetchOnReconnect,
    state.lastFetchTime, staleTime, fetchQuery
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Fetch inicial
  useEffect(() => {
    if (enabled) {
      fetchQuery();
    }
  }, [enabled, fetchQuery]);

  return {
    // Estado
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    isStale: state.isStale,
    lastFetchTime: state.lastFetchTime,
    fetchCount: state.fetchCount,

    // Métodos
    fetchQuery,
    refetch,
    invalidateQuery,

    // Métricas
    getQueryMetrics,

    // Utilitários
    cleanup
  };
};