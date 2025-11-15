import { useState, useEffect, useCallback, useRef } from 'react';

interface LazyLoadingOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
}

interface LazyLoadingResult {
  isVisible: boolean;
  ref: React.RefObject<HTMLDivElement>;
  load: () => void;
}

// Hook avançado para lazy loading com Intersection Observer
export const useAdvancedLazyLoading = (options: LazyLoadingOptions = {}): LazyLoadingResult => {
  const {
    threshold = 0.1,
    rootMargin = '200px',
    triggerOnce = true,
    delay = 0
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const load = useCallback(() => {
    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
        if (triggerOnce) setHasTriggered(true);
      }, delay);
    } else {
      setIsVisible(true);
      if (triggerOnce) setHasTriggered(true);
    }
  }, [delay, triggerOnce]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || (triggerOnce && hasTriggered)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          load();
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered, load]);

  return {
    isVisible,
    ref: elementRef,
    load
  };
};

// Hook específico para lazy loading de imagens
export const useLazyImage = (src: string, options: LazyLoadingOptions = {}) => {
  const { isVisible, ref } = useAdvancedLazyLoading(options);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isVisible && src && !imageSrc) {
      const img = new Image();
      if (src.includes('images.unsplash.com')) {
        img.crossOrigin = 'anonymous';
      }
      
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      
      img.onerror = () => {
        setHasError(true);
      };
      
      img.src = src;
    }
  }, [isVisible, src, imageSrc]);

  return {
    ref,
    src: imageSrc,
    isLoaded,
    hasError,
    isVisible
  };
};

// Hook para lazy loading de componentes pesados
export const useLazyComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadingOptions = {}
) => {
  const { isVisible, ref } = useAdvancedLazyLoading(options);
  const [Component, setComponent] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isVisible && !Component && !isLoading) {
      setIsLoading(true);
      
      importFn()
        .then((module) => {
          setComponent(() => module.default);
          setIsLoading(false);
        })
        .catch(() => {
          setHasError(true);
          setIsLoading(false);
        });
    }
  }, [isVisible, Component, isLoading, importFn]);

  return {
    ref,
    Component,
    isLoading,
    hasError,
    isVisible
  };
};

// Hook para prefetch inteligente
export const usePrefetch = (urls: string[], options: { delay?: number; priority?: 'high' | 'low' } = {}) => {
  const { delay = 2000, priority = 'low' } = options;
  const [prefetchedUrls, setPrefetchedUrls] = useState<Set<string>>(new Set());

  const prefetchUrl = useCallback((url: string) => {
    if (prefetchedUrls.has(url)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'fetch';
    
    if (priority === 'high') {
      link.rel = 'preload';
    }

    document.head.appendChild(link);
    setPrefetchedUrls(prev => new Set([...prev, url]));

    // Remover o link após um tempo para não poluir o DOM
    setTimeout(() => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    }, 30000);
  }, [prefetchedUrls, priority]);

  useEffect(() => {
    const timer = setTimeout(() => {
      urls.forEach(prefetchUrl);
    }, delay);

    return () => clearTimeout(timer);
  }, [urls, delay, prefetchUrl]);

  return { prefetchedUrls: Array.from(prefetchedUrls) };
};