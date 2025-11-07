import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, Clock, Zap, Database, RefreshCw, Bell, Package, Gauge, MemoryStick, Server } from 'lucide-react';
import { unifiedPerformanceService, UnifiedPerformanceMetrics, PerformanceAlert } from '@/services/UnifiedPerformanceService';
import { performanceAlertService, type PerformanceAlert as DBAlert } from '@/services/PerformanceAlertService';
import { logEvent } from '@/lib/logging';
import { Card } from '@/components/UI/Card';
import { Suspense } from 'react';
const LazyTimelineChart = React.lazy(() => import('@/components/Admin/Charts/TimelineChart'));
const LazyCoreVitalsChart = React.lazy(() => import('@/components/Admin/Charts/CoreVitalsChart'));
import { optimizationService } from '@/services/OptimizationService';

const COLORS = {
  good: '#00C853', // High-contrast green
  warning: '#FFAB00', // Amber
  critical: '#D50000', // Deep red
  info: '#2962FF', // Vivid blue
  purple: '#7C4DFF',
  cyan: '#00B8D4',
  darkAxis: '#111827',
  grid: '#e5e7eb'
};

const VITAL_COLORS: Record<string, string> = {
  LCP: COLORS.critical,
  FCP: COLORS.info,
  TTFB: COLORS.cyan,
  FID: COLORS.purple,
  CLS: COLORS.warning
};

interface UnifiedPerformanceDashboardProps {
  className?: string;
}

export const UnifiedPerformanceDashboard: React.FC<UnifiedPerformanceDashboardProps> = ({ className = '' }) => {
  const [metrics, setMetrics] = useState<UnifiedPerformanceMetrics[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<UnifiedPerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [dbAlerts, setDbAlerts] = useState<DBAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'alerts' | 'history'>('overview');
  const [period, setPeriod] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [optProgress, setOptProgress] = useState<number>(0);
  const [optMessage, setOptMessage] = useState<string>('');

  const filteredMetrics = React.useMemo(() => {
    const now = Date.now();
    const ranges: Record<typeof period, number> = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    const cutoff = now - ranges[period];
    return (metrics || []).filter(m => new Date(m.timestamp).getTime() >= cutoff);
  }, [metrics, period]);

  // Buscar métricas iniciais
  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      
      // Coletar métricas unificadas
      const current = await unifiedPerformanceService.collectUnifiedMetrics();
      const cached = unifiedPerformanceService.getCachedMetrics();
      const currentAlerts = unifiedPerformanceService.getCachedAlerts();
      const unack = await performanceAlertService.getUnacknowledgedAlerts(50);

      setMetrics(cached);
      setCurrentMetrics(current);
      setAlerts(currentAlerts);
      setDbAlerts(unack);
      setLastUpdate(new Date());

      // Registrar evento
      await logEvent('info', 'performance', 'unified_dashboard_metrics_loaded', {
        metricsCount: cached.length,
        alertsCount: currentAlerts.length,
        performanceScore: current.performanceScore
      });

    } catch (error) {
      console.error('Erro ao buscar métricas unificadas:', error);
      await logEvent('error', 'performance', 'unified_dashboard_error', { error: String(error) });
    } finally {
      setLoading(false);
    }
  }, []);

  // Configurar monitoramento automático
  useEffect(() => {
    // Buscar métricas iniciais
    fetchMetrics();

    // Configurar listener para mudanças
    const unsubscribe = unifiedPerformanceService.subscribe((newMetrics, newAlerts) => {
      setMetrics(unifiedPerformanceService.getCachedMetrics());
      setAlerts(newAlerts);
      // Atualizar alertas do banco em background
      performanceAlertService.getUnacknowledgedAlerts(50).then(setDbAlerts).catch(() => {});
      setCurrentMetrics(newMetrics);
      setLastUpdate(new Date());
    });

    // Iniciar monitoramento automático
    if (autoRefresh) {
      unifiedPerformanceService.startMonitoring(30000); // 30 segundos
    }

    return () => {
      unsubscribe();
      unifiedPerformanceService.stopMonitoring();
    };
  }, [fetchMetrics, autoRefresh]);

  // Funções utilitárias
  const getStatusColor = (value: number, threshold: number, lowerIsBetter = true) => {
    if (lowerIsBetter) {
      return value <= threshold ? COLORS.good : value <= threshold * 1.5 ? COLORS.warning : COLORS.critical;
    }
    return value >= threshold ? COLORS.good : value >= threshold * 0.5 ? COLORS.warning : COLORS.critical;
  };

  const getPerformanceGrade = (score: number) => {
    if (score >= 90) return { grade: 'A', color: COLORS.good };
    if (score >= 80) return { grade: 'B', color: COLORS.warning };
    if (score >= 70) return { grade: 'C', color: COLORS.warning };
    return { grade: 'D', color: COLORS.critical };
  };

  const formatBytes = (bytes: number) => {
    return `${(bytes / 1024).toFixed(1)}KB`;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Helpers de formatação compacta para evitar overflow em cards e tabela
  const formatCompact = (value?: number) => {
    const v = Number(value || 0);
    return new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(v);
  };
  const formatMs = (value?: number) => {
    const v = Number(value || 0);
    const digits = v >= 1000 ? 0 : 1;
    return `${v.toFixed(digits)}ms`;
  };
  const formatKB = (value?: number) => {
    const v = Number(value || 0);
    const digits = v >= 1000 ? 0 : 1;
    return `${v.toFixed(digits)}KB`;
  };
  const formatMB = (value?: number) => {
    const v = Number(value || 0);
    const digits = v >= 1000 ? 0 : 1;
    return `${v.toFixed(digits)}MB`;
  };
  const formatPercent = (value?: number) => {
    const v = Number(value || 0);
    return `${v.toFixed(1)}%`;
  };

  const TimelineTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    const point = payload.reduce((acc: any, p: any) => ({ ...acc, [p.dataKey]: p.value }), {});
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
        <div className="text-xs text-gray-500 mb-2">{new Date(label).toLocaleString('pt-BR')}</div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-gray-600">Score</span><span className="font-medium">{point.performanceScore || 0}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">LCP</span><span className="font-medium">{formatDuration(point.lcp || 0)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">FCP</span><span className="font-medium">{formatDuration(point.fcp || 0)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">TTFB</span><span className="font-medium">{formatDuration(point.ttfb || 0)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">FID</span><span className="font-medium">{formatDuration(point.fid || 0)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">CLS</span><span className="font-medium">{(point.cls || 0).toFixed(3)}</span></div>
        </div>
      </div>
    );
  };

  // Componente de Visão Geral
  const OverviewTab = () => (
    <div className="space-y-6 overflow-hidden">
      {/* Performance Score Principal */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-lg text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Performance Score</h3>
            <p className="text-blue-100">Métricas gerais do sistema</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">
              {currentMetrics?.performanceScore || 0}
            </div>
            <div className="text-lg">
              {currentMetrics && getPerformanceGrade(currentMetrics.performanceScore).grade}
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Bundle Size */}
        <Card className="p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Package className="w-5 h-5 text-gray-600 mr-2 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-600 truncate">Bundle Size</span>
            </div>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 font-mono tabular-nums text-right truncate">
            {formatKB(currentMetrics?.bundleSize)}
          </div>
          <div className="text-xs text-gray-500 mt-1 truncate">
            Meta: 500KB • Status: {currentMetrics && currentMetrics.bundleSize > 500 ? '⚠️ Elevado' : '✅ OK'}
          </div>
        </Card>

        {/* LCP */}
        <Card className="p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-gray-600 mr-2 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-600 truncate">LCP</span>
            </div>
            <Activity className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 font-mono tabular-nums text-right truncate">
            {formatMs(currentMetrics?.lcp)}
          </div>
          <div className="text-xs text-gray-500 mt-1 truncate">
            Meta: 2.5s • {currentMetrics && getPerformanceGrade(100 - (currentMetrics.lcp / 2500 * 20)).grade}
          </div>
        </Card>

        {/* Cache Hit Rate */}
        <Card className="p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Database className="w-5 h-5 text-gray-600 mr-2 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-600 truncate">Cache</span>
            </div>
            <Zap className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 font-mono tabular-nums text-right truncate">
            {formatPercent(currentMetrics?.cacheHitRate)}
          </div>
          <div className="text-xs text-gray-500 mt-1 truncate">
            Taxa de acerto • Meta: 80%
          </div>
        </Card>

        {/* Memory Usage */}
        <Card className="p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <MemoryStick className="w-5 h-5 text-gray-600 mr-2 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-600 truncate">Memória</span>
            </div>
            <Server className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 font-mono tabular-nums text-right truncate">
            {formatMB(currentMetrics?.memoryUsage)}
          </div>
          <div className="text-xs text-gray-500 mt-1 truncate">
            Uso de heap • Status: Normal
          </div>
        </Card>
      </div>

      {/* Gráficos (lazy) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline de Performance */}
        <Card className="p-6 overflow-hidden">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline de Performance</h3>
          <div className="flex items-center justify-end mb-2">
            <label className="text-xs text-gray-600 mr-2">Período:</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="1h">1h</option>
              <option value="24h">24h</option>
              <option value="7d">7d</option>
              <option value="30d">30d</option>
            </select>
          </div>
          <div className="overflow-hidden">
            <Suspense fallback={<div className="h-64 flex items-center justify-center text-sm text-gray-500">Carregando gráfico...</div>}>
              <LazyTimelineChart data={filteredMetrics.length ? filteredMetrics : metrics.slice(-20)} />
            </Suspense>
          </div>
        </Card>

        {/* Core Web Vitals */}
        <Card className="p-6 overflow-hidden">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Core Web Vitals</h3>
          <Suspense fallback={<div className="h-64 flex items-center justify-center text-sm text-gray-500">Carregando gráfico...</div>}>
            <LazyCoreVitalsChart 
              data={[
                { name: 'LCP', value: currentMetrics?.lcp || 0, target: 2500, unit: 'ms' },
                { name: 'FID', value: currentMetrics?.fid || 0, target: 100, unit: 'ms' },
                { name: 'CLS', value: currentMetrics?.cls || 0, target: 0.1, unit: '' },
                { name: 'TTFB', value: currentMetrics?.ttfb || 0, target: 600, unit: 'ms' },
                { name: 'FCP', value: currentMetrics?.fcp || 0, target: 1800, unit: 'ms' }
              ]}
            />
          </Suspense>
        </Card>
      </div>
    </div>
  );

  // Componente de Alertas
  const AlertsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Alertas de Performance</h3>
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="text-sm text-gray-600">{(dbAlerts?.length || 0) + (alerts?.length || 0)} ativo(s)</span>
        </div>
      </div>

      {/* Preferir alertas persistidos no Supabase quando disponíveis */}
      {dbAlerts.length > 0 ? (
        <div className="space-y-3">
          {dbAlerts.map((alert) => (
            <Card key={alert.id} className={`p-4 border-l-4 ${
              alert.severity === 'critical' ? 'border-red-500' : 
              alert.severity === 'warning' ? 'border-yellow-500' : 'border-blue-500'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                    alert.severity === 'critical' ? 'text-red-500' : 
                    alert.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                  }`} />
                  <div className="max-w-[70ch]">
                    <h4 className="font-medium text-gray-900 truncate">{alert.message}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Métrica: {alert.metric} • Valor atual: {alert.currentValue} • Limite: {alert.threshold}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {alert.created_at ? new Date(alert.created_at).toLocaleString('pt-BR') : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (!alert.id) return;
                    const confirmed = window.confirm('Resolver e otimizar agora?');
                    if (!confirmed) return;
                    try {
                      // Executa otimização real baseada na métrica
                      const metricKey = (alert.metric || alert.type || '').toString();
                      setOptProgress(0);
                      setOptMessage('Iniciando otimização...');
                      const report = await optimizationService.optimizeAlert(metricKey, (p, m) => {
                        setOptProgress(Math.max(0, Math.min(1, p)));
                        setOptMessage(m);
                      });
                      setOptProgress(1);
                      setOptMessage('Concluído');
                      const ok = await performanceAlertService.acknowledgeAlert(alert.id);
                      if (ok) {
                        setDbAlerts((prev) => prev.filter((a) => a.id !== alert.id));
                      }
                      await logEvent('info', 'performance_alert', 'optimized_and_acknowledged', { alertId: alert.id, report });
                    } catch (error) {
                      console.error('Erro ao otimizar/acknowledge alerta:', error);
                      await logEvent('error', 'performance_alert', 'optimize_ack_error', { alertId: alert.id, error: String(error) });
                    }
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Resolver
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <Card className="p-6 text-center">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhum alerta ativo</h4>
          <p className="text-gray-600">Sistema operando dentro dos parâmetros normais</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card key={alert.id} className={`p-4 border-l-4 ${
              alert.severity === 'critical' ? 'border-red-500' : 
              alert.severity === 'warning' ? 'border-yellow-500' : 'border-blue-500'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                    alert.severity === 'critical' ? 'text-red-500' : 
                    alert.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                  }`} />
                  <div>
                    <h4 className="font-medium text-gray-900">{alert.message}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Métrica: {alert.metric} • Valor atual: {alert.currentValue}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(alert.timestamp).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={async () => {
                      try {
                        const confirmed = window.confirm('Resolver e otimizar agora?');
                        if (!confirmed) return;
                        const metricKey = (alert.metric || alert.type || '').toString();
                        setOptProgress(0);
                        setOptMessage('Iniciando otimização...');
                        const report = await optimizationService.optimizeAlert(metricKey, (p, m) => {
                          setOptProgress(Math.max(0, Math.min(1, p)));
                          setOptMessage(m);
                        });
                        setOptProgress(1);
                        setOptMessage('Concluído');
                        await unifiedPerformanceService.resolveAlert(alert.id);
                        setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
                        await logEvent('info', 'performance', 'unified_dashboard_alert_resolved_with_optimization', { alertId: alert.id, report });
                      } catch (error) {
                        console.error('Erro ao resolver/otimizar alerta:', error);
                        await logEvent('error', 'performance', 'unified_dashboard_alert_resolve_optimize_failed', { alertId: alert.id, error: String(error) });
                      }
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Resolver
                  </button>
                  <button
                    onClick={() => {
                      unifiedPerformanceService.snoozeAlert(alert.metric, 24 * 60 * 60 * 1000);
                      setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
                      logEvent('info', 'performance', 'unified_dashboard_alert_snoozed', { metric: alert.metric, hours: 24 });
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800"
                    title="Silenciar novos alertas desta métrica por 24h"
                  >
                    Silenciar 24h
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Componente de Detalhes
  const DetailsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Detalhes de Performance</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Métricas Atuais */}
        <Card className="p-6">
          <h4 className="font-medium text-gray-900 mb-4">Métricas Atuais</h4>
          <div className="space-y-3">
            {currentMetrics && Object.entries({
              'Bundle Size': formatKB(currentMetrics.bundleSize),
              'LCP': formatMs(currentMetrics.lcp),
              'FID': formatMs(currentMetrics.fid),
              'CLS': (currentMetrics.cls || 0).toFixed(3),
              'TTFB': formatMs(currentMetrics.ttfb),
              'Load Time': formatMs(currentMetrics.loadTime),
              'Cache Hit Rate': formatPercent(currentMetrics.cacheHitRate),
              'Memory Usage': formatMB(currentMetrics.memoryUsage),
              'Query Time': formatMs(currentMetrics.queryTime)
            }).map(([key, value]) => (
              <div key={key} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-gray-600">{key}</span>
                <span className="font-medium text-gray-900 font-mono tabular-nums text-right whitespace-nowrap truncate max-w-[160px]">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Análise de Tendências */}
        <Card className="p-6">
          <h4 className="font-medium text-gray-900 mb-4">Análise de Tendências</h4>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Performance Score Médio</span>
              <span className="font-medium text-gray-900">
                {metrics.length > 0 ? Math.round(metrics.reduce((sum, m) => sum + m.performanceScore, 0) / metrics.length) : 0}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Bundle Size Médio</span>
              <span className="font-medium text-gray-900">
                {metrics.length > 0 ? Math.round(metrics.reduce((sum, m) => sum + m.bundleSize, 0) / metrics.length) : 0}KB
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">LCP Médio</span>
              <span className="font-medium text-gray-900">
                {metrics.length > 0 ? Math.round(metrics.reduce((sum, m) => sum + m.lcp, 0) / metrics.length) : 0}ms
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Total de Métricas</span>
              <span className="font-medium text-gray-900">{metrics.length}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  // Componente de Histórico
  const HistoryTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Histórico de Performance</h3>
      
      <Card className="p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-600">Período: {period}</div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const rows = (metrics || []).map(m => ({
                  timestamp: m.timestamp,
                  bundleSize: m.bundleSize,
                  lcp: m.lcp,
                  fcp: m.fcp,
                  fid: m.fid,
                  cls: m.cls,
                  ttfb: m.ttfb,
                  loadTime: m.loadTime,
                  cacheHitRate: m.cacheHitRate,
                  queryTime: m.queryTime,
                  memoryUsage: m.memoryUsage,
                  performanceScore: m.performanceScore
                }));
                const header = Object.keys(rows[0] || {}).join(',');
                const body = rows.map(r => Object.values(r).join(',')).join('\n');
                const blob = new Blob([header + '\n' + body], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `performance_history_${new Date().toISOString().slice(0,10)}.csv`;
                link.click();
                URL.revokeObjectURL(url);
              }}
              className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
            >
              Exportar CSV
            </button>
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(metrics, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `performance_history_${new Date().toISOString().slice(0,10)}.json`;
                link.click();
                URL.revokeObjectURL(url);
              }}
              className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
            >
              Exportar JSON
            </button>
          </div>
        </div>
        <div className="overflow-hidden">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={filteredMetrics.length ? filteredMetrics : metrics} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
              stroke={COLORS.darkAxis}
            />
            <YAxis stroke={COLORS.darkAxis} />
            <Tooltip 
              labelFormatter={(value) => new Date(value).toLocaleString('pt-BR')}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', maxWidth: '280px', overflow: 'hidden' }}
            />
            <Legend />
            <Line type="monotone" dataKey="bundleSize" stroke={COLORS.warning} strokeWidth={2} name="Bundle Size (KB)" />
            <Line type="monotone" dataKey="lcp" stroke={VITAL_COLORS.LCP} strokeWidth={2} name="LCP (ms)" />
            <Line type="monotone" dataKey="fcp" stroke={VITAL_COLORS.FCP} strokeWidth={2} name="FCP (ms)" />
            <Line type="monotone" dataKey="ttfb" stroke={VITAL_COLORS.TTFB} strokeWidth={2} name="TTFB (ms)" />
            <Line type="monotone" dataKey="performanceScore" stroke={COLORS.purple} strokeWidth={3} name="Performance Score" />
            <Line type="monotone" dataKey="cacheHitRate" stroke={COLORS.good} strokeWidth={2} name="Cache Hit Rate (%)" />
            <Line type="monotone" dataKey="memoryUsage" stroke={COLORS.info} strokeWidth={2} name="Memória (MB)" />
          </LineChart>
        </ResponsiveContainer>
        </div>
        {/* Tabela compacta com scroll vertical controlado */}
        <div className="mt-4 overflow-x-auto">
          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-2 text-left text-gray-600 w-28">Horário</th>
                  <th className="px-2 py-2 text-right text-gray-600 w-20">Score</th>
                  <th className="px-2 py-2 text-right text-gray-600 w-20">LCP</th>
                  <th className="px-2 py-2 text-right text-gray-600 w-20">FCP</th>
                  <th className="px-2 py-2 text-right text-gray-600 w-20">FID</th>
                  <th className="px-2 py-2 text-right text-gray-600 w-20">CLS</th>
                  <th className="px-2 py-2 text-right text-gray-600 w-24">TTFB</th>
                  <th className="px-2 py-2 text-right text-gray-600 w-24">Bundle</th>
                  <th className="px-2 py-2 text-right text-gray-600 w-24">Cache</th>
                  <th className="px-2 py-2 text-right text-gray-600 w-24">Memória</th>
                  <th className="px-2 py-2 text-right text-gray-600 w-24">Query</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {(filteredMetrics.length ? filteredMetrics : metrics).map((m, i) => (
                  <tr key={`${m.timestamp}-${i}`} className="hover:bg-gray-50">
                    <td className="px-2 py-2 whitespace-nowrap text-gray-700">
                      {new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-right font-mono tabular-nums">{Math.round(m.performanceScore || 0)}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-right font-mono tabular-nums">{formatMs(m.lcp)}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-right font-mono tabular-nums">{formatMs(m.fcp)}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-right font-mono tabular-nums">{formatMs(m.fid)}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-right font-mono tabular-nums">{(m.cls || 0).toFixed(3)}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-right font-mono tabular-nums">{formatMs(m.ttfb)}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-right font-mono tabular-nums">{formatKB(m.bundleSize)}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-right font-mono tabular-nums">{formatPercent(m.cacheHitRate)}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-right font-mono tabular-nums">{formatMB(m.memoryUsage)}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-right font-mono tabular-nums">{formatMs(m.queryTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com Controles */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Performance Unificado</h1>
          <p className="text-gray-600 mt-1">Monitoramento completo de métricas e desempenho</p>
        </div>
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-500">
          Última atualização: {lastUpdate ? lastUpdate.toLocaleTimeString('pt-BR') : '...'}
        </div>
        <button
          onClick={fetchMetrics}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Atualizar agora"
          disabled={loading}
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Auto-refresh</span>
          </label>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="border-b border-gray-200">
        {/* Barra de Progresso de Otimização */}
        {optMessage && (
          <div className="rounded-md bg-blue-50 p-4 border border-blue-200 mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-blue-800">{optMessage}</div>
              <div className="text-xs text-blue-700 font-mono">{Math.round(optProgress * 100)}%</div>
            </div>
            <div className="w-full bg-blue-100 h-2 rounded">
              <div className="h-2 rounded bg-blue-600 transition-all" style={{ width: `${Math.round(optProgress * 100)}%` }} />
            </div>
          </div>
        )}
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Visão Geral', icon: Gauge },
            { id: 'details', label: 'Detalhes', icon: Activity },
            { id: 'alerts', label: 'Alertas', icon: Bell },
            { id: 'history', label: 'Histórico', icon: Clock }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              {id === 'alerts' && alerts.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {alerts.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo da Aba Ativa */}
      {loading && !currentMetrics ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Carregando métricas...</span>
        </div>
      ) : (
        <div className="transition-all duration-300">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'details' && <DetailsTab />}
          {activeTab === 'alerts' && <AlertsTab />}
          {activeTab === 'history' && <HistoryTab />}
        </div>
      )}
    </div>
  );
};

export default UnifiedPerformanceDashboard;