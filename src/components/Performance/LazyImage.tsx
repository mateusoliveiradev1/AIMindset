import React, { useState, useRef, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

// Cache para detecção de suporte WebP
let webpSupport: boolean | null = null;

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhcnJlZ2FuZG8uLi48L3RleHQ+PC9zdmc+',
  width,
  height,
  loading = 'lazy',
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [supportsWebP, setSupportsWebP] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Detectar suporte WebP
  useEffect(() => {
    const detectWebPSupport = async () => {
      if (webpSupport !== null) {
        setSupportsWebP(webpSupport);
        return;
      }

      try {
        const webpData = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        const img = new Image();
        
        const promise = new Promise<boolean>((resolve) => {
          img.onload = () => resolve(img.width === 2 && img.height === 2);
          img.onerror = () => resolve(false);
        });
        
        img.src = webpData;
        webpSupport = await promise;
        setSupportsWebP(webpSupport);
      } catch {
        webpSupport = false;
        setSupportsWebP(false);
      }
    };

    detectWebPSupport();
  }, []);

  // Intersection Observer para lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px' // Começar a carregar 50px antes de entrar na viewport
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Converter extensão para WebP se suportado
  const getWebPSrc = (originalSrc: string) => {
    if (!supportsWebP) return originalSrc;
    
    // Para imagens locais, tentar versão WebP
    if (!originalSrc.startsWith('http') && !originalSrc.startsWith('data:')) {
      const webpSrc = originalSrc.replace(/\.(png|jpg|jpeg)$/i, '.webp');
      return webpSrc;
    }
    
    return originalSrc;
  };

  // Gerar srcSet para diferentes densidades de tela e tamanhos responsivos
  const generateSrcSet = (originalSrc: string) => {
    if (originalSrc.includes('trae-api-us.mchost.guru')) {
      // Para imagens da API, gerar múltiplos tamanhos e qualidades
      const sizes = [
        { width: 400, quality: 75, descriptor: '400w' },
        { width: 800, quality: 80, descriptor: '800w' },
        { width: 1200, quality: 85, descriptor: '1200w' },
        { width: 1600, quality: 90, descriptor: '1600w' }
      ];
      
      return sizes
        .map(({ width, quality, descriptor }) => 
          `${originalSrc}&width=${width}&quality=${quality} ${descriptor}`
        )
        .join(', ');
    }
    return originalSrc;
  };

  // Otimizar formato de imagem
  const getOptimizedSrc = (originalSrc: string) => {
    if (originalSrc.includes('trae-api-us.mchost.guru')) {
      // Adicionar formato WebP se suportado
      if (supportsWebP) {
        return `${originalSrc}&format=webp`;
      }
    }
    return getWebPSrc(originalSrc);
  };

  const optimizedSrc = getOptimizedSrc(src);
  const srcSet = generateSrcSet(optimizedSrc);

  // Se suporta WebP e é uma imagem local, usar picture element
  const shouldUsePicture = supportsWebP && !src.startsWith('http') && !src.startsWith('data:') && /\.(png|jpg|jpeg)$/i.test(src);

  if (shouldUsePicture) {
    const webpSrc = src.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {/* Placeholder enquanto carrega */}
        {!isLoaded && !hasError && (
          <img
            src={placeholder}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-0' : 'opacity-100'
            }`}
            aria-hidden="true"
          />
        )}

        {/* Picture element com WebP e fallback */}
        <picture>
          <source 
            srcSet={isInView ? webpSrc : undefined} 
            type="image/webp" 
          />
          <img
            ref={imgRef}
            src={isInView ? src : placeholder}
            alt={alt}
            width={width}
            height={height}
            loading={loading}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleLoad}
            onError={handleError}
            decoding="async"
            fetchPriority={loading === 'eager' ? 'high' : 'low'}
          />
        </picture>

        {/* Fallback para erro */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-2 text-sm">Erro ao carregar imagem</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder enquanto carrega */}
      {!isLoaded && !hasError && (
        <img
          src={placeholder}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-0' : 'opacity-100'
          }`}
          aria-hidden="true"
        />
      )}

      {/* Imagem principal */}
      <img
        ref={imgRef}
        src={isInView ? optimizedSrc : placeholder}
        srcSet={isInView ? srcSet : undefined}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        decoding="async"
        fetchPriority={loading === 'eager' ? 'high' : 'low'}
        crossOrigin={optimizedSrc?.includes('images.unsplash.com') ? 'anonymous' : undefined}
        referrerPolicy={optimizedSrc?.includes('images.unsplash.com') ? 'no-referrer' : undefined}
      />

      {/* Fallback para erro */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-2 text-sm">Erro ao carregar imagem</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;