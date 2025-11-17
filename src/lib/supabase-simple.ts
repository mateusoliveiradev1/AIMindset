import { createClient } from '@supabase/supabase-js';

// Valores hardcoded como fallback absoluto
const EMERGENCY_SUPABASE_URL = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const EMERGENCY_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

// Função simples para obter variáveis com múltiplos fallbacks
function getSupabaseConfig() {
  // Múltiplas fontes de variáveis (ordem de prioridade)
  const sources = [
    // 1. Vite env (desenvolvimento)
    () => typeof import.meta !== 'undefined' && import.meta.env ? {
      url: import.meta.env.VITE_SUPABASE_URL,
      key: import.meta.env.VITE_SUPABASE_ANON_KEY
    } : null,
    
    // 2. Process env (Node.js)
    () => typeof process !== 'undefined' && process.env ? {
      url: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      key: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    } : null,
    
    // 3. Window (global)
    () => typeof window !== 'undefined' ? {
      url: (window as any).VITE_SUPABASE_URL || (window as any).SUPABASE_URL,
      key: (window as any).VITE_SUPABASE_ANON_KEY || (window as any).SUPABASE_ANON_KEY
    } : null,
    
    // 4. Valores hardcoded de emergência
    () => ({
      url: EMERGENCY_SUPABASE_URL,
      key: EMERGENCY_SUPABASE_ANON_KEY
    })
  ];
  
  // Tentar cada fonte até encontrar uma válida
  for (const getSource of sources) {
    const config = getSource();
    if (config?.url && config?.key) {
      console.log('✅ Supabase config carregado de:', sources.indexOf(getSource) + 1);
      return config;
    }
  }
  
  // Se nada funcionar (nunca deve acontecer com os valores hardcoded)
  console.error('❌ CRÍTICO: Nenhuma fonte de configuração Supabase funcionou!');
  return {
    url: EMERGENCY_SUPABASE_URL,
    key: EMERGENCY_SUPABASE_ANON_KEY
  };
}

// Obter configuração
const config = getSupabaseConfig();

console.log('🔍 [SUPABASE-SIMPLE] Configuração carregada:', {
  hasUrl: !!config.url,
  hasKey: !!config.key,
  urlPreview: config.url?.substring(0, 30) + '...',
  keyPreview: config.key?.substring(0, 20) + '...'
});

// Criar cliente com configuração obtida
export const supabase = createClient(config.url, config.key, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-client-info': 'aimindset-app-simple',
      'apikey': config.key
    }
  }
});

// Exportar cliente de serviço (mesma instância para simplificar)
export const supabaseServiceClient = supabase;

// Funções auxiliares
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabaseServiceClient.from('articles').select('count').limit(1);
    return { connected: !error, error };
  } catch (error) {
    return { connected: false, error };
  }
}

export async function getSupabaseStats() {
  try {
    const { data: articlesCount } = await supabaseServiceClient.from('articles').select('id', { count: 'exact' });
    const { data: categoriesCount } = await supabaseServiceClient.from('categories').select('id', { count: 'exact' });
    
    return {
      articles: articlesCount?.length || 0,
      categories: categoriesCount?.length || 0
    };
  } catch (error) {
    console.error('Error getting Supabase stats:', error);
    return { articles: 0, categories: 0 };
  }
}

// Tipos para TypeScript
export type Article = any;
export type Category = any;
export type NewsletterSubscriber = any;
export type NewsletterCampaign = any;
export type NewsletterTemplate = any;

export interface Contact {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status?: 'new' | 'read' | 'replied';
  created_at: string;
}