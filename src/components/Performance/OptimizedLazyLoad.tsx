import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { logEvent } from '@/lib/logging';

interface OptimizedLazyLoadProps {
  component: React.LazyExoticComponent<any>;
  componentName: string;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  timeout?: number;
  retryCount?: number;
}

// Fallback otimizado com skeleton e métricas
const OptimizedFallback: React.FC<{ componentName: string }> = ({ componentName }) => (
  <div className="w-full animate-pulse">
    <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-6 space-y-4">
      <div className="h-4 bg-gray-300 rounded w-1/4"></div>
      <div className="h-8 bg-gray-300 rounded w-3/4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-300 rounded"></div>
        <div className="h-4 bg-gray-300 rounded w-5/6"></div>
        <div className="h-4 bg-gray-300 rounded w-4/6"></div>
      </div>
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Carregando {componentName}...</span>
      </div>
    </div>
  </div>
);

// Fallback de erro com retry automático
const OptimizedErrorFallback: React.FC<{ 
  componentName: string; 
  error: Error; 
  onRetry: () => void;
  retryCount: number;
}> = ({ componentName, error, onRetry, retryCount }) => (
  <div className="w-full p-6 bg-red-50 border border-red-200 rounded-lg">
    <div className="flex items-center space-x-3 mb-4">
      <AlertTriangle className="h-6 w-6 text-red-500" />
      <div>
        <h3 className="text-lg font-semibold text-red-800">Erro ao carregar {componentName}</h3>
        <p className="text-sm text-red-600 mt-1">{error.message}</p>
      </div>
    </div>
    <div className="flex items-center space-x-3">
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        disabled={retryCount >= 3}
      >
        Tentar novamente {retryCount > 0 ? `(${retryCount}/3)` : ''}
      </button>
      {retryCount >= 3 && (
        <span className="text-sm text-red-600">Máximo de tentativas atingido</span>
      )}
    </div>
  </div>
);

export const OptimizedLazyLoad: React.FC<OptimizedLazyLoadProps> = ({
  component: Component,
  componentName,
  fallback = <OptimizedFallback componentName={componentName} />,
  errorFallback,
  timeout = 10000, // 10 segundos de timeout padrão
  retryCount = 3
}) => {
  const [error, setError] = useState<Error | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [startTime, setStartTime] = useState(performance.now());
  const [componentKey, setComponentKey] = useState(0);
  const timerRef = useRef<number | null>(null);
  const loadedRef = useRef<boolean>(false);

  useEffect(() => {
    const loadTime = performance.now() - startTime;
    logEvent('info', 'lazy_load', 'slow_load', {
      component: componentName,
      loadTime: Math.round(loadTime),
      retryAttempt,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });

    if (loadTime > 5000) {
      logEvent('info', 'lazy_load', 'component_loaded', {
        component: componentName,
        loadTime: Math.round(loadTime),
        threshold: 5000
      });
    }
  }, [componentName, startTime, retryAttempt]);

  const handleRetry = () => {
    if (retryAttempt < retryCount) {
      setRetryAttempt(prev => prev + 1);
      setError(null);
      loadedRef.current = false;
      setStartTime(performance.now());
      // Remontar o componente sem recarregar a página
      setComponentKey(prev => prev + 1);
    }
  };

  // Timeout para carregamento com cancelamento quando carregar
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    loadedRef.current = false;
    timerRef.current = window.setTimeout(() => {
      if (!loadedRef.current && !error) {
        setError(new Error(`Timeout ao carregar ${componentName} após ${timeout}ms`));
      }
    }, timeout);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [componentName, timeout, error, componentKey]);

  const markLoaded = () => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const LoadedMarker: React.FC<{ onLoaded: () => void; Comp: any; }> = ({ onLoaded, Comp }) => {
    useEffect(() => {
      onLoaded();
    }, [onLoaded]);
    return <Comp />;
  };

  if (error) {
    return errorFallback || (
      <OptimizedErrorFallback
        componentName={componentName}
        error={error}
        onRetry={handleRetry}
        retryCount={retryAttempt}
      />
    );
  }

  return (
    <Suspense fallback={fallback}>
      {/* Marca como carregado ao renderizar o componente resolvido do lazy */}
      <LoadedMarker key={componentKey} onLoaded={markLoaded} Comp={Component} />
    </Suspense>
  );
};

// Componentes otimizados para lazy loading estratégico
export const OptimizedAdminLogs = () => (
  <OptimizedLazyLoad
    component={lazy(() => import('@/pages/admin/logs').then(m => ({ default: m.default })))}
    componentName="Logs & Monitoramento"
    timeout={15000} // Logs podem demorar mais
  />
);

export const OptimizedAdminBackup = () => (
  <OptimizedLazyLoad
    component={lazy(() => import('@/pages/admin/backup').then(m => ({ default: m.default })))}
    componentName="Backup & Restore"
    timeout={12000} // Backup tem operações pesadas
  />
);

export const OptimizedAdminNewsletter = () => (
  <OptimizedLazyLoad
    component={lazy(() => import('@/pages/admin/newsletter').then(m => ({ default: m.default })))}
    componentName="Newsletter"
    timeout={20000}
  />
);

export const OptimizedAdminFeedback = () => (
  <OptimizedLazyLoad
    component={lazy(() => import('@/pages/admin/feedback').then(m => ({ default: m.default })))}
    componentName="Feedback Management"
    timeout={8000}
  />
);

// Hook para monitorar performance de lazy loading
export const useLazyLoadMetrics = () => {
  const [metrics, setMetrics] = useState({
    totalLoads: 0,
    successfulLoads: 0,
    failedLoads: 0,
    averageLoadTime: 0,
    slowLoads: 0
  });

  const recordLoad = (success: boolean, loadTime: number, componentName: string) => {
    setMetrics(prev => ({
      totalLoads: prev.totalLoads + 1,
      successfulLoads: prev.successfulLoads + (success ? 1 : 0),
      failedLoads: prev.failedLoads + (success ? 0 : 1),
      averageLoadTime: prev.totalLoads === 0 
        ? loadTime 
        : (prev.averageLoadTime * prev.totalLoads + loadTime) / (prev.totalLoads + 1),
      slowLoads: prev.slowLoads + (loadTime > 3000 ? 1 : 0)
    }));

    // Log de métricas agregadas
    logEvent('info', 'lazy_load', 'metrics_collected', {
      component: componentName,
      success,
      loadTime: Math.round(loadTime),
      totalLoads: metrics.totalLoads + 1,
      successRate: ((metrics.successfulLoads + (success ? 1 : 0)) / (metrics.totalLoads + 1) * 100).toFixed(1)
    });
  };

  return { metrics, recordLoad };
};

export default OptimizedLazyLoad;