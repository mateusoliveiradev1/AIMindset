// Utility para retry de requisições Supabase com backoff exponencial
export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: any) => boolean;
}

export interface RetryResult<T> {
  data: T | null;
  error: any;
  attempts: number;
  success: boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000, // 1 segundo
  maxDelay: 10000, // 10 segundos
  backoffMultiplier: 2,
  retryCondition: (error: any) => {
    // Log detalhado do erro para debug
    console.log('🔍 [Retry] Analisando erro para retry:', {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      name: error?.name,
      details: error?.details
    });

    // Retry em casos de problemas de rede ou timeouts
    if (error?.message?.includes('Failed to fetch')) {
      console.log('🔄 [Retry] Erro de fetch detectado - retry habilitado');
      return true;
    }
    if (error?.message?.includes('ERR_ABORTED')) {
      console.log('🔄 [Retry] Erro ERR_ABORTED detectado - retry habilitado');
      return true;
    }
    if (error?.message?.includes('NetworkError')) {
      console.log('🔄 [Retry] Erro de rede detectado - retry habilitado');
      return true;
    }
    if (error?.message?.includes('timeout')) {
      console.log('🔄 [Retry] Timeout detectado - retry habilitado');
      return true;
    }
    if (error?.code === 'PGRST301') {
      console.log('🔄 [Retry] Timeout do Supabase detectado - retry habilitado');
      return true;
    }
    if (error?.code === 'PGRST116') {
      console.log('🔄 [Retry] Erro de conexão do Supabase detectado - retry habilitado');
      return true;
    }
    
    // Não retry em erros de autenticação ou permissão
    if (error?.code === 'PGRST103') {
      console.log('❌ [Retry] Erro de permissão (Forbidden) - retry desabilitado');
      return false;
    }
    if (error?.code === 'PGRST301') {
      console.log('❌ [Retry] Erro de autenticação (Unauthorized) - retry desabilitado');
      return false;
    }
    
    console.log('❌ [Retry] Erro não reconhecido - retry desabilitado');
    return false;
  }
};

export async function withRetry<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any = null;
  let attempts = 0;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    attempts = attempt + 1;
    
    try {
      console.log(`🔄 [Retry] Tentativa ${attempts}/${config.maxRetries + 1}`);
      
      const result = await operation();
      
      if (result.error) {
        lastError = result.error;
        
        // Verificar se deve tentar novamente
        if (attempt < config.maxRetries && config.retryCondition(result.error)) {
          const delay = Math.min(
            config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
            config.maxDelay
          );
          
          console.warn(`⚠️ [Retry] Erro na tentativa ${attempts}: ${result.error.message || result.error}`);
          console.log(`⏳ [Retry] Aguardando ${delay}ms antes da próxima tentativa...`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        } else {
          console.error(`❌ [Retry] Erro não recuperável ou limite de tentativas atingido:`, result.error);
          return {
            data: null,
            error: result.error,
            attempts,
            success: false
          };
        }
      }
      
      console.log(`✅ [Retry] Sucesso na tentativa ${attempts}`);
      return {
        data: result.data,
        error: null,
        attempts,
        success: true
      };
      
    } catch (error) {
      lastError = error;
      
      if (attempt < config.maxRetries && config.retryCondition(error)) {
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelay
        );
        
        console.warn(`⚠️ [Retry] Exceção na tentativa ${attempts}: ${error instanceof Error ? error.message : error}`);
        console.log(`⏳ [Retry] Aguardando ${delay}ms antes da próxima tentativa...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      } else {
        console.error(`❌ [Retry] Exceção não recuperável ou limite de tentativas atingido:`, error);
        return {
          data: null,
          error,
          attempts,
          success: false
        };
      }
    }
  }

  return {
    data: null,
    error: lastError,
    attempts,
    success: false
  };
}

// Função específica para operações do Supabase
export async function supabaseWithRetry<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  operationName: string = 'Supabase Operation',
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  console.log(`🚀 [${operationName}] Iniciando operação com retry...`);
  
  const result = await withRetry(operation, {
    maxRetries: 2, // Menos tentativas para não sobrecarregar
    baseDelay: 500, // Delay menor para melhor UX
    ...options
  });
  
  if (result.success) {
    console.log(`✅ [${operationName}] Operação concluída com sucesso após ${result.attempts} tentativa(s)`);
  } else {
    console.error(`❌ [${operationName}] Operação falhou após ${result.attempts} tentativa(s):`, result.error);
  }
  
  return result;
}