import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Global singleton instance para evitar múltiplas instâncias GoTrueClient
declare global {
  var __supabase_singleton__: any;
}

// Singleton instance - uma única instância para toda a aplicação
export const supabase = (() => {
  // Verificar se já existe uma instância global
  if (typeof window !== 'undefined') {
    if (window.__supabase_singleton__) {
      return window.__supabase_singleton__;
    }
  } else if (global.__supabase_singleton__) {
    return global.__supabase_singleton__;
  }

  // Criar nova instância apenas se não existir
  const instance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'supabase.auth.token',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'x-client-info': 'aimindset-app'
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
    window.__supabase_singleton__ = instance;
  } else {
    global.__supabase_singleton__ = instance;
  }
  
  return instance;
})();

// Função para verificar conectividade
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('articles').select('count').limit(1);
    return { connected: !error, error };
  } catch (error) {
    return { connected: false, error };
  }
}

// Função para obter estatísticas do Supabase
export async function getSupabaseStats() {
  try {
    const { data: articlesCount } = await supabase.from('articles').select('id', { count: 'exact' });
    const { data: categoriesCount } = await supabase.from('categories').select('id', { count: 'exact' });
    
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
  image_url?: string; // Alias para featured_image
  category?: Category | { name: string } | string;
  tags?: string[] | string | null; // Permitir string ou array
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

// Criar cliente de serviço usando a mesma instância principal
export const supabaseServiceClient = supabase;

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
          featured_image: string | null;
          slug: string;
          published: boolean;
          category_id: string;
          author_id: string;
          created_at: string;
          updated_at: string;
          views: number | null;
          reading_time: number | null;
          tags: string[] | null;
          meta_title: string | null;
          meta_description: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          excerpt: string;
          featured_image?: string | null;
          slug: string;
          published?: boolean;
          category_id: string;
          author_id: string;
          created_at?: string;
          updated_at?: string;
          views?: number;
          reading_time?: number;
          tags?: string[] | null;
          meta_title?: string | null;
          meta_description?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          excerpt?: string;
          featured_image?: string | null;
          slug?: string;
          published?: boolean;
          category_id?: string;
          author_id?: string;
          created_at?: string;
          updated_at?: string;
          views?: number;
          reading_time?: number;
          tags?: string[] | null;
          meta_title?: string | null;
          meta_description?: string | null;
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