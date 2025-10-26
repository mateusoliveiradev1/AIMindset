import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Tipos para detecção de capacidades
interface DeviceCapabilities {
  // Rede
  connectionType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  downlink: number;
  rtt: number;
  saveData: boolean;

  // Hardware
  deviceMemory: number;
  hardwareConcurrency: number;
  
  // Suporte a recursos
  supportsWebP: boolean;
  supportsIntersectionObserver: boolean;
  supportsServiceWorker: boolean;
  supportsWebWorkers: boolean;
  supportsIndexedDB: boolean;
  
  // Performance
  isLowEndDevice: boolean;
  preferReducedMotion: boolean;
}

interface ProgressiveEnhancementConfig {
  // Limites para considerar dispositivo de baixo desempenho
  lowEndThresholds: {
    memory: number; // GB
    cores: number;
    downlink: number; // Mbps
    rtt: number; // ms
  };
  
  // Configurações de fallback
  fallbacks: {
    enableVirtualization: boolean;
    enableAnimations: boolean;
    enableLazyLoading: boolean;
    enableWebWorkers: boolean;
    maxConcurrentRequests: number;
    imageQuality: 'high' | 'medium' | 'low';
  };
}

const defaultConfig: ProgressiveEnhancementConfig = {
  lowEndThresholds: {
    memory: 4, // 4GB
    cores: 4,
    downlink: 1.5, // 1.5 Mbps
    rtt: 300 // 300ms
  },
  fallbacks: {
    enableVirtualization: true,
    enableAnimations: true,
    enableLazyLoading: true,
    enableWebWorkers: true,
    maxConcurrentRequests: 6,
    imageQuality: 'high'
  }
};

// Hook para detecção de capacidades do dispositivo
export const useDeviceCapabilities = (): DeviceCapabilities => {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>(() => {
    // Detecção inicial síncrona
    const connection = (navigator as any).connection;
    const memory = (navigator as any).deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    
    return {
      connectionType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 10,
      rtt: connection?.rtt || 100,
      saveData: connection?.saveData || false,
      deviceMemory: memory,
      hardwareConcurrency: cores,
      supportsWebP: false,
      supportsIntersectionObserver: 'IntersectionObserver' in window,
      supportsServiceWorker: 'serviceWorker' in navigator,
      supportsWebWorkers: 'Worker' in window,
      supportsIndexedDB: 'indexedDB' in window,
      isLowEndDevice: memory < 4 || cores < 4,
      preferReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    };
  });

  useEffect(() => {
    // Detecção assíncrona de suporte a WebP
    const detectWebPSupport = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const dataURL = canvas.toDataURL('image/webp');
      return dataURL.indexOf('data:image/webp') === 0;
    };

    // Atualizar capacidades
    setCapabilities(prev => ({
      ...prev,
      supportsWebP: detectWebPSupport()
    }));

    // Listener para mudanças na conexão
    const connection = (navigator as any).connection;
    if (connection) {
      const updateConnection = () => {
        setCapabilities(prev => ({
          ...prev,
          connectionType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        }));
      };

      connection.addEventListener('change', updateConnection);
      return () => connection.removeEventListener('change', updateConnection);
    }
  }, []);

  return capabilities;
};

// Hook para configuração adaptativa baseada nas capacidades
export const useAdaptiveConfig = (
  customConfig?: Partial<ProgressiveEnhancementConfig>
): ProgressiveEnhancementConfig => {
  const capabilities = useDeviceCapabilities();
  const config = useMemo(() => ({ ...defaultConfig, ...customConfig }), [customConfig]);

  return useMemo(() => {
    const adaptiveConfig = { ...config };
    
    // Ajustar configurações baseado nas capacidades do dispositivo
    const isLowEnd = 
      capabilities.deviceMemory < config.lowEndThresholds.memory ||
      capabilities.hardwareConcurrency < config.lowEndThresholds.cores ||
      capabilities.downlink < config.lowEndThresholds.downlink ||
      capabilities.rtt > config.lowEndThresholds.rtt ||
      capabilities.saveData;

    if (isLowEnd) {
      adaptiveConfig.fallbacks = {
        ...adaptiveConfig.fallbacks,
        enableAnimations: !capabilities.preferReducedMotion,
        enableWebWorkers: capabilities.supportsWebWorkers && capabilities.hardwareConcurrency > 2,
        maxConcurrentRequests: Math.min(3, adaptiveConfig.fallbacks.maxConcurrentRequests),
        imageQuality: capabilities.saveData ? 'low' : 'medium'
      };
    }

    // Desabilitar recursos não suportados
    if (!capabilities.supportsIntersectionObserver) {
      adaptiveConfig.fallbacks.enableLazyLoading = false;
    }

    if (!capabilities.supportsWebWorkers) {
      adaptiveConfig.fallbacks.enableWebWorkers = false;
    }

    return adaptiveConfig;
  }, [capabilities, config]);
};

// Componente para carregamento progressivo de imagens
interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  className = '',
  placeholder,
  sizes,
  loading = 'lazy'
}) => {
  const capabilities = useDeviceCapabilities();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Determinar formato e qualidade da imagem
  const optimizedSrc = useMemo(() => {
    let optimizedUrl = src;
    
    // Usar WebP se suportado
    if (capabilities.supportsWebP && !src.includes('.webp')) {
      optimizedUrl = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }
    
    // Ajustar qualidade baseado na conexão
    if (capabilities.saveData || capabilities.connectionType === 'slow-2g' || capabilities.connectionType === '2g') {
      optimizedUrl += optimizedUrl.includes('?') ? '&quality=60' : '?quality=60';
    }
    
    return optimizedUrl;
  }, [src, capabilities]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    // Fallback para imagem original se a otimizada falhar
    if (optimizedSrc !== src) {
      setHasError(false);
    }
  }, [optimizedSrc, src]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          {placeholder ? (
            <img src={placeholder} alt="" className="w-full h-full object-cover opacity-50" />
          ) : (
            <div className="w-8 h-8 bg-gray-300 rounded" />
          )}
        </div>
      )}
      
      {/* Imagem principal */}
      <img
        src={hasError ? src : optimizedSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        loading={capabilities.supportsIntersectionObserver ? loading : 'eager'}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};

// Hook para carregamento adaptativo de recursos
export const useAdaptiveLoading = () => {
  const config = useAdaptiveConfig();
  const capabilities = useDeviceCapabilities();

  const loadResource = useCallback(async (
    resourceLoader: () => Promise<any>,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ) => {
    // Atrasar carregamento em dispositivos lentos
    if (capabilities.isLowEndDevice && priority === 'low') {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Usar requestIdleCallback se disponível
    if ('requestIdleCallback' in window && priority === 'low') {
      return new Promise((resolve, reject) => {
        (window as any).requestIdleCallback(async () => {
          try {
            const result = await resourceLoader();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });
    }

    return resourceLoader();
  }, [capabilities.isLowEndDevice]);

  const shouldEnableFeature = useCallback((feature: keyof typeof config.fallbacks) => {
    return config.fallbacks[feature];
  }, [config.fallbacks]);

  return {
    loadResource,
    shouldEnableFeature,
    isLowEndDevice: capabilities.isLowEndDevice,
    connectionType: capabilities.connectionType,
    saveData: capabilities.saveData
  };
};

// Componente para renderização condicional baseada em capacidades
interface ConditionalRenderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  condition: (capabilities: DeviceCapabilities) => boolean;
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  children,
  fallback = null,
  condition
}) => {
  const capabilities = useDeviceCapabilities();
  
  return condition(capabilities) ? <>{children}</> : <>{fallback}</>;
};

// Hook para otimização de performance baseada em capacidades
export const usePerformanceOptimization = () => {
  const capabilities = useDeviceCapabilities();
  const config = useAdaptiveConfig();

  // Debounce adaptativo
  const adaptiveDebounce = useCallback((delay: number) => {
    if (capabilities.isLowEndDevice) {
      return Math.max(delay * 1.5, 300); // Aumentar delay em dispositivos lentos
    }
    return delay;
  }, [capabilities.isLowEndDevice]);

  // Throttle adaptativo
  const adaptiveThrottle = useCallback((interval: number) => {
    if (capabilities.isLowEndDevice) {
      return Math.max(interval * 2, 100); // Reduzir frequência em dispositivos lentos
    }
    return interval;
  }, [capabilities.isLowEndDevice]);

  // Configurações de virtualização
  const getVirtualizationConfig = useCallback(() => {
    if (!config.fallbacks.enableVirtualization) {
      return { enabled: false };
    }

    return {
      enabled: true,
      overscan: capabilities.isLowEndDevice ? 2 : 5,
      itemHeight: capabilities.isLowEndDevice ? 150 : 200,
      bufferSize: capabilities.isLowEndDevice ? 10 : 20
    };
  }, [config.fallbacks.enableVirtualization, capabilities.isLowEndDevice]);

  return {
    adaptiveDebounce,
    adaptiveThrottle,
    getVirtualizationConfig,
    shouldUseWebWorkers: config.fallbacks.enableWebWorkers,
    maxConcurrentRequests: config.fallbacks.maxConcurrentRequests,
    imageQuality: config.fallbacks.imageQuality,
    enableAnimations: config.fallbacks.enableAnimations
  };
};

// Provider para contexto de Progressive Enhancement
const ProgressiveEnhancementContext = React.createContext<{
  capabilities: DeviceCapabilities;
  config: ProgressiveEnhancementConfig;
} | null>(null);

export const ProgressiveEnhancementProvider: React.FC<{
  children: React.ReactNode;
  config?: Partial<ProgressiveEnhancementConfig>;
}> = ({ children, config: customConfig }) => {
  const capabilities = useDeviceCapabilities();
  const config = useAdaptiveConfig(customConfig);

  return (
    <ProgressiveEnhancementContext.Provider value={{ capabilities, config }}>
      {children}
    </ProgressiveEnhancementContext.Provider>
  );
};

export const useProgressiveEnhancement = () => {
  const context = React.useContext(ProgressiveEnhancementContext);
  if (!context) {
    throw new Error('useProgressiveEnhancement must be used within ProgressiveEnhancementProvider');
  }
  return context;
};

export default ProgressiveEnhancementProvider;