import { supabaseServiceClient } from '../lib/supabase';

/**
 * Verifica se o Supabase está pronto para receber requisições
 * Testa a conexão com uma query simples
 */
export const waitForSupabaseReady = async (maxWait: number = 5000): Promise<boolean> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    try {
      // Test connection with a simple query
      const { error } = await supabaseServiceClient
        .from('newsletter_subscribers')
        .select('id')
        .limit(1);
      
      if (!error) {
        return true;
      }
    } catch (e) {
      // Continue waiting
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return false;
};

/**
 * Retry com backoff exponencial e jitter
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff with jitter
      const jitter = Math.random() * 0.3; // 0-30% jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) * (1 + jitter);
      
      console.warn(`Attempt ${attempt} failed, retrying in ${Math.round(delay)}ms...`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

/**
 * Debounce inteligente
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};