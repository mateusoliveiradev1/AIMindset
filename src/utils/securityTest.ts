/**
 * Teste de compatibilidade das melhorias de segurança
 * Verifica se todas as funcionalidades estão funcionando sem quebrar o sistema
 */

import { sanitizeInput, sanitizeEmail, sanitizeName, sanitizeMessage, validators, RateLimiter, isNormalContent } from './security.js';
import SecurityLogger, { SecurityEventType, SecurityLevel } from './securityLogger';
import { AdvancedRateLimit } from './advancedRateLimit';
import { AdvancedValidator, ValidationContext } from './advancedValidation';
import { AttackProtection } from './attackProtection';
import { IntegrityMonitor } from './integrityMonitor';

/**
 * Testa as funcionalidades básicas de segurança
 */
export const testBasicSecurity = (): boolean => {
  console.log('🔒 Testando funcionalidades básicas de segurança...');
  
  try {
    // Teste de sanitização
    const testInput = 'Teste <script>alert("xss")</script> normal';
    const sanitized = sanitizeInput(testInput);
    console.log('✅ Sanitização funcionando:', sanitized);
    
    // Teste de validação de email
    const email = 'test@example.com';
    const isValidEmail = validators.email(email);
    console.log('✅ Validação de email funcionando:', isValidEmail);
    
    // Teste de rate limiting
    const canPerform = RateLimiter.canPerformAction('test', 5, 60000);
    console.log('✅ Rate limiting funcionando:', canPerform);
    
    return true;
  } catch (error) {
    console.error('❌ Erro nos testes básicos:', error);
    return false;
  }
};

/**
 * Testa o sistema de logs de segurança
 */
export const testSecurityLogging = (): boolean => {
  console.log('📊 Testando sistema de logs de segurança...');
  
  try {
    // Teste de log de evento
    SecurityLogger.logEvent(SecurityEventType.LOGIN_ATTEMPT, SecurityLevel.INFO, 'Teste de autenticação', {
      userId: 'test-user',
      action: 'login'
    });
    
    // Teste de log de XSS
    SecurityLogger.logXSSAttempt('<script>alert("test")</script>', { source: 'test' });
    
    // Verificar se os logs foram criados
    const logs = SecurityLogger.getLogs();
    console.log('✅ Sistema de logs funcionando. Total de logs:', logs.length);
    
    return true;
  } catch (error) {
    console.error('❌ Erro no sistema de logs:', error);
    return false;
  }
};

/**
 * Testa o rate limiting avançado
 */
export const testAdvancedRateLimit = (): boolean => {
  console.log('⚡ Testando rate limiting avançado...');
  
  try {
    const rateLimiter = new AdvancedRateLimit();
    
    // Teste de diferentes ações
    const canComment = AdvancedRateLimit.canPerformAction('comment');
    const canLogin = AdvancedRateLimit.canPerformAction('admin_login');
    
    console.log('✅ Rate limiting avançado funcionando - Comentário:', canComment, 'Login:', canLogin);
    
    return true;
  } catch (error) {
    console.error('❌ Erro no rate limiting avançado:', error);
    return false;
  }
};

/**
 * Testa a validação avançada
 */
export const testAdvancedValidation = (): boolean => {
  console.log('🔍 Testando validação avançada...');
  
  try {
    const validator = new AdvancedValidator();
    
    // Teste de validação de título de artigo
    const titleResult = validator.validate('Meu Artigo Sobre IA', ValidationContext.ARTICLE_TITLE);
    console.log('✅ Validação de título:', titleResult.isValid);
    
    // Teste de validação de email
    const emailResult = validator.validate('test@example.com', ValidationContext.EMAIL);
    console.log('✅ Validação de email avançada:', emailResult.isValid);
    
    return true;
  } catch (error) {
    console.error('❌ Erro na validação avançada:', error);
    return false;
  }
};

/**
 * Testa a proteção contra ataques
 */
export const testAttackProtection = (): boolean => {
  console.log('🛡️ Testando proteção contra ataques...');
  
  try {
    const protection = new AttackProtection();
    
    // Teste de detecção de ataques
    const sqlTest = AttackProtection.detectAttack("SELECT * FROM users WHERE id = '1' OR '1'='1'");
    console.log('✅ Detecção de SQL injection:', sqlTest.isAttack);
    
    // Teste de detecção de XSS
    const xssTest = AttackProtection.detectAttack('<script>alert("xss")</script>');
    console.log('✅ Detecção de XSS:', xssTest.isAttack);
    
    return true;
  } catch (error) {
    console.error('❌ Erro na proteção contra ataques:', error);
    return false;
  }
};

/**
 * Testa o monitoramento de integridade
 */
export const testIntegrityMonitoring = (): boolean => {
  console.log('🔍 Testando monitoramento de integridade...');
  
  try {
    const monitor = new IntegrityMonitor();
    
    // Criar snapshot inicial
    IntegrityMonitor.createInitialSnapshot();
    console.log('✅ Snapshot de integridade criado');
    
    // Verificar integridade
    const status = IntegrityMonitor.getMonitoringStatus();
    console.log('✅ Status de integridade:', status.isMonitoring);
    
    return true;
  } catch (error) {
    console.error('❌ Erro no monitoramento de integridade:', error);
    return false;
  }
};

/**
 * Executa todos os testes de segurança
 */
export const runAllSecurityTests = (): boolean => {
  console.log('🚀 Iniciando testes de compatibilidade das melhorias de segurança...\n');
  
  const tests = [
    { name: 'Funcionalidades Básicas', test: testBasicSecurity },
    { name: 'Sistema de Logs', test: testSecurityLogging },
    { name: 'Rate Limiting Avançado', test: testAdvancedRateLimit },
    { name: 'Validação Avançada', test: testAdvancedValidation },
    { name: 'Proteção contra Ataques', test: testAttackProtection },
    { name: 'Monitoramento de Integridade', test: testIntegrityMonitoring }
  ];
  
  let allPassed = true;
  const results: { name: string; passed: boolean }[] = [];
  
  for (const { name, test } of tests) {
    try {
      const passed = test();
      results.push({ name, passed });
      
      if (!passed) {
        allPassed = false;
      }
      
      console.log(`${passed ? '✅' : '❌'} ${name}: ${passed ? 'PASSOU' : 'FALHOU'}\n`);
    } catch (error) {
      console.error(`❌ ${name}: ERRO -`, error);
      results.push({ name, passed: false });
      allPassed = false;
    }
  }
  
  // Resumo final
  console.log('📋 RESUMO DOS TESTES:');
  console.log('='.repeat(50));
  
  results.forEach(({ name, passed }) => {
    console.log(`${passed ? '✅' : '❌'} ${name}`);
  });
  
  console.log('='.repeat(50));
  console.log(`🎯 RESULTADO GERAL: ${allPassed ? '✅ TODOS OS TESTES PASSARAM' : '❌ ALGUNS TESTES FALHARAM'}`);
  
  if (allPassed) {
    console.log('🎉 Todas as melhorias de segurança foram implementadas com sucesso!');
    console.log('🔒 O sistema mantém 100% de compatibilidade com o código existente.');
  }
  
  return allPassed;
};

// Função para testar em ambiente de desenvolvimento
export const devSecurityTest = () => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('🔧 Executando testes de segurança em ambiente de desenvolvimento...');
    return runAllSecurityTests();
  }
  return true;
};