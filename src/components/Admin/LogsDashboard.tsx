import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { BarChart3, PieChart, TrendingUp, Activity, AlertTriangle, Info, CheckCircle, XCircle, RefreshCw, Download } from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import DateFilters, { DateRange } from '../UI/DateFilters';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

interface LogMetrics {
  totalLogs: number;
  systemLogs: number;
  appLogs: number;
  backendLogs: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  successCount: number;
}

interface TimelineData {
  labels: string[];
  datasets: any[];
}

interface DistributionData {
  labels: string[];
  datasets: any[];
}

const LogsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<LogMetrics>({
    totalLogs: 0,
    systemLogs: 0,
    appLogs: 0,
    backendLogs: 0,
    errorCount: 0,
    warningCount: 0,
    infoCount: 0,
    successCount: 0,
  });
  const [timelineData, setTimelineData] = useState<TimelineData>({
    labels: [],
    datasets: []
  });
  const [distributionData, setDistributionData] = useState<DistributionData>({
    labels: [],
    datasets: []
  });
  const [topSourcesData, setTopSourcesData] = useState<DistributionData>({
    labels: [],
    datasets: []
  });
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
    period: 'today'
  });
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Cores do tema futurístico
  const colors = {
    primary: '#8B5CF6',
    secondary: '#06B6D4',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    background: 'rgba(139, 92, 246, 0.1)',
    border: 'rgba(139, 92, 246, 0.3)',
  };

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      
      // Buscar métricas dos logs do sistema
      let systemQuery = supabase.from('system_logs').select('level', { count: 'exact' });
      let appQuery = supabase.from('app_logs').select('level', { count: 'exact' });
      let backendQuery = supabase.from('backend_logs').select('action', { count: 'exact' });

      // Aplicar filtros de data se definidos
      if (dateRange.startDate && dateRange.endDate) {
        const startISO = dateRange.startDate.toISOString();
        const endISO = dateRange.endDate.toISOString();
        
        systemQuery = systemQuery.gte('created_at', startISO).lte('created_at', endISO);
        appQuery = appQuery.gte('created_at', startISO).lte('created_at', endISO);
        backendQuery = backendQuery.gte('created_at', startISO).lte('created_at', endISO);
      }

      const [systemResult, appResult, backendResult] = await Promise.all([
        systemQuery,
        appQuery,
        backendQuery
      ]);

      // Calcular métricas
      const systemLogs = systemResult.count || 0;
      const appLogs = appResult.count || 0;
      const backendLogs = backendResult.count || 0;

      // Contar por nível (system + app logs)
      const systemData = systemResult.data || [];
      const appData = appResult.data || [];
      const allLogs = [...systemData, ...appData];

      const errorCount = allLogs.filter(log => log.level === 'error').length;
      const warningCount = allLogs.filter(log => log.level === 'warning').length;
      const infoCount = allLogs.filter(log => log.level === 'info').length;
      const successCount = allLogs.filter(log => log.level === 'success').length;

      setMetrics({
        totalLogs: systemLogs + appLogs + backendLogs,
        systemLogs,
        appLogs,
        backendLogs,
        errorCount,
        warningCount,
        infoCount,
        successCount,
      });

      // Preparar dados para gráficos
      await prepareChartData();
      
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      toast.error('Erro ao carregar métricas do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = async () => {
    try {
      // Dados para gráfico de linha temporal (últimos 7 dias)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const timelineLabels = last7Days.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      });

      // Buscar dados por dia para cada tipo de log
      const timelinePromises = last7Days.map(async (date) => {
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const [systemCount, appCount, backendCount] = await Promise.all([
          supabase.from('system_logs').select('*', { count: 'exact', head: true })
            .gte('created_at', date).lt('created_at', nextDate.toISOString().split('T')[0]),
          supabase.from('app_logs').select('*', { count: 'exact', head: true })
            .gte('created_at', date).lt('created_at', nextDate.toISOString().split('T')[0]),
          supabase.from('backend_logs').select('*', { count: 'exact', head: true })
            .gte('created_at', date).lt('created_at', nextDate.toISOString().split('T')[0])
        ]);

        return {
          system: systemCount.count || 0,
          app: appCount.count || 0,
          backend: backendCount.count || 0
        };
      });

      const timelineResults = await Promise.all(timelinePromises);

      setTimelineData({
        labels: timelineLabels,
        datasets: [
          {
            label: 'Logs do Sistema',
            data: timelineResults.map(r => r.system),
            borderColor: colors.error,
            backgroundColor: colors.error + '20',
            tension: 0.4,
          },
          {
            label: 'Logs da Aplicação',
            data: timelineResults.map(r => r.app),
            borderColor: colors.info,
            backgroundColor: colors.info + '20',
            tension: 0.4,
          },
          {
            label: 'Logs do Backend',
            data: timelineResults.map(r => r.backend),
            borderColor: colors.success,
            backgroundColor: colors.success + '20',
            tension: 0.4,
          }
        ]
      });

      // Dados para gráfico de pizza (distribuição por nível)
      setDistributionData({
        labels: ['Erros', 'Avisos', 'Informações', 'Sucessos'],
        datasets: [{
          data: [metrics.errorCount, metrics.warningCount, metrics.infoCount, metrics.successCount],
          backgroundColor: [colors.error, colors.warning, colors.info, colors.success],
          borderColor: [colors.error, colors.warning, colors.info, colors.success],
          borderWidth: 2,
        }]
      });

      // Dados para gráfico de barras (top fontes)
      setTopSourcesData({
        labels: ['Sistema', 'Aplicação', 'Backend'],
        datasets: [{
          label: 'Quantidade de Logs',
          data: [metrics.systemLogs, metrics.appLogs, metrics.backendLogs],
          backgroundColor: [colors.error + '80', colors.info + '80', colors.success + '80'],
          borderColor: [colors.error, colors.info, colors.success],
          borderWidth: 2,
        }]
      });

    } catch (error) {
      console.error('Erro ao preparar dados dos gráficos:', error);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [dateRange]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, 30000); // Atualizar a cada 30 segundos
      return () => clearInterval(interval);
    }
  }, [autoRefresh, dateRange]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#ffffff',
          font: {
            family: 'Orbitron, monospace'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: colors.primary,
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        ticks: { color: '#ffffff' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      y: {
        ticks: { color: '#ffffff' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#ffffff',
          font: {
            family: 'Orbitron, monospace'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: colors.primary,
        borderWidth: 1,
      }
    }
  };

  const exportChart = (chartId: string, filename: string) => {
    const canvas = document.getElementById(chartId) as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = url;
      link.click();
      toast.success('Gráfico exportado com sucesso!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card className="glass-effect p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-orbitron font-bold text-white flex items-center">
              <BarChart3 className="w-6 h-6 mr-2 text-neon-purple" />
              Dashboard de Logs
            </h2>
            
            <Button
              onClick={fetchMetrics}
              disabled={loading}
              className="bg-neon-gradient hover:bg-neon-gradient/80 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Atualizar
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center text-white text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2 rounded border-neon-purple/20 bg-darker-surface/50 text-neon-purple focus:ring-neon-purple"
              />
              Auto-refresh (30s)
            </label>
          </div>
        </div>
      </Card>

      {/* Filtros de Data */}
      <DateFilters onDateRangeChange={setDateRange} />

      {/* Métricas em Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-effect p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-futuristic-gray text-sm">Total de Logs</p>
              <p className="text-2xl font-orbitron font-bold text-white">{metrics.totalLogs.toLocaleString()}</p>
            </div>
            <Activity className="w-8 h-8 text-neon-purple" />
          </div>
        </Card>

        <Card className="glass-effect p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-futuristic-gray text-sm">Erros</p>
              <p className="text-2xl font-orbitron font-bold text-red-400">{metrics.errorCount.toLocaleString()}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </Card>

        <Card className="glass-effect p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-futuristic-gray text-sm">Avisos</p>
              <p className="text-2xl font-orbitron font-bold text-yellow-400">{metrics.warningCount.toLocaleString()}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
        </Card>

        <Card className="glass-effect p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-futuristic-gray text-sm">Sucessos</p>
              <p className="text-2xl font-orbitron font-bold text-lime-green">{metrics.successCount.toLocaleString()}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-lime-green" />
          </div>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Linha Temporal */}
        <Card className="glass-effect p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-orbitron font-bold text-white flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-neon-purple" />
              Volume de Logs (7 dias)
            </h3>
            <Button
              onClick={() => exportChart('timeline-chart', 'timeline-logs')}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
          <div className="h-64">
            <Line id="timeline-chart" data={timelineData} options={chartOptions} />
          </div>
        </Card>

        {/* Gráfico de Pizza */}
        <Card className="glass-effect p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-orbitron font-bold text-white flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-neon-purple" />
              Distribuição por Nível
            </h3>
            <Button
              onClick={() => exportChart('distribution-chart', 'distribution-logs')}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
          <div className="h-64">
            <Pie id="distribution-chart" data={distributionData} options={pieOptions} />
          </div>
        </Card>
      </div>

      {/* Gráfico de Barras - Top Fontes */}
      <Card className="glass-effect p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-orbitron font-bold text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-neon-purple" />
            Logs por Fonte
          </h3>
          <Button
            onClick={() => exportChart('sources-chart', 'sources-logs')}
            variant="outline"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
        <div className="h-64">
          <Bar id="sources-chart" data={topSourcesData} options={chartOptions} />
        </div>
      </Card>

      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-darker-surface p-6 rounded-lg border border-neon-purple/20">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-neon-purple"></div>
              <span className="text-white">Carregando dashboard...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogsDashboard;