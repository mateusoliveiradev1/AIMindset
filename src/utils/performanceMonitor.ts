// Sistema de monitoramento de performance em tempo real
export interface PerformanceMetrics {
  // Core Web Vitals
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
  
  // Métricas customizadas
  memoryUsage: number;
  renderTime: number;
  bundleSize: number;
  cacheHitRate: number;
  
  // Métricas de rede
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  
  // Timestamps
  timestamp: number;
  sessionId: string;
}

export interface PerformanceAlert {
  type: 'warning' | 'error' | 'info';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
}

export interface PerformanceConfig {
  // Thresholds para alertas
  thresholds: {
    fcp: number;
    lcp: number;
    fid: number;
    cls: number;
    memoryUsage: number;
    renderTime: number;
  };
  
  // Configurações de coleta
  sampleRate: number; // 0-1, porcentagem de sessões para monitorar
  reportInterval: number; // Intervalo em ms para reportar métricas
  maxReports: number; // Máximo de relatórios por sessão
  
  // Callbacks
  onMetricCollected?: (metric: PerformanceMetrics) => void;
  onAlert?: (alert: PerformanceAlert) => void;
  onReport?: (report: PerformanceReport) => void;
}

export interface PerformanceReport {
  sessionId: string;
  metrics: PerformanceMetrics[];
  alerts: PerformanceAlert[];
  summary: {
    avgFCP: number;
    avgLCP: number;
    avgFID: number;
    avgCLS: number;
    avgMemoryUsage: number;
    totalAlerts: number;
    sessionDuration: number;
  };
  deviceInfo: {
    userAgent: string;
    viewport: { width: number; height: number };
    deviceMemory: number;
    hardwareConcurrency: number;
  };
  timestamp: number;
}

class PerformanceMonitor {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private sessionId: string;
  private startTime: number;
  private observer: PerformanceObserver | null = null;
  private intervalId: number | null = null;
  private isMonitoring = false;

  // Thresholds padrão baseados nas recomendações do Google
  private defaultConfig: PerformanceConfig = {
    thresholds: {
      fcp: 1200, // 1.2s
      lcp: 2000, // 2.0s
      fid: 50,   // 50ms
      cls: 0.1,  // 0.1
      memoryUsage: 50 * 1024 * 1024, // 50MB
      renderTime: 16 // 16ms (60fps)
    },
    sampleRate: 1.0, // 100% em desenvolvimento
    reportInterval: 30000, // 30 segundos
    maxReports: 100
  };

  constructor(config?: Partial<PerformanceConfig>) {
    this.config = { ...this.defaultConfig, ...config };
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
  }

  start(): void {
    if (this.isMonitoring) return;

    // Verificar se deve monitorar baseado na taxa de amostragem
    if (Math.random() > this.config.sampleRate) {
      console.log('Performance monitoring skipped due to sample rate');
      return;
    }

    this.isMonitoring = true;
    console.log('Performance monitoring started');

    // Inicializar observadores
    this.initializeObservers();
    
    // Coletar métricas iniciais
    this.collectInitialMetrics();
    
    // Configurar coleta periódica
    this.intervalId = window.setInterval(() => {
      this.collectMetrics();
    }, this.config.reportInterval);

    // Listener para beforeunload
    window.addEventListener('beforeunload', () => {
      this.generateReport();
    });
  }

  stop(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Gerar relatório final
    this.generateReport();
    
    console.log('Performance monitoring stopped');
  }

  private initializeObservers(): void {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      // Observar diferentes tipos de métricas
      this.observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift', 'navigation', 'resource'] });
    } catch (error) {
      console.error('Error initializing PerformanceObserver:', error);
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'paint':
        if (entry.name === 'first-contentful-paint') {
          this.updateMetric('fcp', entry.startTime);
        }
        break;
        
      case 'largest-contentful-paint':
        this.updateMetric('lcp', entry.startTime);
        break;
        
      case 'first-input':
        const fidEntry = entry as PerformanceEventTiming;
        this.updateMetric('fid', fidEntry.processingStart - fidEntry.startTime);
        break;
        
      case 'layout-shift':
        const clsEntry = entry as any; // LayoutShift interface não está disponível em todos os tipos
        if (!clsEntry.hadRecentInput) {
          this.updateMetric('cls', clsEntry.value);
        }
        break;
        
      case 'navigation':
        const navEntry = entry as PerformanceNavigationTiming;
        this.updateMetric('ttfb', navEntry.responseStart - navEntry.requestStart);
        break;
    }
  }

  private updateMetric(metricName: keyof PerformanceMetrics, value: number): void {
    // Verificar threshold e gerar alerta se necessário
    const threshold = this.config.thresholds[metricName as keyof typeof this.config.thresholds];
    if (threshold && value > threshold) {
      this.generateAlert(metricName, value, threshold);
    }
  }

  private collectInitialMetrics(): void {
    const metrics = this.createMetricsSnapshot();
    this.metrics.push(metrics);
    this.config.onMetricCollected?.(metrics);
  }

  private collectMetrics(): void {
    if (this.metrics.length >= this.config.maxReports) {
      console.log('Max reports reached, stopping collection');
      this.stop();
      return;
    }

    const metrics = this.createMetricsSnapshot();
    this.metrics.push(metrics);
    this.config.onMetricCollected?.(metrics);
  }

  private createMetricsSnapshot(): PerformanceMetrics {
    const now = Date.now();
    
    // Coletar Core Web Vitals
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    const lcpEntry = lcpEntries[lcpEntries.length - 1]; // Última entrada LCP
    
    const fidEntries = performance.getEntriesByType('first-input');
    const fidEntry = fidEntries[0] as PerformanceEventTiming;
    
    const clsEntries = performance.getEntriesByType('layout-shift');
    const clsValue = clsEntries
      .filter((entry: any) => !entry.hadRecentInput)
      .reduce((sum: number, entry: any) => sum + entry.value, 0);

    const navEntries = performance.getEntriesByType('navigation');
    const navEntry = navEntries[0] as PerformanceNavigationTiming;

    // Coletar informações de memória
    const memoryInfo = (performance as any).memory;
    const memoryUsage = memoryInfo ? memoryInfo.usedJSHeapSize : 0;

    // Coletar informações de rede
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      fcp: fcpEntry ? fcpEntry.startTime : null,
      lcp: lcpEntry ? lcpEntry.startTime : null,
      fid: fidEntry ? fidEntry.processingStart - fidEntry.startTime : null,
      cls: clsValue || null,
      ttfb: navEntry ? navEntry.responseStart - navEntry.requestStart : null,
      
      memoryUsage,
      renderTime: this.calculateRenderTime(),
      bundleSize: this.estimateBundleSize(),
      cacheHitRate: this.calculateCacheHitRate(),
      
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      
      timestamp: now,
      sessionId: this.sessionId
    };
  }

  private calculateRenderTime(): number {
    // Estimar tempo de render baseado em performance.now()
    const start = performance.now();
    // Simular operação de render
    for (let i = 0; i < 1000; i++) {
      document.createElement('div');
    }
    return performance.now() - start;
  }

  private estimateBundleSize(): number {
    // Estimar tamanho do bundle baseado nos recursos carregados
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return resources
      .filter(resource => resource.name.includes('.js') || resource.name.includes('.css'))
      .reduce((total, resource) => total + (resource.transferSize || 0), 0);
  }

  private calculateCacheHitRate(): number {
    // Calcular taxa de cache hit baseado nos recursos
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const cachedResources = resources.filter(resource => resource.transferSize === 0);
    return resources.length > 0 ? cachedResources.length / resources.length : 0;
  }

  private generateAlert(metric: string, value: number, threshold: number): void {
    const alert: PerformanceAlert = {
      type: value > threshold * 2 ? 'error' : 'warning',
      metric,
      value,
      threshold,
      message: `${metric.toUpperCase()} (${value.toFixed(2)}) exceeded threshold (${threshold})`,
      timestamp: Date.now()
    };

    this.alerts.push(alert);
    this.config.onAlert?.(alert);
    
    console.warn(`Performance Alert: ${alert.message}`);
  }

  private generateReport(): PerformanceReport {
    const report: PerformanceReport = {
      sessionId: this.sessionId,
      metrics: this.metrics,
      alerts: this.alerts,
      summary: this.calculateSummary(),
      deviceInfo: this.getDeviceInfo(),
      timestamp: Date.now()
    };

    this.config.onReport?.(report);
    return report;
  }

  private calculateSummary() {
    const validMetrics = this.metrics.filter(m => m.fcp !== null);
    
    return {
      avgFCP: this.average(validMetrics.map(m => m.fcp).filter(v => v !== null) as number[]),
      avgLCP: this.average(validMetrics.map(m => m.lcp).filter(v => v !== null) as number[]),
      avgFID: this.average(validMetrics.map(m => m.fid).filter(v => v !== null) as number[]),
      avgCLS: this.average(validMetrics.map(m => m.cls).filter(v => v !== null) as number[]),
      avgMemoryUsage: this.average(validMetrics.map(m => m.memoryUsage)),
      totalAlerts: this.alerts.length,
      sessionDuration: Date.now() - this.startTime
    };
  }

  private getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      deviceMemory: (navigator as any).deviceMemory || 0,
      hardwareConcurrency: navigator.hardwareConcurrency || 0
    };
  }

  private average(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((sum, n) => sum + n, 0) / numbers.length : 0;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Métodos públicos para acesso aos dados
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  getAllMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

// Instância singleton
let performanceMonitor: PerformanceMonitor | null = null;

export function initPerformanceMonitor(config?: Partial<PerformanceConfig>): PerformanceMonitor {
  if (performanceMonitor) {
    console.warn('Performance monitor already initialized');
    return performanceMonitor;
  }

  performanceMonitor = new PerformanceMonitor(config);
  return performanceMonitor;
}

export function getPerformanceMonitor(): PerformanceMonitor | null {
  return performanceMonitor;
}

export function startPerformanceMonitoring(config?: Partial<PerformanceConfig>): void {
  const monitor = initPerformanceMonitor(config);
  monitor.start();
}

export function stopPerformanceMonitoring(): void {
  if (performanceMonitor) {
    performanceMonitor.stop();
    performanceMonitor = null;
  }
}

// Hook para React
export function usePerformanceMonitor(config?: Partial<PerformanceConfig>) {
  const monitor = initPerformanceMonitor(config);
  
  return {
    start: () => monitor.start(),
    stop: () => monitor.stop(),
    getCurrentMetrics: () => monitor.getCurrentMetrics(),
    getAllMetrics: () => monitor.getAllMetrics(),
    getAlerts: () => monitor.getAlerts(),
    getSessionId: () => monitor.getSessionId()
  };
}

// Utilitários para análise de performance
export function analyzePerformance(metrics: PerformanceMetrics[]): {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendations: string[];
} {
  if (metrics.length === 0) {
    return { score: 0, grade: 'F', recommendations: ['No metrics available'] };
  }

  const latest = metrics[metrics.length - 1];
  let score = 100;
  const recommendations: string[] = [];

  // Avaliar Core Web Vitals
  if (latest.fcp && latest.fcp > 1200) {
    score -= 20;
    recommendations.push('Optimize First Contentful Paint (FCP)');
  }

  if (latest.lcp && latest.lcp > 2000) {
    score -= 25;
    recommendations.push('Optimize Largest Contentful Paint (LCP)');
  }

  if (latest.fid && latest.fid > 50) {
    score -= 20;
    recommendations.push('Optimize First Input Delay (FID)');
  }

  if (latest.cls && latest.cls > 0.1) {
    score -= 15;
    recommendations.push('Reduce Cumulative Layout Shift (CLS)');
  }

  // Avaliar uso de memória
  if (latest.memoryUsage > 50 * 1024 * 1024) {
    score -= 10;
    recommendations.push('Optimize memory usage');
  }

  // Determinar grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  return { score: Math.max(0, score), grade, recommendations };
}