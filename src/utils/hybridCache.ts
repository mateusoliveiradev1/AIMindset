/**
 * Sistema de Cache Híbrido Multi-Layer - Fase 1 OTIMIZADO PARA ADMIN
 * 
 * L1 (Memória): Cache rápido para dados frequentes (TTL adaptativo)
 * L2 (IndexedDB): Cache persistente para listas (TTL adaptativo)
 * 
 * GARANTIAS:
 * - Fallback automático para Supabase se cache falhar
 * - Zero impacto nas operações CRUD do admin
 * - Invalidação automática após operações admin
 * - TTL inteligente baseado no padrão de uso
 * - Limpeza automática de dados expirados
 * - Retry automático com backoff exponencial
 * - MODO ADMIN: Bypass de cache para operações críticas
 */

import IndexedDBCache from './indexedDBCache';
import { trackCacheOperation } from './performanceMonitor';

// Tipos para o cache híbrido
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  source: 'memory' | 'indexeddb' | 'supabase';
  accessCount?: number;
  lastAccess?: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  invalidations: number;
  lastUpdate: number;
}

// Modo administrativo - bypass de cache para operações críticas
class AdminModeManager {
  private static isAdminMode = false;
  private static adminOperations = new Set(['publish', 'unpublish', 'create', 'update', 'delete']);
  
  static enableAdminMode(): void {
    this.isAdminMode = true;
    console.log('🔧 [Admin Mode] ENABLED - Cache bypass ativo');
  }
  
  static disableAdminMode(): void {
    this.isAdminMode = false;
    console.log('🔧 [Admin Mode] DISABLED - Cache normal');
  }
  
  static isInAdminMode(): boolean {
    return this.isAdminMode;
  }
  
  static shouldBypassCache(operation?: string): boolean {
    return this.isAdminMode || (operation && this.adminOperations.has(operation));
  }
}

// TTL inteligente baseado no padrão de uso
class SmartTTLManager {
  private static readonly BASE_TTL = 5 * 60 * 1000; // 5 minutos base
  private static readonly POPULAR_TTL = 15 * 60 * 1000; // 15 minutos para populares
  private static readonly NEW_TTL = 3 * 60 * 1000; // 3 minutos para novos
  private static readonly ADMIN_TTL = 30 * 1000; // 30 segundos para admin
  
  static calculateTTL(key: string, accessCount: number = 0, isAdminOperation = false): number {
    // Operações admin = TTL muito baixo para refresh rápido
    if (isAdminOperation) {
      return this.ADMIN_TTL;
    }
    
    // Artigos populares (mais de 5 acessos) = TTL maior
    if (accessCount > 5) {
      return this.POPULAR_TTL;
    }
    
    // Artigos novos ou pouco acessados = TTL menor
    if (accessCount <= 2) {
      return this.NEW_TTL;
    }
    
    return this.BASE_TTL;
  }
}

// Sistema de retry otimizado (sem retry para admin)
class RetryManager {
  private static readonly MAX_RETRIES = 2; // Reduzido de 3 para 2
  private static readonly BASE_DELAY = 100; // Reduzido de 200 para 100ms
  
  static async withRetry<T>(
    operation: () => Promise<T>,
    isAdminOperation = false
  ): Promise<T> {
    // Admin operations = sem retry para velocidade máxima
    if (isAdminOperation || AdminModeManager.isInAdminMode()) {
      try {
        return await operation();
      } catch (error) {
        console.warn('⚡ [Admin Fast] Operation failed, no retry:', error);
        throw error;
      }
    }
    
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.MAX_RETRIES) {
          console.error(`❌ [Retry] Failed after ${this.MAX_RETRIES} attempts:`, lastError);
          throw lastError;
        }
        
        const delay = this.BASE_DELAY * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
}

// Cache L1 (Memória) - TTL adaptativo
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.startCleanupTimer();
  }
  
  set<T>(key: string, data: T, accessCount = 0, isAdminOperation = false): void {
    const ttl = SmartTTLManager.calculateTTL(key, accessCount, isAdminOperation);
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      source: 'memory',
      accessCount,
      lastAccess: Date.now()
    };
    
    this.cache.set(key, entry);
    
    // Log reduzido para admin
    if (!AdminModeManager.isInAdminMode()) {
      console.log(`💾 [L1 Cache] SET: ${key} (TTL: ${Math.round(ttl/1000)}s)`);
    }
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Verificar expiração
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Atualizar estatísticas de acesso
    entry.accessCount = (entry.accessCount || 0) + 1;
    entry.lastAccess = Date.now();
    
    return entry.data;
  }
  
  invalidate(key: string): void {
    const deleted = this.cache.delete(key);
    if (deleted && !AdminModeManager.isInAdminMode()) {
      console.log(`🗑️ [L1 Cache] INVALIDATED: ${key}`);
    }
  }
  
  invalidatePattern(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    const matchingKeys = keys.filter(key => key.includes(pattern));
    
    matchingKeys.forEach(key => {
      this.cache.delete(key);
    });
    
    if (matchingKeys.length > 0 && !AdminModeManager.isInAdminMode()) {
      console.log(`🗑️ [L1 Cache] Pattern invalidated: ${matchingKeys.length} entries`);
    }
  }
  
  clear(): void {
    this.cache.clear();
    if (!AdminModeManager.isInAdminMode()) {
      console.log(`🧹 [L1 Cache] CLEARED ALL`);
    }
  }
  
  size(): number {
    return this.cache.size;
  }
  
  private startCleanupTimer(): void {
    // Limpeza automática a cada 5 minutos (reduzido de 10)
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000);
  }
  
  private cleanupExpired(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0 && !AdminModeManager.isInAdminMode()) {
      console.log(`🧹 [L1 Cache] Cleaned ${cleanedCount} expired entries`);
    }
  }
  
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Cache L2 (IndexedDB) - TTL adaptativo com proteção contra erros
class IndexedDBCacheLayer {
  private cache = new IndexedDBCache('AIMindsetCache', 'articles', 1);
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;
  
  constructor() {
    this.init();
    this.startCleanupTimer();
  }
  
  private async init(): Promise<void> {
    try {
      await this.cache.init();
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ [L2 Cache] Initialization failed:', error);
      this.isInitialized = false;
    }
  }
  
  private startCleanupTimer(): void {
    // Limpeza automática a cada 10 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 10 * 60 * 1000);
  }
  
  private async cleanupExpired(): Promise<void> {
    if (!this.isInitialized) return;
    
    try {
      // Verificar se o método existe antes de chamar
      if (typeof (this.cache as any).getAllKeys !== 'function') {
        console.warn('⚠️ [L2 Cache] getAllKeys method not available, skipping cleanup');
        return;
      }
      
      const keys = await (this.cache as any).getAllKeys();
      const now = Date.now();
      let cleanedCount = 0;
      
      for (const key of keys) {
        try {
          const entry = await this.cache.get(key) as any;
          if (entry && entry.timestamp && entry.ttl && now - entry.timestamp > entry.ttl) {
            await this.cache.delete(key);
            cleanedCount++;
          }
        } catch (error) {
          // Ignorar erros individuais de limpeza
          console.warn(`⚠️ [L2 Cache] Cleanup error for key ${key}:`, error);
        }
      }
      
      if (cleanedCount > 0 && !AdminModeManager.isInAdminMode()) {
        console.log(`🧹 [L2 Cache] Cleaned ${cleanedCount} expired entries`);
      }
    } catch (error) {
      console.error('❌ [L2 Cache] Cleanup failed:', error);
    }
  }
  
  async set<T>(key: string, data: T, accessCount = 0, isAdminOperation = false): Promise<void> {
    if (!this.isInitialized) {
      console.warn('⚠️ [L2 Cache] Not initialized, skipping set');
      return;
    }
    
    const ttl = SmartTTLManager.calculateTTL(key, accessCount, isAdminOperation);
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      source: 'indexeddb',
      accessCount,
      lastAccess: Date.now()
    };
    
    return RetryManager.withRetry(async () => {
      await this.cache.set(key, entry);
      if (!AdminModeManager.isInAdminMode()) {
        console.log(`💾 [L2 Cache] SET: ${key} (TTL: ${Math.round(ttl/1000)}s)`);
      }
    }, isAdminOperation);
  }
  
  async get<T>(key: string): Promise<T | null> {
    if (!this.isInitialized) {
      return null;
    }
    
    try {
      const entry = await this.cache.get(key) as CacheEntry<T> | null;
      
      if (!entry) {
        return null;
      }
      
      // Verificar expiração
      const now = Date.now();
      if (now - entry.timestamp > entry.ttl) {
        await this.cache.delete(key);
        return null;
      }
      
      // Atualizar estatísticas de acesso
      entry.accessCount = (entry.accessCount || 0) + 1;
      entry.lastAccess = Date.now();
      
      return entry.data;
    } catch (error) {
      console.error(`❌ [L2 Cache] Get error for key ${key}:`, error);
      return null;
    }
  }
  
  async delete(key: string): Promise<void> {
    await this.invalidate(key);
  }

  async invalidate(key: string): Promise<void> {
    if (!this.isInitialized) {
      return;
    }
    
    return RetryManager.withRetry(async () => {
      await this.cache.delete(key);
      if (!AdminModeManager.isInAdminMode()) {
        console.log(`🗑️ [L2 Cache] INVALIDATED: ${key}`);
      }
    }, AdminModeManager.isInAdminMode());
  }
  
  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.isInitialized) {
      return;
    }
    
    return RetryManager.withRetry(async () => {
      try {
        // Verificar se o método existe antes de chamar
        if (typeof (this.cache as any).getAllKeys !== 'function') {
          console.warn('⚠️ [L2 Cache] getAllKeys method not available for pattern invalidation');
          return;
        }
        
        const keys = await (this.cache as any).getAllKeys();
        const matchingKeys = keys.filter(key => key.includes(pattern));
        
        for (const key of matchingKeys) {
          try {
            await this.cache.delete(key);
          } catch (error) {
            console.warn(`⚠️ [L2 Cache] Failed to delete key ${key}:`, error);
          }
        }
        
        if (matchingKeys.length > 0 && !AdminModeManager.isInAdminMode()) {
          console.log(`🗑️ [L2 Cache] Pattern invalidated: ${matchingKeys.length} entries`);
        }
      } catch (error) {
        console.error(`❌ [L2 Cache] Pattern invalidation failed for ${pattern}:`, error);
      }
    }, AdminModeManager.isInAdminMode());
  }
  
  async clear(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }
    
    return RetryManager.withRetry(async () => {
      await this.cache.clear();
      if (!AdminModeManager.isInAdminMode()) {
        console.log(`🧹 [L2 Cache] CLEARED ALL`);
      }
    }, AdminModeManager.isInAdminMode());
  }
  
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Sistema de cache híbrido principal
class HybridCacheSystem {
  private l1Cache = new MemoryCache();
  private l2Cache = new IndexedDBCacheLayer();
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    invalidations: 0,
    lastUpdate: Date.now()
  };
  
  // Método para ativar modo admin (operações instantâneas)
  enableAdminMode(): void {
    AdminModeManager.enableAdminMode();
  }
  
  disableAdminMode(): void {
    AdminModeManager.disableAdminMode();
  }
  
  async get<T>(key: string): Promise<{ hit: boolean; data: T | null; source: string }> {
    const startTime = performance.now();
    
    // Tentar L1 primeiro
    const l1Data = this.l1Cache.get<T>(key);
    if (l1Data !== null) {
      this.metrics.hits++;
      trackCacheOperation('cache_hit', 'L1', key, performance.now() - startTime);
      return { hit: true, data: l1Data, source: 'L1' };
    }
    
    // Tentar L2
    const l2Data = await this.l2Cache.get<T>(key);
    if (l2Data !== null) {
      // Promover para L1
      this.l1Cache.set(key, l2Data);
      this.metrics.hits++;
      trackCacheOperation('cache_hit', 'L2', key, performance.now() - startTime);
      return { hit: true, data: l2Data, source: 'L2' };
    }
    
    this.metrics.misses++;
    trackCacheOperation('cache_miss', 'L1', key, performance.now() - startTime);
    return { hit: false, data: null, source: 'none' };
  }
  
  async set<T>(key: string, data: T, options?: { accessCount?: number; isAdminOperation?: boolean }): Promise<void> {
    const { accessCount = 0, isAdminOperation = false } = options || {};
    
    // Admin operations = bypass cache se necessário
    if (AdminModeManager.shouldBypassCache()) {
      console.log(`⚡ [Admin Fast] Bypassing cache for ${key}`);
      return;
    }
    
    const startTime = performance.now();
    
    // Armazenar em L1
    this.l1Cache.set(key, data, accessCount, isAdminOperation);
    
    // Armazenar em L2 (async, não bloquear)
    this.l2Cache.set(key, data, accessCount, isAdminOperation).catch(error => {
      console.error(`❌ [L2 Cache] Set failed for ${key}:`, error);
    });
    
    trackCacheOperation('cache_set', 'L1', key, performance.now() - startTime);
  }
  
  async invalidate(key: string): Promise<void> {
    const startTime = performance.now();
    
    // Invalidar em ambos os níveis
    this.l1Cache.invalidate(key);
    await this.l2Cache.invalidate(key);
    
    this.metrics.invalidations++;
    trackCacheOperation('cache_invalidation', 'L1', key, performance.now() - startTime);
  }
  
  async invalidatePattern(pattern: string): Promise<void> {
    const startTime = performance.now();
    
    // Invalidar em ambos os níveis
    this.l1Cache.invalidatePattern(pattern);
    await this.l2Cache.invalidatePattern(pattern);
    
    this.metrics.invalidations++;
    trackCacheOperation('cache_invalidation', 'L1', pattern, performance.now() - startTime);
  }
  
  async clear(): Promise<void> {
    const startTime = performance.now();
    
    this.l1Cache.clear();
    await this.l2Cache.clear();
    
    this.metrics.invalidations++;
    trackCacheOperation('cache_invalidation', 'L1', 'clear_all', performance.now() - startTime);
  }
  
  async delete(key: string): Promise<void> {
    await this.invalidate(key);
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }
  
  destroy(): void {
    this.l1Cache.destroy();
    this.l2Cache.destroy();
  }
  
  // Método para invalidação após operações CRUD (compatibilidade com useArticles)
  async invalidateAfterCRUD(
    operation: 'create' | 'update' | 'delete' | 'publish' | 'unpublish',
    entityType: 'article' | 'category',
    entityId?: string
  ): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Ativar modo admin para operações instantâneas
      AdminModeManager.enableAdminMode();
      
      // Padrões de invalidação baseados no tipo de entidade
      const patterns: string[] = [];
      
      switch (entityType) {
        case 'article':
          patterns.push('articles_list', 'featured_articles', 'recent_articles', 'popular_articles');
          if (entityId) {
            patterns.push(`article_${entityId}`);
          }
          // Operações de publicação invalidam mais caches
          if (operation === 'publish' || operation === 'unpublish') {
            patterns.push('articles', 'featured', 'highlight');
          }
          break;
          
        case 'category':
          patterns.push('categories_list', 'articles_list');
          if (entityId) {
            patterns.push(`category_${entityId}`, `articles_category_${entityId}`);
          }
          break;
      }
      
      // Invalidar todos os padrões identificados
      for (const pattern of patterns) {
        await this.invalidatePattern(pattern);
      }
      
      const duration = performance.now() - startTime;
      console.log(`⚡ [Admin Fast] Cache invalidated for ${operation} ${entityType} (${Math.round(duration)}ms)`);
      
      // Desabilitar modo admin após operação
      setTimeout(() => AdminModeManager.disableAdminMode(), 500);
      
    } catch (error) {
      console.error(`❌ [Cache Invalidation] Error in ${operation} ${entityType}:`, error);
      throw error;
    }
  }
}

// Chaves de cache padronizadas
export const CacheKeys = {
  ARTICLES_LIST: 'articles_list',
  CATEGORIES_LIST: 'categories_list',
  CATEGORIES_FAST: 'categories_fast', // Cache específico para categorias com TTL menor
  ARTICLE_BY_ID: (id: string) => `article_${id}`,
  CATEGORY_BY_ID: (id: string) => `category_${id}`,
  ARTICLES_BY_CATEGORY: (categoryId: string) => `articles_category_${categoryId}`,
  FEATURED_ARTICLES: 'featured_articles',
  RECENT_ARTICLES: 'recent_articles',
  POPULAR_ARTICLES: 'popular_articles'
};

// Instância singleton
export const hybridCache = new HybridCacheSystem();

// Exportar AdminModeManager para uso externo
export { AdminModeManager };

// Cleanup ao sair
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    hybridCache.destroy();
  });
}