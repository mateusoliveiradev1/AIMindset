/**
 * Sistema de Invalidação Automática Inteligente - Fase 1
 * 
 * GARANTIAS:
 * - Invalidação automática após operações CRUD do admin
 * - Zero impacto nas operações administrativas
 * - Sincronização em tempo real com painel admin
 * - Fallback seguro se invalidação falhar
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

// Sistema de invalidação inteligente
class CacheInvalidationSystem {
  private listeners: Map<string, ((event: InvalidationEvent) => void)[]> = new Map();
  private invalidationHistory: InvalidationEvent[] = [];
  private readonly MAX_HISTORY = 100;
  
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
  
  // Emitir evento de invalidação
  private emit(eventType: string, event: InvalidationEvent): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`❌ [Cache Invalidation] Callback error:`, error);
        }
      });
    }
  }
  
  // Invalidação automática após operações CRUD
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
    
    console.log(`🔄 [Cache Invalidation] Starting invalidation:`, event);
    
    try {
      // Invalidar cache híbrido - mapear operações para tipos aceitos
      const mappedOperation = operation === 'publish' || operation === 'unpublish' ? 'update' : operation;
      await hybridCache.invalidateAfterCRUD(mappedOperation, entityType, entityId);
      
      // Invalidações específicas por tipo de operação
      await this.performSpecificInvalidations(event);
      
      // Adicionar ao histórico
      this.addToHistory(event);
      
      // Emitir evento para listeners
      this.emit('invalidation', event);
      this.emit(`${entityType}_${operation}`, event);
      
      console.log(`✅ [Cache Invalidation] Completed:`, event);
    } catch (error) {
      console.error(`❌ [Cache Invalidation] Error:`, error, event);
      // Não falhar - cache deve ser fail-safe
    }
  }
  
  // Invalidações específicas baseadas na operação
  private async performSpecificInvalidations(event: InvalidationEvent): Promise<void> {
    const { operation, entityType, entityId } = event;
    
    switch (entityType) {
      case 'article':
        await this.invalidateArticleRelated(operation, entityId);
        break;
        
      case 'category':
        await this.invalidateCategoryRelated(operation, entityId);
        break;
    }
  }
  
  // Invalidações relacionadas a artigos
  private async invalidateArticleRelated(operation: CRUDOperation, articleId?: string): Promise<void> {
    const invalidations: Promise<void>[] = [];
    
    // Sempre invalidar listas de artigos
    invalidations.push(hybridCache.invalidate(CacheKeys.ARTICLES_LIST));
    invalidations.push(hybridCache.invalidate(CacheKeys.ARTICLES_FEATURED));
    
    // Invalidar artigo específico se ID fornecido
    if (articleId) {
      invalidations.push(hybridCache.invalidate(CacheKeys.ARTICLE_BY_ID(articleId)));
    }
    
    // Invalidações específicas por operação
    switch (operation) {
      case 'create':
        // Novo artigo pode afetar listas e destaques
        invalidations.push(hybridCache.invalidatePattern('articles'));
        invalidations.push(hybridCache.invalidatePattern('featured'));
        break;
        
      case 'update':
        // Atualização pode afetar categorização
        invalidations.push(hybridCache.invalidatePattern('articles_category'));
        break;
        
      case 'delete':
        // Remoção afeta todas as listas
        invalidations.push(hybridCache.invalidatePattern('articles'));
        break;
        
      case 'publish':
      case 'unpublish':
        // Mudança de status afeta visibilidade
        invalidations.push(hybridCache.invalidatePattern('articles'));
        invalidations.push(hybridCache.invalidatePattern('featured'));
        break;
    }
    
    await Promise.all(invalidations);
  }
  
  // Invalidações relacionadas a categorias
  private async invalidateCategoryRelated(operation: CRUDOperation, categoryId?: string): Promise<void> {
    const invalidations: Promise<void>[] = [];
    
    // Sempre invalidar lista de categorias
    invalidations.push(hybridCache.invalidate(CacheKeys.CATEGORIES_LIST));
    
    // Invalidar categoria específica se ID fornecido
    if (categoryId) {
      invalidations.push(hybridCache.invalidate(CacheKeys.CATEGORY_BY_ID(categoryId)));
      invalidations.push(hybridCache.invalidate(CacheKeys.ARTICLES_BY_CATEGORY(categoryId)));
    }
    
    // Categorias afetam artigos também
    invalidations.push(hybridCache.invalidatePattern('articles'));
    
    await Promise.all(invalidations);
  }
  
  // Invalidação em lote para múltiplas operações
  async batchInvalidate(events: Omit<InvalidationEvent, 'timestamp'>[]): Promise<void> {
    console.log(`🔄 [Cache Invalidation] Batch invalidation:`, events.length, 'events');
    
    const promises = events.map(event => 
      this.invalidateAfterCRUD(
        event.operation,
        event.entityType,
        event.entityId,
        event.source
      )
    );
    
    await Promise.all(promises);
  }
  
  // Invalidação completa (emergência)
  async invalidateAll(reason: string = 'Manual'): Promise<void> {
    console.log(`🧹 [Cache Invalidation] Full invalidation:`, reason);
    
    try {
      await hybridCache.clear();
      
      const event: InvalidationEvent = {
        operation: 'delete',
        entityType: 'article',
        timestamp: Date.now(),
        source: 'system'
      };
      
      this.addToHistory(event);
      this.emit('full_invalidation', event);
      
      console.log(`✅ [Cache Invalidation] Full invalidation completed`);
    } catch (error) {
      console.error(`❌ [Cache Invalidation] Full invalidation error:`, error);
    }
  }
  
  // Adicionar evento ao histórico
  private addToHistory(event: InvalidationEvent): void {
    this.invalidationHistory.unshift(event);
    
    // Manter apenas os últimos eventos
    if (this.invalidationHistory.length > this.MAX_HISTORY) {
      this.invalidationHistory = this.invalidationHistory.slice(0, this.MAX_HISTORY);
    }
  }
  
  // Obter histórico de invalidações
  getHistory(limit: number = 20): InvalidationEvent[] {
    return this.invalidationHistory.slice(0, limit);
  }
  
  // Obter estatísticas de invalidação
  getStats(): {
    totalInvalidations: number;
    byOperation: Record<CRUDOperation, number>;
    byEntityType: Record<EntityType, number>;
    bySource: Record<'admin' | 'api' | 'system', number>;
    lastInvalidation?: InvalidationEvent;
  } {
    const stats = {
      totalInvalidations: this.invalidationHistory.length,
      byOperation: {} as Record<CRUDOperation, number>,
      byEntityType: {} as Record<EntityType, number>,
      bySource: {} as Record<'admin' | 'api' | 'system', number>,
      lastInvalidation: this.invalidationHistory[0]
    };
    
    this.invalidationHistory.forEach(event => {
      stats.byOperation[event.operation] = (stats.byOperation[event.operation] || 0) + 1;
      stats.byEntityType[event.entityType] = (stats.byEntityType[event.entityType] || 0) + 1;
      stats.bySource[event.source] = (stats.bySource[event.source] || 0) + 1;
    });
    
    return stats;
  }
}

// Instância singleton do sistema de invalidação
export const cacheInvalidation = new CacheInvalidationSystem();

// Utilitários para operações comuns do admin
export const AdminCacheUtils = {
  // Após criar artigo
  afterCreateArticle: (articleId: string) => 
    cacheInvalidation.invalidateAfterCRUD('create', 'article', articleId, 'admin'),
  
  // Após atualizar artigo
  afterUpdateArticle: (articleId: string) => 
    cacheInvalidation.invalidateAfterCRUD('update', 'article', articleId, 'admin'),
  
  // Após deletar artigo
  afterDeleteArticle: (articleId: string) => 
    cacheInvalidation.invalidateAfterCRUD('delete', 'article', articleId, 'admin'),
  
  // Após publicar/despublicar artigo
  afterPublishArticle: (articleId: string, published: boolean) => 
    cacheInvalidation.invalidateAfterCRUD(published ? 'publish' : 'unpublish', 'article', articleId, 'admin'),
  
  // Após criar categoria
  afterCreateCategory: (categoryId: string) => 
    cacheInvalidation.invalidateAfterCRUD('create', 'category', categoryId, 'admin'),
  
  // Após atualizar categoria
  afterUpdateCategory: (categoryId: string) => 
    cacheInvalidation.invalidateAfterCRUD('update', 'category', categoryId, 'admin'),
  
  // Após deletar categoria
  afterDeleteCategory: (categoryId: string) => 
    cacheInvalidation.invalidateAfterCRUD('delete', 'category', categoryId, 'admin'),
  
  // Invalidação completa (emergência)
  invalidateAll: (reason?: string) => 
    cacheInvalidation.invalidateAll(reason)
};

// Hook para monitorar invalidações
export const useCacheInvalidation = () => {
  const onInvalidation = (callback: (event: InvalidationEvent) => void) => 
    cacheInvalidation.onInvalidation('invalidation', callback);
  
  const onArticleInvalidation = (callback: (event: InvalidationEvent) => void) => 
    cacheInvalidation.onInvalidation('article_update', callback);
  
  const getHistory = (limit?: number) => cacheInvalidation.getHistory(limit);
  const getStats = () => cacheInvalidation.getStats();
  
  return {
    onInvalidation,
    onArticleInvalidation,
    getHistory,
    getStats,
    utils: AdminCacheUtils
  };
};