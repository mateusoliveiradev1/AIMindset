import { useEffect, useRef, useCallback, useState } from 'react';
import type { ProcessingTask, ProcessingResult } from '../workers/articleProcessor';

export interface WebWorkerHook {
  processTask: (task: Omit<ProcessingTask, 'id'>) => Promise<any>;
  isProcessing: boolean;
  clearCache: () => void;
  getCacheSize: () => Promise<number>;
  terminate: () => void;
}

export function useWebWorker(): WebWorkerHook {
  const workerRef = useRef<Worker | null>(null);
  const taskCallbacksRef = useRef<Map<string, { resolve: (value: any) => void; reject: (error: Error) => void }>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const taskCounterRef = useRef(0);

  // Inicializar worker
  useEffect(() => {
    // Criar worker apenas se suportado
    if (typeof Worker === 'undefined') {
      console.warn('Web Workers não suportados neste navegador');
      return;
    }

    try {
      // Criar worker a partir do arquivo TypeScript
      workerRef.current = new Worker(
        new URL('../workers/articleProcessor.ts', import.meta.url),
        { type: 'module' }
      );

      // Configurar listener de mensagens
      workerRef.current.onmessage = (event) => {
        const { type, taskId, result, error, processingTime } = event.data;

        switch (type) {
          case 'WORKER_READY':
            console.log('Web Worker inicializado com sucesso');
            break;

          case 'TASK_COMPLETED':
            const successCallback = taskCallbacksRef.current.get(taskId);
            if (successCallback) {
              successCallback.resolve(result);
              taskCallbacksRef.current.delete(taskId);
            }
            setIsProcessing(taskCallbacksRef.current.size > 0);
            console.log(`Tarefa ${taskId} concluída em ${processingTime?.toFixed(2)}ms`);
            break;

          case 'TASK_ERROR':
            const errorCallback = taskCallbacksRef.current.get(taskId);
            if (errorCallback) {
              errorCallback.reject(new Error(error));
              taskCallbacksRef.current.delete(taskId);
            }
            setIsProcessing(taskCallbacksRef.current.size > 0);
            console.error(`Erro na tarefa ${taskId}:`, error);
            break;

          case 'CACHE_CLEARED':
            console.log('Cache do Web Worker limpo');
            break;

          case 'CACHE_SIZE':
            // Handled by specific promise in getCacheSize
            break;

          default:
            console.warn('Tipo de mensagem não reconhecido do Web Worker:', type);
        }
      };

      // Configurar listener de erros
      workerRef.current.onerror = (error) => {
        console.error('Erro no Web Worker:', error);
        
        // Rejeitar todas as tarefas pendentes
        taskCallbacksRef.current.forEach(({ reject }) => {
          reject(new Error('Web Worker falhou'));
        });
        taskCallbacksRef.current.clear();
        setIsProcessing(false);
      };

    } catch (error) {
      console.error('Erro ao criar Web Worker:', error);
    }

    // Cleanup
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      taskCallbacksRef.current.clear();
    };
  }, []);

  // Processar tarefa
  const processTask = useCallback(async (task: Omit<ProcessingTask, 'id'>): Promise<any> => {
    if (!workerRef.current) {
      throw new Error('Web Worker não disponível');
    }

    const taskId = `task_${++taskCounterRef.current}_${Date.now()}`;
    const fullTask: ProcessingTask = {
      ...task,
      id: taskId
    };

    return new Promise((resolve, reject) => {
      // Armazenar callbacks
      taskCallbacksRef.current.set(taskId, { resolve, reject });
      setIsProcessing(true);

      // Enviar tarefa para o worker
      workerRef.current!.postMessage({
        type: 'PROCESS_TASK',
        task: fullTask
      });

      // Timeout para evitar tarefas infinitas
      setTimeout(() => {
        if (taskCallbacksRef.current.has(taskId)) {
          taskCallbacksRef.current.delete(taskId);
          setIsProcessing(taskCallbacksRef.current.size > 0);
          reject(new Error('Timeout na execução da tarefa'));
        }
      }, 30000); // 30 segundos
    });
  }, []);

  // Limpar cache
  const clearCache = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'CLEAR_CACHE' });
    }
  }, []);

  // Obter tamanho do cache
  const getCacheSize = useCallback((): Promise<number> => {
    if (!workerRef.current) {
      return Promise.resolve(0);
    }

    return new Promise((resolve) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'CACHE_SIZE') {
          workerRef.current!.removeEventListener('message', handleMessage);
          resolve(event.data.size);
        }
      };

      workerRef.current.addEventListener('message', handleMessage);
      workerRef.current.postMessage({ type: 'GET_CACHE_SIZE' });
    });
  }, []);

  // Terminar worker
  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    taskCallbacksRef.current.clear();
    setIsProcessing(false);
  }, []);

  return {
    processTask,
    isProcessing,
    clearCache,
    getCacheSize,
    terminate
  };
}

// Hook especializado para busca de artigos
export function useArticleSearch() {
  const { processTask, isProcessing } = useWebWorker();

  const searchArticles = useCallback(async (
    articles: any[],
    query: string,
    options?: { fuzzy?: boolean; threshold?: number }
  ) => {
    if (!query.trim()) {
      return { results: articles, totalFound: articles.length };
    }

    return processTask({
      type: 'SEARCH',
      data: { articles, query, options },
      priority: 'high'
    });
  }, [processTask]);

  return {
    searchArticles,
    isSearching: isProcessing
  };
}

// Hook especializado para filtros de artigos
export function useArticleFilter() {
  const { processTask, isProcessing } = useWebWorker();

  const filterArticles = useCallback(async (
    articles: any[],
    filters: any
  ) => {
    return processTask({
      type: 'FILTER',
      data: { articles, filters },
      priority: 'medium'
    });
  }, [processTask]);

  return {
    filterArticles,
    isFiltering: isProcessing
  };
}

// Hook especializado para ordenação de artigos
export function useArticleSort() {
  const { processTask, isProcessing } = useWebWorker();

  const sortArticles = useCallback(async (
    articles: any[],
    sortBy: string,
    order: 'asc' | 'desc' = 'desc'
  ) => {
    return processTask({
      type: 'SORT',
      data: { articles, sortBy, order },
      priority: 'low'
    });
  }, [processTask]);

  return {
    sortArticles,
    isSorting: isProcessing
  };
}

// Hook especializado para análise de artigos
export function useArticleAnalysis() {
  const { processTask, isProcessing } = useWebWorker();

  const analyzeArticles = useCallback(async (articles: any[]) => {
    return processTask({
      type: 'ANALYZE',
      data: { articles },
      priority: 'low'
    });
  }, [processTask]);

  const generateSummary = useCallback(async (article: any) => {
    return processTask({
      type: 'GENERATE_SUMMARY',
      data: { article },
      priority: 'medium'
    });
  }, [processTask]);

  return {
    analyzeArticles,
    generateSummary,
    isAnalyzing: isProcessing
  };
}

// Hook para monitoramento de performance do Web Worker
export function useWebWorkerPerformance() {
  const [metrics, setMetrics] = useState({
    tasksCompleted: 0,
    averageProcessingTime: 0,
    cacheHitRate: 0,
    errorRate: 0
  });

  const { getCacheSize, clearCache } = useWebWorker();

  const updateMetrics = useCallback((processingTime: number, fromCache: boolean, hasError: boolean) => {
    setMetrics(prev => {
      const newTasksCompleted = prev.tasksCompleted + 1;
      const newAverageTime = (prev.averageProcessingTime * prev.tasksCompleted + processingTime) / newTasksCompleted;
      const cacheHits = fromCache ? 1 : 0;
      const newCacheHitRate = (prev.cacheHitRate * prev.tasksCompleted + cacheHits) / newTasksCompleted;
      const errors = hasError ? 1 : 0;
      const newErrorRate = (prev.errorRate * prev.tasksCompleted + errors) / newTasksCompleted;

      return {
        tasksCompleted: newTasksCompleted,
        averageProcessingTime: newAverageTime,
        cacheHitRate: newCacheHitRate,
        errorRate: newErrorRate
      };
    });
  }, []);

  const resetMetrics = useCallback(() => {
    setMetrics({
      tasksCompleted: 0,
      averageProcessingTime: 0,
      cacheHitRate: 0,
      errorRate: 0
    });
  }, []);

  return {
    metrics,
    updateMetrics,
    resetMetrics,
    getCacheSize,
    clearCache
  };
}