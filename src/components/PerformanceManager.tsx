import React from 'react';

interface PerformanceManagerProps {
  children: React.ReactNode;
  criticalResources?: string[];
  prefetchResources?: string[];
  enableImageOptimization?: boolean;
  enableLazyLoading?: boolean;
  cacheStrategy?: 'aggressive' | 'moderate' | 'conservative';
}

interface ImageOptimizationOptions {
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  sizes?: string;
  loading?: 'lazy' | 'eager';
}

// Hook para otimização de imagens (DESABILITADO TEMPORARIAMENTE)
export const useImageOptimization = () => {
  const optimizeImageUrl = (
    src: string, 
    options: ImageOptimizationOptions = {}
  ): string => {
    // DESABILITADO: Retorna URL original sem otimizações
    return src || '';
  };

  return { optimizeImageUrl };
};

// PerformanceManager DESABILITADO TEMPORARIAMENTE
export const PerformanceManager: React.FC<PerformanceManagerProps> = ({ 
  children 
}) => {
  // TODOS OS SISTEMAS DE MONITORAMENTO DESABILITADOS
  // Apenas renderiza os children sem qualquer processamento
  return <>{children}</>;
};

// OptimizedImage DESABILITADO TEMPORARIAMENTE
interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  sizes?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallback,
  ...props
}) => {
  // DESABILITADO: Renderiza img normal sem otimizações
  return <img src={src || fallback} alt={alt} {...props} />;
};

export default PerformanceManager;