/**
 * Sistema de Rate Limiting Avançado
 * Implementa rate limiting multi-layer com diferentes estratégias
 * Mantém compatibilidade total com o sistema atual
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs?: number;
  progressiveDelay?: boolean;
}

interface RateLimitData {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  blockedUntil?: number;
  violations: number;
}

interface ActionConfig {
  [key: string]: RateLimitConfig;
}

/**
 * Configurações específicas por ação
 */
const ACTION_CONFIGS: ActionConfig = {
  // Comentários: 5 por minuto, 50 por hora
  'comment': {
    maxAttempts: 5,
    windowMs: 60000, // 1 minuto
    blockDurationMs: 300000, // 5 minutos de bloqueio
    progressiveDelay: true
  },
  'comment_hourly': {
    maxAttempts: 50,
    windowMs: 3600000, // 1 hora
    blockDurationMs: 1800000, // 30 minutos de bloqueio
    progressiveDelay: true
  },
  
  // Feedback: 10 por minuto, 100 por hora
  'feedback': {
    maxAttempts: 10,
    windowMs: 60000,
    blockDurationMs: 180000, // 3 minutos
    progressiveDelay: true
  },
  'feedback_hourly': {
    maxAttempts: 100,
    windowMs: 3600000,
    blockDurationMs: 900000, // 15 minutos
    progressiveDelay: true
  },
  
  // Newsletter: 1 por minuto, 5 por hora
  'newsletter': {
    maxAttempts: 1,
    windowMs: 60000,
    blockDurationMs: 600000, // 10 minutos
    progressiveDelay: true
  },
  'newsletter_hourly': {
    maxAttempts: 5,
    windowMs: 3600000,
    blockDurationMs: 3600000, // 1 hora
    progressiveDelay: true
  },
  
  // Login Admin: 3 tentativas por 15 minutos
  'admin_login': {
    maxAttempts: 3,
    windowMs: 900000, // 15 minutos
    blockDurationMs: 1800000, // 30 minutos
    progressiveDelay: true
  },
  
  // Contato: 2 por minuto, 10 por hora
  'contact': {
    maxAttempts: 2,
    windowMs: 60000,
    blockDurationMs: 300000, // 5 minutos
    progressiveDelay: true
  },
  'contact_hourly': {
    maxAttempts: 10,
    windowMs: 3600000,
    blockDurationMs: 1800000, // 30 minutos
    progressiveDelay: true
  },
  
  // Busca: 30 por minuto
  'search': {
    maxAttempts: 30,
    windowMs: 60000,
    blockDurationMs: 120000, // 2 minutos
    progressiveDelay: false
  },
  
  // API geral: 100 por minuto
  'api_general': {
    maxAttempts: 100,
    windowMs: 60000,
    blockDurationMs: 300000, // 5 minutos
    progressiveDelay: false
  }
};

/**
 * Classe principal do Rate Limiting Avançado
 */
export class AdvancedRateLimit {
  private static readonly STORAGE_PREFIX = 'advanced_rate_limit_';
  private static readonly FINGERPRINT_KEY = 'user_fingerprint';
  
  /**
   * Gera fingerprint do usuário (simulação de IP)
   */
  private static getUserFingerprint(): string {
    try {
      let fingerprint = localStorage.getItem(this.FINGERPRINT_KEY);
      
      if (!fingerprint) {
        // Gera fingerprint baseado em características do browser
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx!.textBaseline = 'top';
        ctx!.font = '14px Arial';
        ctx!.fillText('Fingerprint test', 2, 2);
        
        const canvasFingerprint = canvas.toDataURL();
        const screenFingerprint = `${screen.width}x${screen.height}x${screen.colorDepth}`;
        const timezoneFingerprint = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const languageFingerprint = navigator.language;
        
        fingerprint = btoa(`${canvasFingerprint}-${screenFingerprint}-${timezoneFingerprint}-${languageFingerprint}`)
          .replace(/[^a-zA-Z0-9]/g, '')
          .substring(0, 32);
        
        localStorage.setItem(this.FINGERPRINT_KEY, fingerprint);
      }
      
      return fingerprint;
    } catch {
      // Fallback para fingerprint simples
      return 'fallback_' + Math.random().toString(36).substring(2, 15);
    }
  }
  
  /**
   * Gera chave de storage para ação específica
   */
  private static getStorageKey(action: string): string {
    const fingerprint = this.getUserFingerprint();
    return `${this.STORAGE_PREFIX}${action}_${fingerprint}`;
  }
  
  /**
   * Obtém dados do rate limit para uma ação
   */
  private static getRateLimitData(action: string): RateLimitData | null {
    try {
      const key = this.getStorageKey(action);
      const stored = localStorage.getItem(key);
      
      if (!stored) return null;
      
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  
  /**
   * Salva dados do rate limit
   */
  private static setRateLimitData(action: string, data: RateLimitData): void {
    try {
      const key = this.getStorageKey(action);
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // Falha silenciosa em caso de erro de storage
    }
  }
  
  /**
   * Calcula delay progressivo baseado no número de violações
   */
  private static calculateProgressiveDelay(violations: number): number {
    if (violations <= 1) return 0;
    
    // Delay exponencial: 2^violations * 1000ms, máximo 30 segundos
    return Math.min(Math.pow(2, violations - 1) * 1000, 30000);
  }
  
  /**
   * Verifica se uma ação pode ser executada
   */
  static canPerformAction(action: string, customConfig?: RateLimitConfig): {
    allowed: boolean;
    remainingTime: number;
    reason?: string;
    retryAfter?: number;
  } {
    const config = customConfig || ACTION_CONFIGS[action];
    
    if (!config) {
      // Se não há configuração, usa rate limiting básico
      return {
        allowed: true,
        remainingTime: 0
      };
    }
    
    const now = Date.now();
    const data = this.getRateLimitData(action);
    
    // Primeira tentativa
    if (!data) {
      this.setRateLimitData(action, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
        violations: 0
      });
      
      return {
        allowed: true,
        remainingTime: 0
      };
    }
    
    // Verifica se está bloqueado
    if (data.blockedUntil && now < data.blockedUntil) {
      return {
        allowed: false,
        remainingTime: data.blockedUntil - now,
        reason: 'blocked',
        retryAfter: data.blockedUntil - now
      };
    }
    
    // Reset se passou da janela de tempo
    if (now - data.firstAttempt > config.windowMs) {
      this.setRateLimitData(action, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
        violations: Math.max(0, data.violations - 1) // Reduz violações gradualmente
      });
      
      return {
        allowed: true,
        remainingTime: 0
      };
    }
    
    // Verifica delay progressivo
    if (config.progressiveDelay && data.violations > 0) {
      const requiredDelay = this.calculateProgressiveDelay(data.violations);
      const timeSinceLastAttempt = now - data.lastAttempt;
      
      if (timeSinceLastAttempt < requiredDelay) {
        return {
          allowed: false,
          remainingTime: requiredDelay - timeSinceLastAttempt,
          reason: 'progressive_delay',
          retryAfter: requiredDelay - timeSinceLastAttempt
        };
      }
    }
    
    // Verifica se excedeu o limite
    if (data.count >= config.maxAttempts) {
      const newViolations = data.violations + 1;
      const blockDuration = config.blockDurationMs || config.windowMs;
      
      this.setRateLimitData(action, {
        ...data,
        violations: newViolations,
        blockedUntil: now + blockDuration,
        lastAttempt: now
      });
      
      return {
        allowed: false,
        remainingTime: blockDuration,
        reason: 'rate_limit_exceeded',
        retryAfter: blockDuration
      };
    }
    
    // Incrementa contador
    this.setRateLimitData(action, {
      ...data,
      count: data.count + 1,
      lastAttempt: now
    });
    
    return {
      allowed: true,
      remainingTime: Math.max(0, config.windowMs - (now - data.firstAttempt))
    };
  }
  
  /**
   * Verifica múltiplas ações (para ações com limite por minuto E por hora)
   */
  static canPerformMultiLayerAction(baseAction: string, customConfigs?: RateLimitConfig[]): {
    allowed: boolean;
    remainingTime: number;
    reason?: string;
    retryAfter?: number;
    blockedBy?: string;
  } {
    const actions = [baseAction, `${baseAction}_hourly`];
    
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const config = customConfigs?.[i];
      const result = this.canPerformAction(action, config);
      
      if (!result.allowed) {
        return {
          ...result,
          blockedBy: action
        };
      }
    }
    
    return {
      allowed: true,
      remainingTime: 0
    };
  }
  
  /**
   * Obtém estatísticas de rate limiting
   */
  static getStats(action: string): {
    count: number;
    remainingAttempts: number;
    resetTime: number;
    violations: number;
    isBlocked: boolean;
  } | null {
    const config = ACTION_CONFIGS[action];
    if (!config) return null;
    
    const data = this.getRateLimitData(action);
    if (!data) {
      return {
        count: 0,
        remainingAttempts: config.maxAttempts,
        resetTime: 0,
        violations: 0,
        isBlocked: false
      };
    }
    
    const now = Date.now();
    const isBlocked = data.blockedUntil ? now < data.blockedUntil : false;
    const resetTime = data.firstAttempt + config.windowMs;
    
    return {
      count: data.count,
      remainingAttempts: Math.max(0, config.maxAttempts - data.count),
      resetTime,
      violations: data.violations,
      isBlocked
    };
  }
  
  /**
   * Limpa dados de rate limiting (para testes ou reset manual)
   */
  static clearRateLimitData(action?: string): void {
    try {
      if (action) {
        const key = this.getStorageKey(action);
        localStorage.removeItem(key);
      } else {
        // Limpa todos os dados de rate limiting
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith(this.STORAGE_PREFIX)) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch {
      // Falha silenciosa
    }
  }
  
  /**
   * Compatibilidade com RateLimiter antigo
   */
  static canPerformActionLegacy(action: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const result = this.canPerformAction(action, {
      maxAttempts,
      windowMs,
      progressiveDelay: false
    });
    
    return result.allowed;
  }
  
  /**
   * Obtém tempo restante (compatibilidade)
   */
  static getRemainingTime(action: string, windowMs: number = 60000): number {
    const stats = this.getStats(action);
    if (!stats) return 0;
    
    const now = Date.now();
    return Math.max(0, stats.resetTime - now);
  }
}

/**
 * Wrapper para manter compatibilidade com código existente
 */
export class RateLimiter {
  static canPerformAction(action: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    return AdvancedRateLimit.canPerformActionLegacy(action, maxAttempts, windowMs);
  }
  
  static getRemainingTime(action: string, windowMs: number = 60000): number {
    return AdvancedRateLimit.getRemainingTime(action, windowMs);
  }
}

// Export default para facilitar importação
export default AdvancedRateLimit;