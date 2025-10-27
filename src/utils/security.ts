import DOMPurify from 'dompurify';
import SecurityLogger, { SecurityEventType, SecurityLevel } from './securityLogger';

// Configuração do DOMPurify para máxima segurança
const purifyConfig = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  SANITIZE_DOM: true,
  SANITIZE_NAMED_PROPS: true,
  FORBID_CONTENTS: ['script', 'style', 'iframe', 'object', 'embed'],
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit']
};

/**
 * Detecta tentativas de XSS
 */
const detectXSSAttempt = (input: string): boolean => {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
};

/**
 * Detecta tentativas de injection
 */
const detectInjectionAttempt = (input: string): boolean => {
  const injectionPatterns = [
    /union\s+select/gi,
    /drop\s+table/gi,
    /insert\s+into/gi,
    /delete\s+from/gi,
    /update\s+set/gi,
    /exec\s*\(/gi,
    /system\s*\(/gi,
    /cmd\s*\(/gi,
    /\.\.\/\.\.\//gi, // Path traversal
    /\|\s*nc\s/gi, // Netcat
    /\|\s*wget\s/gi, // Wget
    /\|\s*curl\s/gi // Curl
  ];
  
  return injectionPatterns.some(pattern => pattern.test(input));
};

/**
 * Sanitiza strings para prevenir XSS
 */
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  const originalInput = input;
  
  // Detecta tentativas de ataque antes da sanitização
  if (detectXSSAttempt(input)) {
    SecurityLogger.logXSSAttempt(input, { source: 'sanitizeInput' });
  }
  
  if (detectInjectionAttempt(input)) {
    SecurityLogger.logInjectionAttempt(input, 'general', { source: 'sanitizeInput' });
  }
  
  // Remove caracteres de controle e normaliza
  const normalized = input.normalize('NFKC').trim();
  
  // Sanitiza com DOMPurify
  const sanitized = DOMPurify.sanitize(normalized, purifyConfig);
  
  // Remove caracteres perigosos adicionais
  const cleaned = sanitized
    .replace(/[<>'"&]/g, '') // Remove caracteres HTML perigosos
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/data:/gi, '') // Remove data: URLs
    .replace(/vbscript:/gi, '') // Remove vbscript: URLs
    .replace(/on\w+=/gi, ''); // Remove event handlers
    // Removido limite de 1000 caracteres para permitir artigos longos
  
  // Log se houve sanitização
  if (originalInput !== cleaned) {
    SecurityLogger.logSanitizationTriggered(originalInput, cleaned, { source: 'sanitizeInput' });
  }
  
  return cleaned;
};

/**
 * Sanitiza emails
 */
export const sanitizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') return '';
  
  const sanitized = sanitizeInput(email.toLowerCase());
  
  // Validação básica de email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  return emailRegex.test(sanitized) ? sanitized : '';
};

/**
 * Sanitiza números de telefone
 */
export const sanitizePhone = (phone: string): string => {
  if (!phone || typeof phone !== 'string') return '';
  
  // Remove tudo exceto números, espaços, parênteses, hífens e +
  const cleaned = phone.replace(/[^\d\s\(\)\-\+]/g, '');
  
  return cleaned.slice(0, 20); // Limita tamanho
};

/**
 * Sanitiza nomes
 */
export const sanitizeName = (name: string): string => {
  if (!name || typeof name !== 'string') return '';
  
  const sanitized = sanitizeInput(name);
  
  // Mantém letras, números, espaços e acentos - removido filtro que excluía números
  return sanitized
    .replace(/[^a-zA-ZÀ-ÿ0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
    // Removido limite de 100 caracteres para permitir títulos longos
};

/**
 * Sanitiza mensagens/textos longos
 */
export const sanitizeMessage = (message: string): string => {
  if (!message || typeof message !== 'string') return '';
  
  const sanitized = sanitizeInput(message);
  
  // Remove URLs suspeitas
  return sanitized
    .replace(/https?:\/\/[^\s]+/gi, '[URL removida]')
    .replace(/www\.[^\s]+/gi, '[URL removida]');
    // Removido limite de 5000 caracteres para permitir artigos longos
};

/**
 * Validações de entrada
 */
export const validators = {
  email: (email: string): boolean => {
    const sanitized = sanitizeEmail(email);
    return sanitized.length > 0 && sanitized.includes('@') && sanitized.includes('.');
  },
  
  name: (name: string): boolean => {
    const sanitized = sanitizeName(name);
    return sanitized.length >= 2 && sanitized.length <= 100;
  },
  
  phone: (phone: string): boolean => {
    const sanitized = sanitizePhone(phone);
    return sanitized.length >= 8 && sanitized.length <= 20;
  },
  
  message: (message: string): boolean => {
    const sanitized = sanitizeMessage(message);
    return sanitized.length >= 10 && sanitized.length <= 5000;
  },
  
  required: (value: string): boolean => {
    return value && value.trim().length > 0;
  }
};

/**
 * Rate limiting simples baseado em localStorage
 */
export class RateLimiter {
  private static getKey(action: string): string {
    return `rate_limit_${action}`;
  }
  
  static canPerformAction(action: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    try {
      const key = this.getKey(action);
      const stored = localStorage.getItem(key);
      const now = Date.now();
      
      if (!stored) {
        localStorage.setItem(key, JSON.stringify({ count: 1, firstAttempt: now }));
        return true;
      }
      
      const data = JSON.parse(stored);
      
      // Reset se passou da janela de tempo
      if (now - data.firstAttempt > windowMs) {
        localStorage.setItem(key, JSON.stringify({ count: 1, firstAttempt: now }));
        return true;
      }
      
      // Verifica se excedeu o limite
      if (data.count >= maxAttempts) {
        // Log rate limit hit
        SecurityLogger.logRateLimitHit(action, {
          attempts: data.count,
          windowMs,
          maxAttempts,
          remainingTime: windowMs - (now - data.firstAttempt)
        });
        return false;
      }
      
      // Incrementa contador
      data.count++;
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch {
      return true; // Em caso de erro, permite a ação
    }
  }
  
  static getRemainingTime(action: string, windowMs: number = 60000): number {
    try {
      const key = this.getKey(action);
      const stored = localStorage.getItem(key);
      
      if (!stored) return 0;
      
      const data = JSON.parse(stored);
      const elapsed = Date.now() - data.firstAttempt;
      
      return Math.max(0, windowMs - elapsed);
    } catch {
      return 0;
    }
  }
}

/**
 * Gerador de tokens seguros
 */
export const generateSecureToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Validação de CSRF token
 */
export const CSRFProtection = {
  generateToken(): string {
    const token = generateSecureToken();
    sessionStorage.setItem('csrf_token', token);
    return token;
  },
  
  validateToken(token: string): boolean {
    const storedToken = sessionStorage.getItem('csrf_token');
    return storedToken === token && token.length === 64;
  },
  
  getToken(): string | null {
    return sessionStorage.getItem('csrf_token');
  }
};

/**
 * Headers de segurança para requisições
 */
export const getSecurityHeaders = (): Record<string, string> => {
  const csrfToken = CSRFProtection.getToken();
  
  return {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    ...(csrfToken && { 'X-CSRF-Token': csrfToken })
  };
};

/**
 * Validação de origem da requisição
 */
export const validateOrigin = (): boolean => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://aimindset.vercel.app',
    window.location.origin
  ];
  
  return allowedOrigins.includes(window.location.origin);
};

/**
 * Limpeza segura de dados sensíveis
 */
export const secureCleanup = {
  clearSensitiveData(): void {
    // Remove dados sensíveis do localStorage
    const sensitiveKeys = ['userPassword', 'tempToken', 'sessionData'];
    sensitiveKeys.forEach(key => localStorage.removeItem(key));
    
    // Limpa sessionStorage
    sessionStorage.clear();
  },
  
  clearFormData(formElement: HTMLFormElement): void {
    if (formElement) {
      formElement.reset();
      
      // Limpa campos de senha especificamente
      const passwordFields = formElement.querySelectorAll('input[type="password"]');
      passwordFields.forEach(field => {
        (field as HTMLInputElement).value = '';
      });
    }
  }
};