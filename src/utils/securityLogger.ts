/**
 * Sistema de Logs de Segurança
 * Monitora eventos de segurança e gera alertas automáticos
 * Mantém compatibilidade total com o sistema atual
 */

export enum SecurityEventType {
  // Autenticação
  LOGIN_ATTEMPT = 'login_attempt',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGIN_BLOCKED = 'login_blocked',
  
  // Rate Limiting
  RATE_LIMIT_HIT = 'rate_limit_hit',
  RATE_LIMIT_BLOCKED = 'rate_limit_blocked',
  RATE_LIMIT_VIOLATION = 'rate_limit_violation',
  
  // Ataques detectados
  XSS_ATTEMPT = 'xss_attempt',
  INJECTION_ATTEMPT = 'injection_attempt',
  CSRF_VIOLATION = 'csrf_violation',
  SUSPICIOUS_INPUT = 'suspicious_input',
  
  // Comportamento suspeito
  SUSPICIOUS_PATTERN = 'suspicious_pattern',
  ANOMALOUS_BEHAVIOR = 'anomalous_behavior',
  MULTIPLE_FAILURES = 'multiple_failures',
  
  // Integridade
  INTEGRITY_VIOLATION = 'integrity_violation',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  
  // Ações administrativas
  ADMIN_ACTION = 'admin_action',
  CONFIG_CHANGE = 'config_change',
  
  // Erros de validação
  VALIDATION_ERROR = 'validation_error',
  SANITIZATION_TRIGGERED = 'sanitization_triggered'
}

export enum SecurityLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface SecurityEvent {
  id: string;
  timestamp: number;
  type: SecurityEventType;
  level: SecurityLevel;
  message: string;
  details: Record<string, any>;
  userFingerprint?: string;
  userAgent?: string;
  url?: string;
  ip?: string; // Simulado via fingerprint
  sessionId?: string;
}

export interface SecurityAlert {
  id: string;
  timestamp: number;
  type: string;
  level: SecurityLevel;
  message: string;
  events: SecurityEvent[];
  acknowledged: boolean;
}

/**
 * Classe principal do Sistema de Logs de Segurança
 */
export class SecurityLogger {
  private static readonly STORAGE_KEY = 'security_logs';
  private static readonly ALERTS_KEY = 'security_alerts';
  private static readonly MAX_LOGS = 1000;
  private static readonly MAX_ALERTS = 100;
  private static readonly ALERT_THRESHOLDS = {
    [SecurityEventType.LOGIN_FAILURE]: { count: 3, timeWindow: 900000 }, // 3 falhas em 15 min
    [SecurityEventType.RATE_LIMIT_HIT]: { count: 5, timeWindow: 300000 }, // 5 hits em 5 min
    [SecurityEventType.XSS_ATTEMPT]: { count: 1, timeWindow: 0 }, // Imediato
    [SecurityEventType.INJECTION_ATTEMPT]: { count: 1, timeWindow: 0 }, // Imediato
    [SecurityEventType.SUSPICIOUS_PATTERN]: { count: 3, timeWindow: 600000 }, // 3 em 10 min
  };
  
  /**
   * Gera ID único para eventos
   */
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  /**
   * Obtém fingerprint do usuário
   */
  private static getUserFingerprint(): string {
    try {
      return localStorage.getItem('user_fingerprint') || 'unknown';
    } catch {
      return 'unknown';
    }
  }
  
  /**
   * Obtém logs existentes
   */
  static getLogs(): SecurityEvent[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
  
  /**
   * Salva logs
   */
  private static saveLogs(logs: SecurityEvent[]): void {
    try {
      // Mantém apenas os logs mais recentes
      const trimmedLogs = logs.slice(-this.MAX_LOGS);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedLogs));
    } catch {
      // Falha silenciosa em caso de erro de storage
    }
  }
  
  /**
   * Obtém alertas existentes
   */
  private static getAlerts(): SecurityAlert[] {
    try {
      const stored = localStorage.getItem(this.ALERTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
  
  /**
   * Salva alertas
   */
  private static saveAlerts(alerts: SecurityAlert[]): void {
    try {
      const trimmedAlerts = alerts.slice(-this.MAX_ALERTS);
      localStorage.setItem(this.ALERTS_KEY, JSON.stringify(trimmedAlerts));
    } catch {
      // Falha silenciosa
    }
  }
  
  /**
   * Registra um evento de segurança
   */
  static logEvent(
    type: SecurityEventType,
    level: SecurityLevel,
    message: string,
    details: Record<string, any> = {}
  ): void {
    const event: SecurityEvent = {
      id: this.generateId(),
      timestamp: Date.now(),
      type,
      level,
      message,
      details,
      userFingerprint: this.getUserFingerprint(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: sessionStorage.getItem('session_id') || undefined
    };
    
    const logs = this.getLogs();
    logs.push(event);
    this.saveLogs(logs);
    
    // Verifica se deve gerar alerta
    this.checkForAlerts(event);
    
    // Log no console em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SECURITY] ${level.toUpperCase()}: ${message}`, details);
    }
  }
  
  /**
   * Verifica se deve gerar alertas baseado no evento
   */
  private static checkForAlerts(event: SecurityEvent): void {
    const threshold = this.ALERT_THRESHOLDS[event.type];
    if (!threshold) return;
    
    const now = Date.now();
    const logs = this.getLogs();
    
    // Conta eventos similares no período
    const recentEvents = logs.filter(log => 
      log.type === event.type &&
      log.userFingerprint === event.userFingerprint &&
      (threshold.timeWindow === 0 || now - log.timestamp <= threshold.timeWindow)
    );
    
    if (recentEvents.length >= threshold.count) {
      this.generateAlert(event.type, recentEvents);
    }
  }
  
  /**
   * Gera um alerta de segurança
   */
  private static generateAlert(type: SecurityEventType, events: SecurityEvent[]): void {
    const alert: SecurityAlert = {
      id: this.generateId(),
      timestamp: Date.now(),
      type,
      level: this.getAlertSeverity(type),
      message: this.getAlertMessage(type, events.length),
      events,
      acknowledged: false
    };
    
    const alerts = this.getAlerts();
    alerts.push(alert);
    this.saveAlerts(alerts);
    
    // Notifica sobre o alerta (pode ser expandido para email, webhook, etc.)
    this.notifyAlert(alert);
  }
  
  /**
   * Determina severidade do alerta
   */
  private static getAlertSeverity(type: SecurityEventType): SecurityLevel {
    switch (type) {
      case SecurityEventType.XSS_ATTEMPT:
      case SecurityEventType.INJECTION_ATTEMPT:
        return SecurityLevel.CRITICAL;
      
      case SecurityEventType.LOGIN_FAILURE:
      case SecurityEventType.SUSPICIOUS_PATTERN:
        return SecurityLevel.ERROR;
      
      case SecurityEventType.RATE_LIMIT_HIT:
        return SecurityLevel.WARNING;
      
      default:
        return SecurityLevel.INFO;
    }
  }
  
  /**
   * Gera mensagem do alerta
   */
  private static getAlertMessage(type: SecurityEventType, count: number): string {
    switch (type) {
      case SecurityEventType.LOGIN_FAILURE:
        return `Múltiplas tentativas de login falhadas detectadas (${count} tentativas)`;
      
      case SecurityEventType.RATE_LIMIT_HIT:
        return `Rate limiting ativado frequentemente (${count} ativações)`;
      
      case SecurityEventType.XSS_ATTEMPT:
        return `Tentativa de ataque XSS detectada`;
      
      case SecurityEventType.INJECTION_ATTEMPT:
        return `Tentativa de injection detectada`;
      
      case SecurityEventType.SUSPICIOUS_PATTERN:
        return `Padrão de comportamento suspeito detectado (${count} eventos)`;
      
      default:
        return `Alerta de segurança: ${type} (${count} eventos)`;
    }
  }
  
  /**
   * Notifica sobre alerta (pode ser expandido)
   */
  private static notifyAlert(alert: SecurityAlert): void {
    // Log no console apenas para alertas críticos reais
    if (alert.level === SecurityLevel.CRITICAL && this.isRealThreat(alert)) {
      console.warn(`[SECURITY ALERT] ${alert.level.toUpperCase()}: ${alert.message}`);
    }
    
    // Em produção, aqui poderia enviar email, webhook, etc.
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implementar notificação por email/webhook
    }
  }

  /**
   * Verifica se um alerta é uma ameaça real ou falso positivo
   */
  private static isRealThreat(alert: SecurityAlert): boolean {
    const input = alert.events[0]?.details?.input || alert.events[0]?.message || '';
    const context = alert.events[0]?.details;
    
    // Validação de entrada
    if (!input || typeof input !== 'string') {
      return false;
    }
    
    // Whitelist de operações normais
    const normalOperations = [
      'article_content',
      'user_comment',
      'search_query',
      'form_data',
      'api_response',
      'navigation',
      'user_input'
    ];

    // Verifica se é uma operação normal
    if (context?.source && normalOperations.includes(context.source)) {
      return false;
    }

    // Se é conteúdo longo, provavelmente é artigo
    if (input.length > 500) {
      return false;
    }

    // Padrões de conteúdo seguro
    const safePatterns = [
      /^[a-zA-Z0-9\s\.,!?\-\(\)@#$%&*+=:;'"\/\\]+$/, // Texto com símbolos comuns
      /^[^<>]+$/, // Sem tags HTML
      /^\{.*\}$/, // JSON
      /^https?:\/\//, // URLs
    ];

    if (safePatterns.some(pattern => pattern.test(input.trim()))) {
      return false;
    }

    return true;
  }

  /**
   * Log de tentativa de XSS (com filtro de falsos positivos)
   */
  static logXSSAttempt(input: string, context?: any): void {
    // Cria um alerta temporário para verificar se é ameaça real
    const tempAlert: SecurityAlert = {
      id: 'temp',
      type: SecurityEventType.XSS_ATTEMPT,
      level: SecurityLevel.CRITICAL,
      message: 'XSS attempt detected',
      timestamp: Date.now(),
      acknowledged: false,
      events: [{
        id: 'temp',
        type: SecurityEventType.XSS_ATTEMPT,
        level: SecurityLevel.CRITICAL,
        message: 'XSS attempt detected',
        timestamp: Date.now(),
        details: { input, ...context }
      }]
    };

    // Só loga se for uma ameaça real
    if (!this.isRealThreat(tempAlert)) {
      return;
    }

    this.logEvent(SecurityEventType.XSS_ATTEMPT, SecurityLevel.CRITICAL, {
      input: input.substring(0, 200),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...context
    });
  }

  /**
   * Log de tentativa de injection (com filtro de falsos positivos)
   */
  static logInjectionAttempt(input: string, type: string, context?: any): void {
    // Cria um alerta temporário para verificar se é ameaça real
    const tempAlert: SecurityAlert = {
      id: 'temp',
      type: SecurityEventType.INJECTION_ATTEMPT,
      level: SecurityLevel.CRITICAL,
      message: 'Injection attempt detected',
      timestamp: Date.now(),
      acknowledged: false,
      events: [{
        id: 'temp',
        type: SecurityEventType.INJECTION_ATTEMPT,
        level: SecurityLevel.CRITICAL,
        message: 'Injection attempt detected',
        timestamp: Date.now(),
        details: { input, type, ...context }
      }]
    };

    // Só loga se for uma ameaça real
    if (!this.isRealThreat(tempAlert)) {
      return;
    }

    this.logEvent(SecurityEventType.INJECTION_ATTEMPT, SecurityLevel.CRITICAL, {
      input: input.substring(0, 200),
      type,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...context
    });
  }

  static logSuspiciousInput(input: string, reason: string, details: Record<string, any> = {}): void {
    // Cria um alerta temporário para verificar se é ameaça real
    const tempAlert: SecurityAlert = {
      id: 'temp',
      type: SecurityEventType.SUSPICIOUS_INPUT,
      level: SecurityLevel.WARNING,
      message: 'Suspicious input detected',
      timestamp: Date.now(),
      acknowledged: false,
      events: [{
        id: 'temp',
        type: SecurityEventType.SUSPICIOUS_INPUT,
        level: SecurityLevel.WARNING,
        message: 'Suspicious input detected',
        timestamp: Date.now(),
        details: { input, reason, ...details }
      }]
    };

    // Só loga se for uma ameaça real
    if (!this.isRealThreat(tempAlert)) {
      return;
    }

    this.logEvent(
      SecurityEventType.SUSPICIOUS_INPUT,
      SecurityLevel.WARNING,
      `Input suspeito detectado: ${reason}`,
      { suspiciousInput: input.substring(0, 100), reason, ...details }
    );
  }
  
  static logValidationError(field: string, value: string, error: string): void {
    // Só loga erros de validação críticos
    const criticalFields = ['password', 'email', 'admin', 'token'];
    if (!criticalFields.includes(field.toLowerCase())) {
      return;
    }

    this.logEvent(
      SecurityEventType.VALIDATION_ERROR,
      SecurityLevel.INFO,
      `Erro de validação no campo ${field}`,
      { field, value: value.substring(0, 50), error }
    );
  }
  
  static logSanitizationTriggered(input: string, output: string, details: Record<string, any> = {}): void {
    // Só loga sanitizações significativas
    const changePercentage = Math.abs(input.length - output.length) / input.length;
    if (changePercentage < 0.1) { // Menos de 10% de mudança
      return;
    }

    this.logEvent(
      SecurityEventType.SANITIZATION_TRIGGERED,
      SecurityLevel.INFO,
      'Sanitização de input ativada',
      { 
        originalLength: input.length,
        sanitizedLength: output.length,
        changed: input !== output,
        ...details
      }
    );
  }
  
  static logAdminAction(action: string, details: Record<string, any> = {}): void {
    this.logEvent(
      SecurityEventType.ADMIN_ACTION,
      SecurityLevel.INFO,
      `Ação administrativa: ${action}`,
      { action, ...details }
    );
  }

  static logRateLimitHit(action: string, details: Record<string, any> = {}): void {
    this.logEvent(
      SecurityEventType.RATE_LIMIT_HIT,
      SecurityLevel.WARNING,
      `Rate limit atingido para ação: ${action}`,
      { action, ...details }
    );
  }
  
  /**
   * Obtém logs filtrados
   */
  static getFilteredLogs(
    type?: SecurityEventType,
    level?: SecurityLevel,
    timeRange?: { start: number; end: number },
    limit?: number
  ): SecurityEvent[] {
    let logs = this.getLogs();
    
    if (type) {
      logs = logs.filter(log => log.type === type);
    }
    
    if (level) {
      logs = logs.filter(log => log.level === level);
    }
    
    if (timeRange) {
      logs = logs.filter(log => 
        log.timestamp >= timeRange.start && log.timestamp <= timeRange.end
      );
    }
    
    // Ordena por timestamp (mais recente primeiro)
    logs.sort((a, b) => b.timestamp - a.timestamp);
    
    if (limit) {
      logs = logs.slice(0, limit);
    }
    
    return logs;
  }
  
  /**
   * Obtém estatísticas de segurança
   */
  static getSecurityStats(timeRange?: { start: number; end: number }): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByLevel: Record<string, number>;
    alertsCount: number;
    unacknowledgedAlerts: number;
  } {
    const logs = timeRange 
      ? this.getFilteredLogs(undefined, undefined, timeRange)
      : this.getLogs();
    
    const alerts = this.getAlerts();
    
    const eventsByType: Record<string, number> = {};
    const eventsByLevel: Record<string, number> = {};
    
    logs.forEach(log => {
      eventsByType[log.type] = (eventsByType[log.type] || 0) + 1;
      eventsByLevel[log.level] = (eventsByLevel[log.level] || 0) + 1;
    });
    
    return {
      totalEvents: logs.length,
      eventsByType,
      eventsByLevel,
      alertsCount: alerts.length,
      unacknowledgedAlerts: alerts.filter(alert => !alert.acknowledged).length
    };
  }
  
  /**
   * Marca alerta como reconhecido
   */
  static acknowledgeAlert(alertId: string): void {
    const alerts = this.getAlerts();
    const alert = alerts.find(a => a.id === alertId);
    
    if (alert) {
      alert.acknowledged = true;
      this.saveAlerts(alerts);
    }
  }
  
  /**
   * Limpa logs antigos
   */
  static cleanupOldLogs(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge;
    const logs = this.getLogs().filter(log => log.timestamp > cutoff);
    const alerts = this.getAlerts().filter(alert => alert.timestamp > cutoff);
    
    this.saveLogs(logs);
    this.saveAlerts(alerts);
  }
  
  /**
   * Exporta logs para análise
   */
  static exportLogs(): string {
    const data = {
      logs: this.getLogs(),
      alerts: this.getAlerts(),
      exportedAt: Date.now()
    };
    
    return JSON.stringify(data, null, 2);
  }
  
  /**
   * Limpa todos os logs (para testes)
   */
  static clearAllLogs(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.ALERTS_KEY);
    } catch {
      // Falha silenciosa
    }
  }
}

// Export default para facilitar importação
export default SecurityLogger;