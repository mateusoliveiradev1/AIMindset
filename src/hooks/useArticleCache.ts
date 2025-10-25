import { useState, useEffect, useCallback } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
  hits: number; // Contador de acessos
}

interface CacheConfig {
  maxAge: number; // em milissegundos
  maxSize: number; // número máximo de itens
  enablePersistence: boolean; // Persistir no localStorage
}

const DEFAULT_CONFIG: CacheConfig = {
  maxAge: 20 * 60 * 1000, // 20 minutos (aumentado para melhor performance)
  maxSize: 300, // Aumentado para mais itens
  enablePersistence: true
};

class ArticleCache {
  private cache = new Map<string, CacheItem<any>>();
  private config: CacheConfig;
  private persistenceKey = 'aimindset_article_cache';

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Carregar cache do localStorage se habilitado
    if (this.config.enablePersistence) {
      this.loadFromStorage();
    }
  }

  set<T>(key: string, data: T, customMaxAge?: number): void {
    const now = Date.now();
    const maxAge = customMaxAge || this.config.maxAge;
    
    // 🚀 PERFORMANCE: Cleanup apenas se necessário
    if (this.cache.size >= this.config.maxSize * 0.9) {
      this.cleanup();
    }
    
    // Se o cache está cheio, remove o item menos usado (LRU)
    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastUsed();
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiry: now + maxAge,
      hits: 0
    });

    // 🚀 PERFORMANCE: Persistir de forma assíncrona
    if (this.config.enablePersistence) {
      setTimeout(() => this.saveToStorage(), 0);
    }
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Verifica se o item expirou
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      // 🚀 PERFORMANCE: Não persistir imediatamente
      return null;
    }

    // Incrementa contador de hits
    item.hits++;

    return item.data as T;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    // Verifica se o item expirou
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
    // 🚀 PERFORMANCE: Persistir de forma assíncrona
    if (this.config.enablePersistence) {
      setTimeout(() => this.saveToStorage(), 0);
    }
  }

  clear(): void {
    this.cache.clear();
    if (this.config.enablePersistence) {
      localStorage.removeItem(this.persistenceKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    let hasExpired = false;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
        hasExpired = true;
      }
    }

    // 🚀 PERFORMANCE: Persistir apenas se houve mudanças
    if (hasExpired && this.config.enablePersistence) {
      setTimeout(() => this.saveToStorage(), 0);
    }
  }

  private evictLeastUsed(): void {
    let leastUsedKey = '';
    let leastHits = Infinity;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.hits < leastHits) {
        leastHits = item.hits;
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  private saveToStorage(): void {
    try {
      const cacheData = Array.from(this.cache.entries());
      localStorage.setItem(this.persistenceKey, JSON.stringify(cacheData));
    } catch (error) {
      // 🚀 PERFORMANCE: Silenciar warnings em produção
      if (process.env.NODE_ENV === 'development') {
        console.warn('Erro ao salvar cache no localStorage:', error);
      }
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.persistenceKey);
      if (stored) {
        const cacheData = JSON.parse(stored);
        const now = Date.now();
        
        // Carregar apenas itens não expirados
        for (const [key, item] of cacheData) {
          if (now <= item.expiry) {
            this.cache.set(key, item);
          }
        }
      }
    } catch (error) {
      // 🚀 PERFORMANCE: Silenciar warnings em produção
      if (process.env.NODE_ENV === 'development') {
        console.warn('Erro ao carregar cache do localStorage:', error);
      }
      localStorage.removeItem(this.persistenceKey);
    }
  }

  // Pré-carregar dados importantes
  prefetch<T>(key: string, dataFetcher: () => Promise<T>, maxAge?: number): Promise<T> {
    return new Promise(async (resolve, reject) => {
      // Se já existe no cache, retorna
      if (this.has(key)) {
        resolve(this.get<T>(key)!);
        return;
      }

      try {
        const data = await dataFetcher();
        this.set(key, data, maxAge);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Estatísticas do cache
  getStats() {
    const now = Date.now();
    let validItems = 0;
    let expiredItems = 0;
    let totalHits = 0;

    for (const [, item] of this.cache.entries()) {
      if (now <= item.expiry) {
        validItems++;
        totalHits += item.hits;
      } else {
        expiredItems++;
      }
    }

    return {
      size: this.cache.size,
      validItems,
      expiredItems,
      maxSize: this.config.maxSize,
      maxAge: this.config.maxAge,
      totalHits,
      hitRate: validItems > 0 ? (totalHits / validItems).toFixed(2) : '0',
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  private estimateMemoryUsage(): string {
    const jsonString = JSON.stringify(Array.from(this.cache.entries()));
    const bytes = new Blob([jsonString]).size;
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

// Instância global do cache com configuração otimizada para performance
const articleCache = new ArticleCache({
  maxAge: 20 * 60 * 1000, // 20 minutos
  maxSize: 300,
  enablePersistence: true
});

export const useArticleCache = () => {
  const [cacheStats, setCacheStats] = useState(articleCache.getStats());

  // 🚀 PERFORMANCE: Atualizar estatísticas menos frequentemente
  useEffect(() => {
    const interval = setInterval(() => {
      setCacheStats(articleCache.getStats());
    }, 60000); // A cada 60 segundos (reduzido de 30s)

    return () => clearInterval(interval);
  }, []);

  const setCache = useCallback(<T>(key: string, data: T, maxAge?: number) => {
    articleCache.set(key, data, maxAge);
    // 🚀 PERFORMANCE: Não atualizar stats imediatamente
  }, []);

  const getCache = useCallback(<T>(key: string): T | null => {
    return articleCache.get<T>(key);
  }, []);

  const hasCache = useCallback((key: string): boolean => {
    return articleCache.has(key);
  }, []);

  const deleteCache = useCallback((key: string) => {
    articleCache.delete(key);
    // 🚀 PERFORMANCE: Não atualizar stats imediatamente
  }, []);

  const clearCache = useCallback(() => {
    articleCache.clear();
    setCacheStats(articleCache.getStats());
  }, []);

  const prefetchCache = useCallback(<T>(key: string, dataFetcher: () => Promise<T>, maxAge?: number) => {
    return articleCache.prefetch(key, dataFetcher, maxAge);
  }, []);

  return {
    setCache,
    getCache,
    hasCache,
    deleteCache,
    clearCache,
    prefetchCache,
    cacheStats
  };
};

export default useArticleCache;