import React, { useState, useEffect } from 'react';
import { hybridCache } from './hybridCache';

// Performance metrics interface
export interface PerformanceMetrics {
  cacheHitRate: number;
  averageResponseTime: number;
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  errorRate: number;
  lastUpdated: Date;
}

// Performance event types
export type PerformanceEvent = 
  | 'cache_hit'
  | 'cache_miss'
  | 'cache_set'
  | 'api_request'
  | 'api_error'
  | 'cache_invalidation';

// Performance data point
interface PerformanceDataPoint {
  timestamp: Date;
  event: PerformanceEvent;
  duration?: number;
  cacheLayer?: 'L1' | 'L2';
  key?: string;
  error?: string;
}

// Logs coloridos e organizados
class SmartLogger {
  private static readonly COLORS = {
    success: '\x1b[32m', // Verde
    warning: '\x1b[33m', // Amarelo
    error: '\x1b[31m',   // Vermelho
    info: '\x1b[36m',    // Ciano
    reset: '\x1b[0m'     // Reset
  };

  static logCacheHit(layer: 'L1' | 'L2', key: string, duration?: number): void {
    const emoji = layer === 'L1' ? '🟢' : '🟡';
    const durationText = duration ? ` (${duration}ms)` : '';
    console.log(`${this.COLORS.success}${emoji} [${layer} Cache] HIT: ${key}${durationText}${this.COLORS.reset}`);
  }

  static logCacheMiss(layer: 'L1' | 'L2', key: string): void {
    const emoji = layer === 'L1' ? '🔴' : '🟠';
    console.log(`${this.COLORS.warning}${emoji} [${layer} Cache] MISS: ${key}${this.COLORS.reset}`);
  }

  static logCacheSet(layer: 'L1' | 'L2', key: string, ttl?: number): void {
    const emoji = layer === 'L1' ? '🟢' : '🟡';
    const ttlText = ttl ? ` (TTL: ${Math.round(ttl/1000/60)}min)` : '';
    console.log(`${this.COLORS.success}${emoji} [${layer} Cache] SET: ${key}${ttlText}${this.COLORS.reset}`);
  }

  static logCacheInvalidation(pattern: string, count: number): void {
    console.log(`${this.COLORS.info}🗑️ [Cache] INVALIDATED: ${pattern} (${count} entries)${this.COLORS.reset}`);
  }

  static logPerformanceMetrics(metrics: PerformanceMetrics): void {
    console.group(`${this.COLORS.info}📊 [Performance Metrics]${this.COLORS.reset}`);
    console.log(`Hit Rate: ${this.COLORS.success}${metrics.cacheHitRate.toFixed(1)}%${this.COLORS.reset}`);
    console.log(`Avg Response: ${this.COLORS.info}${metrics.averageResponseTime.toFixed(1)}ms${this.COLORS.reset}`);
    console.log(`Total Requests: ${metrics.totalRequests}`);
    console.log(`Cache Hits: ${this.COLORS.success}${metrics.cacheHits}${this.COLORS.reset}`);
    console.log(`Cache Misses: ${this.COLORS.warning}${metrics.cacheMisses}${this.COLORS.reset}`);
    console.log(`Error Rate: ${metrics.errorRate.toFixed(1)}%`);
    console.groupEnd();
  }

  static logError(context: string, error: any): void {
    console.error(`${this.COLORS.error}❌ [${context}] ERROR:${this.COLORS.reset}`, error);
  }
}

class PerformanceMonitor {
  private dataPoints: PerformanceDataPoint[] = [];
  private maxDataPoints = 1000; // Keep last 1000 events
  private listeners: ((metrics: PerformanceMetrics) => void)[] = [];
  private metricsCache: PerformanceMetrics | null = null;
  private lastMetricsUpdate = 0;
  private readonly METRICS_CACHE_TTL = 5000; // 5 segundos

  // Record a performance event with smart logging
  recordEvent(event: PerformanceEvent, options?: {
    duration?: number;
    cacheLayer?: 'L1' | 'L2';
    key?: string;
    error?: string;
  }) {
    const dataPoint: PerformanceDataPoint = {
      timestamp: new Date(),
      event,
      ...options
    };

    this.dataPoints.push(dataPoint);

    // Manter apenas os últimos eventos para evitar vazamento de memória
    if (this.dataPoints.length > this.maxDataPoints) {
      this.dataPoints = this.dataPoints.slice(-this.maxDataPoints);
    }

    // Invalidar cache de métricas
    this.metricsCache = null;

    // Log inteligente baseado no evento
    this.smartLog(event, options);

    // Notificar listeners apenas se necessário
    if (this.listeners.length > 0) {
      const metrics = this.getMetrics();
      this.listeners.forEach(listener => listener(metrics));
    }
  }

  private smartLog(event: PerformanceEvent, options?: {
    duration?: number;
    cacheLayer?: 'L1' | 'L2';
    key?: string;
    error?: string;
  }): void {
    // Reduzir poluição visual - apenas logs importantes
    switch (event) {
      case 'cache_hit':
        if (options?.cacheLayer && options?.key) {
          SmartLogger.logCacheHit(options.cacheLayer, options.key, options.duration);
        }
        break;
      
      case 'cache_miss':
        // Log apenas misses críticos para reduzir ruído
        if (options?.key && !options.key.includes('temp_')) {
          SmartLogger.logCacheMiss(options?.cacheLayer || 'L1', options.key);
        }
        break;
      
      case 'api_error':
        if (options?.error) {
          SmartLogger.logError('API', options.error);
        }
        break;
      
      case 'cache_invalidation':
        if (options?.key) {
          SmartLogger.logCacheInvalidation(options.key, 1);
        }
        break;
    }
  }

  // Get performance metrics with caching
  getMetrics(): PerformanceMetrics {
    const now = Date.now();
    
    // Usar cache de métricas se ainda válido
    if (this.metricsCache && (now - this.lastMetricsUpdate) < this.METRICS_CACHE_TTL) {
      return this.metricsCache;
    }

    const now24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentEvents = this.dataPoints.filter(dp => dp.timestamp > now24h);

    const cacheHits = recentEvents.filter(dp => dp.event === 'cache_hit').length;
    const cacheMisses = recentEvents.filter(dp => dp.event === 'cache_miss').length;
    const apiRequests = recentEvents.filter(dp => dp.event === 'api_request').length;
    const apiErrors = recentEvents.filter(dp => dp.event === 'api_error').length;

    const totalCacheRequests = cacheHits + cacheMisses;
    const cacheHitRate = totalCacheRequests > 0 ? (cacheHits / totalCacheRequests) * 100 : 0;
    const errorRate = apiRequests > 0 ? (apiErrors / apiRequests) * 100 : 0;

    // Calcular tempo médio de resposta
    const requestsWithDuration = recentEvents.filter(dp => dp.duration !== undefined);
    const averageResponseTime = requestsWithDuration.length > 0
      ? requestsWithDuration.reduce((sum, dp) => sum + (dp.duration || 0), 0) / requestsWithDuration.length
      : 0;

    this.metricsCache = {
      cacheHitRate,
      averageResponseTime,
      totalRequests: apiRequests,
      cacheHits,
      cacheMisses,
      errorRate,
      lastUpdated: new Date()
    };

    this.lastMetricsUpdate = now;
    return this.metricsCache;
  }

  // Subscribe to metrics updates
  subscribe(listener: (metrics: PerformanceMetrics) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Get detailed cache performance
  getCachePerformance(): {
    l1HitRate: number;
    l2HitRate: number;
    l1AvgResponseTime: number;
    l2AvgResponseTime: number;
    totalL1Hits: number;
    totalL2Hits: number;
  } {
    const now24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentEvents = this.dataPoints.filter(dp => dp.timestamp > now24h);

    const l1Hits = recentEvents.filter(dp => dp.event === 'cache_hit' && dp.cacheLayer === 'L1');
    const l2Hits = recentEvents.filter(dp => dp.event === 'cache_hit' && dp.cacheLayer === 'L2');
    const l1Misses = recentEvents.filter(dp => dp.event === 'cache_miss' && dp.cacheLayer === 'L1');
    const l2Misses = recentEvents.filter(dp => dp.event === 'cache_miss' && dp.cacheLayer === 'L2');

    const l1Total = l1Hits.length + l1Misses.length;
    const l2Total = l2Hits.length + l2Misses.length;

    const l1HitRate = l1Total > 0 ? (l1Hits.length / l1Total) * 100 : 0;
    const l2HitRate = l2Total > 0 ? (l2Hits.length / l2Total) * 100 : 0;

    const l1AvgResponseTime = l1Hits.length > 0
      ? l1Hits.reduce((sum, hit) => sum + (hit.duration || 0), 0) / l1Hits.length
      : 0;

    const l2AvgResponseTime = l2Hits.length > 0
      ? l2Hits.reduce((sum, hit) => sum + (hit.duration || 0), 0) / l2Hits.length
      : 0;

    return {
      l1HitRate,
      l2HitRate,
      l1AvgResponseTime,
      l2AvgResponseTime,
      totalL1Hits: l1Hits.length,
      totalL2Hits: l2Hits.length
    };
  }

  // Log performance summary (menos verboso)
  logPerformanceSummary(): void {
    const metrics = this.getMetrics();
    const cachePerf = this.getCachePerformance();
    
    SmartLogger.logPerformanceMetrics(metrics);
    
    console.group('🎯 [Cache Layer Performance]');
    console.log(`L1 Hit Rate: ${cachePerf.l1HitRate.toFixed(1)}% (${cachePerf.totalL1Hits} hits)`);
    console.log(`L2 Hit Rate: ${cachePerf.l2HitRate.toFixed(1)}% (${cachePerf.totalL2Hits} hits)`);
    console.log(`L1 Avg Response: ${cachePerf.l1AvgResponseTime.toFixed(1)}ms`);
    console.log(`L2 Avg Response: ${cachePerf.l2AvgResponseTime.toFixed(1)}ms`);
    console.groupEnd();
  }

  // Clear old data points to prevent memory leaks
  cleanup(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // Keep 24h
    this.dataPoints = this.dataPoints.filter(dp => dp.timestamp > cutoff);
    this.metricsCache = null;
  }

  // Reset all metrics
  reset(): void {
    this.dataPoints = [];
    this.metricsCache = null;
    this.lastMetricsUpdate = 0;
    console.log('🔄 [Performance Monitor] Metrics reset');
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Convenience function for tracking cache operations
export function trackCacheOperation(
  event: PerformanceEvent,
  cacheLayer: 'L1' | 'L2',
  key: string,
  duration?: number
): void {
  performanceMonitor.recordEvent(event, {
    cacheLayer,
    key,
    duration
  });
}

// Convenience function for tracking API operations
export function trackApiOperation(
  duration: number,
  error?: string
): void {
  if (error) {
    performanceMonitor.recordEvent('api_error', { duration, error });
  } else {
    performanceMonitor.recordEvent('api_request', { duration });
  }
}

// Auto-cleanup timer (runs every hour)
setInterval(() => {
  performanceMonitor.cleanup();
}, 60 * 60 * 1000);

// Hook para monitorar performance em tempo real
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe(setMetrics);
    setMetrics(performanceMonitor.getMetrics());
    return unsubscribe;
  }, []);

  return {
    metrics,
    logSummary: () => performanceMonitor.logPerformanceSummary(),
    reset: () => performanceMonitor.reset()
  };
}