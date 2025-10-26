import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { 
  Search, 
  X, 
  Filter, 
  Calendar, 
  Tag, 
  Clock, 
  History, 
  Trash2,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { useAdvancedSearch } from '../hooks/useAdvancedSearch';
import { useMobileUsability } from '@/hooks/useMobileUsability';
import Card from './UI/Card';
import Button from './UI/Button';

interface AdvancedSearchProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ 
  isOpen, 
  onClose, 
  initialQuery = '' 
}) => {
  const {
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
    hasActiveFilters
  } = useAdvancedSearch();

  const { isTouchDevice, addTouchFeedback } = useMobileUsability();
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Inicializar com query inicial
  useEffect(() => {
    if (initialQuery && initialQuery !== filters.query) {
      updateFilters({ query: initialQuery });
    }
  }, [initialQuery]);

  // Focar no input quando abrir
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Fechar com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (value: string) => {
    updateFilters({ query: value });
    setShowSuggestions(value.length > 1);
    setShowHistory(value.length === 0 && searchHistory.length > 0);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filters.query.trim()) {
      executeSearch(filters.query);
      setShowSuggestions(false);
      setShowHistory(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    updateFilters({ query: suggestion });
    executeSearch(suggestion);
    setShowSuggestions(false);
  };

  const handleHistoryClick = (query: string) => {
    updateFilters({ query });
    executeSearch(query);
    setShowHistory(false);
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-lime-green/30 text-lime-green px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  // Impedir scroll do body quando modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      // Salvar o valor atual do scroll antes de bloquear
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // Restaurar o scroll quando fechar o modal
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    return () => {
      // Cleanup para garantir que o body volte ao normal
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed bg-black/90 backdrop-blur-sm overflow-hidden"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '1rem',
        paddingTop: '5rem'
      }}
    >
      <div 
        ref={searchContainerRef}
        className="w-full max-w-4xl bg-darker-surface/95 backdrop-blur-md rounded-2xl border border-neon-purple/30 shadow-2xl"
        style={{ zIndex: 9999999 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neon-purple/20">
          <h2 className="text-2xl font-orbitron font-bold text-white">
            Busca <span className="gradient-text">Avançada</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-futuristic-gray hover:text-lime-green transition-colors duration-300 hover-lift"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b border-neon-purple/20">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="relative mobile-form-field">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-futuristic-gray w-5 h-5" />
              <input
                ref={searchInputRef}
                type="search"
                value={filters.query}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Digite sua busca..."
                autoComplete="search"
                className="w-full pl-12 pr-4 py-4 bg-dark-surface/50 border border-neon-purple/30 rounded-xl text-white placeholder-futuristic-gray focus:outline-none focus:border-lime-green transition-all duration-300 text-lg prevent-zoom touch-target"
              />
              {isSearching && (
                <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 text-lime-green w-5 h-5 animate-spin" />
              )}
            </div>

            {/* Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div 
                className="absolute top-full left-0 right-0 mt-2 bg-darker-surface border border-neon-purple/30 rounded-lg shadow-xl"
                style={{ zIndex: 9999998 }}
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-3 text-white hover:bg-neon-purple/10 transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
                  >
                    <Search className="inline w-4 h-4 mr-2 text-futuristic-gray" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* History */}
            {showHistory && searchHistory.length > 0 && (
              <div 
                className="absolute top-full left-0 right-0 mt-2 bg-darker-surface border border-neon-purple/30 rounded-lg shadow-xl"
                style={{ zIndex: 9999998 }}
              >
                <div className="flex items-center justify-between px-4 py-2 border-b border-neon-purple/20">
                  <span className="text-sm text-futuristic-gray font-medium">Buscas recentes</span>
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="text-futuristic-gray hover:text-red-400 transition-colors duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {searchHistory.slice(0, 5).map((query, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleHistoryClick(query)}
                    className="w-full text-left px-4 py-3 text-white hover:bg-neon-purple/10 transition-colors duration-200 last:rounded-b-lg"
                  >
                    <History className="inline w-4 h-4 mr-2 text-futuristic-gray" />
                    {query}
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between mt-4">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 text-futuristic-gray hover:text-lime-green transition-colors duration-300 touch-target touch-feedback"
            >
              <Filter className="w-4 h-4" />
              <span>Filtros avançados</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="text-futuristic-gray hover:text-red-400"
              >
                Limpar filtros
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-dark-surface/30 rounded-lg border border-neon-purple/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div className="mobile-form-field">
                  <label className="block text-sm font-medium text-futuristic-gray mb-2">
                    Categoria
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => updateFilters({ category: e.target.value })}
                    className="w-full px-3 py-2 bg-darker-surface border border-neon-purple/30 rounded-lg text-white focus:outline-none focus:border-lime-green transition-colors prevent-zoom touch-target"
                  >
                    <option value="all">Todas as categorias</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range Filter */}
                <div className="mobile-form-field">
                  <label className="block text-sm font-medium text-futuristic-gray mb-2">
                    Período
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => updateFilters({ dateRange: e.target.value as any })}
                    className="w-full px-3 py-2 bg-darker-surface border border-neon-purple/30 rounded-lg text-white focus:outline-none focus:border-lime-green transition-colors prevent-zoom touch-target"
                  >
                    <option value="all">Todos os períodos</option>
                    <option value="week">Última semana</option>
                    <option value="month">Último mês</option>
                    <option value="year">Último ano</option>
                  </select>
                </div>

                {/* Results Count */}
                <div className="flex items-end">
                  <div className="text-sm text-futuristic-gray">
                    <span className="font-medium text-lime-green">
                      {searchResults.length}
                    </span> resultado{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-lime-green animate-spin" />
              <span className="ml-3 text-futuristic-gray">Buscando...</span>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="p-6 space-y-4">
              {searchResults.map(({ article, relevanceScore, matchedFields }) => (
                <Card key={article.id} className="glass-effect hover-lift">
                  <Link 
                    to={`/artigo/${article.slug}`}
                    onClick={onClose}
                    className="block p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white group-hover:text-lime-green transition-colors">
                        {highlightText(article.title, filters.query)}
                      </h3>
                      {relevanceScore > 0 && (
                        <div className="flex items-center space-x-1 text-xs text-futuristic-gray">
                          <span>Relevância: {relevanceScore}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-futuristic-gray text-sm mb-3 line-clamp-2">
                      {highlightText(
                        article.excerpt || article.content.substring(0, 150) + '...',
                        filters.query
                      )}
                    </p>

                    <div className="flex items-center justify-between text-xs text-futuristic-gray">
                      <div className="flex items-center space-x-4">
                        <span className="px-2 py-1 bg-neon-purple/20 text-neon-purple rounded-full">
                          {typeof article.category === 'string' 
                            ? categories.find(cat => cat.slug === article.category)?.name || article.category
                            : (typeof article.category === 'object' && article.category?.name) || 'Sem categoria'}
                        </span>
                        
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(article.created_at).toLocaleDateString('pt-BR')}
                        </div>

                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {article.reading_time || 5} min
                        </div>
                      </div>

                      {matchedFields.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Tag className="w-3 h-3" />
                          <span>Encontrado em: {matchedFields.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          ) : filters.query ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-orbitron font-bold text-white mb-2">
                Nenhum resultado encontrado
              </h3>
              <p className="text-futuristic-gray mb-4">
                Tente ajustar os termos de busca ou filtros.
              </p>
              <Button
                variant="ghost"
                onClick={clearSearch}
                className="text-lime-green hover:text-lime-green/80"
              >
                Limpar busca
              </Button>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-xl font-orbitron font-bold text-white mb-2">
                Busca Avançada
              </h3>
              <p className="text-futuristic-gray">
                Digite algo para começar a buscar por artigos.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AdvancedSearch;