import { useState, useEffect, useCallback } from 'react';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  enabled?: boolean; // Enable/disable cache (default: true)
  keyPrefix?: string; // Prefix for cache keys (default: 'cache')
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Hook de cache com TTL para otimizar queries ao banco
 * Implementa cache em memória com fallback para localStorage
 * 
 * @param key - Chave única para o cache
 * @param fetcher - Função assíncrona para buscar dados
 * @param options - Opções de configuração do cache
 * @returns Objeto com data, loading, error e métodos de controle
 */
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const {
    ttl = 5 * 60 * 1000, // 5 minutos padrão
    enabled = true,
    keyPrefix = 'cache'
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);

  const cacheKey = `${keyPrefix}:${key}`;
  const timestampKey = `${cacheKey}:timestamp`;

  /**
   * Verifica se o cache está válido
   */
  const isCacheValid = useCallback((cachedTimestamp: number): boolean => {
    const now = Date.now();
    return now - cachedTimestamp < ttl;
  }, [ttl]);

  /**
   * Carrega dados do cache localStorage
   */
  const loadFromCache = useCallback((): T | null => {
    if (!enabled) return null;

    try {
      const cached = localStorage.getItem(cacheKey);
      const cachedTime = localStorage.getItem(timestampKey);

      if (cached && cachedTime) {
        const timestamp = parseInt(cachedTime, 10);
        
        if (isCacheValid(timestamp)) {
          return JSON.parse(cached);
        } else {
          // Cache expirado, marcar como stale
          setIsStale(true);
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar cache:', error);
    }

    return null;
  }, [cacheKey, timestampKey, enabled, isCacheValid]);

  /**
   * Salva dados no cache
   */
  const saveToCache = useCallback((dataToCache: T): void => {
    if (!enabled) return;

    try {
      const now = Date.now();
      const cacheEntry: CacheEntry<T> = {
        data: dataToCache,
        timestamp: now,
        expiresAt: now + ttl
      };

      localStorage.setItem(cacheKey, JSON.stringify(dataToCache));
      localStorage.setItem(timestampKey, now.toString());
      setIsStale(false);
    } catch (error) {
      console.warn('Erro ao salvar cache:', error);
    }
  }, [cacheKey, timestampKey, enabled, ttl]);

  /**
   * Limpa o cache
   */
  const clearCache = useCallback((): void => {
    try {
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(timestampKey);
      setData(null);
      setIsStale(false);
    } catch (error) {
      console.warn('Erro ao limpar cache:', error);
    }
  }, [cacheKey, timestampKey]);

  /**
   * Força atualização dos dados (bypass cache)
   */
  const refetch = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
      saveToCache(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [fetcher, saveToCache]);

  /**
   * Carrega dados (com cache)
   */
  const loadData = useCallback(async (): Promise<void> => {
    setLoading(true);

    // Tentar carregar do cache primeiro
    const cachedData = loadFromCache();
    if (cachedData !== null) {
      setData(cachedData);
      setLoading(false);
      
      // Se estiver stale, atualizar em background
      if (isStale) {
        // Atualização em background não bloqueante
        refetch().catch(console.error);
      }
      return;
    }

    // Se não houver cache válido, buscar dados
    await refetch();
  }, [loadFromCache, refetch, isStale]);

  // Carregar dados na montagem
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    refetch,
    clearCache,
    isStale,
    isCached: data !== null && !loading && !error
  };
}

/**
 * Hook específico para cache de queries Supabase
 * Com TTL dinâmico baseado no tipo de dado
 */
export function useSupabaseCache<T>(
  table: string,
  fetcher: () => Promise<T>,
  dataType: 'static' | 'dynamic' | 'critical' = 'dynamic'
) {
  // TTL baseado no tipo de dado
  const ttl = {
    static: 60 * 60 * 1000,    // 1 hora para dados estáticos
    dynamic: 5 * 60 * 1000,   // 5 minutos para dados dinâmicos
    critical: 30 * 1000       // 30 segundos para dados críticos
  }[dataType];

  return useCache<T>(`supabase:${table}`, fetcher, { ttl, keyPrefix: 'supabase' });
}

/**
 * Hook para cache de estatísticas e métricas
 */
export function useStatsCache<T>(
  key: string,
  fetcher: () => Promise<T>
) {
  return useCache<T>(`stats:${key}`, fetcher, {
    ttl: 2 * 60 * 1000, // 2 minutos para estatísticas
    keyPrefix: 'stats'
  });
}

/**
 * Hook para cache de configurações
 */
export function useConfigCache<T>(
  key: string,
  fetcher: () => Promise<T>
) {
  return useCache<T>(`config:${key}`, fetcher, {
    ttl: 24 * 60 * 60 * 1000, // 24 horas para configurações
    keyPrefix: 'config'
  });
}