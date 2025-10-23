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
  featured_image: string;
  slug: string;
  published: boolean;
  category_id: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  meta_title?: string;
  meta_description: string;
  image_url?: string; // Alias para featured_image
  category?: Category;
  tags?: string[] | string | null;
  reading_time?: number;
  read_time?: number;
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