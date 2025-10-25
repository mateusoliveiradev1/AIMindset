import React, { useEffect, useState } from 'react';

interface PerformanceMetrics {
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
}

interface PerformanceMonitorProps {
  showMetrics?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  showMetrics = false,
  onMetricsUpdate
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null
  });

  useEffect(() => {
    // Função para medir Web Vitals
    const measureWebVitals = () => {
      // Largest Contentful Paint (LCP)
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            if (lastEntry) {
              const lcpValue = lastEntry.startTime;
              setMetrics(prev => ({ ...prev, lcp: lcpValue }));
              console.log(`🎯 LCP: ${lcpValue.toFixed(2)}ms`);
            }
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // First Contentful Paint (FCP)
          const fcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              if (entry.name === 'first-contentful-paint') {
                const fcpValue = entry.startTime;
                setMetrics(prev => ({ ...prev, fcp: fcpValue }));
                console.log(`🎨 FCP: ${fcpValue.toFixed(2)}ms`);
              }
            });
          });
          fcpObserver.observe({ entryTypes: ['paint'] });

          // Cumulative Layout Shift (CLS)
          const clsObserver = new PerformanceObserver((list) => {
            let clsValue = 0;
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            });
            setMetrics(prev => ({ ...prev, cls: clsValue }));
            console.log(`📐 CLS: ${clsValue.toFixed(4)}`);
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });

          // First Input Delay (FID)
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              const fidValue = entry.processingStart - entry.startTime;
              setMetrics(prev => ({ ...prev, fid: fidValue }));
              console.log(`⚡ FID: ${fidValue.toFixed(2)}ms`);
            });
          });
          fidObserver.observe({ entryTypes: ['first-input'] });

        } catch (error) {
          console.warn('⚠️ PerformanceObserver não suportado:', error);
        }
      }

      // Time to First Byte (TTFB)
      if (performance.timing) {
        const ttfbValue = performance.timing.responseStart - performance.timing.requestStart;
        setMetrics(prev => ({ ...prev, ttfb: ttfbValue }));
        console.log(`🌐 TTFB: ${ttfbValue}ms`);
      }
    };

    // Medir performance após carregamento
    if (document.readyState === 'complete') {
      measureWebVitals();
    } else {
      window.addEventListener('load', measureWebVitals);
      return () => window.removeEventListener('load', measureWebVitals);
    }
  }, []);

  // Callback para métricas atualizadas
  useEffect(() => {
    if (onMetricsUpdate) {
      onMetricsUpdate(metrics);
    }
  }, [metrics, onMetricsUpdate]);

  // Função para avaliar performance
  const getPerformanceScore = (metric: keyof PerformanceMetrics, value: number | null): string => {
    if (value === null) return 'pending';

    switch (metric) {
      case 'lcp':
        return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
      case 'fid':
        return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
      case 'cls':
        return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
      case 'fcp':
        return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
      case 'ttfb':
        return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
      default:
        return 'pending';
    }
  };

  // Função para formatar valores
  const formatMetric = (metric: keyof PerformanceMetrics, value: number | null): string => {
    if (value === null) return 'Medindo...';
    
    switch (metric) {
      case 'cls':
        return value.toFixed(4);
      case 'lcp':
      case 'fid':
      case 'fcp':
      case 'ttfb':
        return `${value.toFixed(0)}ms`;
      default:
        return value.toString();
    }
  };

  if (!showMetrics) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border z-50 max-w-sm">
      <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">
        📊 Performance Metrics
      </h3>
      
      <div className="space-y-2 text-xs">
        {Object.entries(metrics).map(([key, value]) => {
          const score = getPerformanceScore(key as keyof PerformanceMetrics, value);
          const scoreColor = score === 'good' ? 'text-green-600' : 
                           score === 'needs-improvement' ? 'text-yellow-600' : 
                           score === 'poor' ? 'text-red-600' : 'text-gray-500';
          
          return (
            <div key={key} className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-300 uppercase">
                {key}:
              </span>
              <span className={`font-mono ${scoreColor}`}>
                {formatMetric(key as keyof PerformanceMetrics, value)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          🎯 LCP: Largest Contentful Paint<br/>
          ⚡ FID: First Input Delay<br/>
          📐 CLS: Cumulative Layout Shift<br/>
          🎨 FCP: First Contentful Paint<br/>
          🌐 TTFB: Time to First Byte
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;