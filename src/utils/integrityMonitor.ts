/**
 * Sistema de Monitoramento de Integridade
 * Detecta alterações maliciosas e monitora integridade do sistema
 * Mantém compatibilidade total com o sistema atual
 */

import SecurityLogger, { SecurityEventType, SecurityLevel } from './securityLogger';

/**
 * Tipos de recursos monitorados
 */
export enum ResourceType {
  LOCAL_STORAGE = 'local_storage',
  SESSION_STORAGE = 'session_storage',
  DOM_ELEMENTS = 'dom_elements',
  SCRIPTS = 'scripts',
  STYLESHEETS = 'stylesheets',
  COOKIES = 'cookies',
  CONFIGURATION = 'configuration',
  USER_DATA = 'user_data'
}

/**
 * Tipos de alterações detectadas
 */
export enum ChangeType {
  ADDED = 'added',
  MODIFIED = 'modified',
  DELETED = 'deleted',
  SUSPICIOUS = 'suspicious',
  UNAUTHORIZED = 'unauthorized'
}

/**
 * Interface para snapshot de recurso
 */
export interface ResourceSnapshot {
  id: string;
  type: ResourceType;
  timestamp: number;
  checksum: string;
  size: number;
  metadata: Record<string, any>;
}

/**
 * Interface para alteração detectada
 */
export interface IntegrityChange {
  id: string;
  resourceType: ResourceType;
  changeType: ChangeType;
  timestamp: number;
  oldChecksum?: string;
  newChecksum?: string;
  details: Record<string, any>;
  severity: SecurityLevel;
  isAuthorized: boolean;
}

/**
 * Interface para configuração de monitoramento
 */
export interface MonitoringConfig {
  enabled: boolean;
  interval: number;
  resources: ResourceType[];
  alertThreshold: number;
  autoRestore: boolean;
  strictMode: boolean;
}

/**
 * Classe principal de monitoramento de integridade
 */
export class IntegrityMonitor {
  private static readonly SNAPSHOTS_KEY = 'integrity_snapshots';
  private static readonly CHANGES_KEY = 'integrity_changes';
  private static readonly CONFIG_KEY = 'integrity_config';
  private static readonly MAX_SNAPSHOTS = 100;
  private static readonly MAX_CHANGES = 500;
  
  private static monitoringInterval: number | null = null;
  private static isMonitoring = false;
  
  /**
   * Configuração padrão
   */
  private static readonly DEFAULT_CONFIG: MonitoringConfig = {
    enabled: true,
    interval: 30000, // 30 segundos
    resources: [
      ResourceType.LOCAL_STORAGE,
      ResourceType.SESSION_STORAGE,
      ResourceType.DOM_ELEMENTS,
      ResourceType.SCRIPTS,
      ResourceType.CONFIGURATION
    ],
    alertThreshold: 3,
    autoRestore: false,
    strictMode: false
  };
  
  /**
   * Gera checksum simples para dados
   */
  private static generateChecksum(data: string): string {
    let hash = 0;
    if (data.length === 0) return hash.toString();
    
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }
  
  /**
   * Gera ID único
   */
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  /**
   * Obtém configuração
   */
  private static getConfig(): MonitoringConfig {
    try {
      const stored = localStorage.getItem(this.CONFIG_KEY);
      return stored ? { ...this.DEFAULT_CONFIG, ...JSON.parse(stored) } : this.DEFAULT_CONFIG;
    } catch {
      return this.DEFAULT_CONFIG;
    }
  }
  
  /**
   * Salva configuração
   */
  private static saveConfig(config: MonitoringConfig): void {
    try {
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
    } catch {
      // Falha silenciosa
    }
  }
  
  /**
   * Obtém snapshots armazenados
   */
  private static getSnapshots(): ResourceSnapshot[] {
    try {
      const stored = localStorage.getItem(this.SNAPSHOTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
  
  /**
   * Salva snapshots
   */
  private static saveSnapshots(snapshots: ResourceSnapshot[]): void {
    try {
      const trimmed = snapshots.slice(-this.MAX_SNAPSHOTS);
      localStorage.setItem(this.SNAPSHOTS_KEY, JSON.stringify(trimmed));
    } catch {
      // Falha silenciosa
    }
  }
  
  /**
   * Obtém alterações armazenadas
   */
  private static getChanges(): IntegrityChange[] {
    try {
      const stored = localStorage.getItem(this.CHANGES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
  
  /**
   * Salva alterações
   */
  private static saveChanges(changes: IntegrityChange[]): void {
    try {
      const trimmed = changes.slice(-this.MAX_CHANGES);
      localStorage.setItem(this.CHANGES_KEY, JSON.stringify(trimmed));
    } catch {
      // Falha silenciosa
    }
  }
  
  /**
   * Cria snapshot de um recurso
   */
  private static createSnapshot(type: ResourceType): ResourceSnapshot | null {
    try {
      let data = '';
      let metadata: Record<string, any> = {};
      
      switch (type) {
        case ResourceType.LOCAL_STORAGE:
          data = JSON.stringify(localStorage);
          metadata = { itemCount: localStorage.length };
          break;
          
        case ResourceType.SESSION_STORAGE:
          data = JSON.stringify(sessionStorage);
          metadata = { itemCount: sessionStorage.length };
          break;
          
        case ResourceType.DOM_ELEMENTS:
          const criticalElements = document.querySelectorAll('script, link[rel="stylesheet"], meta[name="csrf-token"]');
          data = Array.from(criticalElements).map(el => el.outerHTML).join('');
          metadata = { elementCount: criticalElements.length };
          break;
          
        case ResourceType.SCRIPTS:
          const scripts = document.querySelectorAll('script[src]');
          data = Array.from(scripts).map(script => (script as HTMLScriptElement).src).join('|');
          metadata = { scriptCount: scripts.length };
          break;
          
        case ResourceType.STYLESHEETS:
          const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
          data = Array.from(stylesheets).map(link => (link as HTMLLinkElement).href).join('|');
          metadata = { stylesheetCount: stylesheets.length };
          break;
          
        case ResourceType.COOKIES:
          data = document.cookie;
          metadata = { cookieCount: document.cookie.split(';').length };
          break;
          
        case ResourceType.CONFIGURATION:
          // Monitora configurações críticas
          const config = {
            origin: window.location.origin,
            protocol: window.location.protocol,
            userAgent: navigator.userAgent.substring(0, 100) // Apenas parte do user agent
          };
          data = JSON.stringify(config);
          metadata = config;
          break;
          
        case ResourceType.USER_DATA:
          // Monitora dados críticos do usuário
          const userData = {
            fingerprint: localStorage.getItem('user_fingerprint'),
            sessionId: sessionStorage.getItem('session_id'),
            csrfToken: sessionStorage.getItem('csrf_token')
          };
          data = JSON.stringify(userData);
          metadata = { hasFingerprint: !!userData.fingerprint };
          break;
          
        default:
          return null;
      }
      
      return {
        id: this.generateId(),
        type,
        timestamp: Date.now(),
        checksum: this.generateChecksum(data),
        size: data.length,
        metadata
      };
    } catch (error) {
      SecurityLogger.logEvent(
        SecurityEventType.INTEGRITY_VIOLATION,
        SecurityLevel.ERROR,
        `Erro ao criar snapshot de ${type}`,
        { error: String(error) }
      );
      return null;
    }
  }
  
  /**
   * Compara snapshots e detecta alterações
   */
  private static compareSnapshots(oldSnapshot: ResourceSnapshot, newSnapshot: ResourceSnapshot): IntegrityChange | null {
    if (oldSnapshot.checksum === newSnapshot.checksum) {
      return null; // Sem alterações
    }
    
    const change: IntegrityChange = {
      id: this.generateId(),
      resourceType: oldSnapshot.type,
      changeType: ChangeType.MODIFIED,
      timestamp: Date.now(),
      oldChecksum: oldSnapshot.checksum,
      newChecksum: newSnapshot.checksum,
      details: {
        oldSize: oldSnapshot.size,
        newSize: newSnapshot.size,
        sizeDelta: newSnapshot.size - oldSnapshot.size,
        oldMetadata: oldSnapshot.metadata,
        newMetadata: newSnapshot.metadata
      },
      severity: this.calculateChangeSeverity(oldSnapshot, newSnapshot),
      isAuthorized: this.isAuthorizedChange(oldSnapshot, newSnapshot)
    };
    
    // Detecta tipo específico de alteração
    if (newSnapshot.size === 0 && oldSnapshot.size > 0) {
      change.changeType = ChangeType.DELETED;
    } else if (oldSnapshot.size === 0 && newSnapshot.size > 0) {
      change.changeType = ChangeType.ADDED;
    } else if (this.isSuspiciousChange(oldSnapshot, newSnapshot)) {
      change.changeType = ChangeType.SUSPICIOUS;
    }
    
    return change;
  }
  
  /**
   * Calcula severidade da alteração
   */
  private static calculateChangeSeverity(oldSnapshot: ResourceSnapshot, newSnapshot: ResourceSnapshot): SecurityLevel {
    const sizeDelta = Math.abs(newSnapshot.size - oldSnapshot.size);
    const sizeChangePercent = oldSnapshot.size > 0 ? sizeDelta / oldSnapshot.size : 1;
    
    // Alterações críticas
    if (oldSnapshot.type === ResourceType.SCRIPTS || oldSnapshot.type === ResourceType.CONFIGURATION) {
      return SecurityLevel.CRITICAL;
    }
    
    // Alterações grandes
    if (sizeChangePercent > 0.5 || sizeDelta > 10000) {
      return SecurityLevel.ERROR;
    }
    
    // Alterações médias
    if (sizeChangePercent > 0.1 || sizeDelta > 1000) {
      return SecurityLevel.WARNING;
    }
    
    return SecurityLevel.INFO;
  }
  
  /**
   * Verifica se a alteração é autorizada
   */
  private static isAuthorizedChange(oldSnapshot: ResourceSnapshot, newSnapshot: ResourceSnapshot): boolean {
    // Alterações em user data são geralmente autorizadas
    if (oldSnapshot.type === ResourceType.USER_DATA) {
      return true;
    }
    
    // Alterações pequenas em localStorage/sessionStorage são geralmente OK
    if ((oldSnapshot.type === ResourceType.LOCAL_STORAGE || oldSnapshot.type === ResourceType.SESSION_STORAGE)) {
      const sizeDelta = Math.abs(newSnapshot.size - oldSnapshot.size);
      return sizeDelta < 1000; // Menos de 1KB de alteração
    }
    
    // Alterações em scripts/configuração são suspeitas
    if (oldSnapshot.type === ResourceType.SCRIPTS || oldSnapshot.type === ResourceType.CONFIGURATION) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Verifica se a alteração é suspeita
   */
  private static isSuspiciousChange(oldSnapshot: ResourceSnapshot, newSnapshot: ResourceSnapshot): boolean {
    // Alterações muito grandes são suspeitas
    const sizeDelta = Math.abs(newSnapshot.size - oldSnapshot.size);
    if (sizeDelta > 50000) { // 50KB
      return true;
    }
    
    // Alterações em recursos críticos são suspeitas
    if ([ResourceType.SCRIPTS, ResourceType.CONFIGURATION, ResourceType.DOM_ELEMENTS].includes(oldSnapshot.type)) {
      return sizeDelta > 100;
    }
    
    // Mudanças drásticas em metadados
    if (oldSnapshot.metadata && newSnapshot.metadata) {
      const oldCount = oldSnapshot.metadata.itemCount || oldSnapshot.metadata.elementCount || 0;
      const newCount = newSnapshot.metadata.itemCount || newSnapshot.metadata.elementCount || 0;
      
      if (Math.abs(newCount - oldCount) > 10) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Inicia monitoramento
   */
  static startMonitoring(config?: Partial<MonitoringConfig>): void {
    if (this.isMonitoring) {
      return;
    }
    
    const finalConfig = { ...this.getConfig(), ...config };
    this.saveConfig(finalConfig);
    
    if (!finalConfig.enabled) {
      return;
    }
    
    // Cria snapshots iniciais
    this.createInitialSnapshots(finalConfig.resources);
    
    // Inicia monitoramento periódico
    this.monitoringInterval = window.setInterval(() => {
      this.performIntegrityCheck();
    }, finalConfig.interval);
    
    this.isMonitoring = true;
    
    SecurityLogger.logEvent(
      SecurityEventType.ADMIN_ACTION,
      SecurityLevel.INFO,
      'Monitoramento de integridade iniciado',
      { config: finalConfig }
    );
  }
  
  /**
   * Para monitoramento
   */
  static stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.isMonitoring = false;
    
    SecurityLogger.logEvent(
      SecurityEventType.ADMIN_ACTION,
      SecurityLevel.INFO,
      'Monitoramento de integridade parado',
      {}
    );
  }
  
  /**
   * Cria snapshots iniciais
   */
  static createInitialSnapshot(): void {
    const config = this.getConfig();
    this.createInitialSnapshots(config.resources);
  }
  
  /**
   * Cria snapshots iniciais internos
   */
  private static createInitialSnapshots(resources: ResourceType[]): void {
    const snapshots = this.getSnapshots();
    
    resources.forEach(resourceType => {
      const snapshot = this.createSnapshot(resourceType);
      if (snapshot) {
        snapshots.push(snapshot);
      }
    });
    
    this.saveSnapshots(snapshots);
  }
  
  /**
   * Executa verificação de integridade
   */
  private static performIntegrityCheck(): void {
    const config = this.getConfig();
    const snapshots = this.getSnapshots();
    const changes = this.getChanges();
    
    config.resources.forEach(resourceType => {
      const newSnapshot = this.createSnapshot(resourceType);
      if (!newSnapshot) return;
      
      // Encontra snapshot anterior do mesmo tipo
      const oldSnapshot = snapshots
        .filter(s => s.type === resourceType)
        .sort((a, b) => b.timestamp - a.timestamp)[0];
      
      if (oldSnapshot) {
        const change = this.compareSnapshots(oldSnapshot, newSnapshot);
        if (change) {
          changes.push(change);
          this.handleIntegrityChange(change, config);
        }
      }
      
      // Atualiza snapshot
      snapshots.push(newSnapshot);
    });
    
    this.saveSnapshots(snapshots);
    this.saveChanges(changes);
  }
  
  /**
   * Trata alteração de integridade detectada
   */
  private static handleIntegrityChange(change: IntegrityChange, config: MonitoringConfig): void {
    // Log da alteração
    SecurityLogger.logEvent(
      SecurityEventType.INTEGRITY_VIOLATION,
      change.severity,
      `Alteração de integridade detectada em ${change.resourceType}`,
      {
        changeType: change.changeType,
        isAuthorized: change.isAuthorized,
        details: change.details
      }
    );
    
    // Verifica se deve alertar
    if (!change.isAuthorized || change.severity === SecurityLevel.CRITICAL) {
      this.triggerIntegrityAlert(change);
    }
    
    // Auto-restauração se configurada
    if (config.autoRestore && !change.isAuthorized && change.changeType === ChangeType.DELETED) {
      this.attemptAutoRestore(change);
    }
  }
  
  /**
   * Dispara alerta de integridade
   */
  private static triggerIntegrityAlert(change: IntegrityChange): void {
    console.warn(`[INTEGRITY ALERT] ${change.severity.toUpperCase()}: ${change.changeType} em ${change.resourceType}`);
    
    // Em produção, aqui poderia enviar notificação
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implementar notificação por email/webhook
    }
  }
  
  /**
   * Tenta restauração automática
   */
  private static attemptAutoRestore(change: IntegrityChange): void {
    SecurityLogger.logEvent(
      SecurityEventType.ADMIN_ACTION,
      SecurityLevel.WARNING,
      `Tentativa de restauração automática para ${change.resourceType}`,
      { changeId: change.id }
    );
    
    // Implementação básica - pode ser expandida
    // Por segurança, não implementamos restauração automática real
  }
  
  /**
   * Executa verificação manual
   */
  static performManualCheck(): IntegrityChange[] {
    const config = this.getConfig();
    const snapshots = this.getSnapshots();
    const detectedChanges: IntegrityChange[] = [];
    
    config.resources.forEach(resourceType => {
      const newSnapshot = this.createSnapshot(resourceType);
      if (!newSnapshot) return;
      
      const oldSnapshot = snapshots
        .filter(s => s.type === resourceType)
        .sort((a, b) => b.timestamp - a.timestamp)[0];
      
      if (oldSnapshot) {
        const change = this.compareSnapshots(oldSnapshot, newSnapshot);
        if (change) {
          detectedChanges.push(change);
        }
      }
    });
    
    return detectedChanges;
  }
  
  /**
   * Obtém status do monitoramento
   */
  static getMonitoringStatus(): {
    isMonitoring: boolean;
    isActive: boolean;
    config: MonitoringConfig;
    lastCheck: number;
    totalSnapshots: number;
    totalChanges: number;
    recentChanges: IntegrityChange[];
  } {
    const snapshots = this.getSnapshots();
    const changes = this.getChanges();
    const recentChanges = changes
      .filter(c => Date.now() - c.timestamp < 3600000) // Últimas 1 hora
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
    
    return {
      isMonitoring: this.isMonitoring,
      isActive: this.isMonitoring,
      config: this.getConfig(),
      lastCheck: snapshots.length > 0 ? Math.max(...snapshots.map(s => s.timestamp)) : 0,
      totalSnapshots: snapshots.length,
      totalChanges: changes.length,
      recentChanges
    };
  }
  
  /**
   * Obtém estatísticas de integridade
   */
  static getIntegrityStats(): {
    changesByType: Record<string, number>;
    changesBySeverity: Record<string, number>;
    unauthorizedChanges: number;
    suspiciousChanges: number;
    resourceHealth: Record<string, 'healthy' | 'warning' | 'critical'>;
  } {
    const changes = this.getChanges();
    const changesByType: Record<string, number> = {};
    const changesBySeverity: Record<string, number> = {};
    let unauthorizedChanges = 0;
    let suspiciousChanges = 0;
    
    changes.forEach(change => {
      changesByType[change.resourceType] = (changesByType[change.resourceType] || 0) + 1;
      changesBySeverity[change.severity] = (changesBySeverity[change.severity] || 0) + 1;
      
      if (!change.isAuthorized) unauthorizedChanges++;
      if (change.changeType === ChangeType.SUSPICIOUS) suspiciousChanges++;
    });
    
    // Calcula saúde dos recursos
    const resourceHealth: Record<string, 'healthy' | 'warning' | 'critical'> = {};
    Object.values(ResourceType).forEach(resourceType => {
      const recentChanges = changes.filter(c => 
        c.resourceType === resourceType && 
        Date.now() - c.timestamp < 3600000 // Última hora
      );
      
      const criticalChanges = recentChanges.filter(c => c.severity === SecurityLevel.CRITICAL).length;
      const unauthorizedChanges = recentChanges.filter(c => !c.isAuthorized).length;
      
      if (criticalChanges > 0 || unauthorizedChanges > 2) {
        resourceHealth[resourceType] = 'critical';
      } else if (recentChanges.length > 5) {
        resourceHealth[resourceType] = 'warning';
      } else {
        resourceHealth[resourceType] = 'healthy';
      }
    });
    
    return {
      changesByType,
      changesBySeverity,
      unauthorizedChanges,
      suspiciousChanges,
      resourceHealth
    };
  }
  
  /**
   * Limpa dados antigos
   */
  static cleanupOldData(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge;
    
    const snapshots = this.getSnapshots().filter(s => s.timestamp > cutoff);
    const changes = this.getChanges().filter(c => c.timestamp > cutoff);
    
    this.saveSnapshots(snapshots);
    this.saveChanges(changes);
  }
  
  /**
   * Limpa todos os dados (para testes)
   */
  static clearAllData(): void {
    try {
      localStorage.removeItem(this.SNAPSHOTS_KEY);
      localStorage.removeItem(this.CHANGES_KEY);
      localStorage.removeItem(this.CONFIG_KEY);
    } catch {
      // Falha silenciosa
    }
  }
  
  /**
   * Exporta dados de integridade
   */
  static exportIntegrityData(): string {
    const data = {
      snapshots: this.getSnapshots(),
      changes: this.getChanges(),
      config: this.getConfig(),
      status: this.getMonitoringStatus(),
      stats: this.getIntegrityStats(),
      exportedAt: Date.now()
    };
    
    return JSON.stringify(data, null, 2);
  }
}

// Export default para facilitar importação
export default IntegrityMonitor;