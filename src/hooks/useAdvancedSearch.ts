import { useState, useEffect, useMemo } from 'react';
import { useArticles } from './useArticles';
import { Article } from '../types';

interface SearchFilters {
  query: string;
  category: string;
  tags: string[];
  dateRange: 'all' | 'week' | 'month' | 'year';
}

interface SearchResult {
  article: Article;
  relevanceScore: number;
  matchedFields: string[];
}

export const useAdvancedSearch = () => {
  const { articles, categories } = useArticles();
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: 'all',
    tags: [],
    dateRange: 'all'
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Carregar histórico do localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('aimindset-search-history');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Salvar no histórico
  const addToHistory = (query: string) => {
    if (!query.trim() || searchHistory.includes(query)) return;
    
    const newHistory = [query, ...searchHistory.slice(0, 9)]; // Manter apenas 10 itens
    setSearchHistory(newHistory);
    localStorage.setItem('aimindset-search-history', JSON.stringify(newHistory));
  };

  // Limpar histórico
  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('aimindset-search-history');
  };

  // Função para calcular relevância
  const calculateRelevance = (article: Article, query: string): { score: number; fields: string[] } => {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    let score = 0;
    const matchedFields: string[] = [];

    searchTerms.forEach(term => {
      // Título (peso 3)
      if (article.title.toLowerCase().includes(term)) {
        score += 3;
        if (!matchedFields.includes('title')) matchedFields.push('title');
      }

      // Conteúdo (peso 1)
      if (article.content.toLowerCase().includes(term)) {
        score += 1;
        if (!matchedFields.includes('content')) matchedFields.push('content');
      }

      // Tags (peso 2)
      if (article.tags) {
        let tagsArray: string[] = [];
        if (typeof article.tags === 'string') {
          tagsArray = article.tags.split(',').map(tag => tag.trim());
        } else if (Array.isArray(article.tags)) {
          tagsArray = article.tags.map(tag => 
            typeof tag === 'string' ? tag : tag.name || tag.slug || ''
          );
        }
        
        if (tagsArray.some(tag => tag.toLowerCase().includes(term))) {
          score += 2;
          if (!matchedFields.includes('tags')) matchedFields.push('tags');
        }
      }

      // Resumo (peso 2)
      if (article.excerpt && article.excerpt.toLowerCase().includes(term)) {
        score += 2;
        if (!matchedFields.includes('excerpt')) matchedFields.push('excerpt');
      }
    });

    return { score, fields: matchedFields };
  };

  // Filtrar por data
  const filterByDate = (article: Article, dateRange: string): boolean => {
    if (dateRange === 'all') return true;

    const articleDate = new Date(article.created_at);
    const now = new Date();
    const diffTime = now.getTime() - articleDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (dateRange) {
      case 'week':
        return diffDays <= 7;
      case 'month':
        return diffDays <= 30;
      case 'year':
        return diffDays <= 365;
      default:
        return true;
    }
  };

  // Resultados da busca
  const searchResults = useMemo(() => {
    setIsSearching(true);
    
    let filteredArticles = articles.filter(article => {
      // Filtrar apenas artigos publicados (não excluídos)
      if (!article.published) return false;

      // Filtro por categoria
      if (filters.category !== 'all') {
        const articleCategory = typeof article.category === 'string' 
          ? article.category 
          : article.category?.slug;
        if (articleCategory !== filters.category) return false;
      }

      // Filtro por tags
      if (filters.tags.length > 0) {
        if (!article.tags) return false;
        
        let tagsArray: string[] = [];
        if (typeof article.tags === 'string') {
          tagsArray = article.tags.split(',').map(tag => tag.trim());
        } else if (Array.isArray(article.tags)) {
          tagsArray = article.tags.map(tag => 
            typeof tag === 'string' ? tag : tag.name || tag.slug || ''
          );
        }
        
        if (!filters.tags.some(tag => 
          tagsArray.some(articleTag => 
            articleTag.toLowerCase().includes(tag.toLowerCase())
          )
        )) return false;
      }

      // Filtro por data
      if (!filterByDate(article, filters.dateRange)) return false;

      return true;
    });

    // Se há query de busca, calcular relevância
    if (filters.query.trim()) {
      const results: SearchResult[] = filteredArticles
        .map(article => {
          const { score, fields } = calculateRelevance(article, filters.query);
          return {
            article,
            relevanceScore: score,
            matchedFields: fields
          };
        })
        .filter(result => result.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore);

      setTimeout(() => setIsSearching(false), 300);
      return results;
    }

    // Se não há query, retornar todos os artigos filtrados
    const results: SearchResult[] = filteredArticles.map(article => ({
      article,
      relevanceScore: 0,
      matchedFields: []
    }));

    setTimeout(() => setIsSearching(false), 300);
    return results;
  }, [articles, filters]);

  // Sugestões baseadas no que o usuário está digitando
  const suggestions = useMemo(() => {
    if (!filters.query.trim() || filters.query.length < 2) return [];

    const query = filters.query.toLowerCase();
    const suggestions = new Set<string>();

    // Sugestões de títulos
    articles.forEach(article => {
      const words = article.title.toLowerCase().split(' ');
      words.forEach(word => {
        if (word.includes(query) && word.length > 2) {
          suggestions.add(word);
        }
      });
    });

    // Sugestões de tags
    articles.forEach(article => {
      if (article.tags) {
        // Verificar se tags é um array
        if (Array.isArray(article.tags)) {
          article.tags.forEach(tag => {
            const tagName = typeof tag === 'string' ? tag : tag.name;
            if (tagName.toLowerCase().includes(query)) {
              suggestions.add(tagName);
            }
          });
        } else if (typeof article.tags === 'string') {
          // Se tags é uma string, dividir por vírgula
          const tagArray = article.tags.split(',').map(t => t.trim());
          tagArray.forEach(tag => {
            if (tag.toLowerCase().includes(query)) {
              suggestions.add(tag);
            }
          });
        }
      }
    });

    return Array.from(suggestions).slice(0, 5);
  }, [articles, filters.query]);

  // Atualizar filtros
  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Executar busca
  const executeSearch = (query: string) => {
    updateFilters({ query });
    if (query.trim()) {
      addToHistory(query.trim());
    }
  };

  // Limpar busca
  const clearSearch = () => {
    setFilters({
      query: '',
      category: 'all',
      tags: [],
      dateRange: 'all'
    });
  };

  return {
    filters,
    updateFilters,
    executeSearch,
    clearSearch,
    searchResults,
    suggestions,
    isSearching,
    searchHistory,
    clearHistory,
    categories,
    hasActiveFilters: filters.query || filters.category !== 'all' || filters.tags.length > 0 || filters.dateRange !== 'all'
  };
};