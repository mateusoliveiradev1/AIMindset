import type { Article, Category } from '../lib/supabase';

export const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Inteligência Artificial',
    slug: 'inteligencia-artificial',
    description: 'Artigos sobre IA, machine learning e deep learning',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Tecnologia',
    slug: 'tecnologia',
    description: 'Novidades e tendências em tecnologia',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Futuro',
    slug: 'futuro',
    description: 'Visões sobre o futuro da tecnologia',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    name: 'Machine Learning',
    slug: 'machine-learning',
    description: 'Artigos sobre aprendizado de máquina e algoritmos',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '5',
    name: 'Deep Learning',
    slug: 'deep-learning',
    description: 'Redes neurais e aprendizado profundo',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '6',
    name: 'Automação',
    slug: 'automacao',
    description: 'Automação de processos e robótica',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '7',
    name: 'Inovação',
    slug: 'inovacao',
    description: 'Inovações tecnológicas e startups',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '8',
    name: 'Negócios',
    slug: 'negocios',
    description: 'Aplicações de IA nos negócios',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

// RESET COMPLETO: 0 artigos - todas funcionalidades mantidas
export const mockArticles: Article[] = [];

export const mockAuthors = [
  {
    id: '1',
    name: 'AIMindset Team',
    bio: 'Equipe especializada em Inteligência Artificial e Tecnologia',
    avatar: '/favicon.svg',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const mockComments = [];

export const mockFeedback = [];