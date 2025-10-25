import React from 'react';

// Sistema de controle global de inicialização para evitar ERR_ABORTED
class InitializationManager {
  private static instance: InitializationManager;
  private initializationQueue: Map<string, Promise<any>> = new Map();
  private initialized: Set<string> = new Set();
  private delays: Map<string, number> = new Map();

  private constructor() {
    // Definir delays específicos para cada hook/componente
    this.delays.set('useArticles', 0);
    this.delays.set('useNewsletterSubscribers', 100);
    this.delays.set('useNewsletter', 200);
    this.delays.set('useStats', 300);
    this.delays.set('useSEO', 400);
    this.delays.set('useContacts', 500);
    this.delays.set('useUsers', 600);
    this.delays.set('useDashboardStats', 700);
    this.delays.set('FeaturedArticles', 50);
    this.delays.set('AllArticles', 150);
    this.delays.set('Articles', 200);
    this.delays.set('Article', 250);
  }

  public static getInstance(): InitializationManager {
    if (!InitializationManager.instance) {
      InitializationManager.instance = new InitializationManager();
    }
    return InitializationManager.instance;
  }

  public async initialize<T>(
    key: string, 
    initFunction: () => Promise<T>,
    forceReinitialize: boolean = false
  ): Promise<T> {
    // Se já foi inicializado e não é para forçar reinicialização, retorna
    if (this.initialized.has(key) && !forceReinitialize) {
      console.log(`🔄 [InitManager] ${key} já inicializado, pulando...`);
      return Promise.resolve(null as T);
    }

    // Se já está na fila de inicialização, aguarda
    if (this.initializationQueue.has(key)) {
      console.log(`⏳ [InitManager] ${key} já na fila, aguardando...`);
      return this.initializationQueue.get(key)!;
    }

    // Criar nova inicialização com delay
    const delay = this.delays.get(key) || 0;
    console.log(`🚀 [InitManager] Inicializando ${key} com delay de ${delay}ms`);

    const initPromise = new Promise<T>((resolve, reject) => {
      setTimeout(async () => {
        try {
          const result = await initFunction();
          this.initialized.add(key);
          this.initializationQueue.delete(key);
          console.log(`✅ [InitManager] ${key} inicializado com sucesso`);
          resolve(result);
        } catch (error) {
          this.initializationQueue.delete(key);
          console.error(`❌ [InitManager] Erro ao inicializar ${key}:`, error);
          reject(error);
        }
      }, delay);
    });

    this.initializationQueue.set(key, initPromise);
    return initPromise;
  }

  public markAsInitialized(key: string): void {
    this.initialized.add(key);
    console.log(`✅ [InitManager] ${key} marcado como inicializado`);
  }

  public isInitialized(key: string): boolean {
    return this.initialized.has(key);
  }

  public reset(): void {
    console.log('🔄 [InitManager] Resetando estado de inicialização');
    this.initializationQueue.clear();
    this.initialized.clear();
  }

  public getStatus(): { initialized: string[], inQueue: string[] } {
    return {
      initialized: Array.from(this.initialized),
      inQueue: Array.from(this.initializationQueue.keys())
    };
  }
}

export const initManager = InitializationManager.getInstance();

// Hook para usar o gerenciador de inicialização
export function useInitialization<T>(
  key: string,
  initFunction: () => Promise<T>,
  dependencies: any[] = []
) {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        setError(null);
        await initManager.initialize(key, initFunction);
        if (isMounted) {
          setIsInitialized(true);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, dependencies);

  return { isInitialized, error };
}

// Função para aguardar inicialização de múltiplos hooks
export async function waitForInitialization(keys: string[], timeout: number = 10000): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const allInitialized = keys.every(key => initManager.isInitialized(key));
    if (allInitialized) {
      console.log(`✅ [InitManager] Todos os hooks inicializados: ${keys.join(', ')}`);
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const status = initManager.getStatus();
  console.warn(`⚠️ [InitManager] Timeout aguardando inicialização. Status:`, status);
}