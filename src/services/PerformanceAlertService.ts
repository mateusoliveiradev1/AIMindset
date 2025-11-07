/**
 * Serviço de Alertas de Performance
 * Monitora métricas e envia alertas automáticos para o system_logs
 */

import { supabase } from '../lib/supabase';
import { LogLevel } from '../lib/logging';
import { logEvent } from '@/lib/logging';

export interface PerformanceThresholds {
  lcp: number;      // Largest Contentful Paint (ms)
  fid: number;      // First Input Delay (ms)
  cls: number;      // Cumulative Layout Shift
  fcp: number;      // First Contentful Paint (ms)
  ttfb: number;     // Time to First Byte (ms)
  loadTime: number; // Total load time (ms)
  queryTime: number; // Database query time (ms)
  cacheHitRate: number; // Cache hit rate (%)
  memoryUsage: number; // Memory usage (MB)
}

export interface AlertConfig {
  thresholds: PerformanceThresholds;
  enabled: boolean;
  cooldownMinutes: number;
  severityLevels: {
    warning: number;
    critical: number;
  };
}

export interface PerformanceAlert {
  id?: string;
  type: 'performance_degradation' | 'threshold_exceeded' | 'cache_miss_spike' | 'query_slowdown' | 'memory_leak';
  severity: 'info' | 'warning' | 'critical';
  metric: string;
  currentValue: number;
  threshold: number;
  message: string;
  context?: Record<string, any>;
  acknowledged: boolean;
  created_at?: string;
}

class PerformanceAlertService {
  private static instance: PerformanceAlertService;
  private alertHistory: Map<string, number> = new Map(); // tipo -> timestamp
  private config: AlertConfig;
  private monitoringInterval: NodeJS.Timeout | null = null;

  private defaultConfig: AlertConfig = {
    thresholds: {
      lcp: 2500,      // < 2.5s bom, > 4s ruim
      fid: 100,       // < 100ms bom, > 300ms ruim
      cls: 0.1,       // < 0.1 bom, > 0.25 ruim
      fcp: 1800,      // < 1.8s bom, > 3s ruim
      ttfb: 800,      // < 800ms bom, > 1800ms ruim
      loadTime: 3000, // < 3s bom, > 5s ruim
      queryTime: 500, // < 500ms bom, > 1000ms ruim
      cacheHitRate: 80, // > 80% bom, < 50% ruim
      memoryUsage: 100 // > 100MB alerta
    },
    enabled: true,
    cooldownMinutes: 15, // Não repetir alertas do mesmo tipo por 15 minutos
    severityLevels: {
      warning: 1.0,   // 100% do threshold
      critical: 1.5   // 150% do threshold
    }
  };

  private constructor(config?: Partial<AlertConfig>) {
    this.config = { ...this.defaultConfig, ...config };
  }

  static getInstance(config?: Partial<AlertConfig>): PerformanceAlertService {
    if (!PerformanceAlertService.instance) {
      PerformanceAlertService.instance = new PerformanceAlertService(config);
    }
    return PerformanceAlertService.instance;
  }

  /**
   * Inicia monitoramento automático de performance
   */
  startMonitoring(intervalMinutes: number = 5): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    console.log('🔔 Iniciando monitoramento de performance com alertas automáticos...');
    
    // Executar imediatamente
    this.checkPerformanceMetrics();
    
    // Configurar intervalo
    this.monitoringInterval = setInterval(() => {
      this.checkPerformanceMetrics();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Para o monitoramento automático
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🔔 Monitoramento de performance parado.');
    }
  }

  /**
   * Verifica métricas de performance e dispara alertas se necessário
   */
  private async checkPerformanceMetrics(): Promise<void> {
    if (!this.config.enabled) return;

    try {
      // Buscar métricas recentes do banco de dados
      const recentMetrics = await this.getRecentMetrics();
      
      if (!recentMetrics || recentMetrics.length === 0) {
        console.log('🔔 Nenhuma métrica recente encontrada para monitoramento.');
        return;
      }

      // Calcular médias das últimas horas
      const averages = this.calculateAverages(recentMetrics);
      
      // Verificar cada métrica contra os thresholds
      for (const [metric, value] of Object.entries(averages)) {
        await this.checkMetricThreshold(metric, value);
      }

      // Verificar taxa de acerto do cache
      await this.checkCachePerformance();
      
      // Verificar performance de queries
      await this.checkQueryPerformance();

    } catch (error) {
      console.error('🔔 Erro ao verificar métricas de performance:', error);
      logEvent('error', 'performance_alert', 'error', { error: String(error) });
    }
  }

  /**
   * Busca métricas recentes do banco de dados
   */
  private async getRecentMetrics(): Promise<any[]> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('system_logs')
      .select('created_at, type, context')
      .gte('created_at', oneHourAgo)
      .in('type', ['performance_audit', 'query_performance', 'cache_hit', 'cache_miss'])
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar métricas:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Calcula médias das métricas recentes
   */
  private calculateAverages(metrics: any[]): Partial<PerformanceThresholds> {
    const sums: any = {};
    const counts: any = {};

    metrics.forEach(metric => {
      const metadata = metric.context || {};
      
      Object.entries(metadata).forEach(([key, value]) => {
        if (typeof value === 'number') {
          sums[key] = (sums[key] || 0) + value;
          counts[key] = (counts[key] || 0) + 1;
        }
      });
    });

    const averages: any = {};
    Object.keys(sums).forEach(key => {
      averages[key] = sums[key] / counts[key];
    });

    return averages;
  }

  /**
   * Verifica uma métrica específica contra o threshold
   */
  private async checkMetricThreshold(metric: string, value: number): Promise<void> {
    const threshold = (this.config.thresholds as any)[metric];
    if (!threshold || !value) return;

    const severity = this.calculateSeverity(metric, value, threshold);
    if (severity === 'info') return;

    // Verificar cooldown
    if (!this.canAlert(`${metric}_${severity}`)) return;

    const alert: PerformanceAlert = {
      type: 'threshold_exceeded',
      severity,
      metric,
      currentValue: Math.round(value * 100) / 100,
      threshold,
      message: `Métrica ${metric} está ${severity === 'critical' ? 'crítica' : 'elevada'}: ${value.toFixed(2)} (threshold: ${threshold})`,
      context: {
        metric,
        value,
        threshold,
        percentage: ((value / threshold) * 100).toFixed(1)
      },
      acknowledged: false
    };

    await this.sendAlert(alert);
  }

  /**
   * Verifica performance do cache
   */
  private async checkCachePerformance(): Promise<void> {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('system_logs')
      .select('type')
      .gte('created_at', sixHoursAgo)
      .in('type', ['cache_hit', 'cache_miss']);

    if (error || !data || data.length === 0) return;

    const hits = data.filter(log => log.type === 'cache_hit').length;
    const misses = data.filter(log => log.type === 'cache_miss').length;
    const total = hits + misses;
    
    if (total === 0) return;

    const hitRate = (hits / total) * 100;
    const threshold = this.config.thresholds.cacheHitRate;

    if (hitRate < threshold) {
      const severity = hitRate < threshold * 0.5 ? 'critical' : 'warning';
      
      if (!this.canAlert(`cache_performance_${severity}`)) return;

      const alert: PerformanceAlert = {
        type: 'cache_miss_spike',
        severity,
        metric: 'cache_hit_rate',
        currentValue: Math.round(hitRate * 100) / 100,
        threshold,
        message: `Taxa de acerto do cache está baixa: ${hitRate.toFixed(1)}% (meta: ${threshold}%)`,
        context: {
          hitRate,
          hits,
          misses,
          total
        },
        acknowledged: false
      };

      await this.sendAlert(alert);
    }
  }

  /**
   * Verifica performance de queries
   */
  private async checkQueryPerformance(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('system_logs')
      .select('context')
      .gte('created_at', oneHourAgo)
      .eq('type', 'query_performance');

    if (error || !data || data.length === 0) return;

    const slowQueries = data.filter(log => {
      const queryTime = log.context?.queryTime || 0;
      return queryTime > this.config.thresholds.queryTime;
    });

    if (slowQueries.length > 0) {
      const avgSlowQueryTime = slowQueries.reduce((sum, log) => 
        sum + (log.context?.queryTime || 0), 0) / slowQueries.length;
      
      const severity = avgSlowQueryTime > this.config.thresholds.queryTime * 2 ? 'critical' : 'warning';
      
      if (!this.canAlert(`query_performance_${severity}`)) return;

      const alert: PerformanceAlert = {
        type: 'query_slowdown',
        severity,
        metric: 'query_time',
        currentValue: Math.round(avgSlowQueryTime * 100) / 100,
        threshold: this.config.thresholds.queryTime,
        message: `${slowQueries.length} queries lentas detectadas (média: ${avgSlowQueryTime.toFixed(0)}ms)`,
        context: {
          slowQueryCount: slowQueries.length,
          avgSlowQueryTime,
          threshold: this.config.thresholds.queryTime
        },
        acknowledged: false
      };

      await this.sendAlert(alert);
    }
  }

  /**
   * Calcula severidade baseada no valor vs threshold
   */
  private calculateSeverity(metric: string, value: number, threshold: number): 'info' | 'warning' | 'critical' {
    const ratio = value / threshold;
    
    if (ratio >= this.config.severityLevels.critical) {
      return 'critical';
    } else if (ratio >= this.config.severityLevels.warning) {
      return 'warning';
    }
    
    return 'info';
  }

  /**
   * Verifica se pode enviar alerta (cooldown)
   */
  private canAlert(alertType: string): boolean {
    const lastAlert = this.alertHistory.get(alertType);
    const now = Date.now();
    const cooldownMs = this.config.cooldownMinutes * 60 * 1000;
    
    if (!lastAlert || (now - lastAlert) > cooldownMs) {
      this.alertHistory.set(alertType, now);
      return true;
    }
    
    return false;
  }

  /**
   * Envia alerta para o system_logs
   */
  private async sendAlert(alert: PerformanceAlert): Promise<void> {
    try {
      // Log no console
      const emoji = alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`${emoji} [Performance Alert] ${alert.message}`);
      
      // Salvar no banco de dados
      const { error } = await supabase
        .from('system_logs')
        .insert({
          type: 'performance_alert',
          message: alert.message,
          context: {
            alert_type: alert.type,
            metric: alert.metric,
            current_value: alert.currentValue,
            threshold: alert.threshold,
            details: alert.context,
            acknowledged: alert.acknowledged,
            severity: alert.severity,
            source: 'performance_alert_service'
          }
        });

      if (error) {
        console.error('Erro ao salvar alerta no banco:', error);
        return;
      }

      // Também logar no sistema de logging geral
      logEvent(alert.severity as LogLevel, 'performance_alert', 'triggered', {
        type: alert.type,
        metric: alert.metric,
        value: alert.currentValue || alert.threshold,
        threshold: alert.threshold,
        severity: alert.severity
      });

    } catch (error) {
      console.error('Erro ao enviar alerta:', error);
    }
  }

  /**
   * Atualiza configuração
   */
  updateConfig(newConfig: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔔 Configuração de alertas atualizada:', this.config);
  }

  /**
   * Busca alertas não reconhecidos
   */
  async getUnacknowledgedAlerts(limit: number = 10): Promise<PerformanceAlert[]> {
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .eq('type', 'performance_alert')
      .eq('context->>acknowledged', 'false')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar alertas:', error);
      return [];
    }

    return (data || []).map(log => ({
      id: log.id,
      type: log.context?.alert_type || 'unknown',
      severity: log.context?.severity || 'info',
      metric: log.context?.metric || 'unknown',
      currentValue: log.context?.current_value || 0,
      threshold: log.context?.threshold || 0,
      message: log.message,
      context: log.context?.details,
      acknowledged: log.context?.acknowledged || false,
      created_at: log.created_at
    }));
  }

  /**
   * Reconhece um alerta
   */
  async acknowledgeAlert(alertId: string): Promise<boolean> {
    const { error } = await supabase
      .from('system_logs')
      .update({
        context: {
          ...((await supabase.from('system_logs').select('context').eq('id', alertId).single()).data?.context || {}),
          acknowledged: true,
          acknowledged_at: new Date().toISOString()
        }
      })
      .eq('id', alertId);

    if (error) {
      console.error('Erro ao reconhecer alerta:', error);
      return false;
    }

    return true;
  }
}

// Exportar singleton
export const performanceAlertService = PerformanceAlertService.getInstance();

// Iniciar monitoramento automaticamente se estiver em produção
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
  performanceAlertService.startMonitoring(5); // Verificar a cada 5 minutos
}

export default PerformanceAlertService;