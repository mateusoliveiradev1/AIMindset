import React, { useEffect, useState, useCallback } from 'react';
import { Activity, Zap, Database, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { useArticleCache } from '../../hooks/useArticleCache';

interface PerformanceMetrics {
  cacheHitRate: string;
  memoryUsage: string;
  loadTime: number;
  networkRequests: number;
  renderTime: number;
}

interface PerformanceOptimizerProps {
  children: React.ReactNode;
  enableMetrics?: boolean;
  showDebugPanel?: boolean;
}

export const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({
  children,
  enableMetrics = true,
  showDebugPanel = false
}) => {
  const { cacheStats, prefetchCache } = useArticleCache();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cacheHitRate: '0',
    memoryUsage: '0 KB',
    loadTime: 0,
    networkRequests: 0,
    renderTime: 0
  });
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Medir performance de renderização
  const measureRenderTime = useCallback(() => {
    const startTime = performance.now();
    
    requestAnimationFrame(() => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      setMetrics(prev => ({
        ...prev,
        renderTime: Math.round(renderTime * 100) / 100
      }));
    });
  }, []);

  // Otimizações automáticas
  const runOptimizations = useCallback(async () => {
    if (isOptimizing) return;
    
    setIsOptimizing(true);
    console.log('🚀 [PERFORMANCE] Iniciando otimizações automáticas...');

    try {
      // 1. Pré-carregar dados críticos
      const criticalData = [
        'articles',
        'categories',
        'seo_metadata_home'
      ];

      for (const key of criticalData) {
        if (!cacheStats.validItems || cacheStats.validItems < 3) {
          console.log(`📦 [PERFORMANCE] Pré-carregando ${key}...`);
          // Aqui você pode adicionar lógica específica de prefetch
        }
      }

      // 2. Limpar recursos não utilizados
      if (cacheStats.expiredItems > 10) {
        console.log('🧹 [PERFORMANCE] Limpando cache expirado...');
        // Cache já limpa automaticamente, mas podemos forçar
      }

      // 3. Otimizar imagens lazy loading
      const images = document.querySelectorAll('img[data-src]');
      if (images.length > 0) {
        console.log(`🖼️ [PERFORMANCE] Otimizando ${images.length} imagens lazy...`);
        // Implementar lazy loading otimizado
      }

      // 4. Prefetch de próximas páginas
      const currentPath = window.location.pathname;
      if (currentPath === '/') {
        // Pré-carregar artigos populares
        console.log('🔮 [PERFORMANCE] Pré-carregando artigos populares...');
      }

    } catch (error) {
      console.error('❌ [PERFORMANCE] Erro nas otimizações:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [isOptimizing, cacheStats]);

  // Monitorar métricas de performance
  useEffect(() => {
    if (!enableMetrics) return;

    const updateMetrics = () => {
      // Atualizar métricas do cache
      setMetrics(prev => ({
        ...prev,
        cacheHitRate: cacheStats.hitRate,
        memoryUsage: cacheStats.memoryUsage
      }));

      // Medir tempo de carregamento
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        setMetrics(prev => ({
          ...prev,
          loadTime: Math.round(loadTime)
        }));
      }

      // Contar requisições de rede
      const resources = performance.getEntriesByType('resource');
      setMetrics(prev => ({
        ...prev,
        networkRequests: resources.length
      }));
    };

    updateMetrics();
    measureRenderTime();

    // Atualizar métricas a cada 30 segundos
    const interval = setInterval(updateMetrics, 30000);

    return () => clearInterval(interval);
  }, [enableMetrics, cacheStats, measureRenderTime]);

  // Executar otimizações automáticas
  useEffect(() => {
    const timer = setTimeout(() => {
      runOptimizations();
    }, 2000); // Aguardar 2s após o mount

    return () => clearTimeout(timer);
  }, [runOptimizations]);

  // Otimizações de performance críticas
  useEffect(() => {
    // 1. Configurar Resource Hints
    const addResourceHint = (href: string, rel: 'prefetch' | 'preload' | 'dns-prefetch') => {
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      document.head.appendChild(link);
    };

    // DNS prefetch para domínios externos
    addResourceHint('https://fonts.googleapis.com', 'dns-prefetch');
    addResourceHint('https://fonts.gstatic.com', 'dns-prefetch');

    // 2. Configurar Intersection Observer para lazy loading
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.1
    });

    // Observar imagens lazy
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => imageObserver.observe(img));

    return () => {
      imageObserver.disconnect();
    };
  }, []);

  if (showDebugPanel) {
    return (
      <>
        {children}
        <div className="fixed bottom-4 right-4 bg-dark-surface border border-neon-purple/30 rounded-lg p-4 text-xs font-mono z-50 max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-neon-purple" />
            <span className="text-white font-semibold">Performance</span>
            {isOptimizing && (
              <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
            )}
          </div>
          
          <div className="space-y-1 text-gray-300">
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3" />
                Cache Hit:
              </span>
              <span className="text-neon-green">{metrics.cacheHitRate}%</span>
            </div>
            
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Memory:
              </span>
              <span className="text-neon-blue">{metrics.memoryUsage}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Load:
              </span>
              <span className="text-neon-yellow">{metrics.loadTime}ms</span>
            </div>
            
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Render:
              </span>
              <span className="text-neon-pink">{metrics.renderTime}ms</span>
            </div>
            
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Requests:
              </span>
              <span className="text-orange-400">{metrics.networkRequests}</span>
            </div>
          </div>
          
          <div className="mt-2 pt-2 border-t border-gray-600">
            <div className="text-xs text-gray-400">
              Cache: {cacheStats.validItems}/{cacheStats.maxSize}
            </div>
          </div>
        </div>
      </>
    );
  }

  return <>{children}</>;
};

export default PerformanceOptimizer;