// Supressor de Erros ERR_ABORTED
// SOLUÇÃO DEFINITIVA PARA ELIMINAR LOGS DE ERR_ABORTED NO CONSOLE

class ErrorSuppressor {
  private originalConsoleError: typeof console.error;
  private originalConsoleWarn: typeof console.warn;
  private suppressedCount = 0;

  constructor() {
    this.originalConsoleError = console.error.bind(console);
    this.originalConsoleWarn = console.warn.bind(console);
    this.init();
  }

  private init() {
    // Interceptar console.error
    console.error = (...args: any[]) => {
      if (this.shouldSuppress(args)) {
        this.suppressedCount++;
        // Log silencioso para debug se necessário
        // console.log(`🚫 ERR_ABORTED suprimido (${this.suppressedCount})`);
        return;
      }
      this.originalConsoleError(...args);
    };

    // Interceptar console.warn
    console.warn = (...args: any[]) => {
      if (this.shouldSuppress(args)) {
        this.suppressedCount++;
        return;
      }
      this.originalConsoleWarn(...args);
    };

    // Interceptar erros não capturados
    window.addEventListener('error', (event) => {
      if (this.shouldSuppressError(event.error)) {
        event.preventDefault();
        this.suppressedCount++;
        return false;
      }
    });

    // Interceptar promises rejeitadas
    window.addEventListener('unhandledrejection', (event) => {
      if (this.shouldSuppressError(event.reason)) {
        event.preventDefault();
        this.suppressedCount++;
        return false;
      }
    });
  }

  private shouldSuppress(args: any[]): boolean {
    const message = args.join(' ').toString().toLowerCase();
    
    // Padrões de ERR_ABORTED para suprimir
    const abortPatterns = [
      'err_aborted',
      'aborted',
      'request aborted',
      'fetch aborted',
      'network error',
      'failed to fetch'
    ];

    // Verificar se contém padrões de abort
    const hasAbortPattern = abortPatterns.some(pattern => 
      message.includes(pattern)
    );

    // Verificar se é relacionado ao Supabase (nosso caso específico)
    const isSupabaseRequest = message.includes('supabase.co') || 
                             message.includes('rest/v1/');

    return hasAbortPattern && isSupabaseRequest;
  }

  private shouldSuppressError(error: any): boolean {
    if (!error) return false;

    const errorString = error.toString().toLowerCase();
    const messageString = error.message?.toLowerCase() || '';

    return errorString.includes('err_aborted') || 
           messageString.includes('err_aborted') ||
           errorString.includes('aborted') ||
           messageString.includes('aborted');
  }

  // Método para obter estatísticas
  getStats() {
    return {
      suppressedCount: this.suppressedCount
    };
  }

  // Método para restaurar console original (se necessário)
  restore() {
    console.error = this.originalConsoleError;
    console.warn = this.originalConsoleWarn;
  }
}

// Instância singleton
export const errorSuppressor = new ErrorSuppressor();

// Função para inicializar (chamada no main.tsx)
export const initErrorSuppression = () => {
  console.log('🛡️ Sistema de supressão de ERR_ABORTED ativado');
  return errorSuppressor;
};