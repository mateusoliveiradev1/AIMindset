/**
 * Serviço Central Unificado de Performance
 * Consolida métricas do dashboard admin e da aba performance
 */

import { supabase } from '@/lib/supabase';
import { logEvent } from '@/lib/logging';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { hybridCache } from '@/utils/hybridCache';
import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';
import { getWebVitalsMonitor } from '@/utils/webVitals';

export interface UnifiedPerformanceMetrics {
  timestamp: string;
  bundleSize: number; // KB
  lcp: number; // ms
  fid: number; // ms
  cls: number; // score
  fcp: number; // ms
  ttfb: number; // ms
  loadTime: number; // ms
  cacheHitRate: number; // %
  queryTime: number; // ms
  memoryUsage: number; // MB
  performanceScore: number; // 0-100
}

export interface PerformanceAlert {
  id: string;
  type: 'bundle' | 'lcp' | 'fid' | 'cls' | 'ttfb' | 'memory' | 'cache';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  metric: string;
  threshold: number;
  currentValue: number;
  timestamp: string;
  resolved: boolean;
}

export interface PerformanceThresholds {
  bundleSize: { warning: number; critical: number };
  lcp: { good: number; warning: number; critical: number };
  fid: { good: number; warning: number; critical: number };
  cls: { good: number; warning: number; critical: number };
  ttfb: { good: number; warning: number; critical: number };
  memoryUsage: { warning: number; critical: number };
  cacheHitRate: { good: number; warning: number };
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  bundleSize: { warning: 450, critical: 500 }, // KB
  lcp: { good: 2500, warning: 4000, critical: 6000 }, // ms
  fid: { good: 100, warning: 300, critical: 500 }, // ms
  cls: { good: 0.1, warning: 0.25, critical: 0.4 }, // score
  ttfb: { good: 600, warning: 1000, critical: 1500 }, // ms
  memoryUsage: { warning: 100, critical: 150 }, // MB
  cacheHitRate: { good: 80, warning: 60 } // %
};

class UnifiedPerformanceService {
  private thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS;
  private metricsCache: UnifiedPerformanceMetrics[] = [];
  private alertsCache: PerformanceAlert[] = [];
  private listeners: Array<(metrics: UnifiedPerformanceMetrics, alerts: PerformanceAlert[]) => void> = [];
  private refreshInterval: NodeJS.Timeout | null = null;
  private suppressUntil: Record<string, number> = {};

  constructor() {
    // Carregar histórico persistido, se existir
    try {
      const persisted = localStorage.getItem('performance-history');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        if (Array.isArray(parsed)) {
          this.metricsCache = parsed.slice(-100);
        }
      }
    } catch {}

    // Carregar supressões de alertas
    try {
      const suppress = localStorage.getItem('alert-suppress');
      if (suppress) {
        const parsed = JSON.parse(suppress);
        if (parsed && typeof parsed === 'object') {
          this.suppressUntil = parsed;
          // Limpar supressões expiradas
          const now = Date.now();
          Object.keys(this.suppressUntil).forEach((key) => {
            if (this.suppressUntil[key] <= now) delete this.suppressUntil[key];
          });
        }
      }
    } catch {}
  }

  /**
   * Coleta métricas unificadas de todas as fontes
   */
  async collectUnifiedMetrics(): Promise<UnifiedPerformanceMetrics> {
    try {
      const timestamp = new Date().toISOString();
      
      // Coletar métricas do bundle
      const bundleSize = await this.getBundleSize();
      
      // Coletar Core Web Vitals
      const webVitals = await this.getWebVitals();
      
      // Coletar métricas de sistema
      const systemMetrics = await this.getSystemMetrics();
      
      // Calcular performance score baseado em todas as métricas
      const performanceScore = this.calculatePerformanceScore({
        bundleSize,
        ...webVitals,
        ...systemMetrics
      });

      const metrics: UnifiedPerformanceMetrics = {
        timestamp,
        bundleSize,
        ...webVitals,
        ...systemMetrics,
        performanceScore
      };

      // Armazenar em cache
      this.metricsCache.push(metrics);
      if (this.metricsCache.length > 100) {
        this.metricsCache.shift(); // Manter apenas últimas 100 métricas
      }

      // Persistir histórico no localStorage
      try {
        localStorage.setItem('performance-history', JSON.stringify(this.metricsCache));
      } catch {}

      // Registrar evento
      await logEvent('info', 'performance', 'metrics_collected', {
        bundleSize,
        performanceScore,
        lcp: webVitals.lcp,
        hasWebVitals: Object.keys(webVitals).length > 0
      });

      return metrics;
    } catch (error) {
      await logEvent('error', 'performance', 'collect_unified_metrics_failed', { error: String(error) });
      throw error;
    }
  }

  /**
   * Obtém tamanho do bundle atual
   */
  private async getBundleSize(): Promise<number> {
    try {
      // Verificar se temos dados do build
      const buildReport = localStorage.getItem('build-performance-report');
      if (buildReport) {
        const report = JSON.parse(buildReport);
        const rawBytes = report.bundleSize?.bytes || 0;
        const gzipBytes = report.bundleSize?.gzip || 0;
        const preferGzip = gzipBytes > 0 ? gzipBytes : rawBytes;
        return Math.round(preferGzip / 1024) || 0;
      }

      // Estimar baseado em recursos carregados
      const jsResources = performance.getEntriesByType('resource')
        .filter((entry: any) => entry.name.includes('.js')) as PerformanceResourceTiming[];
      
      const totalSize = jsResources.reduce((total, resource) => {
        return total + (resource.transferSize || 0);
      }, 0);

      return Math.round(totalSize / 1024); // Converter para KB
    } catch (error) {
      console.error('Erro ao obter bundle size:', error);
      return 0;
    }
  }

  /**
   * Coleta Core Web Vitals
   */
  private async getWebVitals(): Promise<{
    lcp: number;
    fid: number;
    cls: number;
    fcp: number;
    ttfb: number;
    loadTime: number;
  }> {
    const metrics = {
      lcp: 0,
      fid: 0,
      cls: 0,
      fcp: 0,
      ttfb: 0,
      loadTime: 0
    };

    try {
      // Navigation timings para loadTime/TTFB como fallback imediato
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (navigation) {
        metrics.ttfb = Math.round(navigation.responseStart - navigation.requestStart);
        metrics.loadTime = Math.round(navigation.loadEventEnd - navigation.fetchStart);
      }

      // Tentar usar WebVitalsMonitor (singleton) para métricas já coletadas
      try {
        const monitor = getWebVitalsMonitor?.();
        const map = monitor?.getMetrics?.();
        if (map && typeof map.get === 'function') {
          const getVal = (key: string) => {
            const m = map.get(key);
            return m && typeof m.value === 'number' ? m.value : 0;
          };
          const maybeLCP = getVal('LCP');
          const maybeFCP = getVal('FCP');
          const maybeTTFB = getVal('TTFB');
          const maybeINP = getVal('INP');
          const maybeCLS = getVal('CLS');
          metrics.lcp = Math.round(maybeLCP || metrics.lcp);
          metrics.fcp = Math.round(maybeFCP || metrics.fcp);
          metrics.ttfb = Math.round(maybeTTFB || metrics.ttfb);
          metrics.fid = Math.round(maybeINP || metrics.fid);
          metrics.cls = parseFloat((maybeCLS || metrics.cls).toFixed(3));
        }
      } catch {}

      // Coleta utilizando web-vitals (evita APIs deprecated de PerformanceEntry)
      const collectWithWebVitals = () => new Promise<void>((resolve) => {
        let settledCount = 0;
        const settle = () => {
          settledCount += 1;
          // Após capturar LCP e CLS ao menos uma vez, liberar
          if (settledCount >= 2) {
            resolve();
          }
        };

        onLCP((m: Metric) => { metrics.lcp = Math.round(m.value); settle(); });
        onCLS((m: Metric) => { metrics.cls = parseFloat(m.value.toFixed(3)); settle(); });
        onFCP((m: Metric) => { metrics.fcp = Math.round(m.value); });
        onTTFB((m: Metric) => { metrics.ttfb = Math.round(m.value); });
        onINP((m: Metric) => { if (!metrics.fid) metrics.fid = Math.round(m.value); });

        // Fallback de timeout para garantir resolução mesmo se eventos demorarem
        setTimeout(() => resolve(), 1200);
      });

      await collectWithWebVitals();

      // Obter do Supabase se houver dados recentes e normalizar
      const { data: recentMetrics } = await supabase
        .from('system_logs')
        .select('context')
        .eq('type', 'performance')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (recentMetrics?.context?.webVitals) {
        const webVitals = recentMetrics.context.webVitals as any;
        const normalized = {
          ...webVitals,
          fid: typeof webVitals.fid === 'number' ? webVitals.fid : (
            typeof webVitals.inp === 'number' ? webVitals.inp : metrics.fid
          )
        };
        return { ...metrics, ...normalized };
      }

    } catch (error) {
      console.error('Erro ao obter Web Vitals:', error);
    }

    return metrics;
  }

  /**
   * Coleta métricas de sistema
   */
  private async getSystemMetrics(): Promise<{
    cacheHitRate: number;
    queryTime: number;
    memoryUsage: number;
  }> {
    const metrics = {
      cacheHitRate: 0,
      queryTime: 0,
      memoryUsage: 0
    };

    try {
      // Memory usage
      if ('memory' in performance) {
        const memoryInfo = (performance as any).memory;
        metrics.memoryUsage = Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024); // MB
      }

      // Cache hit rate (estimado)
      const cacheStats = await this.getCacheStatistics();
      metrics.cacheHitRate = cacheStats.hitRate;

      // Query time médio
      const queryStats = await this.getQueryStatistics();
      metrics.queryTime = queryStats.avgTime;

    } catch (error) {
      console.error('Erro ao obter métricas de sistema:', error);
    }

    return metrics;
  }

  /**
   * Calcula performance score baseado em todas as métricas
   */
  private calculatePerformanceScore(metrics: Partial<UnifiedPerformanceMetrics>): number {
    let score = 100;
    const thresholds = this.thresholds;

    // Bundle size impact
    if (metrics.bundleSize && metrics.bundleSize > thresholds.bundleSize.critical) {
      score -= 30;
    } else if (metrics.bundleSize && metrics.bundleSize > thresholds.bundleSize.warning) {
      score -= 15;
    }

    // LCP impact
    if (metrics.lcp && metrics.lcp > thresholds.lcp.critical) {
      score -= 25;
    } else if (metrics.lcp && metrics.lcp > thresholds.lcp.warning) {
      score -= 15;
    }

    // FID impact
    if (metrics.fid && metrics.fid > thresholds.fid.critical) {
      score -= 20;
    } else if (metrics.fid && metrics.fid > thresholds.fid.warning) {
      score -= 10;
    }

    // CLS impact
    if (metrics.cls && metrics.cls > thresholds.cls.critical) {
      score -= 15;
    } else if (metrics.cls && metrics.cls > thresholds.cls.warning) {
      score -= 8;
    }

    // Cache impact
    if (metrics.cacheHitRate && metrics.cacheHitRate < thresholds.cacheHitRate.warning) {
      score -= 10;
    }

    return Math.max(0, Math.round(score));
  }

  /**
   * Verifica alertas baseado nas métricas atuais
   */
  async checkAlerts(metrics: UnifiedPerformanceMetrics): Promise<PerformanceAlert[]> {
    const alerts: PerformanceAlert[] = [];
    const thresholds = this.thresholds;
    const now = Date.now();

    // Bundle size alert
    if (metrics.bundleSize > thresholds.bundleSize.critical && !(this.suppressUntil['bundleSize'] && this.suppressUntil['bundleSize'] > now)) {
      alerts.push({
        id: `bundle-critical-${Date.now()}`,
        type: 'bundle',
        severity: 'critical',
        message: `Bundle size crítico: ${metrics.bundleSize}KB (limite: ${thresholds.bundleSize.critical}KB)`,
        metric: 'bundleSize',
        threshold: thresholds.bundleSize.critical,
        currentValue: metrics.bundleSize,
        timestamp: metrics.timestamp,
        resolved: false
      });
    } else if (metrics.bundleSize > thresholds.bundleSize.warning && !(this.suppressUntil['bundleSize'] && this.suppressUntil['bundleSize'] > now)) {
      alerts.push({
        id: `bundle-warning-${Date.now()}`,
        type: 'bundle',
        severity: 'warning',
        message: `Bundle size elevado: ${metrics.bundleSize}KB (limite: ${thresholds.bundleSize.warning}KB)`,
        metric: 'bundleSize',
        threshold: thresholds.bundleSize.warning,
        currentValue: metrics.bundleSize,
        timestamp: metrics.timestamp,
        resolved: false
      });
    }

    // LCP alert
    if (metrics.lcp > thresholds.lcp.critical && !(this.suppressUntil['lcp'] && this.suppressUntil['lcp'] > now)) {
      alerts.push({
        id: `lcp-critical-${Date.now()}`,
        type: 'lcp',
        severity: 'critical',
        message: `LCP crítico: ${metrics.lcp}ms (meta: ${thresholds.lcp.critical}ms)`,
        metric: 'lcp',
        threshold: thresholds.lcp.critical,
        currentValue: metrics.lcp,
        timestamp: metrics.timestamp,
        resolved: false
      });
    }

    // Cache alert
    if (metrics.cacheHitRate < thresholds.cacheHitRate.warning && !(this.suppressUntil['cacheHitRate'] && this.suppressUntil['cacheHitRate'] > now)) {
      alerts.push({
        id: `cache-warning-${Date.now()}`,
        type: 'cache',
        severity: 'warning',
        message: `Taxa de cache baixa: ${metrics.cacheHitRate}% (meta: ${thresholds.cacheHitRate.warning}%)`,
        metric: 'cacheHitRate',
        threshold: thresholds.cacheHitRate.warning,
        currentValue: metrics.cacheHitRate,
        timestamp: metrics.timestamp,
        resolved: false
      });
    }

    // Armazenar alertas
    this.alertsCache = [...this.alertsCache, ...alerts];
    
    // Limitar histórico de alertas
    if (this.alertsCache.length > 50) {
      this.alertsCache = this.alertsCache.slice(-50);
    }

    // Registrar alertas críticos
    for (const alert of alerts.filter(a => a.severity === 'critical')) {
      await logEvent('error', 'performance', 'alert_critical', alert);
    }

    return alerts;
  }

  /**
   * Obtém estatísticas de cache
   */
  private async getCacheStatistics(): Promise<{ hitRate: number }> {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('system_logs')
        .select('type')
        .gte('created_at', twentyFourHoursAgo)
        .in('type', ['cache_hit', 'cache_miss']);

      if (!error && data) {
        const hits = (data || []).filter(l => l.type === 'cache_hit').length;
        const misses = (data || []).filter(l => l.type === 'cache_miss').length;
        const total = hits + misses;
        const hitRate = total > 0 ? Math.round((hits / total) * 100) : 0;

        // Fallback: se taxa do Supabase for 0, tentar fonte local para evitar alertas falsos
        if (hitRate === 0) {
          const localRate = this.getLocalCacheHitRate();
          return { hitRate: localRate };
        }
        return { hitRate };
      }

      // Se houve erro ou sem dados, usar fonte local
      const localRate = this.getLocalCacheHitRate();
      return { hitRate: localRate };
    } catch (error) {
      // Supabase indisponível: usar fonte local
      const localRate = this.getLocalCacheHitRate();
      return { hitRate: localRate };
    }
  }

  // Obtém taxa de cache de fontes locais (monitor e cache híbrido)
  private getLocalCacheHitRate(): number {
    try {
      // Usar performanceMonitor para taxa observada
      const metrics = performanceMonitor.getMetrics();
      if (metrics.cacheHitRate && metrics.cacheHitRate > 0) {
        return Math.round(metrics.cacheHitRate);
      }

      // Fallback secundário: usar contadores do hybridCache
      const cacheMetrics = (hybridCache as any).getMetrics?.();
      if (cacheMetrics && typeof cacheMetrics.hits === 'number' && typeof cacheMetrics.misses === 'number') {
        const total = cacheMetrics.hits + cacheMetrics.misses;
        if (total > 0) {
          return Math.round((cacheMetrics.hits / total) * 100);
        }
      }

      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Obtém estatísticas de queries
   */
  private async getQueryStatistics(): Promise<{ avgTime: number }> {
    try {
      // Tentar fonte local primeiro
      try {
        const tracker = (await import('@/utils/queryMetrics')).queryMetricsTracker;
        const localAvg = tracker.getAverageTime();
        if (localAvg && localAvg > 0) {
          return { avgTime: localAvg };
        }
      } catch {}

      // Fallback Supabase
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('system_logs')
        .select('context')
        .gte('created_at', twentyFourHoursAgo)
        .eq('type', 'query_performance')
        .order('created_at', { ascending: false })
        .limit(50);

      if (data && data.length > 0) {
        const times = data.map(log => log.context?.queryTime || 0).filter(v => typeof v === 'number');
        const avgTime = times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;
        return { avgTime: Math.round(avgTime) };
      }

      return { avgTime: 0 };
    } catch (error) {
      console.error('Erro ao obter estatísticas de queries:', error);
      return { avgTime: 0 };
    }
  }

  /**
   * Inicia monitoramento automático
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    const monitor = async () => {
      try {
        const metrics = await this.collectUnifiedMetrics();
        const alerts = await this.checkAlerts(metrics);
        
        // Notificar listeners
        this.listeners.forEach(listener => listener(metrics, alerts));
      } catch (error) {
        console.error('Erro no monitoramento automático:', error);
      }
    };

    // Executar imediatamente
    monitor();

    // Configurar intervalo
    this.refreshInterval = setInterval(monitor, intervalMs);
  }

  /**
   * Para monitoramento automático
   */
  stopMonitoring(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Adiciona listener para mudanças de métricas
   */
  subscribe(listener: (metrics: UnifiedPerformanceMetrics, alerts: PerformanceAlert[]) => void): () => void {
    this.listeners.push(listener);
    
    // Retornar função de unsubscribe
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Obtém métricas em cache
   */
  getCachedMetrics(): UnifiedPerformanceMetrics[] {
    return [...this.metricsCache];
  }

  /**
   * Obtém alertas em cache
   */
  getCachedAlerts(): PerformanceAlert[] {
    return this.alertsCache.filter(alert => !alert.resolved);
  }

  /**
   * Atualiza limiares personalizados
   */
  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Resolve alerta específico
   */
  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alertsCache.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      await logEvent('info', 'performance', 'alert_resolved', { alertId });
    }
  }

  /**
   * Silencia novos alertas de uma métrica por um período
   */
  snoozeAlert(metric: string, durationMs: number): void {
    const until = Date.now() + durationMs;
    this.suppressUntil[metric] = until;
    try {
      localStorage.setItem('alert-suppress', JSON.stringify(this.suppressUntil));
    } catch {}
  }

  /**
   * Limpa cache de métricas
   */
  clearCache(): void {
    this.metricsCache = [];
    this.alertsCache = [];
  }
}

// Exportar instância singleton
export const unifiedPerformanceService = new UnifiedPerformanceService();

// Exportar tipos
// Removido reexport duplicado para evitar conflitos de declaração