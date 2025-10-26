// IndexedDB para cache local massivo
import type { Article, Category } from '../types/index';

export interface CacheEntry<T = any> {
  id: string;
  data: T;
  timestamp: number;
  expiresAt: number;
  version: number;
  tags?: string[];
}

export interface CacheOptions {
  ttl?: number; // Time to live em milissegundos
  version?: number;
  tags?: string[];
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
}

class IndexedDBCache {
  private dbName = 'AIMindsetCache';
  private version = 1;
  private db: IDBDatabase | null = null;
  private isInitialized = false;
  private stats = {
    hits: 0,
    misses: 0,
    totalRequests: 0
  };

  // Stores para diferentes tipos de dados
  private stores = {
    articles: 'articles',
    categories: 'categories',
    searches: 'searches',
    filters: 'filters',
    metadata: 'metadata',
    images: 'images'
  };

  async init(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Erro ao abrir IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('IndexedDB inicializado com sucesso');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Criar stores se não existirem
        Object.values(this.stores).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            
            // Índices para otimização
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('expiresAt', 'expiresAt', { unique: false });
            store.createIndex('version', 'version', { unique: false });
            
            if (storeName === 'articles') {
              store.createIndex('category', 'data.category', { unique: false });
              store.createIndex('published', 'data.published', { unique: false });
              store.createIndex('created_at', 'data.created_at', { unique: false });
            }
          }
        });
      };
    });
  }

  // Métodos genéricos de cache
  async set<T>(
    store: keyof typeof this.stores,
    key: string,
    data: T,
    options: CacheOptions = {}
  ): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('IndexedDB não inicializado');

    const ttl = options.ttl || 24 * 60 * 60 * 1000; // 24 horas padrão
    const now = Date.now();
    
    const entry: CacheEntry<T> = {
      id: key,
      data,
      timestamp: now,
      expiresAt: now + ttl,
      version: options.version || 1,
      tags: options.tags
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.stores[store]], 'readwrite');
      const objectStore = transaction.objectStore(this.stores[store]);
      const request = objectStore.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(
    store: keyof typeof this.stores,
    key: string
  ): Promise<T | null> {
    await this.init();
    if (!this.db) return null;

    this.stats.totalRequests++;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.stores[store]], 'readonly');
      const objectStore = transaction.objectStore(this.stores[store]);
      const request = objectStore.get(key);

      request.onsuccess = () => {
        const entry = request.result as CacheEntry<T>;
        
        if (!entry) {
          this.stats.misses++;
          resolve(null);
          return;
        }

        // Verificar expiração
        if (Date.now() > entry.expiresAt) {
          this.stats.misses++;
          // Remover entrada expirada
          this.delete(store, key);
          resolve(null);
          return;
        }

        this.stats.hits++;
        resolve(entry.data);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async delete(
    store: keyof typeof this.stores,
    key: string
  ): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.stores[store]], 'readwrite');
      const objectStore = transaction.objectStore(this.stores[store]);
      const request = objectStore.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(store?: keyof typeof this.stores): Promise<void> {
    await this.init();
    if (!this.db) return;

    const storesToClear = store ? [this.stores[store]] : Object.values(this.stores);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storesToClear, 'readwrite');
      
      const promises = storesToClear.map(storeName => {
        return new Promise<void>((resolveStore, rejectStore) => {
          const objectStore = transaction.objectStore(storeName);
          const request = objectStore.clear();
          
          request.onsuccess = () => resolveStore();
          request.onerror = () => rejectStore(request.error);
        });
      });

      Promise.all(promises)
        .then(() => resolve())
        .catch(reject);
    });
  }

  // Métodos específicos para artigos
  async cacheArticles(articles: Article[], options?: CacheOptions): Promise<void> {
    const promises = articles.map(article => 
      this.set('articles', `article_${article.id}`, article, options)
    );
    
    // Cache também a lista completa
    await this.set('articles', 'all_articles', articles, options);
    
    await Promise.all(promises);
  }

  async getCachedArticles(): Promise<Article[] | null> {
    return this.get<Article[]>('articles', 'all_articles');
  }

  async getCachedArticle(id: string): Promise<Article | null> {
    return this.get<Article>('articles', `article_${id}`);
  }

  // Cache de resultados de busca
  async cacheSearchResults(
    query: string,
    results: Article[],
    options?: CacheOptions
  ): Promise<void> {
    const searchKey = `search_${this.hashString(query)}`;
    await this.set('searches', searchKey, { query, results }, options);
  }

  async getCachedSearchResults(query: string): Promise<{ query: string; results: Article[] } | null> {
    const searchKey = `search_${this.hashString(query)}`;
    return this.get('searches', searchKey);
  }

  // Cache de filtros
  async cacheFilterResults(
    filters: any,
    results: Article[],
    options?: CacheOptions
  ): Promise<void> {
    const filterKey = `filter_${this.hashString(JSON.stringify(filters))}`;
    await this.set('filters', filterKey, { filters, results }, options);
  }

  async getCachedFilterResults(filters: any): Promise<{ filters: any; results: Article[] } | null> {
    const filterKey = `filter_${this.hashString(JSON.stringify(filters))}`;
    return this.get('filters', filterKey);
  }

  // Cache de categorias
  async cacheCategories(categories: Category[], options?: CacheOptions): Promise<void> {
    await this.set('categories', 'all_categories', categories, options);
  }

  async getCachedCategories(): Promise<Category[] | null> {
    return this.get<Category[]>('categories', 'all_categories');
  }

  // Cache de imagens
  async cacheImage(url: string, blob: Blob, options?: CacheOptions): Promise<void> {
    const imageKey = `image_${this.hashString(url)}`;
    await this.set('images', imageKey, { url, blob }, options);
  }

  async getCachedImage(url: string): Promise<{ url: string; blob: Blob } | null> {
    const imageKey = `image_${this.hashString(url)}`;
    return this.get('images', imageKey);
  }

  // Limpeza de entradas expiradas
  async cleanupExpired(): Promise<number> {
    await this.init();
    if (!this.db) return 0;

    let deletedCount = 0;
    const now = Date.now();

    for (const storeName of Object.values(this.stores)) {
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const objectStore = transaction.objectStore(storeName);
        const index = objectStore.index('expiresAt');
        const range = IDBKeyRange.upperBound(now);
        const request = index.openCursor(range);

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            deletedCount++;
            cursor.continue();
          } else {
            resolve();
          }
        };

        request.onerror = () => reject(request.error);
      });
    }

    console.log(`Limpeza do IndexedDB: ${deletedCount} entradas expiradas removidas`);
    return deletedCount;
  }

  // Estatísticas do cache
  async getStats(): Promise<CacheStats> {
    await this.init();
    if (!this.db) {
      return {
        totalEntries: 0,
        totalSize: 0,
        hitRate: 0,
        missRate: 0,
        oldestEntry: null,
        newestEntry: null
      };
    }

    let totalEntries = 0;
    let totalSize = 0;
    let oldestTimestamp = Infinity;
    let newestTimestamp = 0;

    for (const storeName of Object.values(this.stores)) {
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readonly');
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.openCursor();

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const entry = cursor.value as CacheEntry;
            totalEntries++;
            
            // Estimar tamanho (aproximado)
            totalSize += JSON.stringify(entry.data).length;
            
            if (entry.timestamp < oldestTimestamp) {
              oldestTimestamp = entry.timestamp;
            }
            if (entry.timestamp > newestTimestamp) {
              newestTimestamp = entry.timestamp;
            }
            
            cursor.continue();
          } else {
            resolve();
          }
        };

        request.onerror = () => reject(request.error);
      });
    }

    const hitRate = this.stats.totalRequests > 0 
      ? this.stats.hits / this.stats.totalRequests 
      : 0;
    
    const missRate = this.stats.totalRequests > 0 
      ? this.stats.misses / this.stats.totalRequests 
      : 0;

    return {
      totalEntries,
      totalSize,
      hitRate,
      missRate,
      oldestEntry: oldestTimestamp !== Infinity ? new Date(oldestTimestamp) : null,
      newestEntry: newestTimestamp > 0 ? new Date(newestTimestamp) : null
    };
  }

  // Utilitários
  private hashString(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString();
  }

  // Backup e restore
  async exportData(): Promise<any> {
    await this.init();
    if (!this.db) return null;

    const data: any = {};

    for (const [key, storeName] of Object.entries(this.stores)) {
      data[key] = await new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readonly');
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    return data;
  }

  async importData(data: any): Promise<void> {
    await this.init();
    if (!this.db) return;

    for (const [key, entries] of Object.entries(data)) {
      if (this.stores[key as keyof typeof this.stores] && Array.isArray(entries)) {
        const storeName = this.stores[key as keyof typeof this.stores];
        
        await new Promise<void>((resolve, reject) => {
          const transaction = this.db!.transaction([storeName], 'readwrite');
          const objectStore = transaction.objectStore(storeName);
          
          // Limpar store antes de importar
          const clearRequest = objectStore.clear();
          
          clearRequest.onsuccess = () => {
            const promises = (entries as any[]).map(entry => {
              return new Promise<void>((resolveEntry, rejectEntry) => {
                const addRequest = objectStore.add(entry);
                addRequest.onsuccess = () => resolveEntry();
                addRequest.onerror = () => rejectEntry(addRequest.error);
              });
            });
            
            Promise.all(promises)
              .then(() => resolve())
              .catch(reject);
          };
          
          clearRequest.onerror = () => reject(clearRequest.error);
        });
      }
    }
  }
}

// Instância singleton
export const indexedDBCache = new IndexedDBCache();

// Hook para usar o IndexedDB cache
export function useIndexedDBCache() {
  return indexedDBCache;
}