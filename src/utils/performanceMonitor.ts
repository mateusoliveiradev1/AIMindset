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

class PerformanceMonitor {
  private dataPoints: PerformanceDataPoint[] = [];
  private maxDataPoints = 1000; // Keep last 1000 events
  private listeners: ((metrics: PerformanceMetrics) => void)[] = [];

  // Record a performance event
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

    // Keep only recent data points
    if (this.dataPoints.length > this.maxDataPoints) {
      this.dataPoints = this.dataPoints.slice(-this.maxDataPoints);
    }

    // Notify listeners
    this.notifyListeners();
  }

  // Get current performance metrics
  getMetrics(): PerformanceMetrics {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Filter recent events (last hour)
    const recentEvents = this.dataPoints.filter(
      point => point.timestamp >= oneHourAgo
    );

    const totalRequests = recentEvents.filter(
      point => point.event === 'api_request'
    ).length;

    const cacheHits = recentEvents.filter(
      point => point.event === 'cache_hit'
    ).length;

    const cacheMisses = recentEvents.filter(
      point => point.event === 'cache_miss'
    ).length;

    const errors = recentEvents.filter(
      point => point.event === 'api_error'
    ).length;

    const requestEvents = recentEvents.filter(
      point => point.event === 'api_request' && point.duration
    );

    const averageResponseTime = requestEvents.length > 0
      ? requestEvents.reduce((sum, event) => sum + (event.duration || 0), 0) / requestEvents.length
      : 0;

    const totalCacheRequests = cacheHits + cacheMisses;
    const cacheHitRate = totalCacheRequests > 0 ? (cacheHits / totalCacheRequests) * 100 : 0;
    const errorRate = totalRequests > 0 ? (errors / totalRequests) * 100 : 0;

    return {
      cacheHitRate,
      averageResponseTime,
      totalRequests,
      cacheHits,
      cacheMisses,
      errorRate,
      lastUpdated: now
    };
  }

  // Get detailed cache statistics
  getCacheStats() {
    const metrics = this.getMetrics();
    const cacheMetrics = hybridCache.getMetrics();
    
    return {
      ...metrics,
      l1CacheSize: cacheMetrics.l1Size,
      l2CacheSize: cacheMetrics.l2Size,
      l1HitRate: cacheMetrics.l1HitRate,
      l2HitRate: cacheMetrics.l2HitRate,
      totalCacheSize: cacheMetrics.l1Size + cacheMetrics.l2Size
    };
  }

  // Subscribe to metrics updates
  subscribe(callback: (metrics: PerformanceMetrics) => void) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify all listeners
  private notifyListeners() {
    const metrics = this.getMetrics();
    this.listeners.forEach(callback => {
      try {
        callback(metrics);
      } catch (error) {
        console.error('Error in performance metrics listener:', error);
      }
    });
  }

  // Clear all data (for testing)
  clear() {
    this.dataPoints = [];
    this.notifyListeners();
  }

  // Export data for analysis
  exportData() {
    return {
      dataPoints: [...this.dataPoints],
      metrics: this.getMetrics(),
      cacheStats: this.getCacheStats()
    };
  }

  // Get performance summary for admin dashboard
  getSummary() {
    const metrics = this.getMetrics();
    const cacheStats = this.getCacheStats();
    
    return {
      status: this.getHealthStatus(metrics),
      cacheEfficiency: Math.round(metrics.cacheHitRate),
      responseTime: Math.round(metrics.averageResponseTime),
      totalRequests: metrics.totalRequests,
      errorRate: Math.round(metrics.errorRate * 100) / 100,
      recommendations: this.getRecommendations(metrics)
    };
  }

  // Determine system health status
  private getHealthStatus(metrics: PerformanceMetrics): 'excellent' | 'good' | 'warning' | 'critical' {
    if (metrics.errorRate > 10) return 'critical';
    if (metrics.errorRate > 5 || metrics.cacheHitRate < 50) return 'warning';
    if (metrics.cacheHitRate > 80 && metrics.averageResponseTime < 500) return 'excellent';
    return 'good';
  }

  // Generate performance recommendations
  private getRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.cacheHitRate < 60) {
      recommendations.push('Consider increasing cache TTL or optimizing cache keys');
    }

    if (metrics.averageResponseTime > 1000) {
      recommendations.push('API response times are high - consider optimizing queries');
    }

    if (metrics.errorRate > 5) {
      recommendations.push('High error rate detected - check API connectivity');
    }

    if (metrics.totalRequests < 10) {
      recommendations.push('Low request volume - metrics may not be representative');
    }

    return recommendations;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
import { useState, useEffect } from 'react';

export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(
    performanceMonitor.getMetrics()
  );
  const [cacheStats, setCacheStats] = useState(
    performanceMonitor.getCacheStats()
  );

  useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe(setMetrics);
    
    // Update cache stats periodically
    const interval = setInterval(() => {
      setCacheStats(performanceMonitor.getCacheStats());
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return {
    metrics,
    cacheStats,
    summary: performanceMonitor.getSummary(),
    exportData: () => performanceMonitor.exportData(),
    clearData: () => performanceMonitor.clear()
  };
};

// Utility functions for performance tracking
export const trackApiRequest = async <T>(
  operation: () => Promise<T>,
  key?: string
): Promise<T> => {
  const startTime = Date.now();
  
  try {
    performanceMonitor.recordEvent('api_request', { key });
    const result = await operation();
    const duration = Date.now() - startTime;
    
    performanceMonitor.recordEvent('api_request', { 
      duration, 
      key 
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.recordEvent('api_error', { 
      duration, 
      key,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

export const trackCacheOperation = (
  event: 'cache_hit' | 'cache_miss' | 'cache_invalidation',
  cacheLayer: 'L1' | 'L2',
  key: string
) => {
  performanceMonitor.recordEvent(event, { cacheLayer, key });
};