import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '../UI/Card';

interface PerformanceMetrics {
  // Web Vitals
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte

  // Runtime Performance
  memoryUsage: number;
  jsHeapSize: number;
  domNodes: number;
  fps: number;
  renderTime: number;

  // Network
  networkType: string;
  downlink: number;
  rtt: number;

  // Custom Metrics
  componentRenderCount: number;
  apiCallsCount: number;
  errorCount: number;
  
  timestamp: number;
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
}

interface PerformanceMonitorProps {
  isVisible?: boolean;
  alertThresholds?: {
    fcp?: number;
    lcp?: number;
    fid?: number;
    cls?: number;
    memoryUsage?: number;
    fps?: number;
  };
  onAlert?: (alert: PerformanceAlert) => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isVisible = false,
  alertThresholds = {
    fcp: 1200,
    lcp: 2000,
    fid: 50,
    cls: 0.1,
    memoryUsage: 100 * 1024 * 1024, // 100MB
    fps: 50
  },
  onAlert
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [history, setHistory] = useState<PerformanceMetrics[]>([]);
  
  const intervalRef = useRef<NodeJS.Timeout>();
  const frameRef = useRef<number>();
  const renderCountRef = useRef(0);
  const apiCallsRef = useRef(0);
  const errorCountRef = useRef(0);
  const fpsCounterRef = useRef({ frames: 0, lastTime: 0 });

  // Coletar métricas de performance
  const collectMetrics = useCallback((): PerformanceMetrics => {
    const now = performance.now();
    
    // Web Vitals (simulados se não disponíveis)
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
    const lcp = 0; // Seria coletado via PerformanceObserver em produção
    const fid = 0; // Seria coletado via PerformanceObserver em produção
    const cls = 0; // Seria coletado via PerformanceObserver em produção
    const ttfb = navigation?.responseStart - navigation?.requestStart || 0;

    // Memória (se disponível)
    const memory = (performance as any).memory;
    const memoryUsage = memory?.usedJSHeapSize || 0;
    const jsHeapSize = memory?.totalJSHeapSize || 0;

    // DOM
    const domNodes = document.querySelectorAll('*').length;

    // Network (se disponível)
    const connection = (navigator as any).connection;
    const networkType = connection?.effectiveType || 'unknown';
    const downlink = connection?.downlink || 0;
    const rtt = connection?.rtt || 0;

    // FPS
    const fps = calculateFPS();

    return {
      fcp,
      lcp,
      fid,
      cls,
      ttfb,
      memoryUsage,
      jsHeapSize,
      domNodes,
      fps,
      renderTime: now,
      networkType,
      downlink,
      rtt,
      componentRenderCount: renderCountRef.current,
      apiCallsCount: apiCallsRef.current,
      errorCount: errorCountRef.current,
      timestamp: Date.now()
    };
  }, []);

  // Calcular FPS
  const calculateFPS = useCallback((): number => {
    const now = performance.now();
    const counter = fpsCounterRef.current;
    
    counter.frames++;
    
    if (now - counter.lastTime >= 1000) {
      const fps = Math.round((counter.frames * 1000) / (now - counter.lastTime));
      counter.frames = 0;
      counter.lastTime = now;
      return fps;
    }
    
    return 60; // Default
  }, []);

  // Verificar alertas
  const checkAlerts = useCallback((currentMetrics: PerformanceMetrics) => {
    const newAlerts: PerformanceAlert[] = [];

    // Verificar cada threshold
    Object.entries(alertThresholds).forEach(([metric, threshold]) => {
      const value = currentMetrics[metric as keyof PerformanceMetrics] as number;
      
      if (value > threshold) {
        const alert: PerformanceAlert = {
          id: `${metric}_${Date.now()}`,
          type: value > threshold * 1.5 ? 'error' : 'warning',
          metric,
          value,
          threshold,
          message: `${metric.toUpperCase()} está acima do limite: ${value.toFixed(2)} > ${threshold}`,
          timestamp: Date.now()
        };
        
        newAlerts.push(alert);
        
        if (onAlert) {
          onAlert(alert);
        }
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts].slice(-10)); // Manter apenas os 10 mais recentes
    }
  }, [alertThresholds, onAlert]);

  // Iniciar monitoramento
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    setIsMonitoring(true);
    
    // Coletar métricas a cada segundo
    intervalRef.current = setInterval(() => {
      const currentMetrics = collectMetrics();
      setMetrics(currentMetrics);
      
      // Adicionar ao histórico (manter apenas os últimos 60 pontos)
      setHistory(prev => [...prev, currentMetrics].slice(-60));
      
      // Verificar alertas
      checkAlerts(currentMetrics);
    }, 1000);

    // Contador de FPS
    const fpsLoop = () => {
      calculateFPS();
      frameRef.current = requestAnimationFrame(fpsLoop);
    };
    frameRef.current = requestAnimationFrame(fpsLoop);

  }, [isMonitoring, collectMetrics, checkAlerts, calculateFPS]);

  // Parar monitoramento
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
  }, []);

  // Limpar alertas
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Incrementar contadores
  const incrementRenderCount = useCallback(() => {
    renderCountRef.current++;
  }, []);

  const incrementApiCalls = useCallback(() => {
    apiCallsRef.current++;
  }, []);

  const incrementErrorCount = useCallback(() => {
    errorCountRef.current++;
  }, []);

  // Resetar contadores
  const resetCounters = useCallback(() => {
    renderCountRef.current = 0;
    apiCallsRef.current = 0;
    errorCountRef.current = 0;
  }, []);

  // Efeitos
  useEffect(() => {
    if (isVisible) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [isVisible, startMonitoring, stopMonitoring]);

  // Interceptar erros globais
  useEffect(() => {
    const handleError = () => {
      incrementErrorCount();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, [incrementErrorCount]);

  // Formatação de valores
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getMetricColor = (value: number, threshold: number): string => {
    if (value > threshold * 1.5) return 'text-red-500';
    if (value > threshold) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="bg-dark-surface/95 backdrop-blur-sm border border-futuristic-gray">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Performance Monitor</h3>
          <div className="flex gap-2">
            <button
              onClick={clearAlerts}
              className="text-xs px-2 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Limpar Alertas
            </button>
            <button
              onClick={resetCounters}
              className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-futuristic-gray">
              {isMonitoring ? 'Monitorando' : 'Parado'}
            </span>
          </div>
        </div>

        {/* Métricas Principais */}
        {metrics && (
          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-futuristic-gray">FCP:</span>
                <span className={`ml-2 ${getMetricColor(metrics.fcp, alertThresholds.fcp!)}`}>
                  {metrics.fcp.toFixed(0)}ms
                </span>
              </div>
              <div>
                <span className="text-futuristic-gray">LCP:</span>
                <span className={`ml-2 ${getMetricColor(metrics.lcp, alertThresholds.lcp!)}`}>
                  {metrics.lcp.toFixed(0)}ms
                </span>
              </div>
              <div>
                <span className="text-futuristic-gray">Memória:</span>
                <span className={`ml-2 ${getMetricColor(metrics.memoryUsage, alertThresholds.memoryUsage!)}`}>
                  {formatBytes(metrics.memoryUsage)}
                </span>
              </div>
              <div>
                <span className="text-futuristic-gray">FPS:</span>
                <span className={`ml-2 ${getMetricColor(60 - metrics.fps, 60 - alertThresholds.fps!)}`}>
                  {metrics.fps}
                </span>
              </div>
              <div>
                <span className="text-futuristic-gray">DOM:</span>
                <span className="ml-2 text-white">{metrics.domNodes}</span>
              </div>
              <div>
                <span className="text-futuristic-gray">Renders:</span>
                <span className="ml-2 text-white">{metrics.componentRenderCount}</span>
              </div>
            </div>
          </div>
        )}

        {/* Alertas */}
        {alerts.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-white mb-2">Alertas Recentes</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {alerts.slice(-3).map(alert => (
                <div
                  key={alert.id}
                  className={`text-xs p-2 rounded ${
                    alert.type === 'error' 
                      ? 'bg-red-900/50 text-red-200' 
                      : 'bg-yellow-900/50 text-yellow-200'
                  }`}
                >
                  {alert.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gráfico Simples de Memória */}
        {history.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-white mb-2">Uso de Memória (últimos 60s)</h4>
            <div className="h-16 bg-darker-surface rounded flex items-end gap-1 p-1">
              {history.slice(-30).map((metric, index) => {
                const height = Math.min((metric.memoryUsage / (100 * 1024 * 1024)) * 100, 100);
                return (
                  <div
                    key={index}
                    className="bg-lime-green flex-1 rounded-sm"
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Network Info */}
        {metrics && (
          <div className="text-xs text-futuristic-gray">
            <div>Rede: {metrics.networkType}</div>
            {metrics.downlink > 0 && (
              <div>Velocidade: {metrics.downlink} Mbps</div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

// Hook para usar o monitor de performance
export const usePerformanceMonitor = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  const show = useCallback(() => setIsVisible(true), []);
  const hide = useCallback(() => setIsVisible(false), []);
  const toggle = useCallback(() => setIsVisible(prev => !prev), []);

  return {
    isVisible,
    show,
    hide,
    toggle,
    PerformanceMonitor
  };
};

export default PerformanceMonitor;