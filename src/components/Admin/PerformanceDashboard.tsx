import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, Clock, Zap, Database, RefreshCw, Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { logEvent } from '@/lib/logging';
import { usePerformanceAudit } from '@/hooks/usePerformanceAudit';
import { performanceAlertService } from '@/services/PerformanceAlertService';
import PerformanceAlerts from './PerformanceAlerts';

interface PerformanceMetric {
  timestamp: string;
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
  loadTime: number;
  cacheHitRate: number;
  queryTime: number;
  memoryUsage: number;
}

interface CacheMetric {
  name: string;
  hits: number;
  misses: number;
  hitRate: number;
}

interface QueryMetric {
  table: string;
  avgTime: number;
  count: number;
  lastQuery: string;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// Componente separado para a visão geral
const PerformanceOverview: React.FC<any> = ({
  metrics,
  cacheMetrics,
  queryMetrics,
  loading,
  lastUpdate,
  autoRefresh,
  setAutoRefresh,
  fetchPerformanceMetrics
}) => {
  const currentMetrics = metrics[metrics.length - 1] || {
    lcp: 0, fid: 0, cls: 0, fcp: 0, ttfb: 0, loadTime: 0, cacheHitRate: 0, queryTime: 0, memoryUsage: 0
  };

  const getPerformanceStatus = (value: number, threshold: number, lowerIsBetter = true) => {
    if (lowerIsBetter) {
      return value <= threshold ? 'good' : value <= threshold * 1.5 ? 'warning' : 'bad';
    }
    return value >= threshold ? 'good' : value >= threshold * 0.5 ? 'warning' : 'bad';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'bad': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Painel de Performance</h1>
          <p className="text-gray-600 mt-1">Monitoramento de métricas e desempenho do sistema</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </div>
          <button
            onClick={fetchPerformanceMetrics}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Atualizar agora"
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

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">LCP (ms)</p>
              <p className="text-2xl font-bold text-gray-900">{currentMetrics.lcp.toFixed(0)}</p>
            </div>
            {getStatusIcon(getPerformanceStatus(currentMetrics.lcp, 2500))}
          </div>
          <p className="text-xs text-gray-500 mt-1">Meta: &lt; 2.5s</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">FID (ms)</p>
              <p className="text-2xl font-bold text-gray-900">{currentMetrics.fid.toFixed(0)}</p>
            </div>
            {getStatusIcon(getPerformanceStatus(currentMetrics.fid, 100))}
          </div>
          <p className="text-xs text-gray-500 mt-1">Meta: &lt; 100ms</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">CLS</p>
              <p className="text-2xl font-bold text-gray-900">{currentMetrics.cls.toFixed(3)}</p>
            </div>
            {getStatusIcon(getPerformanceStatus(currentMetrics.cls, 0.1))}
          </div>
          <p className="text-xs text-gray-500 mt-1">Meta: &lt; 0.1</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
              <p className="text-2xl font-bold text-gray-900">{currentMetrics.cacheHitRate.toFixed(1)}%</p>
            </div>
            {getStatusIcon(getPerformanceStatus(currentMetrics.cacheHitRate, 80, false))}
          </div>
          <p className="text-xs text-gray-500 mt-1">Meta: &gt; 80%</p>
        </div>
      </div>

      {/* Gráficos de Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Web Vitals ao longo do tempo */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Core Web Vitals - Últimas 24h</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(value) => new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleString('pt-BR')}
                formatter={(value: number, name: string) => [value.toFixed(2), name]}
              />
              <Line type="monotone" dataKey="lcp" stroke="#ef4444" strokeWidth={2} name="LCP (ms)" />
              <Line type="monotone" dataKey="fid" stroke="#f59e0b" strokeWidth={2} name="FID (ms)" />
              <Line type="monotone" dataKey="cls" stroke="#10b981" strokeWidth={2} name="CLS" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tempos de Carregamento */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tempos de Carregamento</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(value) => new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleString('pt-BR')}
                formatter={(value: number) => [`${value}ms`, 'Tempo']}
              />
              <Bar dataKey="loadTime" fill="#3b82f6" name="Load Time (ms)" />
              <Bar dataKey="queryTime" fill="#8b5cf6" name="Query Time (ms)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Métricas de Cache */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Database className="w-5 h-5 mr-2" />
          Métricas de Cache
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">Taxa de Acerto por Cache</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={cacheMetrics}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="hitRate"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {cacheMetrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value}%`, 'Hit Rate']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">Estatísticas de Cache</h4>
            <div className="space-y-2">
              {cacheMetrics.map((metric, index) => (
                <div key={metric.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium text-gray-600">{metric.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-green-600">{metric.hits} hits</span>
                    <span className="text-sm text-red-600">{metric.misses} misses</span>
                    <span className="text-sm font-bold text-gray-900">{metric.hitRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Métricas de Query */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2" />
          Performance de Queries
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tabela
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tempo Médio (ms)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Query
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {queryMetrics.map((metric) => (
                <tr key={metric.table}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {metric.table}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.avgTime}ms
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.lastQuery}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusIcon(getPerformanceStatus(metric.avgTime, 500))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alertas de Performance */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800">Alertas de Performance</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Monitore regularmente as métricas. Valores acima dos thresholds indicam necessidade de otimização.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente principal exportado
export const PerformanceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts'>('overview');
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [cacheMetrics, setCacheMetrics] = useState<CacheMetric[]>([]);
  const [queryMetrics, setQueryMetrics] = useState<QueryMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { metrics: auditMetrics } = usePerformanceAudit();

  // Buscar métricas de performance das últimas 24h
  const fetchPerformanceMetrics = async () => {
    try {
      setLoading(true);
      
      // Buscar métricas de system_logs das últimas 24h
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: logs, error } = await supabase
        .from('system_logs')
        .select('created_at, type, context')
        .gte('created_at', twentyFourHoursAgo)
        .in('type', ['performance_audit', 'cache_hit', 'cache_miss', 'query_performance', 'hero_section_optimized_load'])
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar métricas:', error);
        return;
      }

      // Processar logs em métricas
      const processedMetrics = processLogsToMetrics(logs || []);
      setMetrics(processedMetrics);

      // Buscar métricas de cache
      const cacheData = await fetchCacheMetrics();
      setCacheMetrics(cacheData);

      // Buscar métricas de queries
      const queryData = await fetchQueryMetrics();
      setQueryMetrics(queryData);

      setLastUpdate(new Date());
      
      logEvent('info', 'performance_dashboard', 'load', {
        loadTime: Date.now() - performance.now(),
        metricsCount: metrics.length,
        cacheMetricsCount: cacheData.length,
        queryMetricsCount: queryData.length
      });

    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      logEvent('error', 'performance_dashboard', 'error', { error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const processLogsToMetrics = (logs: any[]): PerformanceMetric[] => {
    const hourlyMetrics: { [key: string]: PerformanceMetric } = {};

    logs.forEach(log => {
      const hour = new Date(log.created_at).toISOString().slice(0, 13) + ':00:00';
      
      if (!hourlyMetrics[hour]) {
        hourlyMetrics[hour] = {
          timestamp: hour,
          lcp: 0,
          fid: 0,
          cls: 0,
          fcp: 0,
          ttfb: 0,
          loadTime: 0,
          cacheHitRate: 0,
          queryTime: 0,
          memoryUsage: 0
        };
      }

      const metric = hourlyMetrics[hour];
      const metadata = log.context || {};

      switch (log.type) {
        case 'performance_audit':
          if (metadata.lcp) metric.lcp = (metric.lcp + metadata.lcp) / 2;
          if (metadata.fid) metric.fid = (metric.fid + metadata.fid) / 2;
          if (metadata.cls) metric.cls = (metric.cls + metadata.cls) / 2;
          if (metadata.fcp) metric.fcp = (metric.fcp + metadata.fcp) / 2;
          if (metadata.ttfb) metric.ttfb = (metric.ttfb + metadata.ttfb) / 2;
          break;
        case 'cache_hit':
          metric.cacheHitRate = Math.min(100, metric.cacheHitRate + 1);
          break;
        case 'cache_miss':
          metric.cacheHitRate = Math.max(0, metric.cacheHitRate - 1);
          break;
        case 'query_performance':
          if (metadata.queryTime) {
            metric.queryTime = (metric.queryTime + metadata.queryTime) / 2;
          }
          break;
        case 'hero_section_optimized_load':
          if (metadata.queryTime) {
            metric.loadTime = (metric.loadTime + metadata.queryTime) / 2;
          }
          break;
      }
    });

    return Object.values(hourlyMetrics).sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  };

  const fetchCacheMetrics = async (): Promise<CacheMetric[]> => {
    // Buscar métricas de cache dos logs
    const { data: cacheLogs } = await supabase
      .from('system_logs')
      .select('type, context')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .in('type', ['cache_hit', 'cache_miss']);

    const cacheStats: { [key: string]: { hits: number; misses: number } } = {};

    cacheLogs?.forEach(log => {
      const cacheName = log.context?.cacheName || 'default';
      if (!cacheStats[cacheName]) {
        cacheStats[cacheName] = { hits: 0, misses: 0 };
      }

      if (log.type === 'cache_hit') {
        cacheStats[cacheName].hits++;
      } else if (log.type === 'cache_miss') {
        cacheStats[cacheName].misses++;
      }
    });

    return Object.entries(cacheStats).map(([name, stats]) => ({
      name,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hits + stats.misses > 0 ? Math.round((stats.hits / (stats.hits + stats.misses)) * 100) : 0
    }));
  };

  const fetchQueryMetrics = async (): Promise<QueryMetric[]> => {
    // Buscar métricas de query dos logs
    const { data: queryLogs } = await supabase
      .from('system_logs')
      .select('created_at, context')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .eq('type', 'query_performance');

    const queryStats: { [key: string]: { totalTime: number; count: number; lastQuery: string } } = {};

    queryLogs?.forEach(log => {
      const table = log.context?.table || 'unknown';
      if (!queryStats[table]) {
        queryStats[table] = { totalTime: 0, count: 0, lastQuery: log.created_at };
      }

      queryStats[table].totalTime += log.context?.queryTime || 0;
      queryStats[table].count++;
      queryStats[table].lastQuery = log.created_at;
    });

    return Object.entries(queryStats).map(([table, stats]) => ({
      table,
      avgTime: Math.round(stats.totalTime / stats.count),
      count: stats.count,
      lastQuery: new Date(stats.lastQuery).toLocaleString('pt-BR')
    }));
  };

  useEffect(() => {
    fetchPerformanceMetrics();

    // Iniciar monitoramento de alertas
    performanceAlertService.startMonitoring();

    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchPerformanceMetrics, 30000); // Atualizar a cada 30 segundos
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      // Parar monitoramento quando o componente for desmontado
      performanceAlertService.stopMonitoring();
    };
  }, [autoRefresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Abas de navegação */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Visão Geral</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'alerts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4" />
              <span>Alertas</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Conteúdo da aba ativa */}
      {activeTab === 'overview' ? (
        <PerformanceOverview 
          metrics={metrics}
          cacheMetrics={cacheMetrics}
          queryMetrics={queryMetrics}
          loading={loading}
          lastUpdate={lastUpdate}
          autoRefresh={autoRefresh}
          setAutoRefresh={setAutoRefresh}
          fetchPerformanceMetrics={fetchPerformanceMetrics}
        />
      ) : (
        <PerformanceAlerts />
      )}
    </div>
  );
};