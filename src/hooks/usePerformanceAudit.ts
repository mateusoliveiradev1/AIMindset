import { useEffect, useState } from 'react';
import { logEvent } from '@/lib/logging';

export interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  tti: number; // Time to Interactive
  cls: number; // Cumulative Layout Shift
  fid: number; // First Input Delay
  buildTime: number;
  bundleSize: number;
  memoryUsage: number;
}

export interface PerformanceAuditResult {
  metrics: PerformanceMetrics;
  timestamp: string;
  url: string;
  userAgent: string;
}

export const usePerformanceAudit = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);

  const collectWebVitals = async (): Promise<Partial<PerformanceMetrics>> => {
    return new Promise((resolve) => {
      const metrics: Partial<PerformanceMetrics> = {};
      
      // First Contentful Paint
      if ('performance' in window) {
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          metrics.fcp = Math.round(fcpEntry.startTime);
        }
      }

      // Largest Contentful Paint
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        metrics.lcp = Math.round(lastEntry.startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        metrics.cls = Math.round(clsValue * 1000) / 1000;
      }).observe({ entryTypes: ['layout-shift'] });

      // First Input Delay
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          metrics.fid = Math.round(entries[0].processingStart - entries[0].startTime);
        }
      }).observe({ entryTypes: ['first-input'] });

      // Time to Interactive (estimado)
      setTimeout(() => {
        if (document.readyState === 'complete') {
          const navigationEntries = performance.getEntriesByType('navigation');
          if (navigationEntries.length > 0) {
            const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
            metrics.tti = Math.round(navEntry.domContentLoadedEventEnd - navEntry.fetchStart);
          }
        }
        resolve(metrics);
      }, 3000);
    });
  };

  const getMemoryUsage = (): number => {
    if ('memory' in performance) {
      return Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024 * 100) / 100;
    }
    return 0;
  };

  const startAudit = async () => {
    setIsCollecting(true);
    
    try {
      logEvent('info', 'performance_audit', 'start', { 
        url: window.location.href,
        timestamp: new Date().toISOString()
      });

      const webVitals = await collectWebVitals();
      const memoryUsage = getMemoryUsage();
      
      const auditResult: PerformanceAuditResult = {
        metrics: {
          fcp: webVitals.fcp || 0,
          lcp: webVitals.lcp || 0,
          tti: webVitals.tti || 0,
          cls: webVitals.cls || 0,
          fid: webVitals.fid || 0,
          buildTime: 0, // Será preenchido durante o build
          bundleSize: 0, // Será preenchido durante o build
          memoryUsage
        },
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };

      setMetrics(auditResult.metrics);

      // Log no sistema
      logEvent('info', 'performance', 'audit_complete', {
        fcp: auditResult.metrics.fcp,
        lcp: auditResult.metrics.lcp,
        tti: auditResult.metrics.tti,
        cls: auditResult.metrics.cls,
        fid: auditResult.metrics.fid,
        memoryUsage: auditResult.metrics.memoryUsage,
        url: auditResult.url
      });

      return auditResult;
    } catch (error) {
      logEvent('error', 'performance_audit', 'error', { error: (error as Error).message });
      throw error;
    } finally {
      setIsCollecting(false);
    }
  };

  useEffect(() => {
    // Coletar métricas automaticamente após 5 segundos
    const timer = setTimeout(() => {
      startAudit();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return {
    metrics,
    isCollecting,
    startAudit,
    getMemoryUsage
  };
};

// Função auxiliar para logar performance thresholds
export const logPerformanceAlert = (metric: string, value: number, threshold: number) => {
  if (value > threshold) {
    logEvent('warn', 'performance', 'threshold_exceeded', {
      metric,
      value,
      threshold,
      severity: value > threshold * 2 ? 'critical' : 'warning'
    });
  }
};

// Thresholds de performance
export const PERFORMANCE_THRESHOLDS = {
  WARNING: 2000, // 2 segundos
  CRITICAL: 5000, // 5 segundos
  TARGET: 1500, // 1.5 segundos (meta)
};