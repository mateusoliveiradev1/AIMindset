/**
 * Utilitário para limpeza forçada do cache após mudanças no banco de dados
 * Especialmente útil após operações SQL diretas que não passam pela aplicação
 */

import { hybridCache } from './hybridCache';
import { cacheInvalidation } from './cacheInvalidation';

export class ForceCacheCleanup {
  /**
   * Limpar completamente o cache de artigos e forçar reload
   */
  static async clearArticlesCache(): Promise<void> {
    console.log('🧹 [Force Cache Cleanup] Iniciando limpeza completa do cache de artigos...');
    
    try {
      // 1. Limpar cache híbrido completamente
      await hybridCache.clear();
      console.log('✅ [Force Cache Cleanup] Cache híbrido limpo');
      
      // 2. Limpar cache do Service Worker (se disponível)
      if ('serviceWorker' in navigator && 'caches' in window) {
        const cacheNames = await caches.keys();
        const articleCaches = cacheNames.filter(name => 
          name.includes('article') || 
          name.includes('api') || 
          name.includes('dynamic')
        );
        
        for (const cacheName of articleCaches) {
          await caches.delete(cacheName);
          console.log(`✅ [Force Cache Cleanup] Service Worker cache limpo: ${cacheName}`);
        }
      }
      
      // 3. Limpar localStorage relacionado a artigos
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('article') || key.includes('cache') || key.includes('metrics'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`✅ [Force Cache Cleanup] LocalStorage limpo: ${key}`);
      });
      
      // 4. Invalidar histórico de invalidações
      cacheInvalidation.clearHistory();
      
      console.log('🎉 [Force Cache Cleanup] Limpeza completa finalizada!');
      
    } catch (error) {
      console.error('❌ [Force Cache Cleanup] Erro durante limpeza:', error);
      throw error;
    }
  }
  
  /**
   * Invalidar especificamente caches relacionados a métricas de feedback
   */
  static async invalidateFeedbackMetrics(): Promise<void> {
    console.log('🔄 [Force Cache Cleanup] Invalidando métricas de feedback...');
    
    try {
      // Invalidar padrões relacionados a métricas
      await hybridCache.invalidatePattern('articles');
      await hybridCache.invalidatePattern('metrics');
      await hybridCache.invalidatePattern('feedback');
      await hybridCache.invalidatePattern('rating');
      await hybridCache.invalidatePattern('approval');
      
      // Forçar invalidação via sistema de invalidação
      await cacheInvalidation.invalidateAfterCRUD('update', 'article', undefined, 'system');
      
      // NOVO: Disparar evento global para forçar re-render dos componentes
      window.dispatchEvent(new CustomEvent('realtime-cache-invalidate', {
        detail: { 
          type: 'feedback-metrics',
          timestamp: Date.now(),
          source: 'feedback-submission'
        }
      }));
      
      // NOVO: Disparar evento específico para métricas de feedback
      window.dispatchEvent(new CustomEvent('feedback-metrics-updated', {
        detail: { 
          timestamp: Date.now(),
          action: 'invalidate-cache'
        }
      }));
      
      console.log('✅ [Force Cache Cleanup] Métricas de feedback invalidadas e eventos disparados');
      
    } catch (error) {
      console.error('❌ [Force Cache Cleanup] Erro ao invalidar métricas:', error);
      throw error;
    }
  }
  
  /**
   * Verificar se o cache contém dados desatualizados
   */
  static async checkCacheIntegrity(): Promise<{
    hasStaleData: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    console.log('🔍 [Force Cache Cleanup] Verificando integridade do cache...');
    
    const result = {
      hasStaleData: false,
      issues: [] as string[],
      recommendations: [] as string[]
    };
    
    try {
      // Verificar integridade via sistema de invalidação
      const integrityCheck = await cacheInvalidation.performIntegrityCheck();
      
      if (!integrityCheck.isValid) {
        result.hasStaleData = true;
        result.issues.push(...integrityCheck.errors);
        result.recommendations.push('Execute clearArticlesCache() para limpar dados corrompidos');
      }
      
      // Verificar se há dados muito antigos no cache
      const cacheKeys = ['articles_list', 'categories_list'];
      for (const key of cacheKeys) {
        const cached = await hybridCache.get(key);
        if (cached.hit && cached.data) {
          // Nota: hybridCache.get() não retorna timestamp diretamente
          // Consideramos que dados em cache podem estar desatualizados se existem
          result.hasStaleData = true;
          result.issues.push(`Cache ${key} pode estar desatualizado`);
          result.recommendations.push(`Invalidar cache ${key}`);
        }
      }
      
      if (!result.hasStaleData) {
        console.log('✅ [Force Cache Cleanup] Cache está íntegro');
      } else {
        console.warn('⚠️ [Force Cache Cleanup] Problemas detectados no cache:', result.issues);
      }
      
    } catch (error) {
      result.hasStaleData = true;
      result.issues.push(`Erro ao verificar integridade: ${error}`);
      result.recommendations.push('Execute clearArticlesCache() para resolver problemas');
    }
    
    return result;
  }
  
  /**
   * Executar limpeza completa e recarregar página
   */
  static async clearCacheAndReload(): Promise<void> {
    try {
      await this.clearArticlesCache();
      
      // Aguardar um pouco para garantir que a limpeza foi processada
      setTimeout(() => {
        console.log('🔄 [Force Cache Cleanup] Recarregando página...');
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('❌ [Force Cache Cleanup] Erro durante limpeza e reload:', error);
      // Mesmo com erro, tentar recarregar
      window.location.reload();
    }
  }
}

// Função de conveniência para uso rápido
export const clearArticlesCache = () => ForceCacheCleanup.clearArticlesCache();
export const invalidateFeedbackMetrics = () => ForceCacheCleanup.invalidateFeedbackMetrics();
export const checkCacheIntegrity = () => ForceCacheCleanup.checkCacheIntegrity();
export const clearCacheAndReload = () => ForceCacheCleanup.clearCacheAndReload();

// Expor no window para uso no console do navegador
if (typeof window !== 'undefined') {
  (window as any).forceCacheCleanup = {
    clearArticlesCache,
    invalidateFeedbackMetrics,
    checkCacheIntegrity,
    clearCacheAndReload,
    ForceCacheCleanup
  };
  
  console.log('🔧 [Force Cache Cleanup] Utilitários disponíveis no console:');
  console.log('- window.forceCacheCleanup.clearArticlesCache()');
  console.log('- window.forceCacheCleanup.invalidateFeedbackMetrics()');
  console.log('- window.forceCacheCleanup.checkCacheIntegrity()');
  console.log('- window.forceCacheCleanup.clearCacheAndReload()');
}