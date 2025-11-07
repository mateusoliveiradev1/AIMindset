import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyLoadWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}

// Componente de fallback padrão com estilos de performance
const DefaultFallback = () => (
  <div className="flex items-center justify-center p-8 min-h-[200px]">
    <div className="flex flex-col items-center space-y-2">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

// Wrapper com Intersection Observer para lazy loading inteligente
export const LazyLoadWrapper: React.FC<LazyLoadWrapperProps> = ({
  children,
  fallback = <DefaultFallback />,
  threshold = 0.1,
  rootMargin = '50px'
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const elementRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin, isVisible]);

  return (
    <div ref={elementRef} className="lazy-load-wrapper">
      {isVisible ? (
        <Suspense fallback={fallback}>
          {children}
        </Suspense>
      ) : (
        <div className="min-h-[200px] bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse rounded-lg" />
      )}
    </div>
  );
};

// Lazy loaders específicos para componentes pesados
export const LazyLogs = lazy(() => 
  import('@/pages/admin/logs').then(module => ({
    default: module.default
  }))
);

export const LazyBackup = lazy(() =>
  import('@/pages/admin/backup').then(module => ({
    default: module.default
  }))
);

export const LazyNewsletter = lazy(() =>
  import('@/pages/admin/newsletter').then(module => ({
    default: module.default
  }))
);

export const LazyFeedback = lazy(() =>
  import('@/pages/admin/feedback').then(module => ({
    default: module.default
  }))
);

// Hook para lazy loading de dados
export const useLazyData = <T,>(
  fetchFn: () => Promise<T>,
  dependencies: React.DependencyList = []
) => {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const loadData = React.useCallback(async () => {
    if (data !== null) return; // Já carregado

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar dados'));
    } finally {
      setLoading(false);
    }
  }, [fetchFn, data]);

  React.useEffect(() => {
    loadData();
  }, [loadData, ...dependencies]);

  return { data, loading, error, refetch: loadData };
};

export default LazyLoadWrapper;