/**
 * Sistema de Logs Completo - AIMindset
 * 
 * Funções globais para registrar eventos de aplicação e sistema
 * Integração com Supabase RPC para armazenamento centralizado
 */

import { supabase } from './supabase';
import { supabaseAdmin } from './supabase-admin';
import { rpcWithAuth } from './supabaseRpc';

// Fila offline simples baseada em localStorage
interface QueuedAppLog {
  level: LogLevel;
  source: string;
  action: string;
  details: AppLogDetails;
}

interface QueuedSystemLog {
  type: SystemLogType;
  message: string;
  context: SystemLogContext;
}

const APP_LOG_QUEUE_KEY = 'aimindset_app_log_queue';
const SYSTEM_LOG_QUEUE_KEY = 'aimindset_system_log_queue';

function enqueueAppLog(log: QueuedAppLog) {
  try {
    const existing = JSON.parse(localStorage.getItem(APP_LOG_QUEUE_KEY) || '[]');
    existing.push({ ...log, queued_at: Date.now() });
    localStorage.setItem(APP_LOG_QUEUE_KEY, JSON.stringify(existing));
  } catch {}
}

function enqueueSystemLog(log: QueuedSystemLog) {
  try {
    const existing = JSON.parse(localStorage.getItem(SYSTEM_LOG_QUEUE_KEY) || '[]');
    existing.push({ ...log, queued_at: Date.now() });
    localStorage.setItem(SYSTEM_LOG_QUEUE_KEY, JSON.stringify(existing));
  } catch {}
}

async function flushAppLogQueue() {
  try {
    const raw = localStorage.getItem(APP_LOG_QUEUE_KEY);
    if (!raw) return;
    const queue: any[] = JSON.parse(raw);
    if (!Array.isArray(queue) || queue.length === 0) return;

    const remaining: any[] = [];
    for (const item of queue) {
      try {
        await logEvent(item.level, item.source, item.action, item.details);
      } catch (err) {
        // manter na fila em caso de falha
        remaining.push(item);
      }
    }
    localStorage.setItem(APP_LOG_QUEUE_KEY, JSON.stringify(remaining));
  } catch {}
}

async function flushSystemLogQueue() {
  try {
    const raw = localStorage.getItem(SYSTEM_LOG_QUEUE_KEY);
    if (!raw) return;
    const queue: any[] = JSON.parse(raw);
    if (!Array.isArray(queue) || queue.length === 0) return;

    const remaining: any[] = [];
    for (const item of queue) {
      try {
        await logSystem(item.type, item.message, item.context);
      } catch (err) {
        remaining.push(item);
      }
    }
    localStorage.setItem(SYSTEM_LOG_QUEUE_KEY, JSON.stringify(remaining));
  } catch {}
}

function isOnline(): boolean {
  try {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  } catch {
    return true;
  }
}

// Tipos para os logs
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type SystemLogType = 'auth' | 'database' | 'api' | 'cache' | 'performance' | 'security' | 'backup' | 'email' | 'general' | 'cache_hit' | 'cache_miss';

// Interface para detalhes do log de aplicação
export interface AppLogDetails {
  user_id?: string;
  url?: string;
  user_agent?: string;
  ip_address?: string;
  session_id?: string;
  error_stack?: string;
  performance_metrics?: Record<string, any>;
  [key: string]: any;
}

// Interface para contexto do log de sistema
export interface SystemLogContext {
  component?: string;
  function_name?: string;
  duration_ms?: number;
  memory_usage?: number;
  cpu_usage?: number;
  error_code?: string;
  stack_trace?: string;
  [key: string]: any;
}

/**
 * Registra um evento de aplicação (app_logs)
 * 
 * @param level - Nível do log (info, warn, error, debug)
 * @param source - Origem do log (componente, página, hook, etc.)
 * @param action - Ação realizada (login, create_article, send_email, etc.)
 * @param details - Detalhes adicionais do evento
 * @returns Promise com resultado da operação
 */
export async function logEvent(
  level: LogLevel,
  source: string,
  action: string,
  details: AppLogDetails = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    // Enriquecer detalhes com informações do contexto
    const enrichedDetails = {
      ...details,
      url: details.url || (typeof window !== 'undefined' ? window.location.href : undefined),
      user_agent: details.user_agent || (typeof navigator !== 'undefined' ? navigator.userAgent : undefined),
      timestamp: new Date().toISOString(),
      session_id: details.session_id || generateSessionId()
    };

    // Se offline, enfileirar imediatamente
    if (!isOnline()) {
      enqueueAppLog({ level, source, action, details: enrichedDetails });
      if (import.meta.env.DEV) {
        console.log(`📥 [APP-LOG QUEUED] ${level.toUpperCase()} | ${source} | ${action}`, enrichedDetails);
      }
      return { success: true };
    }

    // Tentar via RPC padrão, com fallbacks em caso de CORS/502
    try {
      const { data, error } = await supabase.rpc('insert_app_log', {
        p_level: level,
        p_source: source,
        p_action: action,
        p_details: enrichedDetails,
        p_user_id: details.user_id || null
      });

      if (error) throw error;
    } catch (primaryErr: any) {
      console.warn('⚠️ [LOG-EVENT] Falha na RPC padrão, tentando fallback com token:', primaryErr?.message || primaryErr);
      try {
        await rpcWithAuth('insert_app_log', {
          p_level: level,
          p_source: source,
          p_action: action,
          p_details: enrichedDetails,
          p_user_id: details.user_id || null
        });
      } catch (authErr: any) {
        console.warn('⚠️ [LOG-EVENT] Falha no fallback com token, tentando insert direto (admin em DEV):', authErr?.message || authErr);
        // Em DEV/preview local, usar cliente admin como último recurso
        const isDev = typeof import.meta !== 'undefined' ? !!import.meta.env.DEV : true;
        const isLocal = typeof window !== 'undefined' ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') : false;
        if (isDev || isLocal) {
          try {
            await supabaseAdmin.from('app_logs').insert({
              level,
              source,
              action,
              details: enrichedDetails,
              user_id: details.user_id || null,
              created_at: new Date().toISOString()
            });
          } catch (adminErr: any) {
            console.error('❌ [LOG-EVENT] Falha no insert direto admin:', adminErr?.message || adminErr);
            enqueueAppLog({ level, source, action, details: enrichedDetails });
            return { success: false, error: adminErr?.message || 'Falha ao registrar log' };
          }
        } else {
          enqueueAppLog({ level, source, action, details: enrichedDetails });
          return { success: false, error: authErr?.message || 'Falha ao registrar log' };
        }
      }
    }

    // Log local para desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`📝 [APP-LOG] ${level.toUpperCase()} | ${source} | ${action}`, enrichedDetails);
    }

    return { success: true };
  } catch (error) {
    console.error('❌ [LOG-EVENT] Erro crítico ao registrar log:', error);
    // Enfileirar para retry
    try {
      enqueueAppLog({ level, source, action, details });
    } catch {}
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

/**
 * Registra um evento de sistema (system_logs)
 * 
 * @param type - Tipo do log de sistema (auth, database, api, etc.)
 * @param message - Mensagem descritiva do evento
 * @param context - Contexto adicional do sistema
 * @returns Promise com resultado da operação
 */
export async function logSystem(
  type: SystemLogType,
  message: string,
  context: SystemLogContext = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    // Enriquecer contexto com informações do sistema
    const enrichedContext = {
      ...context,
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      memory_usage: context.memory_usage || getMemoryUsage(),
      performance_now: typeof performance !== 'undefined' ? performance.now() : undefined
    };

    // Se offline, enfileirar
    if (!isOnline()) {
      enqueueSystemLog({ type, message, context: enrichedContext });
      if (import.meta.env.DEV) {
        console.log(`📥 [SYSTEM-LOG QUEUED] ${type.toUpperCase()} | ${message}`, enrichedContext);
      }
      return { success: true };
    }

    // Tentar via RPC padrão, com fallbacks em caso de CORS/502
    try {
      const { data, error } = await supabase.rpc('insert_system_log', {
        p_type: type,
        p_message: message,
        p_context: enrichedContext
      });
      if (error) throw error;
    } catch (primaryErr: any) {
      console.warn('⚠️ [LOG-SYSTEM] Falha na RPC padrão, tentando fallback com token:', primaryErr?.message || primaryErr);
      try {
        await rpcWithAuth('insert_system_log', {
          p_type: type,
          p_message: message,
          p_context: enrichedContext
        });
      } catch (authErr: any) {
        console.warn('⚠️ [LOG-SYSTEM] Falha no fallback com token, tentando insert direto (admin em DEV):', authErr?.message || authErr);
        const isDev = typeof import.meta !== 'undefined' ? !!import.meta.env.DEV : true;
        const isLocal = typeof window !== 'undefined' ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') : false;
        if (isDev || isLocal) {
          try {
            await supabaseAdmin.from('system_logs').insert({
              type,
              message,
              context: enrichedContext,
              created_at: new Date().toISOString()
            });
          } catch (adminErr: any) {
            console.error('❌ [LOG-SYSTEM] Falha no insert direto admin:', adminErr?.message || adminErr);
            enqueueSystemLog({ type, message, context: enrichedContext });
            return { success: false, error: adminErr?.message || 'Falha ao registrar log' };
          }
        } else {
          enqueueSystemLog({ type, message, context: enrichedContext });
          return { success: false, error: authErr?.message || 'Falha ao registrar log' };
        }
      }
    }

    // Log local para desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`🔧 [SYSTEM-LOG] ${type.toUpperCase()} | ${message}`, enrichedContext);
    }

    return { success: true };
  } catch (error) {
    console.error('❌ [LOG-SYSTEM] Erro crítico ao registrar log:', error);
    try {
      enqueueSystemLog({ type, message, context });
    } catch {}
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

/**
 * Função utilitária para registrar erros automaticamente
 * 
 * @param error - Erro capturado
 * @param source - Origem do erro
 * @param action - Ação que causou o erro
 * @param additionalDetails - Detalhes adicionais
 */
export async function logError(
  error: Error | string,
  source: string,
  action: string,
  additionalDetails: AppLogDetails = {}
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  await logEvent('error', source, action, {
    ...additionalDetails,
    error_message: errorMessage,
    error_stack: errorStack,
    error_name: error instanceof Error ? error.name : 'UnknownError'
  });
}

/**
 * Função utilitária para registrar performance
 * 
 * @param action - Ação medida
 * @param duration - Duração em milissegundos
 * @param source - Origem da medição
 * @param additionalMetrics - Métricas adicionais
 */
export async function logPerformance(
  action: string,
  duration: number,
  source: string,
  additionalMetrics: Record<string, any> = {}
): Promise<void> {
  await logEvent('info', source, `performance_${action}`, {
    performance_metrics: {
      duration_ms: duration,
      ...additionalMetrics
    }
  });
}

/**
 * Função utilitária para registrar autenticação
 * 
 * @param action - Ação de auth (login, logout, register, etc.)
 * @param userId - ID do usuário (opcional)
 * @param success - Se a ação foi bem-sucedida
 * @param details - Detalhes adicionais
 */
export async function logAuth(
  action: string,
  userId?: string,
  success: boolean = true,
  details: AppLogDetails = {}
): Promise<void> {
  await logEvent(success ? 'info' : 'warn', 'auth', action, {
    ...details,
    user_id: userId,
    success
  });
}

// Funções utilitárias internas

/**
 * Gera um ID de sessão único
 */
function generateSessionId(): string {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    let sessionId = window.sessionStorage.getItem('aimindset_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      window.sessionStorage.setItem('aimindset_session_id', sessionId);
    }
    return sessionId;
  }
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Obtém informações de uso de memória (se disponível)
 */
function getMemoryUsage(): number | undefined {
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;
    return memory.usedJSHeapSize;
  }
  return undefined;
}

/**
 * Inicializa o sistema de logs
 * Registra um log de sistema indicando que o sistema foi inicializado
 */
export async function initializeLogging(): Promise<void> {
  try {
    await logSystem('general', 'Sistema de logs inicializado', {
      component: 'logging',
      function_name: 'initializeLogging',
      environment: import.meta.env.MODE,
      timestamp: new Date().toISOString()
    });

    // Tentar flush imediato e configurar listeners
    await flushAppLogQueue();
    await flushSystemLogQueue();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        flushAppLogQueue();
        flushSystemLogQueue();
      });
    }
  } catch (error) {
    console.error('❌ [INIT-LOGGING] Erro ao inicializar sistema de logs:', error);
  }
}

// Adicionar funções ao objeto window para acesso global (apenas em desenvolvimento)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).logEvent = logEvent;
  (window as any).logSystem = logSystem;
  (window as any).logError = logError;
  (window as any).logPerformance = logPerformance;
  (window as any).logAuth = logAuth;
}

// Exportar logEvent como default
export default logEvent;