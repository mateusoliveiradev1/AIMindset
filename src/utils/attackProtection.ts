/**
 * Sistema de Proteção contra Ataques
 * Proteção contra brute force, enumeration, injection e outros ataques
 * Mantém compatibilidade total com o sistema atual
 */

import SecurityLogger, { SecurityEventType, SecurityLevel } from './securityLogger';

/**
 * Tipos de ataques detectáveis
 */
export enum AttackType {
  BRUTE_FORCE = 'brute_force',
  ENUMERATION = 'enumeration',
  SQL_INJECTION = 'sql_injection',
  XSS = 'xss',
  CSRF = 'csrf',
  PATH_TRAVERSAL = 'path_traversal',
  COMMAND_INJECTION = 'command_injection',
  LDAP_INJECTION = 'ldap_injection',
  XML_INJECTION = 'xml_injection',
  NOSQL_INJECTION = 'nosql_injection',
  SSRF = 'ssrf',
  XXE = 'xxe',
  DESERIALIZATION = 'deserialization',
  PROTOTYPE_POLLUTION = 'prototype_pollution'
}

/**
 * Configurações de proteção por tipo de ataque
 */
const attackConfigs = {
  [AttackType.BRUTE_FORCE]: {
    maxAttempts: 5,
    timeWindow: 900000, // 15 minutos
    blockDuration: 3600000, // 1 hora
    escalationFactor: 2
  },
  
  [AttackType.ENUMERATION]: {
    maxAttempts: 10,
    timeWindow: 300000, // 5 minutos
    blockDuration: 1800000, // 30 minutos
    escalationFactor: 1.5
  },
  
  [AttackType.SQL_INJECTION]: {
    maxAttempts: 1,
    timeWindow: 0,
    blockDuration: 7200000, // 2 horas
    escalationFactor: 3
  },
  
  [AttackType.XSS]: {
    maxAttempts: 1,
    timeWindow: 0,
    blockDuration: 7200000, // 2 horas
    escalationFactor: 3
  },
  
  [AttackType.CSRF]: {
    maxAttempts: 3,
    timeWindow: 600000, // 10 minutos
    blockDuration: 1800000, // 30 minutos
    escalationFactor: 2
  },
  
  [AttackType.PATH_TRAVERSAL]: {
    maxAttempts: 2,
    timeWindow: 300000, // 5 minutos
    blockDuration: 3600000, // 1 hora
    escalationFactor: 2.5
  },
  
  [AttackType.COMMAND_INJECTION]: {
    maxAttempts: 1,
    timeWindow: 0,
    blockDuration: 7200000, // 2 horas
    escalationFactor: 3
  },
  
  [AttackType.LDAP_INJECTION]: {
    maxAttempts: 2,
    timeWindow: 300000, // 5 minutos
    blockDuration: 3600000, // 1 hora
    escalationFactor: 2.5
  },
  
  [AttackType.XML_INJECTION]: {
    maxAttempts: 2,
    timeWindow: 300000, // 5 minutos
    blockDuration: 3600000, // 1 hora
    escalationFactor: 2.5
  },
  
  [AttackType.NOSQL_INJECTION]: {
    maxAttempts: 2,
    timeWindow: 300000, // 5 minutos
    blockDuration: 3600000, // 1 hora
    escalationFactor: 2.5
  },
  
  [AttackType.SSRF]: {
    maxAttempts: 1,
    timeWindow: 0,
    blockDuration: 7200000, // 2 horas
    escalationFactor: 3
  },
  
  [AttackType.XXE]: {
    maxAttempts: 1,
    timeWindow: 0,
    blockDuration: 7200000, // 2 horas
    escalationFactor: 3
  },
  
  [AttackType.DESERIALIZATION]: {
    maxAttempts: 1,
    timeWindow: 0,
    blockDuration: 7200000, // 2 horas
    escalationFactor: 3
  },
  
  [AttackType.PROTOTYPE_POLLUTION]: {
    maxAttempts: 1,
    timeWindow: 0,
    blockDuration: 7200000, // 2 horas
    escalationFactor: 3
  }
};

/**
 * Padrões de detecção de ataques
 */
const attackPatterns = {
  [AttackType.SQL_INJECTION]: [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(from|into|table|database|schema)\b)/gi,
    /(\b(or|and)\b\s*\d+\s*=\s*\d+)/gi,
    /(\b(or|and)\b\s*['"].*['"])/gi,
    /(union\s+select)/gi,
    /(drop\s+table)/gi,
    /(insert\s+into)/gi,
    /(delete\s+from)/gi,
    /(update\s+.*set)/gi,
    /(exec\s*\()/gi,
    /(xp_cmdshell)/gi,
    /(sp_executesql)/gi,
    /('.*';\s*(drop|insert|update|delete))/gi,
    /(\/\*.*\*\/)/gi, // SQL comments
    /(-{2,})/gi, // SQL line comments
    /(0x[0-9a-f]+)/gi, // Hex values
    /(char\s*\(\s*\d+\s*\))/gi,
    /(ascii\s*\(\s*.*\s*\))/gi,
    /(substring\s*\(\s*.*\s*,\s*\d+\s*,\s*\d+\s*\))/gi
  ],
  
  [AttackType.XSS]: [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi,
    /javascript\s*:/gi,
    /vbscript\s*:/gi,
    /data\s*:/gi,
    /on\w+\s*=/gi,
    /<img[^>]*onerror[^>]*>/gi,
    /<svg[^>]*onload[^>]*>/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,
    /setTimeout\s*\(/gi,
    /setInterval\s*\(/gi,
    /document\s*\.\s*write/gi,
    /document\s*\.\s*cookie/gi,
    /window\s*\.\s*location/gi,
    /alert\s*\(/gi,
    /confirm\s*\(/gi,
    /prompt\s*\(/gi
  ],
  
  [AttackType.PATH_TRAVERSAL]: [
    /\.\.\//gi,
    /\.\.\\/gi,
    /%2e%2e%2f/gi,
    /%2e%2e%5c/gi,
    /\.\.%2f/gi,
    /\.\.%5c/gi,
    /%2e%2e\//gi,
    /%2e%2e\\/gi,
    /\/etc\/passwd/gi,
    /\/etc\/shadow/gi,
    /\/windows\/system32/gi,
    /\/boot\.ini/gi,
    /\/proc\/self\/environ/gi
  ],
  
  [AttackType.COMMAND_INJECTION]: [
    /;\s*(ls|dir|cat|type|more|less|head|tail|pwd|whoami|id|uname|ps|netstat|ifconfig|ipconfig)/gi,
    /\|\s*(ls|dir|cat|type|more|less|head|tail|pwd|whoami|id|uname|ps|netstat|ifconfig|ipconfig)/gi,
    /&&\s*(ls|dir|cat|type|more|less|head|tail|pwd|whoami|id|uname|ps|netstat|ifconfig|ipconfig)/gi,
    /\$\(.*\)/gi,
    /`.*`/gi,
    /\|\s*nc\s/gi,
    /\|\s*netcat\s/gi,
    /\|\s*wget\s/gi,
    /\|\s*curl\s/gi,
    /\|\s*bash\s/gi,
    /\|\s*sh\s/gi,
    /\|\s*cmd\s/gi,
    /\|\s*powershell\s/gi,
    /exec\s*\(/gi,
    /system\s*\(/gi,
    /shell_exec\s*\(/gi,
    /passthru\s*\(/gi,
    /popen\s*\(/gi
  ],
  
  [AttackType.LDAP_INJECTION]: [
    /\(\|\(/gi,
    /\)&\(/gi,
    /\*\)\(/gi,
    /\(\&\(/gi,
    /\(\!\(/gi,
    /\)\(\|/gi,
    /\)\(\&/gi,
    /\)\(\!/gi,
    /objectclass\s*=/gi,
    /cn\s*=/gi,
    /uid\s*=/gi,
    /ou\s*=/gi,
    /dc\s*=/gi
  ],
  
  [AttackType.XML_INJECTION]: [
    /<!DOCTYPE[^>]*>/gi,
    /<!ENTITY[^>]*>/gi,
    /<\?xml[^>]*>/gi,
    /&\w+;/gi,
    /<!\[CDATA\[.*\]\]>/gi,
    /<!--.*-->/gi,
    /<script[^>]*>.*?<\/script>/gi,
    /<\w+[^>]*xmlns[^>]*>/gi
  ],
  
  [AttackType.NOSQL_INJECTION]: [
    /\$where/gi,
    /\$ne/gi,
    /\$gt/gi,
    /\$lt/gi,
    /\$gte/gi,
    /\$lte/gi,
    /\$in/gi,
    /\$nin/gi,
    /\$regex/gi,
    /\$exists/gi,
    /\$type/gi,
    /\$mod/gi,
    /\$all/gi,
    /\$size/gi,
    /\$elemMatch/gi,
    /\$not/gi,
    /\$or/gi,
    /\$and/gi,
    /\$nor/gi,
    /javascript\s*:/gi,
    /function\s*\(/gi,
    /this\./gi
  ],
  
  [AttackType.SSRF]: [
    /https?:\/\/localhost/gi,
    /https?:\/\/127\.0\.0\.1/gi,
    /https?:\/\/0\.0\.0\.0/gi,
    /https?:\/\/\[::1\]/gi,
    /https?:\/\/10\./gi,
    /https?:\/\/172\.(1[6-9]|2[0-9]|3[01])\./gi,
    /https?:\/\/192\.168\./gi,
    /https?:\/\/169\.254\./gi,
    /file:\/\//gi,
    /ftp:\/\//gi,
    /gopher:\/\//gi,
    /dict:\/\//gi,
    /ldap:\/\//gi
  ],
  
  [AttackType.XXE]: [
    /<!DOCTYPE[^>]*\[/gi,
    /<!ENTITY[^>]*SYSTEM/gi,
    /<!ENTITY[^>]*PUBLIC/gi,
    /&\w+;/gi,
    /<\?xml[^>]*encoding/gi,
    /SYSTEM\s+["'][^"']*["']/gi,
    /PUBLIC\s+["'][^"']*["']/gi
  ],
  
  [AttackType.PROTOTYPE_POLLUTION]: [
    /__proto__/gi,
    /constructor\.prototype/gi,
    /prototype\.constructor/gi,
    /\["__proto__"\]/gi,
    /\['__proto__'\]/gi,
    /\["constructor"\]/gi,
    /\['constructor'\]/gi,
    /\["prototype"\]/gi,
    /\['prototype'\]/gi
  ]
};

/**
 * Interface para resultado de detecção
 */
export interface AttackDetectionResult {
  isAttack: boolean;
  attackTypes: AttackType[];
  confidence: number;
  patterns: string[];
  recommendation: string;
  shouldBlock: boolean;
}

/**
 * Interface para status de bloqueio
 */
export interface BlockStatus {
  isBlocked: boolean;
  attackType: AttackType;
  blockedUntil: number;
  attemptCount: number;
  escalationLevel: number;
}

/**
 * Classe principal de proteção contra ataques
 */
export class AttackProtection {
  private static readonly BLOCK_STORAGE_KEY = 'attack_blocks';
  private static readonly ATTEMPT_STORAGE_KEY = 'attack_attempts';
  
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
   * Obtém tentativas de ataque armazenadas
   */
  private static getStoredAttempts(): Record<string, any> {
    try {
      const stored = localStorage.getItem(this.ATTEMPT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }
  
  /**
   * Salva tentativas de ataque
   */
  private static saveAttempts(attempts: Record<string, any>): void {
    try {
      localStorage.setItem(this.ATTEMPT_STORAGE_KEY, JSON.stringify(attempts));
    } catch {
      // Falha silenciosa
    }
  }
  
  /**
   * Obtém bloqueios armazenados
   */
  private static getStoredBlocks(): Record<string, BlockStatus> {
    try {
      const stored = localStorage.getItem(this.BLOCK_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }
  
  /**
   * Salva bloqueios
   */
  private static saveBlocks(blocks: Record<string, BlockStatus>): void {
    try {
      localStorage.setItem(this.BLOCK_STORAGE_KEY, JSON.stringify(blocks));
    } catch {
      // Falha silenciosa
    }
  }
  
  /**
   * Detecta tentativas de ataque em input
   */
  static detectAttack(input: string, context?: string): AttackDetectionResult {
    const result: AttackDetectionResult = {
      isAttack: false,
      attackTypes: [],
      confidence: 0,
      patterns: [],
      recommendation: 'Input seguro',
      shouldBlock: false
    };
    
    if (!input || typeof input !== 'string') {
      return result;
    }
    
    let totalConfidence = 0;
    let patternCount = 0;
    
    // Verifica cada tipo de ataque
    Object.entries(attackPatterns).forEach(([attackType, patterns]) => {
      const matchedPatterns: string[] = [];
      let typeConfidence = 0;
      
      patterns.forEach(pattern => {
        if (pattern.test(input)) {
          matchedPatterns.push(pattern.source);
          typeConfidence += 1;
          patternCount++;
        }
      });
      
      if (matchedPatterns.length > 0) {
        result.isAttack = true;
        result.attackTypes.push(attackType as AttackType);
        result.patterns.push(...matchedPatterns);
        
        // Calcula confiança baseada no número de padrões encontrados
        const normalizedConfidence = Math.min(typeConfidence / patterns.length, 1);
        totalConfidence += normalizedConfidence;
        
        // Log do ataque detectado
        this.logAttackAttempt(attackType as AttackType, input, context, {
          patterns: matchedPatterns,
          confidence: normalizedConfidence
        });
      }
    });
    
    // Calcula confiança final
    if (result.isAttack) {
      result.confidence = Math.min(totalConfidence / Object.keys(attackPatterns).length, 1);
      
      // Determina se deve bloquear
      result.shouldBlock = this.shouldBlockAttack(result.attackTypes, result.confidence);
      
      // Gera recomendação
      result.recommendation = this.generateRecommendation(result.attackTypes, result.confidence);
    }
    
    return result;
  }
  
  /**
   * Verifica se usuário está bloqueado
   */
  static isUserBlocked(attackType?: AttackType): BlockStatus | null {
    const fingerprint = this.getUserFingerprint();
    const blocks = this.getStoredBlocks();
    const now = Date.now();
    
    // Verifica bloqueio específico por tipo de ataque
    if (attackType) {
      const blockKey = `${fingerprint}_${attackType}`;
      const block = blocks[blockKey];
      
      if (block && block.blockedUntil > now) {
        return block;
      }
      
      // Remove bloqueio expirado
      if (block && block.blockedUntil <= now) {
        delete blocks[blockKey];
        this.saveBlocks(blocks);
      }
    } else {
      // Verifica qualquer bloqueio ativo
      for (const [key, block] of Object.entries(blocks)) {
        if (key.startsWith(fingerprint) && block.blockedUntil > now) {
          return block;
        }
        
        // Remove bloqueios expirados
        if (key.startsWith(fingerprint) && block.blockedUntil <= now) {
          delete blocks[key];
        }
      }
      
      this.saveBlocks(blocks);
    }
    
    return null;
  }
  
  /**
   * Bloqueia usuário por tipo de ataque
   */
  static blockUser(attackType: AttackType, escalationLevel: number = 1): void {
    const fingerprint = this.getUserFingerprint();
    const config = attackConfigs[attackType];
    
    // Validar se a configuração existe para evitar erro de propriedade undefined
    if (!config) {
      console.warn(`⚠️ Configuração não encontrada para tipo de ataque: ${attackType}`);
      return; // Sair da função se não há configuração
    }
    const blocks = this.getStoredBlocks();
    const blockKey = `${fingerprint}_${attackType}`;
    
    // Validar escalationLevel para evitar valores extremos
    const safeEscalationLevel = Math.max(1, Math.min(escalationLevel, 10));
    
    // Calcular duração do bloqueio com validação
    let blockDuration = config.blockDuration * Math.pow(config.escalationFactor, safeEscalationLevel - 1);
    
    // Validar se blockDuration é um número válido e não é infinito
    if (!isFinite(blockDuration) || blockDuration < 0 || blockDuration > 86400000 * 30) { // Máximo 30 dias
      blockDuration = config.blockDuration; // Usar duração padrão
    }
    
    const blockedUntil = Date.now() + blockDuration;
    
    const blockStatus: BlockStatus = {
      isBlocked: true,
      attackType,
      blockedUntil,
      attemptCount: escalationLevel,
      escalationLevel
    };
    
    blocks[blockKey] = blockStatus;
    this.saveBlocks(blocks);
    
    // Validar se blockedUntil é um timestamp válido antes de converter para ISO string
    let blockedUntilISO: string;
    try {
      const date = new Date(blockedUntil);
      if (isNaN(date.getTime()) || blockedUntil < 0 || blockedUntil > 8640000000000000) {
        // Se a data é inválida, usar uma data padrão (1 hora a partir de agora)
        blockedUntilISO = new Date(Date.now() + 3600000).toISOString();
      } else {
        blockedUntilISO = date.toISOString();
      }
    } catch (error) {
      // Fallback para data padrão em caso de erro
      blockedUntilISO = new Date(Date.now() + 3600000).toISOString();
    }

    SecurityLogger.logEvent(
      SecurityEventType.LOGIN_BLOCKED,
      SecurityLevel.CRITICAL,
      `Usuário bloqueado por ${attackType}`,
      {
        attackType,
        escalationLevel,
        blockDuration: blockDuration / 1000 / 60, // em minutos
        blockedUntil: blockedUntilISO
      }
    );
  }
  
  /**
   * Registra tentativa de ataque
   */
  private static logAttackAttempt(
    attackType: AttackType,
    input: string,
    context?: string,
    details: Record<string, any> = {}
  ): void {
    const fingerprint = this.getUserFingerprint();
    const attempts = this.getStoredAttempts();
    const attemptKey = `${fingerprint}_${attackType}`;
    const now = Date.now();
    const config = attackConfigs[attackType];
    
    // Validar se a configuração existe para evitar erro de propriedade undefined
    if (!config) {
      console.warn(`⚠️ Configuração não encontrada para tipo de ataque: ${attackType}`);
      return; // Sair da função se não há configuração
    }
    
    if (!attempts[attemptKey]) {
      attempts[attemptKey] = {
        count: 0,
        firstAttempt: now,
        lastAttempt: now,
        escalationLevel: 1
      };
    }
    
    const attempt = attempts[attemptKey];
    
    // Reset se passou da janela de tempo
    if (config.timeWindow > 0 && now - attempt.firstAttempt > config.timeWindow) {
      attempt.count = 0;
      attempt.firstAttempt = now;
      attempt.escalationLevel = 1;
    }
    
    attempt.count++;
    attempt.lastAttempt = now;
    
    // Verifica se deve bloquear
    if (attempt.count >= config.maxAttempts) {
      this.blockUser(attackType, attempt.escalationLevel);
      attempt.escalationLevel++;
      attempt.count = 0; // Reset contador após bloqueio
    }
    
    attempts[attemptKey] = attempt;
    this.saveAttempts(attempts);
    
    // Log do evento
    const eventType = this.getSecurityEventType(attackType);
    SecurityLogger.logEvent(
      eventType,
      SecurityLevel.CRITICAL,
      `Tentativa de ${attackType} detectada`,
      {
        attackType,
        input: input.substring(0, 100),
        context,
        attemptCount: attempt.count,
        escalationLevel: attempt.escalationLevel,
        ...details
      }
    );
  }
  
  /**
   * Determina se deve bloquear baseado no tipo de ataque e confiança
   */
  private static shouldBlockAttack(attackTypes: AttackType[], confidence: number): boolean {
    // Ataques críticos sempre bloqueiam
    const criticalAttacks = [
      AttackType.SQL_INJECTION,
      AttackType.XSS,
      AttackType.COMMAND_INJECTION
    ];
    
    if (attackTypes.some(type => criticalAttacks.includes(type))) {
      return true;
    }
    
    // Bloqueia se confiança for alta
    return confidence > 0.7;
  }
  
  /**
   * Gera recomendação baseada nos ataques detectados
   */
  private static generateRecommendation(attackTypes: AttackType[], confidence: number): string {
    if (confidence > 0.8) {
      return 'Ataque de alta confiança detectado. Bloqueio recomendado.';
    }
    
    if (attackTypes.includes(AttackType.SQL_INJECTION)) {
      return 'Possível SQL Injection detectado. Validar entrada e usar prepared statements.';
    }
    
    if (attackTypes.includes(AttackType.XSS)) {
      return 'Possível XSS detectado. Sanitizar entrada e usar CSP.';
    }
    
    if (attackTypes.includes(AttackType.COMMAND_INJECTION)) {
      return 'Possível Command Injection detectado. Validar entrada e evitar execução de comandos.';
    }
    
    if (attackTypes.includes(AttackType.BRUTE_FORCE)) {
      return 'Possível Brute Force detectado. Implementar rate limiting.';
    }
    
    return 'Padrão suspeito detectado. Monitorar atividade.';
  }
  
  /**
   * Mapeia tipo de ataque para evento de segurança
   */
  private static getSecurityEventType(attackType: AttackType): SecurityEventType {
    switch (attackType) {
      case AttackType.SQL_INJECTION:
      case AttackType.NOSQL_INJECTION:
      case AttackType.LDAP_INJECTION:
      case AttackType.XML_INJECTION:
        return SecurityEventType.INJECTION_ATTEMPT;
      
      case AttackType.XSS:
        return SecurityEventType.XSS_ATTEMPT;
      
      case AttackType.BRUTE_FORCE:
        return SecurityEventType.LOGIN_FAILURE;
      
      default:
        return SecurityEventType.SUSPICIOUS_PATTERN;
    }
  }
  
  /**
   * Métodos de conveniência para diferentes tipos de proteção
   */
  static checkForSQLInjection(input: string, context?: string): AttackDetectionResult {
    const patterns = attackPatterns[AttackType.SQL_INJECTION];
    return this.checkSpecificAttack(input, AttackType.SQL_INJECTION, patterns, context);
  }
  
  static checkForXSS(input: string, context?: string): AttackDetectionResult {
    const patterns = attackPatterns[AttackType.XSS];
    return this.checkSpecificAttack(input, AttackType.XSS, patterns, context);
  }
  
  static checkForCommandInjection(input: string, context?: string): AttackDetectionResult {
    const patterns = attackPatterns[AttackType.COMMAND_INJECTION];
    return this.checkSpecificAttack(input, AttackType.COMMAND_INJECTION, patterns, context);
  }
  
  static checkForPathTraversal(input: string, context?: string): AttackDetectionResult {
    const patterns = attackPatterns[AttackType.PATH_TRAVERSAL];
    return this.checkSpecificAttack(input, AttackType.PATH_TRAVERSAL, patterns, context);
  }
  
  /**
   * Verifica ataque específico
   */
  private static checkSpecificAttack(
    input: string,
    attackType: AttackType,
    patterns: RegExp[],
    context?: string
  ): AttackDetectionResult {
    const result: AttackDetectionResult = {
      isAttack: false,
      attackTypes: [],
      confidence: 0,
      patterns: [],
      recommendation: 'Input seguro',
      shouldBlock: false
    };
    
    if (!input || typeof input !== 'string') {
      return result;
    }
    
    const matchedPatterns: string[] = [];
    let matchCount = 0;
    
    patterns.forEach(pattern => {
      if (pattern.test(input)) {
        matchedPatterns.push(pattern.source);
        matchCount++;
      }
    });
    
    if (matchedPatterns.length > 0) {
      result.isAttack = true;
      result.attackTypes = [attackType];
      result.patterns = matchedPatterns;
      result.confidence = Math.min(matchCount / patterns.length, 1);
      result.shouldBlock = this.shouldBlockAttack([attackType], result.confidence);
      result.recommendation = this.generateRecommendation([attackType], result.confidence);
      
      this.logAttackAttempt(attackType, input, context, {
        patterns: matchedPatterns,
        confidence: result.confidence
      });
    }
    
    return result;
  }
  
  /**
   * Limpa bloqueios expirados
   */
  static cleanupExpiredBlocks(): void {
    const blocks = this.getStoredBlocks();
    const now = Date.now();
    let hasChanges = false;
    
    Object.keys(blocks).forEach(key => {
      if (blocks[key].blockedUntil <= now) {
        delete blocks[key];
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      this.saveBlocks(blocks);
    }
  }
  
  /**
   * Obtém estatísticas de ataques
   */
  static getAttackStats(): {
    totalAttempts: number;
    attacksByType: Record<string, number>;
    activeBlocks: number;
    topAttackTypes: Array<{ type: string; count: number }>;
  } {
    const attempts = this.getStoredAttempts();
    const blocks = this.getStoredBlocks();
    const now = Date.now();
    
    const attacksByType: Record<string, number> = {};
    let totalAttempts = 0;
    
    Object.entries(attempts).forEach(([key, attempt]) => {
      const attackType = key.split('_').slice(1).join('_');
      attacksByType[attackType] = (attacksByType[attackType] || 0) + attempt.count;
      totalAttempts += attempt.count;
    });
    
    const activeBlocks = Object.values(blocks).filter(block => block.blockedUntil > now).length;
    
    const topAttackTypes = Object.entries(attacksByType)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return {
      totalAttempts,
      attacksByType,
      activeBlocks,
      topAttackTypes
    };
  }
  
  /**
   * Remove todos os bloqueios (para testes)
   */
  static clearAllBlocks(): void {
    try {
      localStorage.removeItem(this.BLOCK_STORAGE_KEY);
      localStorage.removeItem(this.ATTEMPT_STORAGE_KEY);
    } catch {
      // Falha silenciosa
    }
  }
}

// Export default para facilitar importação
export default AttackProtection;