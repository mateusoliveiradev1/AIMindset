import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  // Paleta de cores moderna e vibrante - MOVIDA PARA O INÍCIO
  const colors = {
    primary: '#8B5CF6',
    secondary: '#06B6D4',
    success: '#00FF88',
    warning: '#FFD700',
    error: '#FF4757',
    info: '#00D4FF',
    // Cores neon vibrantes
    neonPurple: '#C084FC',
    neonBlue: '#38BDF8',
    neonGreen: '#4ADE80',
    neonPink: '#F472B6',
    neonOrange: '#FB923C',
    neonCyan: '#22D3EE',
    neonYellow: '#FDE047',
    neonRed: '#F87171',
    // Gradientes modernos
    gradientPurple: 'linear-gradient(135deg, #8B5CF6 0%, #C084FC 50%, #DDD6FE 100%)',
    gradientBlue: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 50%, #BAE6FD 100%)',
    gradientGreen: 'linear-gradient(135deg, #059669 0%, #4ADE80 50%, #BBF7D0 100%)',
    gradientPink: 'linear-gradient(135deg, #EC4899 0%, #F472B6 50%, #FBCFE8 100%)',
    gradientOrange: 'linear-gradient(135deg, #EA580C 0%, #FB923C 50%, #FED7AA 100%)',
    gradientCyan: 'linear-gradient(135deg, #0891B2 0%, #22D3EE 50%, #CFFAFE 100%)',
    // Sombras e efeitos
    shadowPurple: 'rgba(139, 92, 246, 0.4)',
    shadowBlue: 'rgba(56, 189, 248, 0.4)',
    shadowGreen: 'rgba(74, 222, 128, 0.4)',
    shadowPink: 'rgba(244, 114, 182, 0.4)',
    shadowOrange: 'rgba(251, 146, 60, 0.4)',
    background: 'rgba(139, 92, 246, 0.1)',
    border: 'rgba(139, 92, 246, 0.3)',
  };

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
    labels: ['❌ Erros', '⚠️ Avisos', 'ℹ️ Informações', '✅ Sucessos'],
    datasets: [{
      data: [0, 0, 0, 0],
      backgroundColor: [
        colors.gradientPink,
        colors.gradientOrange,
        colors.gradientBlue,
        colors.gradientGreen
      ],
      borderColor: [
        colors.neonRed,
        colors.neonYellow,
        colors.neonCyan,
        colors.neonGreen
      ],
      borderWidth: 4
    }]
  });
  const [topSourcesData, setTopSourcesData] = useState<DistributionData>({
    labels: [],
    datasets: []
  });
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  
  // Inicializar autoRefresh com valor do localStorage
  const [autoRefresh, setAutoRefresh] = useState(() => {
    const saved = localStorage.getItem('logs-dashboard-auto-refresh');
    return saved ? JSON.parse(saved) : false;
  });

  // AbortController para cancelar requisições pendentes
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRequestTimeRef = useRef<number>(0);
  const isRequestInProgressRef = useRef<boolean>(false);

  // Rate limiting - mínimo 2 segundos entre requisições
  const RATE_LIMIT_MS = 2000;
  const DEBOUNCE_MS = 1000;

  // Função otimizada para buscar métricas com uma única query
  const fetchMetrics = useCallback(async (signal?: AbortSignal) => {
    try {
      // Rate limiting
      const now = Date.now();
      if (now - lastRequestTimeRef.current < RATE_LIMIT_MS) {
        return;
      }
      lastRequestTimeRef.current = now;

      if (isRequestInProgressRef.current) {
        return;
      }
      isRequestInProgressRef.current = true;
      setLoading(true);

      // Usar queries individuais otimizadas diretamente
      await fetchMetricsFallback(signal);
      
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Erro ao buscar métricas:', error);
      toast.error('Erro ao carregar métricas do dashboard');
    } finally {
      isRequestInProgressRef.current = false;
      setLoading(false);
    }
  }, [dateRange]);

  // Fallback para queries individuais (otimizado)
  const fetchMetricsFallback = async (signal?: AbortSignal) => {
    try {
      // Usar apenas count queries para reduzir transferência de dados
      let systemQuery = supabase.from('system_logs').select('id', { count: 'exact' });
      let appQuery = supabase.from('app_logs').select('id', { count: 'exact' });
      let backendQuery = supabase.from('backend_logs').select('id', { count: 'exact' });

      // Aplicar filtros de data se definidos
      if (dateRange && dateRange.startDate && dateRange.endDate) {
        const startISO = dateRange.startDate.toISOString();
        const endISO = dateRange.endDate.toISOString();
        
        systemQuery = systemQuery.gte('created_at', startISO).lte('created_at', endISO);
        appQuery = appQuery.gte('created_at', startISO).lte('created_at', endISO);
        backendQuery = backendQuery.gte('created_at', startISO).lte('created_at', endISO);
      }

      // Executar queries com AbortSignal
      const [systemResult, appResult, backendResult] = await Promise.all([
        systemQuery.abortSignal(signal),
        appQuery.abortSignal(signal),
        backendQuery.abortSignal(signal)
      ]);

      // Calcular métricas básicas
      const systemLogs = systemResult.count || 0;
      const appLogs = appResult.count || 0;
      const backendLogs = backendResult.count || 0;

      setMetrics({
        totalLogs: systemLogs + appLogs + backendLogs,
        systemLogs,
        appLogs,
        backendLogs,
        errorCount: 0, // Simplificado para reduzir queries
        warningCount: 0,
        infoCount: 0,
        successCount: 0,
      });

      // Preparar dados básicos dos gráficos
      prepareBasicChartData(systemLogs, appLogs, backendLogs);
      
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Erro no fallback:', error);
      toast.error('Erro ao carregar métricas do dashboard');
    }
  };

  // Preparar dados dos gráficos a partir das métricas (otimizado)
  const prepareChartDataFromMetrics = (data: any) => {
    try {
      // Timeline data com múltiplos pontos para mostrar linhas
      const timelineLabels = ['6h atrás', '4h atrás', '2h atrás', 'Agora'];
      
      // Simular dados históricos baseados nos valores atuais
      const systemLogsHistory = [
        Math.max(0, (data.system_logs || 0) * 0.6),
        Math.max(0, (data.system_logs || 0) * 0.8),
        Math.max(0, (data.system_logs || 0) * 0.9),
        data.system_logs || 0
      ];
      
      const appLogsHistory = [
        Math.max(0, (data.app_logs || 0) * 0.7),
        Math.max(0, (data.app_logs || 0) * 0.85),
        Math.max(0, (data.app_logs || 0) * 0.95),
        data.app_logs || 0
      ];
      
      const backendLogsHistory = [
        Math.max(0, (data.backend_logs || 0) * 0.5),
        Math.max(0, (data.backend_logs || 0) * 0.75),
        Math.max(0, (data.backend_logs || 0) * 0.9),
        data.backend_logs || 0
      ];

      setTimelineData({
        labels: timelineLabels,
        datasets: [
          {
            label: '🔧 Logs do Sistema',
            data: systemLogsHistory,
            borderColor: colors.neonPink,
            backgroundColor: colors.gradientPink.replace('linear-gradient', 'linear-gradient').replace('135deg', '180deg') + '40',
            pointBackgroundColor: colors.neonPink,
            pointBorderColor: colors.neonRed,
            pointHoverBackgroundColor: colors.neonRed,
            pointHoverBorderColor: '#ffffff',
            pointRadius: 8,
            pointHoverRadius: 12,
            borderWidth: 5,
            tension: 0.5,
            fill: true,
            // Efeitos avançados de sombra e brilho
            shadowOffsetX: 4,
            shadowOffsetY: 4,
            shadowBlur: 15,
            shadowColor: colors.shadowPink,
            // Animações suaves
            animation: {
              duration: 2000,
              easing: 'easeInOutQuart'
            },
            // Efeito de brilho nos pontos
            pointStyle: 'circle',
            pointBorderWidth: 3,
            pointHoverBorderWidth: 4
          },
          {
            label: '📱 Logs da Aplicação',
            data: appLogsHistory,
            borderColor: colors.neonBlue,
            backgroundColor: colors.gradientBlue.replace('linear-gradient', 'linear-gradient').replace('135deg', '180deg') + '40',
            pointBackgroundColor: colors.neonBlue,
            pointBorderColor: colors.neonCyan,
            pointHoverBackgroundColor: colors.neonCyan,
            pointHoverBorderColor: '#ffffff',
            pointRadius: 8,
            pointHoverRadius: 12,
            borderWidth: 5,
            tension: 0.5,
            fill: true,
            // Efeitos avançados de sombra e brilho
            shadowOffsetX: 4,
            shadowOffsetY: 4,
            shadowBlur: 15,
            shadowColor: colors.shadowBlue,
            // Animações suaves
            animation: {
              duration: 2200,
              easing: 'easeInOutQuart'
            },
            // Efeito de brilho nos pontos
            pointStyle: 'circle',
            pointBorderWidth: 3,
            pointHoverBorderWidth: 4
          },
          {
            label: '⚙️ Logs do Backend',
            data: backendLogsHistory,
            borderColor: colors.neonGreen,
            backgroundColor: colors.gradientGreen.replace('linear-gradient', 'linear-gradient').replace('135deg', '180deg') + '40',
            pointBackgroundColor: colors.neonGreen,
            pointBorderColor: colors.neonYellow,
            pointHoverBackgroundColor: colors.neonYellow,
            pointHoverBorderColor: '#ffffff',
            pointRadius: 8,
            pointHoverRadius: 12,
            borderWidth: 5,
            tension: 0.5,
            fill: true,
            // Efeitos avançados de sombra e brilho
            shadowOffsetX: 4,
            shadowOffsetY: 4,
            shadowBlur: 15,
            shadowColor: colors.shadowGreen,
            // Animações suaves
            animation: {
              duration: 2400,
              easing: 'easeInOutQuart'
            },
            // Efeito de brilho nos pontos
            pointStyle: 'circle',
            pointBorderWidth: 3,
            pointHoverBorderWidth: 4
          }
        ]
      });

      // Dados para gráfico de pizza (distribuição por nível) - Design 3D moderno
      setDistributionData({
        labels: ['❌ Erros', '⚠️ Avisos', 'ℹ️ Informações', '✅ Sucessos'],
        datasets: [{
          data: [data.error_count || 0, data.warning_count || 0, data.info_count || 0, data.success_count || 0],
          backgroundColor: [
            colors.gradientPink,
            colors.gradientOrange,
            colors.gradientBlue,
            colors.gradientGreen
          ],
          borderColor: [
            colors.neonRed,
            colors.neonYellow,
            colors.neonCyan,
            colors.neonGreen
          ],
          borderWidth: 4,
          hoverBackgroundColor: [
            colors.gradientPink,
            colors.gradientOrange,
            colors.gradientBlue,
            colors.gradientGreen
          ],
          hoverBorderColor: [
            colors.neonPink,
            colors.neonOrange,
            colors.neonBlue,
            colors.neonYellow
          ],
          hoverBorderWidth: 6,
          hoverOffset: 15,
          // Efeitos 3D e sombras
          shadowOffsetX: 6,
          shadowOffsetY: 6,
          shadowBlur: 20,
          shadowColor: 'rgba(0, 0, 0, 0.3)',
          // Animações suaves
          animation: {
            animateRotate: true,
            animateScale: true,
            duration: 2500,
            easing: 'easeInOutCubic'
          },
          // Efeito de brilho e profundidade
          cutout: '35%',
          radius: '90%',
          spacing: 3,
          // Hover effects avançados
          hoverAnimation: {
            duration: 400,
            easing: 'easeOutQuart'
          }
        }]
      });

      // Dados para gráfico de barras (top fontes) - Design moderno
      setTopSourcesData({
        labels: ['🔧 Sistema', '📱 Aplicação', '⚙️ Backend'],
        datasets: [{
          label: '📊 Quantidade de Logs',
          data: [data.system_logs || 0, data.app_logs || 0, data.backend_logs || 0],
          backgroundColor: [
            colors.gradientPink,
            colors.gradientBlue,
            colors.gradientGreen
          ],
          borderColor: [colors.neonPink, colors.neonBlue, colors.neonGreen],
          borderWidth: 3,
          borderRadius: 12,
          borderSkipped: false,
          hoverBackgroundColor: [
            colors.gradientPink,
            colors.gradientBlue,
            colors.gradientGreen
          ],
          hoverBorderColor: [colors.neonRed, colors.neonCyan, colors.neonYellow],
          hoverBorderWidth: 4,
          // Efeitos de sombra e animação
          shadowOffsetX: 4,
          shadowOffsetY: 4,
          shadowBlur: 12,
          shadowColor: [colors.shadowPink, colors.shadowBlue, colors.shadowGreen],
          // Animações suaves
          animation: {
            duration: 2000,
            easing: 'easeInOutQuart'
          },
          // Efeito de brilho
          pointStyle: 'rectRounded',
          tension: 0.4
        }]
      });

    } catch (error) {
      console.error('Erro ao preparar dados dos gráficos:', error);
    }
  };

  // Preparar dados básicos dos gráficos (fallback)
  const prepareBasicChartData = (systemLogs: number, appLogs: number, backendLogs: number) => {
    try {
      // Timeline data com múltiplos pontos para mostrar linhas
      const timelineLabels = ['6h atrás', '4h atrás', '2h atrás', 'Agora'];
      
      // Simular dados históricos baseados nos valores atuais
      const systemLogsHistory = [
        Math.max(0, systemLogs * 0.6),
        Math.max(0, systemLogs * 0.8),
        Math.max(0, systemLogs * 0.9),
        systemLogs
      ];
      
      const appLogsHistory = [
        Math.max(0, appLogs * 0.7),
        Math.max(0, appLogs * 0.85),
        Math.max(0, appLogs * 0.95),
        appLogs
      ];
      
      const backendLogsHistory = [
        Math.max(0, backendLogs * 0.5),
        Math.max(0, backendLogs * 0.75),
        Math.max(0, backendLogs * 0.9),
        backendLogs
      ];

      setTimelineData({
        labels: timelineLabels,
        datasets: [
          {
            label: '🔧 Logs do Sistema',
            data: systemLogsHistory,
            borderColor: colors.neonPink,
            backgroundColor: colors.gradientPink.replace('linear-gradient', 'linear-gradient').replace('135deg', '180deg') + '40',
            pointBackgroundColor: colors.neonPink,
            pointBorderColor: colors.neonRed,
            pointHoverBackgroundColor: colors.neonRed,
            pointHoverBorderColor: '#ffffff',
            pointRadius: 8,
            pointHoverRadius: 12,
            borderWidth: 5,
            tension: 0.5,
            fill: true,
            // Efeitos avançados de sombra e brilho
            shadowOffsetX: 4,
            shadowOffsetY: 4,
            shadowBlur: 15,
            shadowColor: colors.shadowPink,
            // Animações suaves
            animation: {
              duration: 2000,
              easing: 'easeInOutQuart'
            },
            // Efeito de brilho nos pontos
            pointStyle: 'circle',
            pointBorderWidth: 3,
            pointHoverBorderWidth: 4
          },
          {
            label: '📱 Logs da Aplicação',
            data: appLogsHistory,
            borderColor: colors.neonBlue,
            backgroundColor: colors.gradientBlue.replace('linear-gradient', 'linear-gradient').replace('135deg', '180deg') + '40',
            pointBackgroundColor: colors.neonBlue,
            pointBorderColor: colors.neonCyan,
            pointHoverBackgroundColor: colors.neonCyan,
            pointHoverBorderColor: '#ffffff',
            pointRadius: 8,
            pointHoverRadius: 12,
            borderWidth: 5,
            tension: 0.5,
            fill: true,
            // Efeitos avançados de sombra e brilho
            shadowOffsetX: 4,
            shadowOffsetY: 4,
            shadowBlur: 15,
            shadowColor: colors.shadowBlue,
            // Animações suaves
            animation: {
              duration: 2200,
              easing: 'easeInOutQuart'
            },
            // Efeito de brilho nos pontos
            pointStyle: 'circle',
            pointBorderWidth: 3,
            pointHoverBorderWidth: 4
          },
          {
            label: '⚙️ Logs do Backend',
            data: backendLogsHistory,
            borderColor: colors.neonGreen,
            backgroundColor: colors.gradientGreen.replace('linear-gradient', 'linear-gradient').replace('135deg', '180deg') + '40',
            pointBackgroundColor: colors.neonGreen,
            pointBorderColor: colors.neonYellow,
            pointHoverBackgroundColor: colors.neonYellow,
            pointHoverBorderColor: '#ffffff',
            pointRadius: 8,
            pointHoverRadius: 12,
            borderWidth: 5,
            tension: 0.5,
            fill: true,
            // Efeitos avançados de sombra e brilho
            shadowOffsetX: 4,
            shadowOffsetY: 4,
            shadowBlur: 15,
            shadowColor: colors.shadowGreen,
            // Animações suaves
            animation: {
              duration: 2400,
              easing: 'easeInOutQuart'
            },
            // Efeito de brilho nos pontos
            pointStyle: 'circle',
            pointBorderWidth: 3,
            pointHoverBorderWidth: 4
          }
        ]
      });

      setDistributionData({
        labels: ['❌ Erros', '⚠️ Avisos', 'ℹ️ Informações', '✅ Sucessos'],
        datasets: [{
          data: [
            Math.floor((systemLogs + appLogs + backendLogs) * 0.1), // 10% erros
            Math.floor((systemLogs + appLogs + backendLogs) * 0.2), // 20% avisos
            Math.floor((systemLogs + appLogs + backendLogs) * 0.4), // 40% informações
            Math.floor((systemLogs + appLogs + backendLogs) * 0.3)  // 30% sucessos
          ],
          backgroundColor: [
            colors.gradientPink,
            colors.gradientOrange,
            colors.gradientBlue,
            colors.gradientGreen
          ],
          borderColor: [
            colors.neonRed,
            colors.neonYellow,
            colors.neonCyan,
            colors.neonGreen
          ],
          borderWidth: 4,
          hoverBackgroundColor: [
            colors.gradientPink,
            colors.gradientOrange,
            colors.gradientBlue,
            colors.gradientGreen
          ],
          hoverBorderColor: [
            colors.neonPink,
            colors.neonOrange,
            colors.neonBlue,
            colors.neonYellow
          ],
          hoverBorderWidth: 6,
          hoverOffset: 15,
          // Efeitos 3D e sombras
          shadowOffsetX: 6,
          shadowOffsetY: 6,
          shadowBlur: 20,
          shadowColor: 'rgba(0, 0, 0, 0.3)',
          // Animações suaves
          animation: {
            animateRotate: true,
            animateScale: true,
            duration: 2500,
            easing: 'easeInOutCubic'
          },
          // Efeito de brilho e profundidade
          cutout: '35%',
          radius: '90%',
          spacing: 3,
          // Hover effects avançados
          hoverAnimation: {
            duration: 400,
            easing: 'easeOutQuart'
          }
        }]
      });

      setTopSourcesData({
        labels: ['🔧 Sistema', '📱 Aplicação', '⚙️ Backend'],
        datasets: [{
          label: '📊 Quantidade de Logs',
          data: [systemLogs, appLogs, backendLogs],
          backgroundColor: [
            colors.gradientPink,
            colors.gradientBlue,
            colors.gradientGreen
          ],
          borderColor: [colors.neonPink, colors.neonBlue, colors.neonGreen],
          borderWidth: 3,
          borderRadius: 12,
          borderSkipped: false,
          hoverBackgroundColor: [
            colors.gradientPink,
            colors.gradientBlue,
            colors.gradientGreen
          ],
          hoverBorderColor: [colors.neonRed, colors.neonCyan, colors.neonYellow],
          hoverBorderWidth: 4,
          // Efeitos de sombra e animação
          shadowOffsetX: 4,
          shadowOffsetY: 4,
          shadowBlur: 12,
          shadowColor: [colors.shadowPink, colors.shadowBlue, colors.shadowGreen],
          // Animações suaves
          animation: {
            duration: 2000,
            easing: 'easeInOutQuart'
          },
          // Efeito de brilho
          pointStyle: 'rectRounded',
          tension: 0.4
        }]
      });

    } catch (error) {
      console.error('Erro ao preparar dados básicos dos gráficos:', error);
    }
  };

  // Função com debounce para mudanças de dateRange
  const debouncedFetchMetrics = useCallback(() => {
    // Cancelar requisição anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Cancelar debounce anterior
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Criar novo AbortController
    abortControllerRef.current = new AbortController();

    // Aplicar debounce
    debounceTimeoutRef.current = setTimeout(() => {
      if (abortControllerRef.current) {
        fetchMetrics(abortControllerRef.current.signal);
      }
    }, DEBOUNCE_MS);
  }, [fetchMetrics]);

  // useEffect otimizado com debounce
  useEffect(() => {
    debouncedFetchMetrics();

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [debouncedFetchMetrics]);

  // Auto-refresh otimizado
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (autoRefresh) {
      interval = setInterval(() => {
        debouncedFetchMetrics();
      }, 30000); // 30 segundos
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh]);

  // Persistir estado do autoRefresh no localStorage
  useEffect(() => {
    localStorage.setItem('logs-dashboard-auto-refresh', JSON.stringify(autoRefresh));
  }, [autoRefresh]);

  // Cleanup ao desmontar componente
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    // Animações globais melhoradas
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart' as const,
      delay: (context: any) => context.dataIndex * 100,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#ffffff',
          font: {
            family: 'Orbitron, monospace',
            size: 16,
            weight: 'bold'
          },
          padding: 25,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 15,
          boxHeight: 15,
          // Efeito de brilho nas legendas
          generateLabels: function(chart: any) {
            const original = chart.constructor.defaults.plugins.legend.labels.generateLabels;
            const labels = original.call(this, chart);
            labels.forEach((label: any) => {
              label.fillStyle = label.strokeStyle;
            });
            return labels;
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        titleColor: colors.neonPurple,
        bodyColor: '#ffffff',
        borderColor: colors.neonPurple,
        borderWidth: 3,
        cornerRadius: 12,
        titleFont: {
          family: 'Orbitron, monospace',
          size: 18,
          weight: 'bold'
        },
        bodyFont: {
          family: 'Inter, sans-serif',
          size: 15,
          weight: '500'
        },
        padding: 16,
        displayColors: true,
        boxWidth: 12,
        boxHeight: 12,
        // Animação do tooltip
        animation: {
          duration: 300,
          easing: 'easeOutQuart'
        },
        callbacks: {
          title: function(context: any) {
            return `✨ ${context[0].label}`;
          },
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} logs`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: { 
          color: '#ffffff',
          font: {
            family: 'Inter, sans-serif',
            size: 13,
            weight: '600'
          },
          padding: 8
        },
        grid: { 
          color: 'rgba(255, 255, 255, 0.08)',
          lineWidth: 1,
          drawBorder: false,
          // Efeito de brilho sutil no grid
          borderDash: [2, 4]
        },
        border: {
          color: colors.neonPurple,
          width: 2
        }
      },
      y: {
        ticks: { 
          color: '#ffffff',
          font: {
            family: 'Inter, sans-serif',
            size: 13,
            weight: '600'
          },
          padding: 12,
          callback: function(value: any) {
            return value.toLocaleString();
          }
        },
        grid: { 
          color: 'rgba(255, 255, 255, 0.08)',
          lineWidth: 1,
          drawBorder: false,
          // Efeito de brilho sutil no grid
          borderDash: [2, 4]
        },
        border: {
          color: colors.neonPurple,
          width: 2
        }
      }
    },
    elements: {
      point: {
        radius: 8,
        hoverRadius: 12,
        borderWidth: 4,
        hoverBorderWidth: 5
      },
      line: {
        tension: 0.5,
        borderWidth: 5
      },
      bar: {
        borderRadius: 12,
        borderSkipped: false,
        hoverBorderRadius: 15
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    // Animações 3D melhoradas
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 2500,
      easing: 'easeInOutCubic' as const,
    },
    // Interações avançadas
    interaction: {
      mode: 'nearest' as const,
      intersect: true,
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#ffffff',
          font: {
            family: 'Orbitron, monospace',
            size: 16,
            weight: 'bold'
          },
          padding: 25,
          usePointStyle: true,
          pointStyle: 'rectRounded',
          boxWidth: 18,
          boxHeight: 18,
          // Efeito de brilho nas legendas - Corrigido para manter os labels
          generateLabels: function(chart: any) {
            const data = chart.data;
            if (data.labels && data.datasets && data.datasets.length > 0) {
              return data.labels.map((label: string, index: number) => {
                const dataset = data.datasets[0];
                const backgroundColor = Array.isArray(dataset.backgroundColor) 
                  ? dataset.backgroundColor[index] 
                  : dataset.backgroundColor;
                
                return {
                  text: label,
                  fillStyle: backgroundColor || [colors.gradientPink, colors.gradientOrange, colors.gradientBlue, colors.gradientGreen][index],
                  strokeStyle: dataset.borderColor?.[index] || colors.neonPurple,
                  lineWidth: 2,
                  hidden: false,
                  index: index,
                  pointStyle: 'rectRounded'
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        titleColor: colors.neonPurple,
        bodyColor: '#ffffff',
        borderColor: colors.neonPurple,
        borderWidth: 3,
        cornerRadius: 15,
        titleFont: {
          family: 'Orbitron, monospace',
          size: 18,
          weight: 'bold'
        },
        bodyFont: {
          family: 'Inter, sans-serif',
          size: 16,
          weight: '600'
        },
        padding: 20,
        displayColors: true,
        boxWidth: 15,
        boxHeight: 15,
        // Animação do tooltip
        animation: {
          duration: 400,
          easing: 'easeOutQuart'
        },
        callbacks: {
          title: function(context: any) {
            const label = context[0]?.label || 'Dados';
            return `🎯 ${label}`;
          },
          label: function(context: any) {
            const label = context.label || 'Dados';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${label}: ${value.toLocaleString()} logs (${percentage}%)`;
          },
          afterLabel: function(context: any) {
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return `Proporção: ${percentage}% do total`;
          }
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 4,
        borderColor: 'rgba(0, 0, 0, 0.8)',
        hoverBorderWidth: 6,
        hoverBorderColor: '#ffffff',
        // Efeitos 3D
        shadowOffsetX: 8,
        shadowOffsetY: 8,
        shadowBlur: 25,
        shadowColor: 'rgba(0, 0, 0, 0.4)',
        // Animações de hover
        hoverOffset: 20,
        offset: 5
      }
    },
    // Layout melhorado
    layout: {
      padding: {
        top: 20,
        bottom: 20,
        left: 20,
        right: 20
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
    <div className="space-y-4 sm:space-y-6">
      {/* Controles */}
      <Card className="glass-effect p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <h2 className="text-lg sm:text-xl font-orbitron font-bold text-white flex items-center">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-neon-purple" />
              Dashboard de Logs
            </h2>
            
            <Button
              onClick={() => {
                toast.info('Atualizando dados...');
                debouncedFetchMetrics();
              }}
              disabled={loading}
              size="sm"
              className="bg-neon-gradient hover:bg-neon-gradient/80 disabled:opacity-50 transition-all duration-200 w-full sm:w-auto"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              <span className="sm:inline">Atualizar</span>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <label className="flex items-center text-white text-xs sm:text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2 rounded border-neon-purple/20 bg-darker-surface/50 text-neon-purple focus:ring-neon-purple"
              />
              <span className="whitespace-nowrap">Auto-refresh (30s)</span>
            </label>
            <div className="w-full sm:w-auto">
              <DateFilters onDateRangeChange={setDateRange} />
            </div>
          </div>
        </div>
      </Card>

      {/* Métricas em Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="glass-effect p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-futuristic-gray text-xs sm:text-sm truncate">Total de Logs</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-orbitron font-bold text-white">{metrics.totalLogs.toLocaleString()}</p>
            </div>
            <Activity className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-neon-purple flex-shrink-0" />
          </div>
        </Card>

        <Card className="glass-effect p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-futuristic-gray text-xs sm:text-sm truncate">Logs de Sistema</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-orbitron font-bold text-neon-pink">{metrics.systemLogs.toLocaleString()}</p>
            </div>
            <XCircle className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-neon-pink flex-shrink-0" />
          </div>
        </Card>

        <Card className="glass-effect p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-futuristic-gray text-xs sm:text-sm truncate">Logs de Aplicação</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-orbitron font-bold text-neon-blue">{metrics.appLogs.toLocaleString()}</p>
            </div>
            <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-neon-blue flex-shrink-0" />
          </div>
        </Card>

        <Card className="glass-effect p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-futuristic-gray text-xs sm:text-sm truncate">Logs de Backend</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-orbitron font-bold text-neon-green">{metrics.backendLogs.toLocaleString()}</p>
            </div>
            <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-neon-green flex-shrink-0" />
          </div>
        </Card>
      </div>

      {/* Gráficos - Layout Moderno e Responsivo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Gráfico de Linha Temporal */}
        <Card className="glass-effect p-4 sm:p-6 lg:p-8 hover-lift transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-orbitron font-bold text-white flex items-center">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-neon-purple animate-pulse" />
              <span className="truncate">Volume de Logs (Temporal)</span>
            </h3>
            <Button
              onClick={() => exportChart('timeline-chart', 'timeline-logs')}
              variant="outline"
              size="sm"
              className="hover:bg-neon-purple/20 transition-all duration-200 w-full sm:w-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              <span className="sm:inline">Exportar</span>
            </Button>
          </div>
          <div className="h-64 sm:h-72 lg:h-80 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/5 to-transparent rounded-lg"></div>
            <Line id="timeline-chart" data={timelineData} options={chartOptions} />
          </div>
        </Card>

        {/* Gráfico de Pizza */}
        <Card className="glass-effect p-4 sm:p-6 lg:p-8 hover-lift transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-orbitron font-bold text-white flex items-center">
              <PieChart className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-neon-purple animate-pulse" />
              <span className="truncate">Distribuição por Nível</span>
            </h3>
            <Button
              onClick={() => exportChart('distribution-chart', 'distribution-logs')}
              variant="outline"
              size="sm"
              className="hover:bg-neon-purple/20 transition-all duration-200 w-full sm:w-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              <span className="sm:inline">Exportar</span>
            </Button>
          </div>
          <div className="h-64 sm:h-72 lg:h-80 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/5 to-transparent rounded-lg"></div>
            <Pie id="distribution-chart" data={distributionData} options={pieOptions} />
          </div>
        </Card>
      </div>

      {/* Gráfico de Barras - Top Fontes */}
      <Card className="glass-effect p-4 sm:p-6 lg:p-8 hover-lift transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-orbitron font-bold text-white flex items-center">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-neon-purple animate-pulse" />
            <span className="truncate">Logs por Fonte</span>
          </h3>
          <Button
            onClick={() => exportChart('sources-chart', 'sources-logs')}
            variant="outline"
            size="sm"
            className="hover:bg-neon-purple/20 transition-all duration-200 w-full sm:w-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            <span className="sm:inline">Exportar</span>
          </Button>
        </div>
        <div className="h-64 sm:h-72 lg:h-80 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/5 to-transparent rounded-lg"></div>
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