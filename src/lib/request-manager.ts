// Sistema de gerenciamento de requisições para evitar ERR_ABORTED
class RequestManager {
  private static instance: RequestManager;
  private activeRequests: Map<string, AbortController> = new Map();
  private requestQueue: Map<string, Promise<any>> = new Map();
  private requestCounts: Map<string, number> = new Map();
  private lastRequestTime: Map<string, number> = new Map();
  
  private constructor() {}

  public static getInstance(): RequestManager {
    if (!RequestManager.instance) {
      RequestManager.instance = new RequestManager();
    }
    return RequestManager.instance;
  }

  public async makeRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    options: {
      timeout?: number;
      retries?: number;
      minInterval?: number;
    } = {}
  ): Promise<T> {
    const { timeout = 30000, retries = 3, minInterval = 1000 } = options;

    // Verificar se já existe uma requisição em andamento
    if (this.requestQueue.has(key)) {
      console.log(`⏳ [RequestManager] Aguardando requisição existente: ${key}`);
      return this.requestQueue.get(key)!;
    }

    // Verificar intervalo mínimo entre requisições
    const lastTime = this.lastRequestTime.get(key) || 0;
    const now = Date.now();
    const timeSinceLastRequest = now - lastTime;
    
    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      console.log(`⏰ [RequestManager] Aguardando ${waitTime}ms antes da próxima requisição: ${key}`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Cancelar requisição anterior se existir
    if (this.activeRequests.has(key)) {
      console.log(`🚫 [RequestManager] Cancelando requisição anterior: ${key}`);
      this.activeRequests.get(key)?.abort();
      this.activeRequests.delete(key);
    }

    // Criar nova requisição
    const controller = new AbortController();
    this.activeRequests.set(key, controller);
    this.lastRequestTime.set(key, Date.now());

    const requestPromise = this.executeWithRetry(
      key,
      requestFn,
      controller,
      timeout,
      retries
    );

    this.requestQueue.set(key, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.activeRequests.delete(key);
      this.requestQueue.delete(key);
    }
  }

  private async executeWithRetry<T>(
    key: string,
    requestFn: () => Promise<T>,
    controller: AbortController,
    timeout: number,
    retries: number
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🚀 [RequestManager] Tentativa ${attempt}/${retries} para: ${key}`);

        // Configurar timeout
        const timeoutId = setTimeout(() => {
          console.warn(`⏰ [RequestManager] Timeout na requisição: ${key}`);
          controller.abort();
        }, timeout);

        const result = await requestFn();
        
        clearTimeout(timeoutId);
        console.log(`✅ [RequestManager] Sucesso na tentativa ${attempt} para: ${key}`);
        
        // Incrementar contador de sucesso
        const count = this.requestCounts.get(key) || 0;
        this.requestCounts.set(key, count + 1);
        
        return result;
      } catch (error: any) {
        lastError = error;
        console.warn(`❌ [RequestManager] Erro na tentativa ${attempt}/${retries} para ${key}:`, error.message);

        // Se foi cancelado, não tentar novamente
        if (error.name === 'AbortError' || controller.signal.aborted) {
          console.log(`🚫 [RequestManager] Requisição cancelada: ${key}`);
          throw error;
        }

        // Se não é a última tentativa, aguardar antes de tentar novamente
        if (attempt < retries) {
          const backoffTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ [RequestManager] Aguardando ${backoffTime}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }
    }

    console.error(`💥 [RequestManager] Todas as tentativas falharam para: ${key}`);
    throw lastError;
  }

  public cancelRequest(key: string): void {
    if (this.activeRequests.has(key)) {
      console.log(`🚫 [RequestManager] Cancelando requisição: ${key}`);
      this.activeRequests.get(key)?.abort();
      this.activeRequests.delete(key);
      this.requestQueue.delete(key);
    }
  }

  public cancelAllRequests(): void {
    console.log('🚫 [RequestManager] Cancelando todas as requisições');
    this.activeRequests.forEach((controller, key) => {
      console.log(`🚫 [RequestManager] Cancelando: ${key}`);
      controller.abort();
    });
    this.activeRequests.clear();
    this.requestQueue.clear();
  }

  public getStats(): { active: string[], queued: string[], counts: Record<string, number> } {
    return {
      active: Array.from(this.activeRequests.keys()),
      queued: Array.from(this.requestQueue.keys()),
      counts: Object.fromEntries(this.requestCounts)
    };
  }

  public reset(): void {
    this.cancelAllRequests();
    this.requestCounts.clear();
    this.lastRequestTime.clear();
  }
}

export const requestManager = RequestManager.getInstance();

// Hook para usar o gerenciador de requisições
export function useRequestManager() {
  return {
    makeRequest: requestManager.makeRequest.bind(requestManager),
    cancelRequest: requestManager.cancelRequest.bind(requestManager),
    cancelAllRequests: requestManager.cancelAllRequests.bind(requestManager),
    getStats: requestManager.getStats.bind(requestManager),
    reset: requestManager.reset.bind(requestManager)
  };
}