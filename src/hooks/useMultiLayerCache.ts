import { useState, useEffect, useCallback, useRef } from 'react';
import { useMemoryLeakDetection } from './useMemoryOptimization';

// Tipos para o sistema de cache multi-camada
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccess: number;
  size: number;
}

interface CacheStats {
  memoryHits: number;
  memoryMisses: number;
  indexedDBHits: number;
  indexedDBMisses: number;
  networkRequests: number;
  totalSize: number;
  entryCount: number;
}

interface CacheConfig {
  memoryMaxSize: number;    // Tamanho máximo em bytes para cache em memória
  memoryMaxEntries: number; // Número máximo de entradas em memória
  indexedDBMaxSize: number; // Tamanho máximo para IndexedDB
  defaultTTL: number;       // TTL padrão em ms
  compressionThreshold: number; // Tamanho mínimo para compressão
}

// Configuração padrão otimizada para artigos
const DEFAULT_CONFIG: CacheConfig = {
  memoryMaxSize: 50 * 1024 * 1024,    // 50MB
  memoryMaxEntries: 1000,              // 1000 entradas
  indexedDBMaxSize: 500 * 1024 * 1024, // 500MB
  defaultTTL: 30 * 60 * 1000,          // 30 minutos
  compressionThreshold: 10 * 1024,     // 10KB
};

class MultiLayerCache<T = any> {
  private memoryCache = new Map<string, CacheEntry<T>>();
  private dbName = 'aimindset-cache';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private config: CacheConfig;
  private stats: CacheStats = {
    memoryHits: 0,
    memoryMisses: 0,
    indexedDBHits: 0,
    indexedDBMisses: 0,
    networkRequests: 0,
    totalSize: 0,
    entryCount: 0,
  };

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initIndexedDB();
  }

  // Inicializar IndexedDB
  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Criar object store para cache
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('lastAccess', 'lastAccess');
        }
      };
    });
  }

  // Calcular tamanho aproximado de um objeto
  private calculateSize(data: T): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return JSON.stringify(data).length * 2; // Aproximação
    }
  }

  // Comprimir dados se necessário
  private async compressData(data: T): Promise<string> {
    const jsonString = JSON.stringify(data);
    
    if (jsonString.length < this.config.compressionThreshold) {
      return jsonString;
    }

    // Usar CompressionStream se disponível
    if ('CompressionStream' in window) {
      try {
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(new TextEncoder().encode(jsonString));
        writer.close();
        
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }
        
        const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          compressed.set(chunk, offset);
          offset += chunk.length;
        }
        
        return btoa(String.fromCharCode(...compressed));
      } catch (error) {
        console.warn('Compression failed, using uncompressed data:', error);
      }
    }
    
    return jsonString;
  }

  // Descomprimir dados
  private async decompressData(compressedData: string): Promise<T> {
    // Tentar descomprimir se parece ser dados comprimidos
    if (compressedData.startsWith('{') || compressedData.startsWith('[')) {
      return JSON.parse(compressedData);
    }

    if ('DecompressionStream' in window) {
      try {
        const compressed = Uint8Array.from(atob(compressedData), c => c.charCodeAt(0));
        const stream = new DecompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(compressed);
        writer.close();
        
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }
        
        const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          decompressed.set(chunk, offset);
          offset += chunk.length;
        }
        
        const jsonString = new TextDecoder().decode(decompressed);
        return JSON.parse(jsonString);
      } catch (error) {
        console.warn('Decompression failed, trying as JSON:', error);
      }
    }
    
    return JSON.parse(compressedData);
  }

  // Limpar cache em memória (LRU)
  private evictMemoryCache(): void {
    if (this.memoryCache.size <= this.config.memoryMaxEntries) return;

    // Ordenar por último acesso (LRU)
    const entries = Array.from(this.memoryCache.entries())
      .sort(([, a], [, b]) => a.lastAccess - b.lastAccess);

    // Remover 25% das entradas mais antigas
    const toRemove = Math.floor(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      this.memoryCache.delete(entries[i][0]);
    }
  }

  // Verificar se entrada está expirada
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  // Buscar no cache em memória
  private getFromMemory(key: string): T | null {
    const entry = this.memoryCache.get(key);
    
    if (!entry || this.isExpired(entry)) {
      if (entry) {
        this.memoryCache.delete(key);
      }
      this.stats.memoryMisses++;
      return null;
    }

    // Atualizar estatísticas de acesso
    entry.accessCount++;
    entry.lastAccess = Date.now();
    this.stats.memoryHits++;
    
    return entry.data;
  }

  // Salvar no cache em memória
  private setInMemory(key: string, data: T, ttl: number): void {
    const size = this.calculateSize(data);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 1,
      lastAccess: Date.now(),
      size,
    };

    this.memoryCache.set(key, entry);
    this.evictMemoryCache();
  }

  // Buscar no IndexedDB
  private async getFromIndexedDB(key: string): Promise<T | null> {
    if (!this.db) {
      await this.initIndexedDB();
      if (!this.db) return null;
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onsuccess = async () => {
        const result = request.result;
        
        if (!result || this.isExpired(result)) {
          if (result) {
            // Remover entrada expirada
            this.deleteFromIndexedDB(key);
          }
          this.stats.indexedDBMisses++;
          resolve(null);
          return;
        }

        try {
          const data = await this.decompressData(result.compressedData);
          
          // Atualizar estatísticas
          result.accessCount++;
          result.lastAccess = Date.now();
          
          // Salvar de volta com estatísticas atualizadas
          this.setInIndexedDB(key, data, result.ttl);
          
          // Também colocar em memória para acesso rápido
          this.setInMemory(key, data, result.ttl);
          
          this.stats.indexedDBHits++;
          resolve(data);
        } catch (error) {
          console.error('Error decompressing data from IndexedDB:', error);
          this.stats.indexedDBMisses++;
          resolve(null);
        }
      };

      request.onerror = () => {
        this.stats.indexedDBMisses++;
        resolve(null);
      };
    });
  }

  // Salvar no IndexedDB
  private async setInIndexedDB(key: string, data: T, ttl: number): Promise<void> {
    if (!this.db) {
      await this.initIndexedDB();
      if (!this.db) return;
    }

    try {
      const compressedData = await this.compressData(data);
      const size = compressedData.length;
      
      const entry = {
        key,
        compressedData,
        timestamp: Date.now(),
        ttl,
        accessCount: 1,
        lastAccess: Date.now(),
        size,
      };

      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      store.put(entry);
    } catch (error) {
      console.error('Error saving to IndexedDB:', error);
    }
  }

  // Remover do IndexedDB
  private async deleteFromIndexedDB(key: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    store.delete(key);
  }

  // API pública - Buscar dados
  async get(key: string): Promise<T | null> {
    // 1. Tentar cache em memória primeiro
    const memoryResult = this.getFromMemory(key);
    if (memoryResult !== null) {
      return memoryResult;
    }

    // 2. Tentar IndexedDB
    const dbResult = await this.getFromIndexedDB(key);
    if (dbResult !== null) {
      return dbResult;
    }

    return null;
  }

  // API pública - Salvar dados
  async set(key: string, data: T, ttl: number = this.config.defaultTTL): Promise<void> {
    // Salvar em ambos os caches
    this.setInMemory(key, data, ttl);
    await this.setInIndexedDB(key, data, ttl);
    
    this.stats.entryCount++;
    this.stats.totalSize += this.calculateSize(data);
  }

  // API pública - Remover dados
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await this.deleteFromIndexedDB(key);
  }

  // API pública - Limpar todo o cache
  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    if (this.db) {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      store.clear();
    }
    
    this.stats = {
      memoryHits: 0,
      memoryMisses: 0,
      indexedDBHits: 0,
      indexedDBMisses: 0,
      networkRequests: 0,
      totalSize: 0,
      entryCount: 0,
    };
  }

  // API pública - Obter estatísticas
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Limpeza automática de entradas expiradas
  async cleanup(): Promise<void> {
    // Limpar memória
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
      }
    }

    // Limpar IndexedDB
    if (!this.db) return;

    const transaction = this.db.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    const index = store.index('timestamp');
    
    const cutoff = Date.now() - this.config.defaultTTL;
    const range = IDBKeyRange.upperBound(cutoff);
    
    index.openCursor(range).onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  }
}

// Hook principal para cache multi-camada
export function useMultiLayerCache<T = any>(namespace: string = 'default') {
  const cacheRef = useRef<MultiLayerCache<T>>();
  const [stats, setStats] = useState<CacheStats | null>(null);
  const memoryUtils = useMemoryLeakDetection('MultiLayerCache');

  // Inicializar cache
  useEffect(() => {
    if (!cacheRef.current) {
      cacheRef.current = new MultiLayerCache<T>();
    }

    // Limpeza automática a cada 5 minutos
    const cleanupInterval = setInterval(() => {
      cacheRef.current?.cleanup();
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(cleanupInterval);
    };
  }, []);

  // Função para buscar com fallback para rede
  const getWithFallback = useCallback(async (
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> => {
    if (!cacheRef.current) {
      throw new Error('Cache not initialized');
    }

    const fullKey = `${namespace}:${key}`;
    
    // Tentar cache primeiro
    const cached = await cacheRef.current.get(fullKey);
    if (cached !== null) {
      return cached;
    }

    // Buscar da rede
    try {
      cacheRef.current.getStats().networkRequests++;
      const data = await fetcher();
      
      // Salvar no cache
      await cacheRef.current.set(fullKey, data, ttl);
      
      return data;
    } catch (error) {
      console.error('Network request failed:', error);
      throw error;
    }
  }, [namespace]);

  // Função para salvar no cache
  const set = useCallback(async (key: string, data: T, ttl?: number): Promise<void> => {
    if (!cacheRef.current) return;
    
    const fullKey = `${namespace}:${key}`;
    await cacheRef.current.set(fullKey, data, ttl);
  }, [namespace]);

  // Função para buscar do cache
  const get = useCallback(async (key: string): Promise<T | null> => {
    if (!cacheRef.current) return null;
    
    const fullKey = `${namespace}:${key}`;
    return cacheRef.current.get(fullKey);
  }, [namespace]);

  // Função para remover do cache
  const remove = useCallback(async (key: string): Promise<void> => {
    if (!cacheRef.current) return;
    
    const fullKey = `${namespace}:${key}`;
    await cacheRef.current.delete(fullKey);
  }, [namespace]);

  // Função para limpar cache
  const clear = useCallback(async (): Promise<void> => {
    if (!cacheRef.current) return;
    await cacheRef.current.clear();
  }, []);

  // Função para obter estatísticas
  const getStats = useCallback((): CacheStats | null => {
    if (!cacheRef.current) return null;
    return cacheRef.current.getStats();
  }, []);

  // Atualizar estatísticas periodicamente
  useEffect(() => {
    const updateStats = () => {
      const currentStats = getStats();
      setStats(currentStats);
    };

    updateStats();
    const interval = setInterval(updateStats, 10000); // A cada 10 segundos

    return () => clearInterval(interval);
  }, [getStats]);

  return {
    get,
    set,
    remove,
    clear,
    getWithFallback,
    stats,
    getStats,
  };
}

// Hook especializado para cache de artigos
export function useArticleCache() {
  const cache = useMultiLayerCache<any>('articles');

  const getArticle = useCallback(async (id: string) => {
    return cache.getWithFallback(
      `article:${id}`,
      () => fetch(`/api/articles/${id}`).then(res => res.json()),
      30 * 60 * 1000 // 30 minutos
    );
  }, [cache]);

  const getArticlesList = useCallback(async (params: Record<string, any>) => {
    const key = `list:${JSON.stringify(params)}`;
    return cache.getWithFallback(
      key,
      () => fetch(`/api/articles?${new URLSearchParams(params)}`).then(res => res.json()),
      5 * 60 * 1000 // 5 minutos
    );
  }, [cache]);

  const getCategory = useCallback(async (id: string) => {
    return cache.getWithFallback(
      `category:${id}`,
      () => fetch(`/api/categories/${id}`).then(res => res.json()),
      60 * 60 * 1000 // 1 hora
    );
  }, [cache]);

  const searchArticles = useCallback(async (query: string, filters: Record<string, any> = {}) => {
    const key = `search:${query}:${JSON.stringify(filters)}`;
    return cache.getWithFallback(
      key,
      () => fetch(`/api/search?q=${encodeURIComponent(query)}&${new URLSearchParams(filters)}`).then(res => res.json()),
      10 * 60 * 1000 // 10 minutos
    );
  }, [cache]);

  return {
    ...cache,
    getArticle,
    getArticlesList,
    getCategory,
    searchArticles,
  };
}