/**
 * Sistema de Cache Híbrido Multi-Layer - Fase 1
 * 
 * L1 (Memória): Cache rápido para dados frequentes (TTL 5min)
 * L2 (IndexedDB): Cache persistente para listas (TTL 10min)
 * 
 * GARANTIAS:
 * - Fallback automático para Supabase se cache falhar
 * - Zero impacto nas operações CRUD do admin
 * - Invalidação automática após operações admin
 */

import IndexedDBCache from './indexedDBCache';
import { trackCacheOperation } from './performanceMonitor';

// Tipos para o cache híbrido
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  source: 'memory' | 'indexeddb' | 'supabase';
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  invalidations: number;
  lastUpdate: number;
}

// Cache L1 (Memória) - TTL 5 minutos para dados críticos
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos
  
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
      source: 'memory'
    };
    
    this.cache.set(key, entry);
    console.log(`🟢 [L1 Cache] SET: ${key} (TTL: ${entry.ttl}ms)`);
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      console.log(`🔴 [L1 Cache] MISS: ${key}`);
      return null;
    }
    
    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      console.log(`⏰ [L1 Cache] EXPIRED: ${key}`);
      return null;
    }
    
    console.log(`🟢 [L1 Cache] HIT: ${key}`);
    return entry.data;
  }
  
  invalidate(key: string): void {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`🗑️ [L1 Cache] INVALIDATED: ${key}`);
    }
  }
  
  invalidatePattern(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    const matchingKeys = keys.filter(key => key.includes(pattern));
    
    matchingKeys.forEach(key => {
      this.cache.delete(key);
      console.log(`🗑️ [L1 Cache] PATTERN INVALIDATED: ${key}`);
    });
  }
  
  clear(): void {
    this.cache.clear();
    console.log(`🧹 [L1 Cache] CLEARED ALL`);
  }
  
  size(): number {
    return this.cache.size;
  }
}

// Cache L2 (IndexedDB) - TTL 10 minutos para listas
class IndexedDBCacheLayer {
  private readonly DEFAULT_TTL = 10 * 60 * 1000; // 10 minutos
  private cache = new IndexedDBCache('AIMindsetCache', 'articles', 1);
  
  constructor() {
    this.cache.init().catch(error => {
      console.error('❌ [L2 Cache] Initialization failed:', error);
    });
  }
  
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
      source: 'indexeddb'
    };
    
    try {
      await this.cache.set(key, entry);
      console.log(`🟡 [L2 Cache] SET: ${key} (TTL: ${entry.ttl}ms)`);
    } catch (error) {
      console.error(`❌ [L2 Cache] SET ERROR: ${key}`, error);
    }
  }
  
  async get<T>(key: string): Promise<T | null> {
    try {
      const entry = await this.cache.get<CacheEntry<T>>(key);
      
      if (!entry) {
        console.log(`🔴 [L2 Cache] MISS: ${key}`);
        return null;
      }
      
      // Verificar se expirou
      if (Date.now() - entry.timestamp > entry.ttl) {
        await this.cache.delete(key);
        console.log(`⏰ [L2 Cache] EXPIRED: ${key}`);
        return null;
      }
      
      console.log(`🟡 [L2 Cache] HIT: ${key}`);
      return entry.data;
    } catch (error) {
      console.error(`❌ [L2 Cache] GET ERROR: ${key}`, error);
      return null;
    }
  }
  
  async invalidate(key: string): Promise<void> {
    try {
      await this.cache.delete(key);
      console.log(`🗑️ [L2 Cache] INVALIDATED: ${key}`);
    } catch (error) {
      console.error(`❌ [L2 Cache] INVALIDATE ERROR: ${key}`, error);
    }
  }
  
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      // Usar método público da classe ArticleCache
      const articleCache = new (await import('./indexedDBCache')).ArticleCache();
      const keys = await articleCache.getAllKeys();
      const matchingKeys = keys.filter(key => key.includes(pattern));
      
      await Promise.all(
        matchingKeys.map(async (key) => {
          await this.cache.delete(key);
          console.log(`🗑️ [L2 Cache] PATTERN INVALIDATED: ${key}`);
        })
      );
    } catch (error) {
      console.error(`❌ [L2 Cache] PATTERN INVALIDATE ERROR:`, error);
    }
  }
  
  async clear(): Promise<void> {
    try {
      await this.cache.clear();
      console.log(`🧹 [L2 Cache] CLEARED ALL`);
    } catch (error) {
      console.error(`❌ [L2 Cache] CLEAR ERROR:`, error);
    }
  }
}

// Sistema de Cache Híbrido Principal
class HybridCacheSystem {
  private l1Cache = new MemoryCache();
  private l2Cache = new IndexedDBCacheLayer();
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    invalidations: 0,
    lastUpdate: Date.now()
  };
  
  // Estratégia de cache por tipo de dados
  private getCacheStrategy(key: string): { useL1: boolean; useL2: boolean; l1TTL?: number; l2TTL?: number } {
    if (key.includes('featured') || key.includes('highlight')) {
      // Artigos em destaque: L1 (5min) + L2 (10min)
      return { useL1: true, useL2: true, l1TTL: 5 * 60 * 1000, l2TTL: 10 * 60 * 1000 };
    }
    
    if (key.includes('articles_list') || key.includes('categories')) {
      // Listas: Principalmente L2 (10min) + L1 opcional (3min)
      return { useL1: true, useL2: true, l1TTL: 3 * 60 * 1000, l2TTL: 10 * 60 * 1000 };
    }
    
    // Padrão: L1 (5min) + L2 (10min)
    return { useL1: true, useL2: true };
  }
  
  async get<T>(key: string): Promise<{ data: T | null; source: 'memory' | 'indexeddb' | null; hit: boolean }> {
    const strategy = this.getCacheStrategy(key);
    
    try {
      // Tentar L1 primeiro (mais rápido)
      if (strategy.useL1) {
        const l1Data = this.l1Cache.get<T>(key);
        if (l1Data !== null) {
          this.metrics.hits++;
          trackCacheOperation('cache_hit', 'L1', key);
          return { data: l1Data, source: 'memory', hit: true };
        }
      }
      
      // Tentar L2 se L1 falhou
      if (strategy.useL2) {
        const l2Data = await this.l2Cache.get<T>(key);
        if (l2Data !== null) {
          // Promover para L1 se estratégia permitir
          if (strategy.useL1) {
            this.l1Cache.set(key, l2Data, strategy.l1TTL);
          }
          this.metrics.hits++;
          trackCacheOperation('cache_hit', 'L2', key);
          return { data: l2Data, source: 'indexeddb', hit: true };
        }
      }
      
      this.metrics.misses++;
      trackCacheOperation('cache_miss', 'L2', key);
      return { data: null, source: null, hit: false };
    } catch (error) {
      console.error(`❌ [Hybrid Cache] GET ERROR: ${key}`, error);
      this.metrics.misses++;
      trackCacheOperation('cache_miss', 'L2', key);
      return { data: null, source: null, hit: false };
    }
  }
  
  async set<T>(key: string, data: T): Promise<void> {
    const strategy = this.getCacheStrategy(key);
    
    try {
      const promises: Promise<void>[] = [];
      
      // Salvar em L1 se estratégia permitir
      if (strategy.useL1) {
        this.l1Cache.set(key, data, strategy.l1TTL);
      }
      
      // Salvar em L2 se estratégia permitir
      if (strategy.useL2) {
        promises.push(this.l2Cache.set(key, data, strategy.l2TTL));
      }
      
      await Promise.all(promises);
      this.metrics.lastUpdate = Date.now();
      
      console.log(`✅ [Hybrid Cache] SET: ${key} (L1: ${strategy.useL1}, L2: ${strategy.useL2})`);
    } catch (error) {
      console.error(`❌ [Hybrid Cache] SET ERROR: ${key}`, error);
    }
  }
  
  async invalidate(key: string): Promise<void> {
    try {
      const promises: Promise<void>[] = [];
      
      // Invalidar L1
      this.l1Cache.invalidate(key);
      
      // Invalidar L2
      promises.push(this.l2Cache.invalidate(key));
      
      await Promise.all(promises);
      this.metrics.invalidations++;
      
      trackCacheOperation('cache_invalidation', 'L1', key);
      trackCacheOperation('cache_invalidation', 'L2', key);
      
      console.log(`🗑️ [Hybrid Cache] INVALIDATED: ${key}`);
    } catch (error) {
      console.error(`❌ [Hybrid Cache] INVALIDATE ERROR: ${key}`, error);
    }
  }
  
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const promises: Promise<void>[] = [];
      
      // Invalidar L1
      this.l1Cache.invalidatePattern(pattern);
      
      // Invalidar L2
      promises.push(this.l2Cache.invalidatePattern(pattern));
      
      await Promise.all(promises);
      this.metrics.invalidations++;
      
      console.log(`🗑️ [Hybrid Cache] PATTERN INVALIDATED: ${pattern}`);
    } catch (error) {
      console.error(`❌ [Hybrid Cache] PATTERN INVALIDATE ERROR: ${pattern}`, error);
    }
  }
  
  async clear(): Promise<void> {
    try {
      const promises: Promise<void>[] = [];
      
      // Limpar L1
      this.l1Cache.clear();
      
      // Limpar L2
      promises.push(this.l2Cache.clear());
      
      await Promise.all(promises);
      this.metrics.invalidations++;
      
      console.log(`🧹 [Hybrid Cache] CLEARED ALL`);
    } catch (error) {
      console.error(`❌ [Hybrid Cache] CLEAR ERROR:`, error);
    }
  }
  
  getMetrics(): CacheMetrics & { l1Size: number; l2Size: number; l1HitRate: number; l2HitRate: number } {
    return {
      ...this.metrics,
      l1Size: this.l1Cache.size(),
      l2Size: 0, // IndexedDB size is complex to calculate, using 0 for now
      l1HitRate: this.metrics.hits / (this.metrics.hits + this.metrics.misses) * 100 || 0,
      l2HitRate: 0 // Simplified for now
    };
  }
  
  // Método para invalidação automática após operações CRUD
  async invalidateAfterCRUD(operation: 'create' | 'update' | 'delete', entityType: 'article' | 'category', entityId?: string): Promise<void> {
    console.log(`🔄 [Hybrid Cache] Auto-invalidation after ${operation} ${entityType} ${entityId || ''}`);
    
    try {
      switch (entityType) {
        case 'article':
          // Invalidar caches relacionados a artigos
          await this.invalidatePattern('articles');
          await this.invalidatePattern('featured');
          await this.invalidatePattern('highlight');
          if (entityId) {
            await this.invalidate(`article_${entityId}`);
          }
          break;
          
        case 'category':
          // Invalidar caches relacionados a categorias
          await this.invalidatePattern('categories');
          await this.invalidatePattern('articles'); // Artigos têm categorias
          if (entityId) {
            await this.invalidate(`category_${entityId}`);
          }
          break;
      }
      
      console.log(`✅ [Hybrid Cache] Auto-invalidation completed for ${operation} ${entityType}`);
    } catch (error) {
      console.error(`❌ [Hybrid Cache] Auto-invalidation error:`, error);
    }
  }
}

// Instância singleton do cache híbrido
export const hybridCache = new HybridCacheSystem();

// Utilitários para chaves de cache padronizadas
export const CacheKeys = {
  ARTICLES_LIST: 'articles_list',
  ARTICLES_FEATURED: 'articles_featured',
  CATEGORIES_LIST: 'categories_list',
  ARTICLE_BY_ID: (id: string) => `article_${id}`,
  CATEGORY_BY_ID: (id: string) => `category_${id}`,
  ARTICLES_BY_CATEGORY: (categoryId: string) => `articles_category_${categoryId}`,
} as const;

// Hook para monitoramento de performance do cache
export const useCacheMetrics = () => {
  const getMetrics = () => hybridCache.getMetrics();
  
  const logPerformance = () => {
    const metrics = getMetrics();
    const hitRate = metrics.hits / (metrics.hits + metrics.misses) * 100;
    
    console.log(`📊 [Cache Performance]`, {
      hitRate: `${hitRate.toFixed(1)}%`,
      hits: metrics.hits,
      misses: metrics.misses,
      invalidations: metrics.invalidations,
      l1Size: metrics.l1Size,
      lastUpdate: new Date(metrics.lastUpdate).toLocaleTimeString()
    });
  };
  
  return { getMetrics, logPerformance };
};