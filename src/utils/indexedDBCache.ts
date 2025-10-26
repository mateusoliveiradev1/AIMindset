// Sistema de cache IndexedDB para armazenamento massivo de artigos
// Suporta milhares de artigos com busca rápida e sincronização

interface CacheItem<T> {
  id: string;
  data: T;
  timestamp: number;
  expiresAt?: number;
  version: number;
  tags?: string[];
  size?: number;
}

interface CacheOptions {
  ttl?: number; // Time to live em milissegundos
  version?: number;
  tags?: string[];
  compress?: boolean;
}

interface SearchOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

class IndexedDBCache {
  private dbName: string;
  private dbVersion: number;
  private db: IDBDatabase | null = null;
  private storeName: string;
  private indexNames: string[];

  constructor(
    dbName: string = 'AIMindsetCache',
    storeName: string = 'articles',
    dbVersion: number = 1
  ) {
    this.dbName = dbName;
    this.dbVersion = dbVersion;
    this.storeName = storeName;
    this.indexNames = ['timestamp', 'expiresAt', 'tags', 'version'];
  }

  // Inicializar o banco de dados
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Criar object store se não existir
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          
          // Criar índices para busca rápida
          this.indexNames.forEach(indexName => {
            if (!store.indexNames.contains(indexName)) {
              store.createIndex(indexName, indexName, { unique: false });
            }
          });

          // Índice composto para busca por tags
          if (!store.indexNames.contains('tags_timestamp')) {
            store.createIndex('tags_timestamp', ['tags', 'timestamp'], { unique: false });
          }
        }
      };
    });
  }

  // Verificar se o banco está inicializado
  private ensureInitialized(): void {
    if (!this.db) {
      throw new Error('IndexedDB not initialized. Call init() first.');
    }
  }

  // Armazenar item no cache
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    this.ensureInitialized();

    const now = Date.now();
    const item: CacheItem<T> = {
      id: key,
      data,
      timestamp: now,
      version: options.version || 1,
      tags: options.tags || [],
      size: this.calculateSize(data)
    };

    if (options.ttl) {
      item.expiresAt = now + options.ttl;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to store item: ${request.error}`));
    });
  }

  // Recuperar item do cache
  async get<T>(key: string): Promise<T | null> {
    this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const item = request.result as CacheItem<T>;
        
        if (!item) {
          resolve(null);
          return;
        }

        // Verificar se o item expirou
        if (item.expiresAt && Date.now() > item.expiresAt) {
          this.delete(key); // Remove item expirado
          resolve(null);
          return;
        }

        resolve(item.data);
      };

      request.onerror = () => reject(new Error(`Failed to get item: ${request.error}`));
    });
  }

  // Armazenar múltiplos itens em lote
  async setMany<T>(items: Array<{ key: string; data: T; options?: CacheOptions }>): Promise<void> {
    this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      let completed = 0;
      let hasError = false;

      const now = Date.now();

      items.forEach(({ key, data, options = {} }) => {
        const item: CacheItem<T> = {
          id: key,
          data,
          timestamp: now,
          version: options.version || 1,
          tags: options.tags || [],
          size: this.calculateSize(data)
        };

        if (options.ttl) {
          item.expiresAt = now + options.ttl;
        }

        const request = store.put(item);

        request.onsuccess = () => {
          completed++;
          if (completed === items.length && !hasError) {
            resolve();
          }
        };

        request.onerror = () => {
          hasError = true;
          reject(new Error(`Failed to store item ${key}: ${request.error}`));
        };
      });
    });
  }

  // Recuperar múltiplos itens
  async getMany<T>(keys: string[]): Promise<Array<{ key: string; data: T | null }>> {
    this.ensureInitialized();

    const results: Array<{ key: string; data: T | null }> = [];

    for (const key of keys) {
      try {
        const data = await this.get<T>(key);
        results.push({ key, data });
      } catch (error) {
        results.push({ key, data: null });
      }
    }

    return results;
  }

  // Buscar itens por critérios
  async search<T>(options: SearchOptions = {}): Promise<Array<CacheItem<T>>> {
    this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        let items = request.result as Array<CacheItem<T>>;

        // Filtrar itens expirados
        const now = Date.now();
        items = items.filter(item => !item.expiresAt || item.expiresAt > now);

        // Aplicar filtros
        if (options.filters) {
          items = items.filter(item => {
            return Object.entries(options.filters!).every(([key, value]) => {
              if (key === 'tags' && Array.isArray(value)) {
                return value.some(tag => item.tags?.includes(tag));
              }
              return (item as any)[key] === value;
            });
          });
        }

        // Ordenar
        if (options.sortBy) {
          items.sort((a, b) => {
            const aValue = (a as any)[options.sortBy!];
            const bValue = (b as any)[options.sortBy!];
            
            if (options.sortOrder === 'desc') {
              return bValue - aValue;
            }
            return aValue - bValue;
          });
        }

        // Paginação
        const offset = options.offset || 0;
        const limit = options.limit || items.length;
        items = items.slice(offset, offset + limit);

        resolve(items);
      };

      request.onerror = () => reject(new Error(`Search failed: ${request.error}`));
    });
  }

  // Buscar por tags
  async getByTags<T>(tags: string[], options: SearchOptions = {}): Promise<Array<CacheItem<T>>> {
    return this.search<T>({
      ...options,
      filters: { ...options.filters, tags }
    });
  }

  // Deletar item
  async delete(key: string): Promise<void> {
    this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to delete item: ${request.error}`));
    });
  }

  // Deletar múltiplos itens
  async deleteMany(keys: string[]): Promise<void> {
    this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      let completed = 0;
      let hasError = false;

      keys.forEach(key => {
        const request = store.delete(key);

        request.onsuccess = () => {
          completed++;
          if (completed === keys.length && !hasError) {
            resolve();
          }
        };

        request.onerror = () => {
          hasError = true;
          reject(new Error(`Failed to delete item ${key}: ${request.error}`));
        };
      });
    });
  }

  // Limpar itens expirados
  async clearExpired(): Promise<number> {
    this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('expiresAt');
      const now = Date.now();
      
      const request = index.openCursor(IDBKeyRange.upperBound(now));
      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };

      request.onerror = () => reject(new Error(`Failed to clear expired items: ${request.error}`));
    });
  }

  // Obter estatísticas do cache
  async getStats(): Promise<{
    totalItems: number;
    totalSize: number;
    expiredItems: number;
    oldestItem: number;
    newestItem: number;
  }> {
    this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result as Array<CacheItem<any>>;
        const now = Date.now();

        const stats = {
          totalItems: items.length,
          totalSize: items.reduce((sum, item) => sum + (item.size || 0), 0),
          expiredItems: items.filter(item => item.expiresAt && item.expiresAt < now).length,
          oldestItem: Math.min(...items.map(item => item.timestamp)),
          newestItem: Math.max(...items.map(item => item.timestamp))
        };

        resolve(stats);
      };

      request.onerror = () => reject(new Error(`Failed to get stats: ${request.error}`));
    });
  }

  // Limpar todo o cache
  async clear(): Promise<void> {
    this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to clear cache: ${request.error}`));
    });
  }

  // Fechar conexão com o banco
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // Calcular tamanho aproximado do objeto
  private calculateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 0;
    }
  }
}

// Hook para usar o cache IndexedDB
export const useIndexedDBCache = (
  dbName?: string,
  storeName?: string,
  dbVersion?: number
) => {
  const cache = new IndexedDBCache(dbName, storeName, dbVersion);

  return {
    cache,
    init: () => cache.init(),
    set: <T>(key: string, data: T, options?: CacheOptions) => cache.set(key, data, options),
    get: <T>(key: string) => cache.get<T>(key),
    setMany: <T>(items: Array<{ key: string; data: T; options?: CacheOptions }>) => cache.setMany(items),
    getMany: <T>(keys: string[]) => cache.getMany<T>(keys),
    search: <T>(options?: SearchOptions) => cache.search<T>(options),
    getByTags: <T>(tags: string[], options?: SearchOptions) => cache.getByTags<T>(tags, options),
    delete: (key: string) => cache.delete(key),
    deleteMany: (keys: string[]) => cache.deleteMany(keys),
    clearExpired: () => cache.clearExpired(),
    getStats: () => cache.getStats(),
    clear: () => cache.clear(),
    close: () => cache.close()
  };
};

// Cache específico para artigos
export class ArticleCache extends IndexedDBCache {
  constructor() {
    super('AIMindsetArticles', 'articles', 1);
  }

  // Armazenar artigo com metadados específicos
  async storeArticle(article: any, options: CacheOptions = {}): Promise<void> {
    const articleOptions: CacheOptions = {
      ...options,
      tags: [
        ...(options.tags || []),
        article.category,
        ...(article.tags || [])
      ].filter(Boolean),
      ttl: options.ttl || 24 * 60 * 60 * 1000 // 24 horas por padrão
    };

    return this.set(`article_${article.id}`, article, articleOptions);
  }

  // Armazenar múltiplos artigos
  async storeArticles(articles: any[], options: CacheOptions = {}): Promise<void> {
    const items = articles.map(article => ({
      key: `article_${article.id}`,
      data: article,
      options: {
        ...options,
        tags: [
          ...(options.tags || []),
          article.category,
          ...(article.tags || [])
        ].filter(Boolean),
        ttl: options.ttl || 24 * 60 * 60 * 1000
      }
    }));

    return this.setMany(items);
  }

  // Buscar artigos por categoria
  async getArticlesByCategory(category: string, options: SearchOptions = {}): Promise<any[]> {
    const items = await this.getByTags([category], options);
    return items.map(item => item.data);
  }

  // Buscar artigos por múltiplas tags
  async getArticlesByTags(tags: string[], options: SearchOptions = {}): Promise<any[]> {
    const items = await this.getByTags(tags, options);
    return items.map(item => item.data);
  }

  // Buscar artigos recentes
  async getRecentArticles(limit: number = 20): Promise<any[]> {
    const items = await this.search({
      sortBy: 'timestamp',
      sortOrder: 'desc',
      limit
    });
    return items.map(item => item.data);
  }
}

export default IndexedDBCache;