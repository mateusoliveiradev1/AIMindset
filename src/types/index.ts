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
  id: string;
  title: string;
  content: string;
  excerpt: string;
  image_url: string;
  slug: string;
  published: boolean;
  category_id: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  // meta_title removido - coluna não existe na tabela
  // meta_description removido - coluna não existe na tabela
  category?: Category;
  tags?: string[] | string | null;
  reading_time?: string | number; // Adicionado para compatibilidade com componentes
  read_time?: number | string;
  // views removido - coluna não existe na tabela
  
  // Propriedades adicionais para compatibilidade com componentes existentes
  imageUrl?: string; // Alias para image_url
  publishedAt?: string; // Alias para created_at
  updatedAt?: string; // Alias para updated_at
  readTime?: number; // Alias para read_time
  views?: number; // Para componentes que usam views
  likes?: number; // Para componentes que usam likes
  featured?: boolean; // Para componentes que usam featured
  author?: string; // Para componentes que usam author como string
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