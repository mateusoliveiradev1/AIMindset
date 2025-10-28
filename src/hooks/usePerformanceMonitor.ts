// Hook EXTREMO para monitoramento de performance invisível
import { useEffect, useRef, useCallback } from 'react';
import { initWebVitals, getWebVitalsMonitor } from '../utils/webVitals';

interface PerformanceConfig {
  enableWebVitals?: boolean;
  enableResourceMonitoring?: boolean;
  enableIntersectionObserver?: boolean;
  enableIdleCallback?: boolean;
  reportingThreshold?: number;
}

export function usePerformanceMonitor(config: PerformanceConfig = {}) {
  const {
    enableWebVitals = true,
    enableResourceMonitoring = true,
    enableIntersectionObserver = true,
    enableIdleCallback = true,
    reportingThreshold = 1000
  } = config;

  const webVitalsRef = useRef<any>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const performanceDataRef = useRef<{
    renderStart: number;
    renderEnd: number;
    componentMounts: number;
    rerenders: number;
  }>({
    renderStart: 0,
    renderEnd: 0,
    componentMounts: 0,
    rerenders: 0
  });

  // Inicializar Web Vitals
  useEffect(() => {
    if (enableWebVitals && !webVitalsRef.current) {
      webVitalsRef.current = initWebVitals();
    }
  }, [enableWebVitals]);

  // Monitoramento de recursos críticos
  const monitorCriticalResources = useCallback(() => {
    if (!enableResourceMonitoring) return;

    // Usar RequestIdleCallback para não bloquear thread principal
    const scheduleMonitoring = (callback: () => void) => {
      if (enableIdleCallback && 'requestIdleCallback' in window) {
        requestIdleCallback(callback, { timeout: 5000 });
      } else {
        setTimeout(callback, 0);
      }
    };

    scheduleMonitoring(() => {
      // Monitorar recursos lentos
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const slowResources = resources.filter(resource => resource.duration > reportingThreshold);
      
      if (slowResources.length > 0 && process.env.NODE_ENV === 'development') {
        console.warn('[Performance] Recursos lentos detectados:', 
          slowResources.map(r => ({ name: r.name, duration: r.duration }))
        );
      }

      // Monitorar memory usage (se disponível)
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
          console.warn('[Performance] Alto uso de memória detectado:', {
            used: memory.usedJSHeapSize,
            limit: memory.jsHeapSizeLimit,
            percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit * 100).toFixed(2) + '%'
          });
        }
      }
    });
  }, [enableResourceMonitoring, enableIdleCallback, reportingThreshold]);

  // Intersection Observer para lazy loading otimizado
  const createIntersectionObserver = useCallback(() => {
    if (!enableIntersectionObserver || intersectionObserverRef.current) return;

    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: '50px',
      threshold: [0, 0.1, 0.5, 1.0]
    };

    intersectionObserverRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const element = entry.target as HTMLElement;
        
        // Otimização: só processar elementos visíveis
        if (entry.isIntersecting) {
          // Marcar elemento como visível para otimizações futuras
          element.setAttribute('data-visible', 'true');
          
          // Trigger lazy loading se necessário
          if (element.hasAttribute('data-lazy')) {
            const src = element.getAttribute('data-src');
            if (src && element.tagName === 'IMG') {
              (element as HTMLImageElement).src = src;
              element.removeAttribute('data-lazy');
              element.removeAttribute('data-src');
            }
          }
        } else {
          element.setAttribute('data-visible', 'false');
        }
      });
    }, options);

    // Observar elementos lazy
    const lazyElements = document.querySelectorAll('[data-lazy]');
    lazyElements.forEach(el => intersectionObserverRef.current?.observe(el));

  }, [enableIntersectionObserver]);

  // Monitoramento de renderização de componentes
  const trackComponentRender = useCallback((componentName: string, isMount: boolean = false) => {
    const now = performance.now();
    
    if (isMount) {
      performanceDataRef.current.componentMounts++;
      performanceDataRef.current.renderStart = now;
    } else {
      performanceDataRef.current.rerenders++;
    }

    performanceDataRef.current.renderEnd = now;

    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      const renderTime = now - performanceDataRef.current.renderStart;
      if (renderTime > 16.67) { // Mais que 1 frame (60fps)
        console.warn(`[Performance] Render lento em ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    }
  }, []);

  // Otimização de scroll performance
  const optimizeScrollPerformance = useCallback(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Processar scroll de forma otimizada
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          
          // Otimizar elementos baseado na posição do scroll
          if (scrollTop > 100) {
            document.body.classList.add('scrolled');
          } else {
            document.body.classList.remove('scrolled');
          }
          
          ticking = false;
        });
        ticking = true;
      }
    };

    // Usar passive listener para melhor performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Preload crítico de recursos
  const preloadCriticalResources = useCallback(() => {
    const criticalResources = [
      '/src/pages/Home.tsx',
      '/src/components/ui/Button.tsx',
      '/src/components/ui/Card.tsx'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'modulepreload';
      link.href = resource;
      document.head.appendChild(link);
    });
  }, []);

  // Performance budget monitoring
  const monitorPerformanceBudget = useCallback(() => {
    const scheduleCheck = (callback: () => void) => {
      if (enableIdleCallback && 'requestIdleCallback' in window) {
        requestIdleCallback(callback, { timeout: 10000 });
      } else {
        setTimeout(callback, 5000);
      }
    };

    scheduleCheck(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const metrics = {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstByte: navigation.responseStart - navigation.requestStart,
          domInteractive: navigation.domInteractive - navigation.fetchStart
        };

        // Verificar se está dentro do budget
        const budgets = {
          domContentLoaded: 1500,
          loadComplete: 3000,
          firstByte: 800,
          domInteractive: 2000
        };

        Object.entries(metrics).forEach(([key, value]) => {
          const budget = budgets[key as keyof typeof budgets];
          if (value > budget && process.env.NODE_ENV === 'development') {
            console.warn(`[Performance Budget] ${key} excedeu o budget: ${value}ms > ${budget}ms`);
          }
        });
      }
    });
  }, [enableIdleCallback]);

  // Inicialização
  useEffect(() => {
    monitorCriticalResources();
    createIntersectionObserver();
    preloadCriticalResources();
    monitorPerformanceBudget();
    
    const scrollCleanup = optimizeScrollPerformance();

    return () => {
      scrollCleanup();
      intersectionObserverRef.current?.disconnect();
    };
  }, [
    monitorCriticalResources,
    createIntersectionObserver,
    preloadCriticalResources,
    monitorPerformanceBudget,
    optimizeScrollPerformance
  ]);

  // Cleanup
  useEffect(() => {
    return () => {
      webVitalsRef.current?.destroy();
      intersectionObserverRef.current?.disconnect();
    };
  }, []);

  return {
    trackComponentRender,
    getPerformanceData: () => performanceDataRef.current,
    getWebVitalsScore: () => webVitalsRef.current?.getPerformanceScore() || 0,
    getMetrics: () => webVitalsRef.current?.getMetrics() || new Map()
  };
}