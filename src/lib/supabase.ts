import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  id: string;
  title: string;
  slug?: string;
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