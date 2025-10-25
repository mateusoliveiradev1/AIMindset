import React, { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ImageOptimizerProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  quality?: number;
}

export const ImageOptimizer: React.FC<ImageOptimizerProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  placeholder = 'blur',
  quality = 85
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Gerar URL otimizada (simulação - em produção usaria um serviço como Cloudinary)
  const getOptimizedUrl = (originalSrc: string, w?: number, h?: number, q?: number) => {
    // Para desenvolvimento, retorna a URL original
    // Em produção, você implementaria otimização real:
    // return `https://res.cloudinary.com/your-cloud/image/fetch/w_${w},h_${h},q_${q},f_auto/${encodeURIComponent(originalSrc)}`;
    return originalSrc;
  };

  // Gerar srcSet para diferentes densidades de tela
  const generateSrcSet = (originalSrc: string, baseWidth?: number) => {
    if (!baseWidth) return '';
    
    const sizes = [1, 1.5, 2, 3];
    return sizes
      .map(scale => {
        const scaledWidth = Math.round(baseWidth * scale);
        const optimizedUrl = getOptimizedUrl(originalSrc, scaledWidth, undefined, quality);
        return `${optimizedUrl} ${scale}x`;
      })
      .join(', ');
  };

  // Lazy loading com Intersection Observer
  useEffect(() => {
    if (priority) {
      // Carregar imediatamente se for prioridade
      setIsLoading(true);
      return;
    }

    if (!imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoading && !isLoaded) {
            setIsLoading(true);
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px 0px', // Começar a carregar 50px antes de aparecer
        threshold: 0.1
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, isLoading, isLoaded]);

  const handleLoad = () => {
    setIsLoaded(true);
    setIsLoading(false);
    setError(false);
  };

  const handleError = () => {
    setError(true);
    setIsLoading(false);
  };

  // Placeholder blur effect
  const blurDataUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMxZTI5M2IiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMzNzQxNTEiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0idXJsKCNnKSIvPjwvc3ZnPg==';

  const optimizedSrc = getOptimizedUrl(src, width, height, quality);
  const srcSet = generateSrcSet(src, width);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* Placeholder */}
      {!isLoaded && placeholder === 'blur' && (
        <img
          src={blurDataUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110 transition-opacity duration-300"
          style={{
            opacity: isLoading ? 0.5 : 1
          }}
        />
      )}

      {/* Loading indicator */}
      {isLoading && !isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-surface/50">
          <Loader2 className="w-6 h-6 text-neon-purple animate-spin" />
        </div>
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={isLoading || priority ? optimizedSrc : undefined}
        srcSet={isLoading || priority ? srcSet : undefined}
        alt={alt}
        width={width}
        height={height}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />

      {/* Error fallback */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-surface border border-gray-600 rounded">
          <div className="text-center text-gray-400">
            <div className="text-2xl mb-2">🖼️</div>
            <div className="text-sm">Imagem não disponível</div>
          </div>
        </div>
      )}
    </div>
  );
};

// Hook para preload de imagens críticas
export const useImagePreload = (urls: string[]) => {
  useEffect(() => {
    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    });
  }, [urls]);
};

// Componente para otimização de imagens de artigos
export const ArticleImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}> = ({ src, alt, className, priority = false }) => {
  return (
    <ImageOptimizer
      src={src}
      alt={alt}
      className={className}
      width={800}
      height={400}
      priority={priority}
      quality={90}
      placeholder="blur"
    />
  );
};

// Componente para avatares e imagens pequenas
export const AvatarImage: React.FC<{
  src: string;
  alt: string;
  size?: number;
  className?: string;
}> = ({ src, alt, size = 40, className }) => {
  return (
    <ImageOptimizer
      src={src}
      alt={alt}
      className={`rounded-full ${className}`}
      width={size}
      height={size}
      priority={true}
      quality={95}
      placeholder="blur"
    />
  );
};

export default ImageOptimizer;