/**
 * 🔄 UTILITÁRIO DE RESET DO LOCALSTORAGE
 * 
 * Resolve problemas de versões antigas do localStorage que impedem
 * o funcionamento correto do sistema de feedback e interações.
 */

// Versão atual do sistema para controle de compatibilidade
const CURRENT_VERSION = '2.0.0';
const VERSION_KEY = 'aimindset_version';

// Chaves do localStorage que devem ser limpas
const FEEDBACK_KEYS = [
  'feedback_submissions',
  'feedback_cache',
  'feedback_stats',
  'feedback_validation',
  'user_feedback_status',
  'article_feedback_cache',
  'feedback_metrics'
];

const ARTICLE_KEYS = [
  'articles_cache',
  'article_metrics',
  'article_stats',
  'articles_simple_cache',
  'article_cache_timestamp',
  'cached_articles'
];

const INTERACTION_KEYS = [
  'realtime_interactions',
  'realtime_stats',
  'interaction_cache',
  'comment_cache',
  'like_cache',
  'engagement_metrics'
];

const PERFORMANCE_KEYS = [
  'performance_cache',
  'metrics_cache',
  'cache_timestamps',
  'prefetch_cache',
  'lazy_load_cache'
];

interface ResetOptions {
  feedback?: boolean;
  articles?: boolean;
  interactions?: boolean;
  performance?: boolean;
  all?: boolean;
  force?: boolean;
}

interface ResetResult {
  success: boolean;
  clearedKeys: string[];
  errors: string[];
  previousVersion?: string;
  newVersion: string;
}

/**
 * 🧹 Limpa chaves específicas do localStorage
 */
function clearKeys(keys: string[]): { cleared: string[], errors: string[] } {
  const cleared: string[] = [];
  const errors: string[] = [];

  keys.forEach(key => {
    try {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        cleared.push(key);
        console.log(`✅ [RESET] Removido: ${key}`);
      }
    } catch (error) {
      errors.push(`Erro ao remover ${key}: ${error}`);
      console.error(`❌ [RESET] Erro ao remover ${key}:`, error);
    }
  });

  return { cleared, errors };
}

/**
 * 🔍 Verifica se precisa de reset baseado na versão
 */
export function needsReset(): boolean {
  try {
    const storedVersion = localStorage.getItem(VERSION_KEY);
    
    // Se não tem versão armazenada, precisa de reset
    if (!storedVersion) {
      console.log('🔄 [RESET] Nenhuma versão encontrada, reset necessário');
      return true;
    }

    // Se a versão é diferente da atual, precisa de reset
    if (storedVersion !== CURRENT_VERSION) {
      console.log(`🔄 [RESET] Versão antiga detectada: ${storedVersion} → ${CURRENT_VERSION}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ [RESET] Erro ao verificar versão:', error);
    return true; // Em caso de erro, fazer reset por segurança
  }
}

/**
 * 🚀 Reset completo do localStorage
 */
export function resetLocalStorage(options: ResetOptions = { all: true }): ResetResult {
  console.log('🔄 [RESET] Iniciando reset do localStorage...', options);
  
  const result: ResetResult = {
    success: false,
    clearedKeys: [],
    errors: [],
    previousVersion: localStorage.getItem(VERSION_KEY) || undefined,
    newVersion: CURRENT_VERSION
  };

  try {
    // Se force=true ou all=true, limpar tudo
    if (options.force || options.all) {
      console.log('🧹 [RESET] Limpeza completa do localStorage');
      
      // Salvar dados importantes antes de limpar tudo
      const importantData: Record<string, string | null> = {};
      const preserveKeys = [
        'theme', 
        'user_preferences', 
        'auth_token',
        'aimindset_user',           // 🔥 Preservar dados de autenticação
        'aimindset_supabase_user'   // 🔥 Preservar sessão do Supabase
      ];
      
      preserveKeys.forEach(key => {
        importantData[key] = localStorage.getItem(key);
      });

      // Limpar tudo
      localStorage.clear();
      result.clearedKeys.push('*ALL*');

      // Restaurar dados importantes
      Object.entries(importantData).forEach(([key, value]) => {
        if (value !== null) {
          localStorage.setItem(key, value);
        }
      });
    } else {
      // Limpeza seletiva
      const keysToClean: string[] = [];

      if (options.feedback !== false) {
        keysToClean.push(...FEEDBACK_KEYS);
      }
      if (options.articles !== false) {
        keysToClean.push(...ARTICLE_KEYS);
      }
      if (options.interactions !== false) {
        keysToClean.push(...INTERACTION_KEYS);
      }
      if (options.performance !== false) {
        keysToClean.push(...PERFORMANCE_KEYS);
      }

      const { cleared, errors } = clearKeys(keysToClean);
      result.clearedKeys.push(...cleared);
      result.errors.push(...errors);
    }

    // Definir nova versão
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    
    // Adicionar timestamp do reset
    localStorage.setItem('last_reset', new Date().toISOString());

    result.success = result.errors.length === 0;
    
    console.log(`✅ [RESET] Concluído! Limpas: ${result.clearedKeys.length} chaves`);
    
    return result;

  } catch (error) {
    console.error('❌ [RESET] Erro durante reset:', error);
    result.errors.push(`Erro geral: ${error}`);
    return result;
  }
}

/**
 * 🔄 Reset automático na inicialização
 */
export function autoReset(): Promise<ResetResult | null> {
  return new Promise((resolve) => {
    try {
      if (needsReset()) {
        console.log('🚀 [AUTO-RESET] Executando reset automático...');
        const result = resetLocalStorage({ all: true });
        
        // Notificar usuário sobre o reset
        if (result.success) {
          console.log('✅ [AUTO-RESET] Reset automático concluído com sucesso');
        }
        
        resolve(result);
      } else {
        console.log('✅ [AUTO-RESET] Sistema atualizado, nenhum reset necessário');
        resolve(null);
      }
    } catch (error) {
      console.error('❌ [AUTO-RESET] Erro:', error);
      resolve({
        success: false,
        clearedKeys: [],
        errors: [`Auto-reset falhou: ${error}`],
        newVersion: CURRENT_VERSION
      });
    }
  });
}

/**
 * 🧪 Reset específico para testes de feedback
 */
export function resetForFeedbackTesting(): ResetResult {
  console.log('🧪 [RESET] Reset específico para testes de feedback');
  
  return resetLocalStorage({
    feedback: true,
    interactions: true,
    articles: true, // Limpar cache de artigos também
    performance: false // Manter cache de performance
  });
}

/**
 * 📊 Obter informações sobre o estado do localStorage
 */
export function getLocalStorageInfo(): {
  version: string | null;
  totalKeys: number;
  feedbackKeys: string[];
  articleKeys: string[];
  interactionKeys: string[];
  lastReset: string | null;
  size: number;
} {
  const allKeys = Object.keys(localStorage);
  
  const feedbackKeys = allKeys.filter(key => 
    FEEDBACK_KEYS.some(fKey => key.includes(fKey))
  );
  
  const articleKeys = allKeys.filter(key => 
    ARTICLE_KEYS.some(aKey => key.includes(aKey))
  );
  
  const interactionKeys = allKeys.filter(key => 
    INTERACTION_KEYS.some(iKey => key.includes(iKey))
  );

  // Calcular tamanho aproximado
  let size = 0;
  allKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      size += key.length + value.length;
    }
  });

  return {
    version: localStorage.getItem(VERSION_KEY),
    totalKeys: allKeys.length,
    feedbackKeys,
    articleKeys,
    interactionKeys,
    lastReset: localStorage.getItem('last_reset'),
    size
  };
}

/**
 * 🎯 Função de conveniência para reset rápido via console
 */
if (typeof window !== 'undefined') {
  (window as any).resetAIMindset = resetLocalStorage;
  (window as any).resetFeedback = resetForFeedbackTesting;
  (window as any).checkLocalStorage = getLocalStorageInfo;
}

export default {
  needsReset,
  resetLocalStorage,
  autoReset,
  resetForFeedbackTesting,
  getLocalStorageInfo
};