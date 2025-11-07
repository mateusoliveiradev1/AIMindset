import React, { memo, useState, useCallback } from 'react';
import { useLazyImage } from '../../hooks/useAdvancedLazyLoading';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholder?: string;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

// Componente de placeholder otimizado
const ImagePlaceholder = memo<{ 
  width?: number; 
  height?: number; 
  className?: string;
  alt: string;
}>(({ width, height, className, alt }) => (
  <div 
    className={`bg-darker-surface animate-pulse flex items-center justify-center ${className || ''}`}
    style={{ width, height }}
    role="img"
    aria-label={`Carregando imagem: ${alt}`}
  >
    <svg 
      className="w-8 h-8 text-futuristic-gray" 
      fill="currentColor" 
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path 
        fillRule="evenodd" 
        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" 
        clipRule="evenodd" 
      />
    </svg>
  </div>
));

ImagePlaceholder.displayName = 'ImagePlaceholder';

// Função para otimizar URL da imagem
const optimizeImageUrl = (src: string, options: { 
  width?: number; 
  height?: number; 
  quality?: number; 
  format?: string;
}): string => {
  // Se for uma URL externa, retornar como está
  if (src.startsWith('http') && !src.includes('trae-api')) {
    return src;
  }

  // Se for uma URL da API Trae, aplicar otimizações
  if (src.includes('trae-api')) {
    const url = new URL(src);
    
    if (options.width) url.searchParams.set('w', options.width.toString());
    if (options.height) url.searchParams.set('h', options.height.toString());
    if (options.quality) url.searchParams.set('q', options.quality.toString());
    if (options.format && options.format !== 'auto') {
      url.searchParams.set('f', options.format);
    }
    
    return url.toString();
  }

  return src;
};

export const OptimizedImage: React.FC<OptimizedImageProps> = memo(({
  src,
  alt,
  className = '',
  width,
  height,
  placeholder,
  quality = 85,
  format = 'auto',
  sizes,
  priority = false,
  onLoad,
  onError
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Usar lazy loading apenas se não for prioridade
  const lazyOptions = priority ? { triggerOnce: false, threshold: 1 } : { 
    threshold: 0.1, 
    rootMargin: '50px',
    triggerOnce: true 
  };
  
  const { ref, src: lazySrc, isLoaded, hasError } = useLazyImage(
    optimizeImageUrl(src, { width, height, quality, format }),
    lazyOptions
  );

  const handleLoad = useCallback(() => {
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setImageError(true);
    onError?.();
  }, [onError]);

  // Se houver erro na imagem, mostrar placeholder
  if (hasError || imageError) {
    return (
      <ImagePlaceholder 
        width={width} 
        height={height} 
        className={className}
        alt={alt}
      />
    );
  }

  // Se ainda não carregou, mostrar placeholder
  if (!isLoaded || !lazySrc) {
    return (
      <div ref={ref}>
        <ImagePlaceholder 
          width={width} 
          height={height} 
          className={className}
          alt={alt}
        />
      </div>
    );
  }

  return (
    <div ref={ref}>
      <img
        src={lazySrc}
        alt={alt}
        className={className}
        width={width}
        height={height}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'low'}
        decoding="async"
        crossOrigin={lazySrc?.includes('images.unsplash.com') ? 'anonymous' : undefined}
        referrerPolicy={lazySrc?.includes('images.unsplash.com') ? 'no-referrer' : undefined}
        style={{
          contentVisibility: 'auto',
          containIntrinsicSize: width && height ? `${width}px ${height}px` : 'auto'
        }}
      />
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

// Hook para gerar srcSet responsivo
export const useResponsiveImage = (baseSrc: string, breakpoints: number[] = [320, 640, 768, 1024, 1280]) => {
  const generateSrcSet = useCallback(() => {
    return breakpoints
      .map(width => `${optimizeImageUrl(baseSrc, { width })} ${width}w`)
      .join(', ');
  }, [baseSrc, breakpoints]);

  const generateSizes = useCallback(() => {
    return breakpoints
      .map((width, index) => {
        if (index === breakpoints.length - 1) return `${width}px`;
        return `(max-width: ${width}px) ${width}px`;
      })
      .join(', ');
  }, [breakpoints]);

  return {
    srcSet: generateSrcSet(),
    sizes: generateSizes()
  };
};