import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMemoryLeakDetection } from './useMemoryOptimization';

interface PaginationConfig {
  itemsPerPage: number;
  prefetchPages: number;
  cacheSize: number;
  adaptiveLoading: boolean;
}

interface PaginationState<T> {
  currentPage: number;
  totalPages: number;
  items: T[];
  loading: boolean;
  error: string | null;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface CachedPage<T> {
  data: T[];
  timestamp: number;
  accessed: number;
}

export function useIntelligentPagination<T>(
  allItems: T[],
  config: PaginationConfig = {
    itemsPerPage: 12,
    prefetchPages: 2,
    cacheSize: 10,
    adaptiveLoading: true
  }
) {
  const memoryUtils = useMemoryLeakDetection('IntelligentPagination');
  
  // Estado da paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache inteligente com LRU
  const [pageCache, setPageCache] = useState<Map<number, CachedPage<T>>>(new Map());
  
  // Detectar velocidade de conexão para adaptive loading
  const [connectionSpeed, setConnectionSpeed] = useState<'slow' | 'fast'>('fast');
  
  useEffect(() => {
    if (config.adaptiveLoading && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      const updateConnectionSpeed = () => {
        const effectiveType = connection.effectiveType;
        setConnectionSpeed(['slow-2g', '2g', '3g'].includes(effectiveType) ? 'slow' : 'fast');
      };
      
      updateConnectionSpeed();
      connection.addEventListener('change', updateConnectionSpeed);
      
      return () => {
        connection.removeEventListener('change', updateConnectionSpeed);
      };
    }
  }, [config.adaptiveLoading]);

  // Calcular páginas totais
  const totalPages = useMemo(() => {
    return Math.ceil(allItems.length / config.itemsPerPage);
  }, [allItems.length, config.itemsPerPage]);

  // Obter itens da página atual
  const getCurrentPageItems = useCallback((page: number): T[] => {
    const startIndex = (page - 1) * config.itemsPerPage;
    const endIndex = startIndex + config.itemsPerPage;
    return allItems.slice(startIndex, endIndex);
  }, [allItems, config.itemsPerPage]);

  // Cache management com LRU
  const addToCache = useCallback((page: number, data: T[]) => {
    setPageCache(prev => {
      const newCache = new Map(prev);
      
      // Remover páginas antigas se cache estiver cheio
      if (newCache.size >= config.cacheSize) {
        // Encontrar página menos recentemente acessada
        let oldestPage = -1;
        let oldestAccess = Date.now();
        
        for (const [pageNum, cachedPage] of newCache) {
          if (cachedPage.accessed < oldestAccess) {
            oldestAccess = cachedPage.accessed;
            oldestPage = pageNum;
          }
        }
        
        if (oldestPage !== -1) {
          newCache.delete(oldestPage);
        }
      }
      
      // Adicionar nova página
      newCache.set(page, {
        data,
        timestamp: Date.now(),
        accessed: Date.now()
      });
      
      return newCache;
    });
  }, [config.cacheSize]);

  // Obter dados do cache
  const getFromCache = useCallback((page: number): T[] | null => {
    const cached = pageCache.get(page);
    if (!cached) return null;
    
    // Verificar se cache ainda é válido (5 minutos)
    const isValid = Date.now() - cached.timestamp < 5 * 60 * 1000;
    if (!isValid) {
      setPageCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(page);
        return newCache;
      });
      return null;
    }
    
    // Atualizar timestamp de acesso
    setPageCache(prev => {
      const newCache = new Map(prev);
      const cachedPage = newCache.get(page);
      if (cachedPage) {
        cachedPage.accessed = Date.now();
      }
      return newCache;
    });
    
    return cached.data;
  }, [pageCache]);

  // Prefetch de páginas adjacentes
  const prefetchPages = useCallback(async (centerPage: number) => {
    const pagesToPrefetch: number[] = [];
    
    // Determinar quantas páginas prefetch baseado na velocidade da conexão
    const prefetchCount = connectionSpeed === 'slow' ? 1 : config.prefetchPages;
    
    for (let i = 1; i <= prefetchCount; i++) {
      const nextPage = centerPage + i;
      const prevPage = centerPage - i;
      
      if (nextPage <= totalPages && !pageCache.has(nextPage)) {
        pagesToPrefetch.push(nextPage);
      }
      if (prevPage >= 1 && !pageCache.has(prevPage)) {
        pagesToPrefetch.push(prevPage);
      }
    }
    
    // Prefetch em background
    pagesToPrefetch.forEach(page => {
      memoryUtils.safeSetTimeout(() => {
        const data = getCurrentPageItems(page);
        addToCache(page, data);
      }, 100 * (page - centerPage)); // Stagger requests
    });
  }, [connectionSpeed, config.prefetchPages, totalPages, pageCache, getCurrentPageItems, addToCache, memoryUtils]);

  // Navegar para página
  const goToPage = useCallback(async (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Tentar obter do cache primeiro
      let pageData = getFromCache(page);
      
      if (!pageData) {
        // Simular delay de carregamento para UX realista
        await new Promise<void>(resolve => memoryUtils.safeSetTimeout(resolve, 200));
        pageData = getCurrentPageItems(page);
        addToCache(page, pageData);
      }
      
      setCurrentPage(page);
      
      // Prefetch páginas adjacentes
      prefetchPages(page);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar página');
    } finally {
      setLoading(false);
    }
  }, [currentPage, totalPages, getFromCache, getCurrentPageItems, addToCache, prefetchPages, memoryUtils]);

  // Navegação rápida
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  const firstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const lastPage = useCallback(() => {
    goToPage(totalPages);
  }, [goToPage, totalPages]);

  // Obter itens da página atual
  const currentItems = useMemo(() => {
    const cached = getFromCache(currentPage);
    return cached || getCurrentPageItems(currentPage);
  }, [currentPage, getFromCache, getCurrentPageItems]);

  // Inicializar cache com página atual
  useEffect(() => {
    const initialData = getCurrentPageItems(currentPage);
    addToCache(currentPage, initialData);
    prefetchPages(currentPage);
  }, [currentPage, getCurrentPageItems, addToCache, prefetchPages]);

  // Estado da paginação
  const paginationState: PaginationState<T> = {
    currentPage,
    totalPages,
    items: currentItems,
    loading,
    error,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };

  // Estatísticas do cache
  const cacheStats = useMemo(() => ({
    size: pageCache.size,
    hitRate: pageCache.size > 0 ? (pageCache.size / Math.max(currentPage, 1)) * 100 : 0,
    connectionSpeed
  }), [pageCache.size, currentPage, connectionSpeed]);

  return {
    ...paginationState,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    cacheStats,
    clearCache: () => setPageCache(new Map())
  };
}

// Hook especializado para artigos
export function useArticlePagination(
  articles: any[],
  itemsPerPage: number = 12
) {
  return useIntelligentPagination(articles, {
    itemsPerPage,
    prefetchPages: 2,
    cacheSize: 15,
    adaptiveLoading: true
  });
}