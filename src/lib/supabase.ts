import { createClient } from '@supabase/supabase-js';

// Suporte a variáveis de ambiente tanto VITE_* quanto NEXT_PUBLIC_* para produção na Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug das variáveis de ambiente - LOGS EXTREMOS PARA PREVIEW
console.log('🔍 [SUPABASE-INIT] Environment Variables Check:', {
  url: supabaseUrl ? 'SET' : 'NOT SET',
  key: supabaseAnonKey ? 'SET' : 'NOT SET',
  fullUrl: supabaseUrl,
  keyPrefix: supabaseAnonKey?.substring(0, 20) + '...',
  isPreview: typeof window !== 'undefined' && (window.location.href.includes('trae') || window.location.href.includes('preview')),
  currentUrl: typeof window !== 'undefined' ? window.location.href : 'server'
});

// Fallback para valores hardcoded em caso de emergência
const EMERGENCY_SUPABASE_URL = 'https://jywjqzhqynhnhetidzsa.supabase.co';
const EMERGENCY_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MjkxMzQsImV4cCI6MjA3NjUwNTEzNH0.oTZ6B-77NGBSqa_lN2YWCtnKwKc0glWnwfuN9xQjDl0';

const finalUrl = supabaseUrl || EMERGENCY_SUPABASE_URL;
const finalKey = supabaseAnonKey || EMERGENCY_SUPABASE_ANON_KEY;

console.log('🚨 [SUPABASE-INIT] EMERGENCY MODE:', supabaseUrl ? 'Using ENV vars' : 'Using hardcoded values');
console.log('🔑 [SUPABASE-INIT] Final URL:', finalUrl);
console.log('🔑 [SUPABASE-INIT] Final Key prefix:', finalKey?.substring(0, 30) + '...');

if (!finalUrl || !finalKey) {
  console.error('❌ [SUPABASE-INIT] CRITICAL ERROR: Missing Supabase environment variables');
  throw new Error('Missing Supabase environment variables');
}

// Global singleton para evitar múltiplas instâncias
declare global {
  var __supabase_singleton__: any;
}

let supabaseInstance: any = null;

// Criar cliente Supabase com configuração correta de headers usando singleton
export const supabase = (() => {
  // Retornar instância existente se já foi criada
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Verificar se já existe uma instância global
  if (typeof window !== 'undefined' && (window as any).__supabase_singleton__) {
    supabaseInstance = (window as any).__supabase_singleton__;
    return supabaseInstance;
  }

  if (typeof global !== 'undefined' && (global as any).__supabase_singleton__) {
    supabaseInstance = (global as any).__supabase_singleton__;
    return supabaseInstance;
  }

  // Criar nova instância apenas se não existir
  supabaseInstance = createClient(finalUrl, finalKey, {
    auth: {
      // 🔧 USAR SESSIONSTORAGE COMO FALLBACK PARA EVITAR QUOTA EXCEEDED
      storage: (() => {
        if (typeof window === 'undefined') return undefined;
        
        // Tentar usar localStorage primeiro, mas com fallback para sessionStorage
        try {
          // Testar se localStorage está disponível e não cheio
          window.localStorage.setItem('test-quota-check', 'test');
          window.localStorage.removeItem('test-quota-check');
          return window.localStorage;
        } catch (error) {
          console.warn('⚠️ localStorage não disponível, usando sessionStorage:', error);
          return window.sessionStorage;
        }
      })(),
      storageKey: 'aimindset.auth.token', // Chave única para evitar conflitos
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'x-client-info': 'aimindset-app',
        'apikey': finalKey
        // Authorization deve ser o token de usuário, não a API key.
        // Supabase JS já injeta Authorization quando há sessão.
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });

  // Armazenar a instância globalmente
  if (typeof window !== 'undefined') {
    (window as any).__supabase_singleton__ = supabaseInstance;
    // Expor também como window.supabase para facilitar testes
    (window as any).supabase = supabaseInstance;
  } else if (typeof global !== 'undefined') {
    (global as any).__supabase_singleton__ = supabaseInstance;
  }

  return supabaseInstance;
})();

// Cliente de serviço usando a mesma instância principal
export const supabaseServiceClient = supabase;

// Função para verificar conectividade
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabaseServiceClient.from('articles').select('count').limit(1);
    return { connected: !error, error };
  } catch (error) {
    return { connected: false, error };
  }
}

// Função para obter estatísticas do Supabase
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

// Exportar tipos para compatibilidade com propriedades adicionais
export type Article = Database['public']['Tables']['articles']['Row'] & {
  category?: Category | { name: string } | string;
  tags: string[] | string | null; // Permitir string ou array - obrigatório para compatibilidade
  reading_time?: number | string; // Propriedade para tempo de leitura
  positive_feedback?: number;
  negative_feedback?: number;
  total_comments?: number;
  approval_rate?: number;
};
export type Category = Database['public']['Tables']['categories']['Row'];
export type NewsletterSubscriber = Database['public']['Tables']['newsletter_subscribers']['Row'];
export type NewsletterCampaign = Database['public']['Tables']['newsletter_campaigns']['Row'];
export type NewsletterTemplate = Database['public']['Tables']['newsletter_templates']['Row'];

// Tipo Contact (se necessário)
export interface Contact {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

// Tipos para TypeScript
export type Database = {
  public: {
    Tables: {
      articles: {
        Row: {
          id: string;
          title: string;
          content: string;
          excerpt: string;
          image_url: string | null;
          slug: string;
          published: boolean;
          is_featured_manual?: boolean | null;
          category_id: string;
          author_id: string;
          created_at: string;
          updated_at: string;
          // views removido - coluna não existe na tabela
          // reading_time removido - coluna não existe na tabela
          tags: string[] | string | null;
          // meta_title removido - coluna não existe na tabela
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          excerpt: string;
          image_url?: string | null;
          slug: string;
          published?: boolean;
          is_featured_manual?: boolean | null;
          category_id: string;
          author_id: string;
          created_at?: string;
          updated_at?: string;
          // views removido - coluna não existe na tabela
          // reading_time removido - coluna não existe na tabela
          tags?: string[] | string | null;
          // meta_title removido - coluna não existe na tabela
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          excerpt?: string;
          image_url?: string | null;
          slug?: string;
          published?: boolean;
          is_featured_manual?: boolean | null;
          category_id?: string;
          author_id?: string;
          created_at?: string;
          updated_at?: string;
          // views removido - coluna não existe na tabela
          // reading_time removido - coluna não existe na tabela
          tags?: string[] | string | null;
          // meta_title removido - coluna não existe na tabela
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      newsletter_campaigns: {
        Row: {
          id: string;
          name: string;
          subject: string;
          content: string;
          template_id: string | null;
          status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
          scheduled_at: string | null;
          sent_at: string | null;
          created_at: string;
          updated_at: string;
          total_subscribers: number;
          sent_count: number;
          open_count: number;
          click_count: number;
        };
        Insert: {
          id?: string;
          name: string;
          subject: string;
          content: string;
          template_id?: string | null;
          status?: 'draft' | 'scheduled' | 'sent' | 'cancelled';
          scheduled_at?: string | null;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
          total_subscribers?: number;
          sent_count?: number;
          open_count?: number;
          click_count?: number;
        };
        Update: {
          id?: string;
          name?: string;
          subject?: string;
          content?: string;
          template_id?: string | null;
          status?: 'draft' | 'scheduled' | 'sent' | 'cancelled';
          scheduled_at?: string | null;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
          total_subscribers?: number;
          sent_count?: number;
          open_count?: number;
          click_count?: number;
        };
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          status: 'active' | 'unsubscribed' | 'bounced';
          subscribed_at: string;
          unsubscribed_at: string | null;
          preferences: any | null;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          status?: 'active' | 'unsubscribed' | 'bounced';
          subscribed_at?: string;
          unsubscribed_at?: string | null;
          preferences?: any | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          status?: 'active' | 'unsubscribed' | 'bounced';
          subscribed_at?: string;
          unsubscribed_at?: string | null;
          preferences?: any | null;
        };
      };
      newsletter_templates: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          html_content: string;
          variables: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          html_content: string;
          variables?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          html_content?: string;
          variables?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};