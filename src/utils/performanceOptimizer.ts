/**
 * Performance Optimizer - Otimizações avançadas para escalabilidade massiva
 * Implementa técnicas de performance para suportar milhares de artigos
 */

import { Article } from '../types';

// Configurações de performance
export const PERFORMANCE_CONFIG = {
  // Virtual scrolling
  VIRTUAL_ITEM_HEIGHT: 280,
  VIRTUAL_OVERSCAN: 5,
  VIRTUAL_BUFFER_SIZE: 10,
  
  // Lazy loading
  INTERSECTION_THRESHOLD: 0.1,
  INTERSECTION_ROOT_MARGIN: '50px',
  
  // Debounce
  SEARCH_DEBOUNCE_MS: 300,
  SCROLL_DEBOUNCE_MS: 16, // 60fps
  RESIZE_DEBOUNCE_MS: 250,
  
  // Cache
  CACHE_MAX_SIZE: 10000,
  CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutos
  
  // Pagination
  ITEMS_PER_PAGE: 50,
  PREFETCH_PAGES: 2,
  
  // Memory management
  MAX_RENDERED_ITEMS: 100,
  CLEANUP_INTERVAL_MS: 30000, // 30 segundos
} as const;

// Debounce utility otimizado
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

// Throttle utility para scroll
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Intersection Observer otimizado para lazy loading
export class LazyLoadManager {
  private observer: IntersectionObserver | null = null;
  private callbacks = new Map<Element, () => void>();

  constructor() {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const callback = this.callbacks.get(entry.target);
              if (callback) {
                callback();
                this.unobserve(entry.target);
              }
            }
          });
        },
        {
          threshold: PERFORMANCE_CONFIG.INTERSECTION_THRESHOLD,
          rootMargin: PERFORMANCE_CONFIG.INTERSECTION_ROOT_MARGIN,
        }
      );
    }
  }

  observe(element: Element, callback: () => void) {
    if (this.observer) {
      this.callbacks.set(element, callback);
      this.observer.observe(element);
    } else {
      // Fallback para browsers sem suporte
      callback();
    }
  }

  unobserve(element: Element) {
    if (this.observer) {
      this.observer.unobserve(element);
      this.callbacks.delete(element);
    }
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.callbacks.clear();
    }
  }
}

// Memory manager para limpeza automática
export class MemoryManager {
  private static instance: MemoryManager;
  private cleanupTasks: (() => void)[] = [];
  private intervalId: NodeJS.Timeout | null = null;

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  private constructor() {
    this.startCleanupInterval();
  }

  addCleanupTask(task: () => void) {
    this.cleanupTasks.push(task);
  }

  removeCleanupTask(task: () => void) {
    const index = this.cleanupTasks.indexOf(task);
    if (index > -1) {
      this.cleanupTasks.splice(index, 1);
    }
  }

  private startCleanupInterval() {
    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, PERFORMANCE_CONFIG.CLEANUP_INTERVAL_MS);
  }

  private runCleanup() {
    // Executar tarefas de limpeza
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.warn('Erro na tarefa de limpeza:', error);
      }
    });

    // Forçar garbage collection se disponível
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc();
    }
  }

  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.cleanupTasks = [];
  }
}

// Cache LRU otimizado para artigos
export class ArticleCache {
  private cache = new Map<string, { data: Article; timestamp: number; accessCount: number }>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize = PERFORMANCE_CONFIG.CACHE_MAX_SIZE, ttl = PERFORMANCE_CONFIG.CACHE_TTL_MS) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  set(key: string, article: Article): void {
    const now = Date.now();
    
    // Remover item expirado se existir
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // Verificar se precisa remover itens antigos
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    
    this.cache.set(key, {
      data: article,
      timestamp: now,
      accessCount: 1
    });
  }

  get(key: string): Article | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    const now = Date.now();
    
    // Verificar se expirou
    if (now - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Atualizar estatísticas de acesso
    item.accessCount++;
    item.timestamp = now;
    
    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    let lowestAccess = Infinity;
    
    // Encontrar item menos usado e mais antigo
    for (const [key, item] of this.cache.entries()) {
      if (item.accessCount < lowestAccess || 
          (item.accessCount === lowestAccess && item.timestamp < oldestTime)) {
        oldestKey = key;
        oldestTime = item.timestamp;
        lowestAccess = item.accessCount;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate(),
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  private calculateHitRate(): number {
    let totalAccess = 0;
    for (const item of this.cache.values()) {
      totalAccess += item.accessCount;
    }
    return totalAccess > 0 ? (this.cache.size / totalAccess) * 100 : 0;
  }

  private estimateMemoryUsage(): number {
    // Estimativa aproximada em bytes
    let size = 0;
    for (const [key, item] of this.cache.entries()) {
      size += key.length * 2; // string UTF-16
      size += JSON.stringify(item.data).length * 2;
      size += 24; // overhead do objeto
    }
    return size;
  }
}

// Performance monitor para métricas em tempo real
export class PerformanceMonitor {
  private metrics = {
    renderTime: [] as number[],
    scrollTime: [] as number[],
    searchTime: [] as number[],
    memoryUsage: [] as number[],
    cacheHits: 0,
    cacheMisses: 0
  };

  private maxSamples = 100;

  recordRenderTime(time: number) {
    this.addMetric('renderTime', time);
  }

  recordScrollTime(time: number) {
    this.addMetric('scrollTime', time);
  }

  recordSearchTime(time: number) {
    this.addMetric('searchTime', time);
  }

  recordMemoryUsage(usage: number) {
    this.addMetric('memoryUsage', usage);
  }

  recordCacheHit() {
    this.metrics.cacheHits++;
  }

  recordCacheMiss() {
    this.metrics.cacheMisses++;
  }

  private addMetric(type: keyof typeof this.metrics, value: number) {
    const array = this.metrics[type] as number[];
    array.push(value);
    
    if (array.length > this.maxSamples) {
      array.shift();
    }
  }

  getAverageRenderTime(): number {
    return this.calculateAverage(this.metrics.renderTime);
  }

  getAverageScrollTime(): number {
    return this.calculateAverage(this.metrics.scrollTime);
  }

  getAverageSearchTime(): number {
    return this.calculateAverage(this.metrics.searchTime);
  }

  getAverageMemoryUsage(): number {
    return this.calculateAverage(this.metrics.memoryUsage);
  }

  getCacheHitRate(): number {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    return total > 0 ? (this.metrics.cacheHits / total) * 100 : 0;
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  getPerformanceGrade(): { grade: string; score: number; recommendations: string[] } {
    const avgRender = this.getAverageRenderTime();
    const avgScroll = this.getAverageScrollTime();
    const avgSearch = this.getAverageSearchTime();
    const cacheHitRate = this.getCacheHitRate();
    
    let score = 100;
    const recommendations: string[] = [];
    
    // Penalidades baseadas em métricas
    if (avgRender > 100) {
      score -= 20;
      recommendations.push('Otimizar tempo de renderização com React.memo');
    }
    
    if (avgScroll > 16) {
      score -= 15;
      recommendations.push('Implementar throttling no scroll');
    }
    
    if (avgSearch > 200) {
      score -= 15;
      recommendations.push('Otimizar algoritmo de busca');
    }
    
    if (cacheHitRate < 80) {
      score -= 10;
      recommendations.push('Melhorar estratégia de cache');
    }
    
    let grade = 'A+';
    if (score < 90) grade = 'A';
    if (score < 80) grade = 'B';
    if (score < 70) grade = 'C';
    if (score < 60) grade = 'D';
    
    return { grade, score, recommendations };
  }

  reset() {
    this.metrics = {
      renderTime: [],
      scrollTime: [],
      searchTime: [],
      memoryUsage: [],
      cacheHits: 0,
      cacheMisses: 0
    };
  }
}

// Singleton instances
export const lazyLoadManager = new LazyLoadManager();
export const memoryManager = MemoryManager.getInstance();
export const articleCache = new ArticleCache();
export const performanceMonitor = new PerformanceMonitor();

// Cleanup no unload da página
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    lazyLoadManager.disconnect();
    memoryManager.destroy();
  });
}