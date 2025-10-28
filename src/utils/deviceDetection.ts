// Device Detection Utility - Balanceamento Mobile/Desktop Performance
// Detecta tipo de dispositivo para aplicar otimizações específicas

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  connectionType: string;
  isSlowConnection: boolean;
  isTouchDevice: boolean;
  userAgent: string;
}

export interface PerformanceConfig {
  // Service Worker
  cacheMaxEntries: number;
  cacheMaxAge: number;
  cacheStrategy: 'aggressive' | 'moderate' | 'conservative';
  
  // Resource Hints
  enableDNSPrefetch: boolean;
  enablePreconnect: boolean;
  enableModulePreload: boolean;
  maxPreloadResources: number;
  
  // Lazy Loading
  intersectionThreshold: number;
  intersectionRootMargin: string;
  lazyLoadingDelay: number;
  
  // General
  enableAdvancedOptimizations: boolean;
  prioritizeSpeed: boolean;
}

// Cache para evitar recálculos
let cachedDeviceInfo: DeviceInfo | null = null;
let cachedPerformanceConfig: PerformanceConfig | null = null;

/**
 * Detecta informações detalhadas do dispositivo
 */
export function getDeviceType(): DeviceInfo {
  return getDeviceInfo();
}

export function getDeviceInfo(): DeviceInfo {
  if (cachedDeviceInfo) {
    return cachedDeviceInfo;
  }

  const userAgent = navigator.userAgent || '';
  const screenWidth = window.innerWidth || screen.width;
  const screenHeight = window.innerHeight || screen.height;
  const devicePixelRatio = window.devicePixelRatio || 1;

  // Detecção de mobile mais robusta
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const tabletRegex = /iPad|Android(?=.*\bMobile\b)(?=.*\bTablet\b)|Android(?=.*\bTablet\b)/i;
  
  const isMobileUA = mobileRegex.test(userAgent);
  const isTabletUA = tabletRegex.test(userAgent);
  const isMobileScreen = screenWidth <= 768;
  const isTabletScreen = screenWidth > 768 && screenWidth <= 1024;
  
  // Combinação de detecções para maior precisão
  const isMobile = (isMobileUA && !isTabletUA) || (isMobileScreen && !isTabletScreen);
  const isTablet = isTabletUA || isTabletScreen;
  const isDesktop = !isMobile && !isTablet;

  // Detecção de conexão
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  const connectionType = connection?.effectiveType || 'unknown';
  const isSlowConnection = ['slow-2g', '2g'].includes(connectionType);

  // Detecção de touch
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  cachedDeviceInfo = {
    isMobile,
    isTablet,
    isDesktop,
    screenWidth,
    screenHeight,
    devicePixelRatio,
    connectionType,
    isSlowConnection,
    isTouchDevice,
    userAgent
  };

  return cachedDeviceInfo;
}

/**
 * Gera configuração de performance otimizada para o dispositivo
 */
export function getPerformanceConfig(): PerformanceConfig {
  if (cachedPerformanceConfig) {
    return cachedPerformanceConfig;
  }

  const device = getDeviceInfo();

  let config: PerformanceConfig;

  if (device.isMobile) {
    // Configuração agressiva para mobile (manter 68+ pontos)
    config = {
      // Service Worker - Cache agressivo para mobile
      cacheMaxEntries: device.isSlowConnection ? 150 : 200,
      cacheMaxAge: device.isSlowConnection ? 86400000 : 172800000, // 1-2 dias
      cacheStrategy: 'aggressive',
      
      // Resource Hints - Otimizado para mobile
      enableDNSPrefetch: true,
      enablePreconnect: true,
      enableModulePreload: true,
      maxPreloadResources: device.isSlowConnection ? 3 : 5,
      
      // Lazy Loading - Thresholds otimizados para mobile
      intersectionThreshold: 0.05,
      intersectionRootMargin: device.isSlowConnection ? '20px' : '100px',
      lazyLoadingDelay: 0,
      
      // Geral
      enableAdvancedOptimizations: true,
      prioritizeSpeed: true
    };
  } else if (device.isTablet) {
    // Configuração balanceada para tablet
    config = {
      // Service Worker - Cache moderado para tablet
      cacheMaxEntries: 100,
      cacheMaxAge: 86400000, // 1 dia
      cacheStrategy: 'moderate',
      
      // Resource Hints - Balanceado
      enableDNSPrefetch: true,
      enablePreconnect: true,
      enableModulePreload: false, // Reduzir para tablet
      maxPreloadResources: 3,
      
      // Lazy Loading - Thresholds intermediários
      intersectionThreshold: 0.1,
      intersectionRootMargin: '75px',
      lazyLoadingDelay: 0,
      
      // Geral
      enableAdvancedOptimizations: true,
      prioritizeSpeed: false
    };
  } else {
    // Configuração conservadora para desktop (recuperar 85+ pontos)
    config = {
      // Service Worker - Cache moderado para desktop
      cacheMaxEntries: 75, // Reduzido para não sobrecarregar
      cacheMaxAge: 43200000, // 12 horas (reduzido)
      cacheStrategy: 'moderate',
      
      // Resource Hints - Conservador para desktop
      enableDNSPrefetch: true,
      enablePreconnect: true,
      enableModulePreload: false, // Desabilitar para desktop
      maxPreloadResources: 2, // Reduzido significativamente
      
      // Lazy Loading - Thresholds conservadores para desktop
      intersectionThreshold: 0.15, // Maior threshold
      intersectionRootMargin: '50px', // Margem padrão
      lazyLoadingDelay: 0,
      
      // Geral
      enableAdvancedOptimizations: false, // Desabilitar otimizações avançadas
      prioritizeSpeed: false
    };
  }

  cachedPerformanceConfig = config;
  return config;
}

/**
 * Limpa cache de detecção (útil para testes ou mudanças de orientação)
 */
export function clearDeviceCache(): void {
  cachedDeviceInfo = null;
  cachedPerformanceConfig = null;
}

/**
 * Hook para reagir a mudanças de orientação/resize
 */
export function setupDeviceChangeListener(callback: (deviceInfo: DeviceInfo) => void): () => void {
  const handleResize = () => {
    clearDeviceCache();
    callback(getDeviceInfo());
  };

  const handleOrientationChange = () => {
    setTimeout(() => {
      clearDeviceCache();
      callback(getDeviceInfo());
    }, 100);
  };

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleOrientationChange);

  return () => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleOrientationChange);
  };
}

/**
 * Utilitário para debug - mostra informações do dispositivo
 */
export function logDeviceInfo(): void {
  if (process.env.NODE_ENV === 'development') {
    const device = getDeviceInfo();
    const config = getPerformanceConfig();
    
    console.group('🔍 Device Detection & Performance Config');
    console.log('📱 Device Info:', device);
    console.log('⚡ Performance Config:', config);
    console.groupEnd();
  }
}

// Auto-detectar na inicialização
if (typeof window !== 'undefined') {
  // Detectar imediatamente
  getDeviceInfo();
  getPerformanceConfig();
  
  // Log em desenvolvimento
  logDeviceInfo();
}