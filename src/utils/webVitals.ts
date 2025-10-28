// Web Vitals EXTREMOS para monitoramento de performance
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

interface PerformanceData {
  cls: number;
  inp: number;
  fcp: number;
  lcp: number;
  ttfb: number;
  timestamp: number;
  url: string;
  userAgent: string;
}

// Thresholds otimizados para Web Vitals
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  INP: { good: 200, poor: 500 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 }
};

class WebVitalsMonitor {
  private metrics: Map<string, WebVitalsMetric> = new Map();
  private observers: PerformanceObserver[] = [];
  
  constructor() {
    this.initializeWebVitals();
    this.initializeCustomMetrics();
  }

  private initializeWebVitals() {
    // Core Web Vitals
    onCLS(this.handleMetric.bind(this));
    onINP(this.handleMetric.bind(this));
    onFCP(this.handleMetric.bind(this));
    onLCP(this.handleMetric.bind(this));
    onTTFB(this.handleMetric.bind(this));
  }

  private initializeCustomMetrics() {
    // First Input Delay personalizado
    if ('PerformanceObserver' in window) {
      // Long Tasks Observer
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            this.reportCustomMetric('long-task', entry.duration);
          }
        }
      });
      
      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (e) {
        console.warn('Long Task API not supported');
      }

      // Layout Shift Observer personalizado
      const layoutShiftObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        if (clsValue > 0) {
          this.reportCustomMetric('custom-cls', clsValue);
        }
      });

      try {
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(layoutShiftObserver);
      } catch (e) {
        console.warn('Layout Shift API not supported');
      }

      // Resource Timing Observer
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          if (resource.duration > 1000) {
            this.reportCustomMetric('slow-resource', resource.duration, {
              name: resource.name,
              type: resource.initiatorType
            });
          }
        }
      });

      try {
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (e) {
        console.warn('Resource Timing API not supported');
      }
    }
  }

  private handleMetric(metric: WebVitalsMetric) {
    this.metrics.set(metric.name, metric);
    
    // Log para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`[WebVitals] ${metric.name}:`, {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta
      });
    }

    // Reportar métricas críticas
    if (metric.rating === 'poor') {
      this.reportPoorMetric(metric);
    }

    // Enviar para analytics (apenas em produção)
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(metric);
    }
  }

  private reportCustomMetric(name: string, value: number, details?: any) {
    const metric: WebVitalsMetric = {
      name,
      value,
      rating: this.getRating(name, value),
      delta: value,
      id: `${name}-${Date.now()}`
    };

    this.metrics.set(name, metric);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[CustomMetric] ${name}:`, { value, details });
    }
  }

  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = THRESHOLDS[name.toUpperCase() as keyof typeof THRESHOLDS];
    if (!thresholds) return 'good';
    
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  }

  private reportPoorMetric(metric: WebVitalsMetric) {
    console.warn(`[WebVitals] Poor ${metric.name} detected:`, {
      value: metric.value,
      threshold: THRESHOLDS[metric.name.toUpperCase() as keyof typeof THRESHOLDS]?.poor,
      url: window.location.href
    });
  }

  private async sendToAnalytics(metric: WebVitalsMetric) {
    try {
      // Enviar para Google Analytics 4 se disponível
      if (typeof (window as any).gtag !== 'undefined') {
        (window as any).gtag('event', metric.name, {
          event_category: 'Web Vitals',
          value: Math.round(metric.value),
          metric_rating: metric.rating,
          custom_parameter_1: metric.id
        });
      }

      // Enviar para endpoint personalizado
      const performanceData: PerformanceData = {
        cls: this.metrics.get('CLS')?.value || 0,
        inp: this.metrics.get('INP')?.value || 0,
        fcp: this.metrics.get('FCP')?.value || 0,
        lcp: this.metrics.get('LCP')?.value || 0,
        ttfb: this.metrics.get('TTFB')?.value || 0,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };

      // Usar sendBeacon para envio confiável
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/analytics/web-vitals',
          JSON.stringify(performanceData)
        );
      }
    } catch (error) {
      console.error('Failed to send analytics:', error);
    }
  }

  public getMetrics(): Map<string, WebVitalsMetric> {
    return new Map(this.metrics);
  }

  public getPerformanceScore(): number {
    const metrics = Array.from(this.metrics.values());
    if (metrics.length === 0) return 0;

    const scores = metrics.map(metric => {
      switch (metric.rating) {
        case 'good': return 100;
        case 'needs-improvement': return 50;
        case 'poor': return 0;
        default: return 0;
      }
    });

    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  public destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// Singleton instance
let webVitalsMonitor: WebVitalsMonitor | null = null;

export function initWebVitals(): WebVitalsMonitor {
  if (!webVitalsMonitor) {
    webVitalsMonitor = new WebVitalsMonitor();
  }
  return webVitalsMonitor;
}

export function getWebVitalsMonitor(): WebVitalsMonitor | null {
  return webVitalsMonitor;
}

export { WebVitalsMonitor };
export type { WebVitalsMetric, PerformanceData };