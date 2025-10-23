import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5d2pxemhxeW5obmhldGlkenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkyOTEzNCwiZXhwIjoyMDc2NTA1MTM0fQ.04Y2US3KKeveKGi_8PvhqxS1EKiAB4xNjuFZTP1VLOQ';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Singleton instances para evitar múltiplas instâncias GoTrueClient
let supabaseInstance: any = null;
let supabaseServiceInstance: any = null;

// Singleton instance for regular client
export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'supabase.auth.token'
      },
      global: {
        headers: {
          'x-client-info': 'supabase-main'
        }
      }
    });
  }
  return supabaseInstance;
})();

// Singleton instance for service role client com configurações otimizadas para payloads grandes
export const supabaseServiceClient = (() => {
  if (!supabaseServiceInstance) {
    supabaseServiceInstance = createClient(supabaseUrl, supabaseServiceKey, {
      db: {
        schema: 'public'
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        storage: undefined // Evita conflitos de storage
      },
      global: {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-client-info': 'supabase-service'
        }
      },
      // Configurações para realtime
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  }
  return supabaseServiceInstance;
})();

export interface Contact {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  created_at: string;
}

export interface Article {
  id: number;
  title: string;
  slug: string; // Obrigatório para compatibilidade
  excerpt?: string;
  meta_description?: string;
  content: string;
  image_url?: string;
  featured_image?: string;
  category_id: string;
  category?: Category | string;
  categories?: Category;
  tags?: Tag[] | string[] | string;
  reading_time?: number;
  read_time?: number;
  author_id?: string;
  published: boolean;
  views?: number;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  status: 'active' | 'inactive' | 'unsubscribed';
  subscribed_at: string;
  created_at: string;
  unsubscribed_at?: string;
}

export interface NewsletterLog {
  id: string;
  subject: string;
  content: string;
  recipients_count: number;
  sent_at: string;
  status: 'sent' | 'failed';
  error_message?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

// Database helper functions
export const getArticles = async () => {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const getCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data;
};