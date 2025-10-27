/**
 * Sistema de Invalidação Automática Inteligente - Fase 1 OTIMIZADO
 * 
 * GARANTIAS:
 * - Invalidação automática após operações CRUD do admin
 * - Zero impacto nas operações administrativas
 * - Sincronização em tempo real com painel admin
 * - Fallback seguro se invalidação falhar
 * - Validação de integridade dos dados em cache
 * - Detecção automática de corrupção
 */

import { hybridCache, CacheKeys } from './hybridCache';

// Tipos para operações CRUD
export type CRUDOperation = 'create' | 'update' | 'delete' | 'publish' | 'unpublish';
export type EntityType = 'article' | 'category';

// Interface para eventos de invalidação
export interface InvalidationEvent {
  operation: CRUDOperation;
  entityType: EntityType;
  entityId?: string;
  timestamp: number;
  source: 'admin' | 'api' | 'system';
}

// Interface para validação de integridade
export interface IntegrityCheckResult {
  isValid: boolean;
  errors: string[];
  corruptedKeys: string[];
  fixedKeys: string[];
}

// Validador de integridade de dados
class DataIntegrityValidator {
  // Validar estrutura de artigo
  static validateArticle(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data) {
      errors.push('Article data is null or undefined');
      return { isValid: false, errors };
    }
    
    // Validações essenciais
    if (!data.id) errors.push('Missing article ID');
    if (!data.title || typeof data.title !== 'string') errors.push('Invalid or missing title');
    if (!data.content || typeof data.content !== 'string') errors.push('Invalid or missing content');
    if (data.published !== undefined && typeof data.published !== 'boolean') {
      errors.push('Invalid published status');
    }
    
    // Validar timestamps
    if (data.created_at && isNaN(new Date(data.created_at).getTime())) {
      errors.push('Invalid created_at timestamp');
    }
    if (data.updated_at && isNaN(new Date(data.updated_at).getTime())) {
      errors.push('Invalid updated_at timestamp');
    }
    
    // Validar categoria se presente
    if (data.category_id && typeof data.category_id !== 'string') {
      errors.push('Invalid category_id');
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  // Validar estrutura de categoria
  static validateCategory(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data) {
      errors.push('Category data is null or undefined');
      return { isValid: false, errors };
    }
    
    // Validações essenciais
    if (!data.id) errors.push('Missing category ID');
    if (!data.name || typeof data.name !== 'string') errors.push('Invalid or missing name');
    
    // Validar cor se presente
    if (data.color && typeof data.color !== 'string') {
      errors.push('Invalid color format');
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  // Validar lista de artigos
  static validateArticlesList(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!Array.isArray(data)) {
      errors.push('Articles list is not an array');
      return { isValid: false, errors };
    }
    
    // Validar cada artigo na lista
    data.forEach((article, index) => {
      const validation = this.validateArticle(article);
      if (!validation.isValid) {
        errors.push(`Article at index ${index}: ${validation.errors.join(', ')}`);
      }
    });
    
    return { isValid: errors.length === 0, errors };
  }
  
  // Validar lista de categorias
  static validateCategoriesList(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!Array.isArray(data)) {
      errors.push('Categories list is not an array');
      return { isValid: false, errors };
    }
    
    // Validar cada categoria na lista
    data.forEach((category, index) => {
      const validation = this.validateCategory(category);
      if (!validation.isValid) {
        errors.push(`Category at index ${index}: ${validation.errors.join(', ')}`);
      }
    });
    
    return { isValid: errors.length === 0, errors };
  }
}

// Sistema de invalidação inteligente com validação de integridade
class CacheInvalidationSystem {
  private listeners: Map<string, ((event: InvalidationEvent) => void)[]> = new Map();
  private invalidationHistory: InvalidationEvent[] = [];
  private readonly MAX_HISTORY = 100;
  private integrityCheckInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.startIntegrityMonitoring();
  }
  
  // Iniciar monitoramento de integridade automático
  private startIntegrityMonitoring(): void {
    // Verificar integridade a cada 15 minutos
    this.integrityCheckInterval = setInterval(() => {
      this.performIntegrityCheck();
    }, 15 * 60 * 1000);
  }
  
  // Verificação completa de integridade do cache
  async performIntegrityCheck(): Promise<IntegrityCheckResult> {
    console.log('🔍 [Cache Integrity] Starting integrity check...');
    
    const result: IntegrityCheckResult = {
      isValid: true,
      errors: [],
      corruptedKeys: [],
      fixedKeys: []
    };
    
    try {
      // Verificar artigos em cache
      const articlesResult = await hybridCache.get<any[]>(CacheKeys.ARTICLES_LIST);
      if (articlesResult.hit && articlesResult.data) {
        const validation = DataIntegrityValidator.validateArticlesList(articlesResult.data);
        if (!validation.isValid) {
          result.isValid = false;
          result.errors.push(...validation.errors);
          result.corruptedKeys.push(CacheKeys.ARTICLES_LIST);
          
          // Invalidar dados corrompidos
          await hybridCache.invalidate(CacheKeys.ARTICLES_LIST);
          result.fixedKeys.push(CacheKeys.ARTICLES_LIST);
          console.warn('⚠️ [Cache Integrity] Corrupted articles list invalidated');
        }
      }
      
      // Verificar categorias em cache
      const categoriesResult = await hybridCache.get<any[]>(CacheKeys.CATEGORIES_LIST);
      if (categoriesResult.hit && categoriesResult.data) {
        const validation = DataIntegrityValidator.validateCategoriesList(categoriesResult.data);
        if (!validation.isValid) {
          result.isValid = false;
          result.errors.push(...validation.errors);
          result.corruptedKeys.push(CacheKeys.CATEGORIES_LIST);
          
          // Invalidar dados corrompidos
          await hybridCache.invalidate(CacheKeys.CATEGORIES_LIST);
          result.fixedKeys.push(CacheKeys.CATEGORIES_LIST);
          console.warn('⚠️ [Cache Integrity] Corrupted categories list invalidated');
        }
      }
      
      if (result.isValid) {
        console.log('✅ [Cache Integrity] All cached data is valid');
      } else {
        console.warn(`⚠️ [Cache Integrity] Found ${result.corruptedKeys.length} corrupted entries, ${result.fixedKeys.length} fixed`);
      }
      
    } catch (error) {
      result.isValid = false;
      result.errors.push(`Integrity check failed: ${error}`);
      console.error('❌ [Cache Integrity] Check failed:', error);
    }
    
    return result;
  }
  
  // Validar dados antes de armazenar no cache
  async validateBeforeCache(key: string, data: any): Promise<boolean> {
    try {
      let validation: { isValid: boolean; errors: string[] };
      
      if (key === CacheKeys.ARTICLES_LIST) {
        validation = DataIntegrityValidator.validateArticlesList(data);
      } else if (key === CacheKeys.CATEGORIES_LIST) {
        validation = DataIntegrityValidator.validateCategoriesList(data);
      } else if (key.startsWith('article_')) {
        validation = DataIntegrityValidator.validateArticle(data);
      } else if (key.startsWith('category_')) {
        validation = DataIntegrityValidator.validateCategory(data);
      } else {
        // Para outros tipos de dados, assumir válido
        return true;
      }
      
      if (!validation.isValid) {
        console.error(`❌ [Cache Validation] Invalid data for key ${key}:`, validation.errors);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`❌ [Cache Validation] Validation error for key ${key}:`, error);
      return false;
    }
  }
  
  // Registrar listener para eventos de invalidação
  onInvalidation(eventType: string, callback: (event: InvalidationEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    
    this.listeners.get(eventType)!.push(callback);
    
    // Retornar função para remover listener
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }
  
  // Disparar evento de invalidação
  private emitInvalidationEvent(event: InvalidationEvent): void {
    // Adicionar ao histórico
    this.invalidationHistory.push(event);
    
    // Manter apenas os últimos eventos
    if (this.invalidationHistory.length > this.MAX_HISTORY) {
      this.invalidationHistory = this.invalidationHistory.slice(-this.MAX_HISTORY);
    }
    
    // Notificar listeners
    const eventKey = `${event.entityType}_${event.operation}`;
    const callbacks = this.listeners.get(eventKey) || [];
    const allCallbacks = this.listeners.get('*') || [];
    
    [...callbacks, ...allCallbacks].forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('❌ [Cache Invalidation] Listener error:', error);
      }
    });
  }
  
  // Invalidação inteligente após operações CRUD
  async invalidateAfterCRUD(
    operation: CRUDOperation,
    entityType: EntityType,
    entityId?: string,
    source: 'admin' | 'api' | 'system' = 'admin'
  ): Promise<void> {
    const event: InvalidationEvent = {
      operation,
      entityType,
      entityId,
      timestamp: Date.now(),
      source
    };
    
    console.log(`🔄 [Cache Invalidation] ${operation} ${entityType} ${entityId || ''} (source: ${source})`);
    
    try {
      // Estratégia de invalidação baseada no tipo de operação
      await this.executeInvalidationStrategy(event);
      
      // Emitir evento para listeners
      this.emitInvalidationEvent(event);
      
      console.log(`✅ [Cache Invalidation] Completed for ${operation} ${entityType}`);
    } catch (error) {
      console.error(`❌ [Cache Invalidation] Failed for ${operation} ${entityType}:`, error);
      
      // Fallback: invalidar tudo relacionado
      try {
        await this.fallbackInvalidation(entityType);
        console.log(`🔄 [Cache Invalidation] Fallback completed for ${entityType}`);
      } catch (fallbackError) {
        console.error(`❌ [Cache Invalidation] Fallback failed:`, fallbackError);
      }
    }
  }
  
  // Executar estratégia de invalidação específica
  private async executeInvalidationStrategy(event: InvalidationEvent): Promise<void> {
    const { operation, entityType, entityId } = event;
    
    switch (entityType) {
      case 'article':
        await this.invalidateArticleCache(operation, entityId);
        break;
        
      case 'category':
        await this.invalidateCategoryCache(operation, entityId);
        break;
        
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }
  
  // Invalidação específica para artigos
  private async invalidateArticleCache(operation: CRUDOperation, articleId?: string): Promise<void> {
    const promises: Promise<void>[] = [];
    
    // Sempre invalidar lista de artigos
    promises.push(hybridCache.invalidate(CacheKeys.ARTICLES_LIST));
    
    // Invalidar artigos em destaque
    promises.push(hybridCache.invalidatePattern('featured'));
    promises.push(hybridCache.invalidatePattern('highlight'));
    
    // Se temos ID específico, invalidar cache do artigo
    if (articleId) {
      promises.push(hybridCache.invalidate(CacheKeys.ARTICLE_BY_ID(articleId)));
    }
    
    // Para operações de publicação, invalidar caches relacionados
    if (operation === 'publish' || operation === 'unpublish') {
      promises.push(hybridCache.invalidatePattern('published'));
      promises.push(hybridCache.invalidatePattern('articles_category'));
    }
    
    await Promise.all(promises);
  }
  
  // Invalidação específica para categorias
  private async invalidateCategoryCache(operation: CRUDOperation, categoryId?: string): Promise<void> {
    const promises: Promise<void>[] = [];
    
    // Sempre invalidar lista de categorias
    promises.push(hybridCache.invalidate(CacheKeys.CATEGORIES_LIST));
    
    // Invalidar artigos (pois podem ter categorias)
    promises.push(hybridCache.invalidate(CacheKeys.ARTICLES_LIST));
    
    // Se temos ID específico, invalidar cache da categoria
    if (categoryId) {
      promises.push(hybridCache.invalidate(CacheKeys.CATEGORY_BY_ID(categoryId)));
      promises.push(hybridCache.invalidate(CacheKeys.ARTICLES_BY_CATEGORY(categoryId)));
    }
    
    await Promise.all(promises);
  }
  
  // Invalidação de fallback (mais agressiva)
  private async fallbackInvalidation(entityType: EntityType): Promise<void> {
    console.log(`🚨 [Cache Invalidation] Executing fallback for ${entityType}`);
    
    switch (entityType) {
      case 'article':
        await hybridCache.invalidatePattern('article');
        await hybridCache.invalidatePattern('featured');
        break;
        
      case 'category':
        await hybridCache.invalidatePattern('category');
        await hybridCache.invalidatePattern('article'); // Artigos podem ter categorias
        break;
        
      default:
        // Último recurso: limpar tudo
        await hybridCache.clear();
    }
  }
  
  // Invalidar artigos específicos
  async invalidateArticles(articleIds?: string[]): Promise<void> {
    if (articleIds && articleIds.length > 0) {
      const promises = articleIds.map(id => 
        this.invalidateAfterCRUD('update', 'article', id, 'system')
      );
      await Promise.all(promises);
    } else {
      await hybridCache.invalidatePattern('article');
    }
  }
  
  // Invalidar categorias específicas
  async invalidateCategories(categoryIds?: string[]): Promise<void> {
    if (categoryIds && categoryIds.length > 0) {
      const promises = categoryIds.map(id => 
        this.invalidateAfterCRUD('update', 'category', id, 'system')
      );
      await Promise.all(promises);
    } else {
      await hybridCache.invalidatePattern('category');
    }
  }
  
  // Limpar todo o cache
  async clearAllCache(): Promise<void> {
    await hybridCache.clear();
    console.log('🧹 [Cache] All cache cleared');
  }
  
  // Obter histórico de invalidações
  getInvalidationHistory(limit?: number): InvalidationEvent[] {
    const history = [...this.invalidationHistory];
    return limit ? history.slice(-limit) : history;
  }
  
  // Limpar histórico
  clearHistory(): void {
    this.invalidationHistory = [];
    console.log('🧹 [Cache Invalidation] History cleared');
  }
  
  // Destruir sistema (limpar timers)
  destroy(): void {
    if (this.integrityCheckInterval) {
      clearInterval(this.integrityCheckInterval);
      this.integrityCheckInterval = null;
    }
    this.listeners.clear();
    console.log('🔄 [Cache Invalidation] System destroyed');
  }
}

// Instância singleton
export const cacheInvalidation = new CacheInvalidationSystem();

// Utilitários para uso fácil
export const invalidateAfterCRUD = (
  operation: CRUDOperation,
  entityType: EntityType,
  entityId?: string,
  source?: 'admin' | 'api' | 'system'
) => cacheInvalidation.invalidateAfterCRUD(operation, entityType, entityId, source);

export const validateCacheData = (key: string, data: any) => 
  cacheInvalidation.validateBeforeCache(key, data);

export const checkCacheIntegrity = () => 
  cacheInvalidation.performIntegrityCheck();

// Hook para status de invalidação de cache
export const useCacheInvalidationStatus = () => {
  const [isInvalidating, setIsInvalidating] = React.useState(false);
  const [lastInvalidation, setLastInvalidation] = React.useState<InvalidationEvent | null>(null);
  const [integrityErrors, setIntegrityErrors] = React.useState<Map<string, string[]>>(new Map());

  React.useEffect(() => {
    // Subscrever a eventos de invalidação
    const checkStatus = () => {
      const history = cacheInvalidation.getInvalidationHistory();
      if (history.length > 0) {
        setLastInvalidation(history[0]);
      }
    };

    // Verificação inicial
    checkStatus();
    
    // Verificação de integridade inicial
    cacheInvalidation.performIntegrityCheck().then(result => {
      const errors = new Map<string, string[]>();
      if (!result.isValid && result.errors.length > 0) {
        errors.set('cache', result.errors);
      }
      setIntegrityErrors(errors);
    });

    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const clearCache = async () => {
    setIsInvalidating(true);
    try {
      await hybridCache.clear();
    } finally {
      setIsInvalidating(false);
    }
  };

  return {
    isInvalidating,
    lastInvalidation,
    integrityErrors,
    clearCache,
    getHistory: () => cacheInvalidation.getInvalidationHistory()
  };
};

// Classe AdminCacheUtils para compatibilidade com useArticles.ts
export class AdminCacheUtils {
  // Invalidar cache após operações CRUD do admin
  static async invalidateAfterCRUD(
    operation: CRUDOperation,
    entityType: EntityType,
    entityId?: string
  ): Promise<void> {
    return cacheInvalidation.invalidateAfterCRUD(operation, entityType, entityId, 'admin');
  }
  
  // Invalidar artigo específico
  static async invalidateArticle(articleId: string): Promise<void> {
    return cacheInvalidation.invalidateAfterCRUD('update', 'article', articleId, 'admin');
  }
  
  // Invalidar categoria específica
  static async invalidateCategory(categoryId: string): Promise<void> {
    return cacheInvalidation.invalidateAfterCRUD('update', 'category', categoryId, 'admin');
  }
  
  // Invalidar todos os artigos
  static async invalidateAllArticles(): Promise<void> {
    return hybridCache.invalidatePattern('article');
  }
  
  // Invalidar todas as categorias
  static async invalidateAllCategories(): Promise<void> {
    return hybridCache.invalidatePattern('category');
  }
  
  // Limpar todo o cache
  static async clearAllCache(): Promise<void> {
    return hybridCache.clear();
  }
  
  // Verificar integridade do cache
  static async checkIntegrity(): Promise<IntegrityCheckResult> {
    return cacheInvalidation.performIntegrityCheck();
  }
  
  // Obter histórico de invalidações
  static getInvalidationHistory(): InvalidationEvent[] {
    return cacheInvalidation.getInvalidationHistory();
  }
}

// Hook React para monitorar invalidações
export function useInvalidationMonitor() {
  const [lastInvalidation, setLastInvalidation] = React.useState<InvalidationEvent | null>(null);
  const [integrityStatus, setIntegrityStatus] = React.useState<IntegrityCheckResult | null>(null);
  
  React.useEffect(() => {
    const unsubscribe = cacheInvalidation.onInvalidation('*', (event) => {
      setLastInvalidation(event);
    });
    
    // Verificar integridade inicial
    cacheInvalidation.performIntegrityCheck().then(setIntegrityStatus);
    
    return unsubscribe;
  }, []);
  
  return {
    lastInvalidation,
    integrityStatus,
    history: cacheInvalidation.getInvalidationHistory(),
    checkIntegrity: () => cacheInvalidation.performIntegrityCheck().then(setIntegrityStatus),
    clearHistory: () => cacheInvalidation.clearHistory()
  };
}

// React import (will be available in React components)
declare const React: any;