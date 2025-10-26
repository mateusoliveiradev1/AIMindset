import { useCallback, useEffect, useRef, useState } from 'react';

// Hook para monitoramento de memória
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
    percentage: number;
  } | null>(null);

  const updateMemoryInfo = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const percentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      
      setMemoryInfo({
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        percentage
      });
    }
  }, []);

  useEffect(() => {
    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // Atualizar a cada 5 segundos

    return () => clearInterval(interval);
  }, [updateMemoryInfo]);

  return { memoryInfo, updateMemoryInfo };
};

// Hook para limpeza automática de cache
export const useAutoCleanup = (maxItems: number = 1000) => {
  const cacheRef = useRef<Map<string, any>>(new Map());
  const accessOrderRef = useRef<string[]>([]);

  const set = useCallback((key: string, value: any) => {
    const cache = cacheRef.current;
    const accessOrder = accessOrderRef.current;

    // Se já existe, remover da ordem de acesso
    if (cache.has(key)) {
      const index = accessOrder.indexOf(key);
      if (index > -1) {
        accessOrder.splice(index, 1);
      }
    }

    // Adicionar/atualizar valor
    cache.set(key, value);
    accessOrder.push(key);

    // Limpar itens antigos se exceder o limite
    while (cache.size > maxItems) {
      const oldestKey = accessOrder.shift();
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }
  }, [maxItems]);

  const get = useCallback((key: string) => {
    const cache = cacheRef.current;
    const accessOrder = accessOrderRef.current;

    if (cache.has(key)) {
      // Mover para o final da ordem de acesso (mais recente)
      const index = accessOrder.indexOf(key);
      if (index > -1) {
        accessOrder.splice(index, 1);
        accessOrder.push(key);
      }
      return cache.get(key);
    }
    return undefined;
  }, []);

  const clear = useCallback(() => {
    cacheRef.current.clear();
    accessOrderRef.current = [];
  }, []);

  const size = cacheRef.current.size;

  return { set, get, clear, size };
};

// Hook para otimização de re-renders
export const useRenderOptimization = () => {
  const renderCountRef = useRef(0);
  const lastRenderTime = useRef(Date.now());
  const [renderStats, setRenderStats] = useState({
    count: 0,
    averageTime: 0,
    lastRender: Date.now()
  });

  useEffect(() => {
    renderCountRef.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    
    setRenderStats(prev => ({
      count: renderCountRef.current,
      averageTime: (prev.averageTime * (prev.count - 1) + timeSinceLastRender) / prev.count,
      lastRender: now
    }));

    lastRenderTime.current = now;
  });

  return renderStats;
};

// Hook para detecção de vazamentos de memória
export const useMemoryLeakDetection = (componentName: string) => {
  const mountTime = useRef(Date.now());
  const timersRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const intervalsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const listenersRef = useRef<Array<{ element: EventTarget; event: string; handler: EventListener }>>([]); 

  // Wrapper para setTimeout que rastreia timers
  const safeSetTimeout = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      callback();
    }, delay);
    
    timersRef.current.add(timer);
    return timer;
  }, []);

  // Wrapper para setInterval que rastreia intervals
  const safeSetInterval = useCallback((callback: () => void, delay: number) => {
    const interval = setInterval(callback, delay);
    intervalsRef.current.add(interval);
    return interval;
  }, []);

  // Wrapper para addEventListener que rastreia listeners
  const safeAddEventListener = useCallback((
    element: EventTarget, 
    event: string, 
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ) => {
    element.addEventListener(event, handler, options);
    listenersRef.current.push({ element, event, handler });
  }, []);

  // Limpeza automática no unmount
  useEffect(() => {
    return () => {
      // Limpar todos os timers
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current.clear();

      // Limpar todos os intervals
      intervalsRef.current.forEach(interval => clearInterval(interval));
      intervalsRef.current.clear();

      // Remover todos os event listeners
      listenersRef.current.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      listenersRef.current = [];

      // Log para debug em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        const lifeTime = Date.now() - mountTime.current;
        console.log(`🧹 [${componentName}] Cleanup completed after ${lifeTime}ms`);
      }
    };
  }, [componentName]);

  return {
    safeSetTimeout,
    safeSetInterval,
    safeAddEventListener,
    activeTimers: timersRef.current.size,
    activeIntervals: intervalsRef.current.size,
    activeListeners: listenersRef.current.length
  };
};