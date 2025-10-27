/**
 * Sistema de Validação Avançada
 * Sanitização contextual melhorada para diferentes tipos de conteúdo
 * Mantém compatibilidade total com o sistema atual
 */

import DOMPurify from 'dompurify';
import SecurityLogger, { SecurityEventType, SecurityLevel } from './securityLogger';

/**
 * Tipos de contexto para validação
 */
export enum ValidationContext {
  ARTICLE_TITLE = 'article_title',
  ARTICLE_CONTENT = 'article_content',
  USER_NAME = 'user_name',
  EMAIL = 'email',
  PHONE = 'phone',
  MESSAGE = 'message',
  COMMENT = 'comment',
  SEARCH_QUERY = 'search_query',
  URL = 'url',
  FILE_NAME = 'file_name',
  ADMIN_INPUT = 'admin_input'
}

/**
 * Configurações específicas por contexto
 */
const contextConfigs = {
  [ValidationContext.ARTICLE_TITLE]: {
    maxLength: 200,
    allowedChars: /^[a-zA-ZÀ-ÿ0-9\s\-\.\!\?\:\;\,\(\)]+$/,
    forbiddenPatterns: [
      /<script/gi,
      /javascript:/gi,
      /on\w+=/gi
    ],
    sanitizeHtml: true,
    preserveFormatting: false,
    allowedTags: [],
    allowedAttributes: [],
    strictMode: false
  },
  
  [ValidationContext.ARTICLE_CONTENT]: {
    maxLength: 50000,
    allowedChars: null, // Permite mais caracteres para conteúdo
    forbiddenPatterns: [
      /<script/gi,
      /javascript:/gi,
      /on\w+=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi
    ],
    sanitizeHtml: true,
    preserveFormatting: true,
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'img'],
    allowedAttributes: ['class', 'href', 'src', 'alt', 'title'],
    strictMode: false
  },
  
  [ValidationContext.USER_NAME]: {
    maxLength: 100,
    allowedChars: /^[a-zA-ZÀ-ÿ0-9\s\-\.]+$/,
    forbiddenPatterns: [
      /<.*?>/gi,
      /javascript:/gi,
      /admin/gi,
      /root/gi,
      /system/gi
    ],
    sanitizeHtml: true,
    preserveFormatting: false,
    allowedTags: [],
    allowedAttributes: [],
    strictMode: false
  },
  
  [ValidationContext.EMAIL]: {
    maxLength: 254,
    allowedChars: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    forbiddenPatterns: [
      /<.*?>/gi,
      /javascript:/gi,
      /\s/g // Não permite espaços em email
    ],
    sanitizeHtml: true,
    preserveFormatting: false,
    allowedTags: [],
    allowedAttributes: [],
    strictMode: false
  },
  
  [ValidationContext.PHONE]: {
    maxLength: 20,
    allowedChars: /^[\d\s\(\)\-\+]+$/,
    forbiddenPatterns: [
      /<.*?>/gi,
      /javascript:/gi,
      /[a-zA-Z]/gi // Não permite letras
    ],
    sanitizeHtml: true,
    preserveFormatting: false,
    allowedTags: [],
    allowedAttributes: [],
    strictMode: false
  },
  
  [ValidationContext.MESSAGE]: {
    maxLength: 5000,
    allowedChars: null,
    forbiddenPatterns: [
      /<script/gi,
      /javascript:/gi,
      /on\w+=/gi,
      /<iframe/gi
    ],
    sanitizeHtml: true,
    preserveFormatting: true,
    allowedTags: ['p', 'br', 'strong', 'em'],
    allowedAttributes: [],
    strictMode: false
  },
  
  [ValidationContext.COMMENT]: {
    maxLength: 1000,
    allowedChars: null,
    forbiddenPatterns: [
      /<script/gi,
      /javascript:/gi,
      /on\w+=/gi,
      /<iframe/gi,
      /fuck/gi,
      /shit/gi,
      /damn/gi // Filtro básico de palavrões
    ],
    sanitizeHtml: true,
    preserveFormatting: false,
    allowedTags: [],
    allowedAttributes: [],
    strictMode: false
  },
  
  [ValidationContext.SEARCH_QUERY]: {
    maxLength: 200,
    allowedChars: /^[a-zA-ZÀ-ÿ0-9\s\-\.\!\?\:\;\,\(\)]+$/,
    forbiddenPatterns: [
      /<.*?>/gi,
      /javascript:/gi,
      /union\s+select/gi,
      /drop\s+table/gi,
      /insert\s+into/gi
    ],
    sanitizeHtml: true,
    preserveFormatting: false,
    allowedTags: [],
    allowedAttributes: [],
    strictMode: false
  },
  
  [ValidationContext.URL]: {
    maxLength: 2048,
    allowedChars: /^https?:\/\/[^\s<>"{}|\\^`\[\]]+$/,
    forbiddenPatterns: [
      /javascript:/gi,
      /data:/gi,
      /vbscript:/gi,
      /file:/gi,
      /ftp:/gi
    ],
    sanitizeHtml: false,
    preserveFormatting: false,
    allowedTags: [],
    allowedAttributes: [],
    strictMode: false
  },
  
  [ValidationContext.FILE_NAME]: {
    maxLength: 255,
    allowedChars: /^[a-zA-Z0-9\-_\.]+$/,
    forbiddenPatterns: [
      /\.\./gi, // Path traversal
      /\//gi,
      /\\/gi,
      /\|/gi,
      /</gi,
      />/gi,
      /:/gi,
      /\*/gi,
      /\?/gi,
      /"/gi
    ],
    sanitizeHtml: false,
    preserveFormatting: false,
    allowedTags: [],
    allowedAttributes: [],
    strictMode: false
  },
  
  [ValidationContext.ADMIN_INPUT]: {
    maxLength: 10000,
    allowedChars: null,
    forbiddenPatterns: [
      /<script/gi,
      /javascript:/gi,
      /on\w+=/gi,
      /eval\s*\(/gi,
      /exec\s*\(/gi,
      /system\s*\(/gi
    ],
    sanitizeHtml: true,
    preserveFormatting: true,
    strictMode: true,
    allowedTags: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    allowedAttributes: []
  }
};

/**
 * Resultado da validação
 */
export interface ValidationResult {
  isValid: boolean;
  sanitizedValue: string;
  errors: string[];
  warnings: string[];
  originalLength: number;
  sanitizedLength: number;
  context: ValidationContext;
}

/**
 * Classe principal de validação avançada
 */
export class AdvancedValidator {
  
  /**
   * Valida e sanitiza input baseado no contexto
   */
  validate(
    input: string,
    context: ValidationContext,
    customConfig?: Partial<typeof contextConfigs[ValidationContext]>
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      sanitizedValue: '',
      errors: [],
      warnings: [],
      originalLength: input?.length || 0,
      sanitizedLength: 0,
      context
    };
    
    // Verifica se input é válido
    if (!input || typeof input !== 'string') {
      result.isValid = false;
      result.errors.push('Input inválido ou vazio');
      SecurityLogger.logValidationError('input', input, 'Input inválido ou vazio');
      return result;
    }
    
    const config = { ...contextConfigs[context], ...customConfig };
    let sanitized = input;
    
    try {
      // 1. Normalização
      sanitized = this.normalizeInput(sanitized);
      
      // 2. Verificação de comprimento
      if (sanitized.length > config.maxLength) {
        result.warnings.push(`Input truncado de ${sanitized.length} para ${config.maxLength} caracteres`);
        sanitized = sanitized.substring(0, config.maxLength);
      }
      
      // 3. Verificação de padrões proibidos
      const forbiddenFound = this.checkForbiddenPatterns(sanitized, config.forbiddenPatterns || []);
      if (forbiddenFound.length > 0) {
        result.errors.push(`Padrões proibidos encontrados: ${forbiddenFound.join(', ')}`);
        result.isValid = false;
        
        SecurityLogger.logSuspiciousInput(
          input,
          `Padrões proibidos no contexto ${context}`,
          { patterns: forbiddenFound, context }
        );
      }
      
      // 4. Verificação de caracteres permitidos
      if (config.allowedChars && !config.allowedChars.test(sanitized)) {
        result.warnings.push('Caracteres não permitidos removidos');
        sanitized = this.removeDisallowedChars(sanitized, config.allowedChars);
      }
      
      // 5. Sanitização HTML se necessária
      if (config.sanitizeHtml) {
        const htmlSanitized = this.sanitizeHtml(sanitized, config);
        if (htmlSanitized !== sanitized) {
          result.warnings.push('Conteúdo HTML sanitizado');
          sanitized = htmlSanitized;
        }
      }
      
      // 6. Verificações específicas por contexto
      const contextValidation = this.validateByContext(sanitized, context);
      if (!contextValidation.isValid) {
        result.errors.push(...contextValidation.errors);
        result.warnings.push(...contextValidation.warnings);
        result.isValid = false;
      }
      
      // 7. Modo estrito para admin
      if (config.strictMode) {
        const strictValidation = this.strictValidation(sanitized);
        if (!strictValidation.isValid) {
          result.errors.push(...strictValidation.errors);
          result.isValid = false;
        }
      }
      
      result.sanitizedValue = sanitized;
      result.sanitizedLength = sanitized.length;
      
      // Log se houve mudanças significativas
      if (input !== sanitized || result.errors.length > 0) {
        SecurityLogger.logSanitizationTriggered(input, sanitized, {
          context,
          errors: result.errors,
          warnings: result.warnings
        });
      }
      
    } catch (error) {
      result.isValid = false;
      result.errors.push('Erro interno de validação');
      SecurityLogger.logValidationError('validation', input, `Erro interno: ${error}`);
    }
    
    return result;
  }
  
  /**
   * Normaliza input
   */
  private normalizeInput(input: string): string {
    return input
      .normalize('NFKC')
      .trim()
      .replace(/\r\n/g, '\n') // Normaliza quebras de linha
      .replace(/\r/g, '\n')
      .replace(/\u0000/g, ''); // Remove null bytes
  }
  
  /**
   * Verifica padrões proibidos
   */
  private checkForbiddenPatterns(input: string, patterns: RegExp[]): string[] {
    const found: string[] = [];
    
    patterns.forEach(pattern => {
      if (pattern.test(input)) {
        found.push(pattern.source);
      }
    });
    
    return found;
  }
  
  /**
   * Remove caracteres não permitidos
   */
  private removeDisallowedChars(input: string, allowedPattern: RegExp): string {
    // Cria padrão inverso para remover caracteres não permitidos
    const chars = input.split('');
    return chars.filter(char => allowedPattern.test(char)).join('');
  }
  
  /**
   * Sanitiza HTML baseado na configuração
   */
  private sanitizeHtml(input: string, config: any): string {
    const purifyConfig: any = {
      ALLOWED_TAGS: config.allowedTags || [],
      ALLOWED_ATTR: config.allowedAttributes || [],
      KEEP_CONTENT: config.preserveFormatting || false,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      RETURN_DOM_IMPORT: false,
      SANITIZE_DOM: true,
      SANITIZE_NAMED_PROPS: true,
      FORBID_CONTENTS: ['script', 'style', 'iframe', 'object', 'embed'],
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit']
    };
    
    return DOMPurify.sanitize(input, purifyConfig) as unknown as string;
  }
  
  /**
   * Validações específicas por contexto
   */
  private validateByContext(input: string, context: ValidationContext): { isValid: boolean; errors: string[]; warnings: string[] } {
    const result = { isValid: true, errors: [], warnings: [] };
    
    switch (context) {
      case ValidationContext.EMAIL:
        if (!this.isValidEmail(input)) {
          result.isValid = false;
          result.errors.push('Formato de email inválido');
        }
        break;
        
      case ValidationContext.PHONE:
        if (!this.isValidPhone(input)) {
          result.isValid = false;
          result.errors.push('Formato de telefone inválido');
        }
        break;
        
      case ValidationContext.URL:
        if (!this.isValidUrl(input)) {
          result.isValid = false;
          result.errors.push('URL inválida');
        }
        break;
        
      case ValidationContext.FILE_NAME:
        if (!this.isValidFileName(input)) {
          result.isValid = false;
          result.errors.push('Nome de arquivo inválido');
        }
        break;
        
      case ValidationContext.SEARCH_QUERY:
        if (this.containsSqlInjection(input)) {
          result.isValid = false;
          result.errors.push('Query de busca contém padrões suspeitos');
        }
        break;
    }
    
    return result;
  }
  
  /**
   * Validação estrita para admin
   */
  private strictValidation(input: string): { isValid: boolean; errors: string[] } {
    const result = { isValid: true, errors: [] };
    
    // Verifica padrões de comando
    const commandPatterns = [
      /rm\s+-rf/gi,
      /sudo\s+/gi,
      /chmod\s+/gi,
      /chown\s+/gi,
      /passwd\s+/gi,
      /su\s+/gi,
      /kill\s+/gi,
      /killall\s+/gi
    ];
    
    commandPatterns.forEach(pattern => {
      if (pattern.test(input)) {
        result.isValid = false;
        result.errors.push('Comando de sistema detectado');
      }
    });
    
    return result;
  }
  
  /**
   * Validadores específicos
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
  }
  
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\d\s\(\)\-\+]{8,20}$/;
    return phoneRegex.test(phone);
  }
  
  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }
  
  private isValidFileName(fileName: string): boolean {
    const fileNameRegex = /^[a-zA-Z0-9\-_\.]+$/;
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
    
    return fileNameRegex.test(fileName) && 
           !reservedNames.includes(fileName.toUpperCase()) &&
           fileName.length > 0 && 
           fileName.length <= 255;
  }
  
  private containsSqlInjection(input: string): boolean {
    const sqlPatterns = [
      /union\s+select/gi,
      /drop\s+table/gi,
      /insert\s+into/gi,
      /delete\s+from/gi,
      /update\s+.*set/gi,
      /exec\s*\(/gi,
      /xp_cmdshell/gi,
      /sp_executesql/gi
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  }
  
  /**
   * Métodos de conveniência para diferentes contextos
   */
  static validateArticleTitle(title: string): ValidationResult {
    const validator = new AdvancedValidator();
    return validator.validate(title, ValidationContext.ARTICLE_TITLE);
  }
  
  static validateArticleContent(content: string): ValidationResult {
    const validator = new AdvancedValidator();
    return validator.validate(content, ValidationContext.ARTICLE_CONTENT);
  }
  
  static validateUserName(name: string): ValidationResult {
    const validator = new AdvancedValidator();
    return validator.validate(name, ValidationContext.USER_NAME);
  }
  
  static validateEmail(email: string): ValidationResult {
    const validator = new AdvancedValidator();
    return validator.validate(email, ValidationContext.EMAIL);
  }
  
  static validatePhone(phone: string): ValidationResult {
    const validator = new AdvancedValidator();
    return validator.validate(phone, ValidationContext.PHONE);
  }
  
  static validateMessage(message: string): ValidationResult {
    const validator = new AdvancedValidator();
    return validator.validate(message, ValidationContext.MESSAGE);
  }
  
  static validateComment(comment: string): ValidationResult {
    const validator = new AdvancedValidator();
    return validator.validate(comment, ValidationContext.COMMENT);
  }
  
  static validateSearchQuery(query: string): ValidationResult {
    const validator = new AdvancedValidator();
    return validator.validate(query, ValidationContext.SEARCH_QUERY);
  }
  
  static validateUrl(url: string): ValidationResult {
    const validator = new AdvancedValidator();
    return validator.validate(url, ValidationContext.URL);
  }
  
  static validateFileName(fileName: string): ValidationResult {
    const validator = new AdvancedValidator();
    return validator.validate(fileName, ValidationContext.FILE_NAME);
  }
  
  static validateAdminInput(input: string): ValidationResult {
    const validator = new AdvancedValidator();
    return validator.validate(input, ValidationContext.ADMIN_INPUT);
  }
  
  /**
   * Validação em lote
   */
  static validateBatch(inputs: Array<{ value: string; context: ValidationContext }>): ValidationResult[] {
    const validator = new AdvancedValidator();
    return inputs.map(input => validator.validate(input.value, input.context));
  }
  
  /**
   * Obtém configuração de contexto
   */
  static getContextConfig(context: ValidationContext) {
    return contextConfigs[context];
  }
  
  /**
   * Atualiza configuração de contexto
   */
  static updateContextConfig(context: ValidationContext, config: Partial<{
    maxLength: number;
    allowedChars: RegExp | null;
    forbiddenPatterns: RegExp[];
    sanitizeHtml: boolean;
    preserveFormatting: boolean;
    allowedTags: string[];
    allowedAttributes: string[];
    strictMode?: boolean;
  }>): void {
    contextConfigs[context] = { ...contextConfigs[context], ...config };
  }
}

// Export default para facilitar importação
export default AdvancedValidator;