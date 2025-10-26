import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  rootMargin?: string;
}

export const useInfiniteScroll = ({
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 0.1,
  rootMargin = '100px'
}: UseInfiniteScrollOptions) => {
  const [isMounted, setIsMounted] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);

  // Callback otimizado para evitar re-renders desnecessários
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    
    if (entry.isIntersecting && hasMore && !isLoading && isMounted) {
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore, isMounted]);

  // Configurar o Intersection Observer
  useEffect(() => {
    setIsMounted(true);
    
    if (!loadingRef.current) return;

    // Criar observer com configurações otimizadas
    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
      // Usar passive para melhor performance
    });

    const currentRef = loadingRef.current;
    observerRef.current.observe(currentRef);

    return () => {
      if (observerRef.current && currentRef) {
        observerRef.current.unobserve(currentRef);
      }
      observerRef.current?.disconnect();
      setIsMounted(false);
    };
  }, [handleIntersection, threshold, rootMargin]);

  // Cleanup quando o componente for desmontado
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return {
    loadingRef,
    isMounted
  };
};