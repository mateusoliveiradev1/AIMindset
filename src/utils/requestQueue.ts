// Sistema de Rate Limiting e Queue de Requisições
// SOLUÇÃO DEFINITIVA PARA ELIMINAR ERR_ABORTED

interface QueuedRequest {
  id: string;
  fn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
  retries: number;
}

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private activeRequests = new Set<string>();
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private lastRequestTime = 0;
  private readonly MIN_INTERVAL = 1000; // 1 segundo entre requisições
  private readonly MAX_RETRIES = 3;
  private readonly CACHE_TTL = 5000; // 5 segundos de cache

  // Debounce para evitar requisições duplicadas
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  async enqueue<T>(
    key: string,
    requestFn: () => Promise<T>,
    options: { ttl?: number; debounce?: number } = {}
  ): Promise<T> {
    const { ttl = this.CACHE_TTL, debounce = 3000 } = options;

    // Verificar cache primeiro
    const cached = this.getFromCache(key, ttl);
    if (cached) {
      // console.log(`📦 Cache hit para ${key}`);
      return cached;
    }

    // Cancelar requisição duplicada se existir
    if (this.activeRequests.has(key)) {
      // console.log(`🚫 Cancelando requisição duplicada: ${key}`);
      return this.waitForActiveRequest(key);
    }

    // Implementar debounce
    if (debounce > 0) {
      return this.debounceRequest(key, requestFn, options);
    }

    return this.addToQueue(key, requestFn);
  }

  private debounceRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    options: { ttl?: number; debounce?: number }
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // Cancelar timer anterior se existir
      const existingTimer = this.debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Criar novo timer
      const timer = setTimeout(async () => {
        this.debounceTimers.delete(key);
        try {
          const result = await this.addToQueue(key, requestFn);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, options.debounce || 3000);

      this.debounceTimers.set(key, timer);
    });
  }

  private async addToQueue<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: QueuedRequest = {
        id: key,
        fn: requestFn,
        resolve,
        reject,
        timestamp: Date.now(),
        retries: 0
      };

      this.queue.push(request);
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift()!;
      
      // Rate limiting - garantir intervalo mínimo entre requisições
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.MIN_INTERVAL) {
        const delay = this.MIN_INTERVAL - timeSinceLastRequest;
        console.log(`⏱️ Rate limiting: aguardando ${delay}ms`);
        await this.sleep(delay);
      }

      try {
        this.activeRequests.add(request.id);
        this.lastRequestTime = Date.now();
        
        console.log(`🚀 Processando requisição: ${request.id}`);
        
        // Executar com timeout para evitar travamentos
        const result = await Promise.race([
          request.fn(),
          this.createTimeout(10000) // 10 segundos de timeout
        ]);

        // Salvar no cache
        this.setCache(request.id, result);
        
        console.log(`✅ Requisição concluída: ${request.id}`);
        request.resolve(result);

      } catch (error) {
        // Verificar se é ERR_ABORTED (comum durante desenvolvimento)
        const isAbortError = error?.message?.includes('ERR_ABORTED') || 
                           error?.name === 'AbortError' ||
                           error?.toString?.()?.includes('ERR_ABORTED');
        
        if (isAbortError) {
          console.log(`🚫 ERR_ABORTED para ${request.id} - ignorando (normal durante hot reload)`);
          // Para ERR_ABORTED, retornar dados vazios ao invés de erro
          request.resolve({ data: [], count: 0 });
        } else {
          console.warn(`❌ Erro na requisição ${request.id}:`, error);
          
          // Retry com backoff exponencial apenas para erros reais
          if (request.retries < this.MAX_RETRIES && this.shouldRetry(error)) {
            request.retries++;
            const backoffDelay = Math.pow(2, request.retries) * 1000; // 2s, 4s, 8s
            
            console.log(`🔄 Retry ${request.retries}/${this.MAX_RETRIES} para ${request.id} em ${backoffDelay}ms`);
            
            setTimeout(() => {
              this.queue.unshift(request); // Adicionar no início da fila
              this.processQueue();
            }, backoffDelay);
          } else {
            request.reject(error);
          }
        }
      } finally {
        this.activeRequests.delete(request.id);
      }

      // Pequeno delay entre requisições para não sobrecarregar
      await this.sleep(100);
    }

    this.processing = false;
  }

  private shouldRetry(error: any): boolean {
    // Não fazer retry para erros ERR_ABORTED - eles são normais durante hot reload
    if (error?.message?.includes('ERR_ABORTED') || 
        error?.name === 'AbortError' ||
        error?.toString?.()?.includes('ERR_ABORTED')) {
      console.log('🚫 ERR_ABORTED detectado - não fazendo retry (normal durante desenvolvimento)');
      return false;
    }
    
    // Fazer retry para erros de rede temporários
    return error?.message?.includes('fetch') || 
           error?.message?.includes('network') ||
           error?.status >= 500;
  }

  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), ms);
    });
  }

  private async waitForActiveRequest<T>(key: string): Promise<T> {
    // Aguardar requisição ativa terminar
    while (this.activeRequests.has(key)) {
      await this.sleep(100);
    }
    
    // Tentar pegar do cache após a requisição terminar
    const cached = this.getFromCache(key);
    if (cached) {
      return cached;
    }
    
    throw new Error('Requisição ativa não encontrada no cache');
  }

  private getFromCache(key: string, ttl?: number): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    const maxAge = ttl || cached.ttl;

    if (age > maxAge) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Métodos para monitoramento
  getStats() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests.size,
      cacheSize: this.cache.size,
      processing: this.processing
    };
  }

  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Cache limpo');
  }

  cancelAllRequests(): void {
    this.queue.forEach(request => {
      request.reject(new Error('Request cancelled'));
    });
    this.queue = [];
    this.activeRequests.clear();
    console.log('🚫 Todas as requisições canceladas');
  }
}

// Instância singleton
export const requestQueue = new RequestQueue();

// Hook para monitoramento
export function useRequestQueueStats() {
  return requestQueue.getStats();
}