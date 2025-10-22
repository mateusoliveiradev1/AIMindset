export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string; // Adicionado campo excerpt
  meta_description?: string;
  featured_image?: string;
  published: boolean;
  category_id: string;
  category?: Category | string; // Pode ser objeto Category ou string
  tags?: Tag[] | string[] | string; // Pode ser array de objetos Tag, strings ou string simples
  reading_time?: number;
  read_time?: number; // Alias para compatibilidade
  created_at: string;
  updated_at: string;
  author_id?: string;
  views?: number;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  status: 'active' | 'inactive' | 'unsubscribed';
  subscribed_at: string;
  created_at: string;
  active: boolean;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}