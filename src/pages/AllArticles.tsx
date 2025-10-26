import React, { useState, useMemo, useCallback, memo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Calendar, Clock, Tag, Grid, List, TrendingUp } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { useArticles } from '../hooks/useArticles';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '../components/UI/PullToRefreshIndicator';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { InfiniteScrollLoader } from '../components/UI/InfiniteScrollLoader';
import { VirtualizedArticleList } from '../components/Performance/VirtualizedArticleList';
import { usePerformanceOptimization } from '../hooks/usePerformanceOptimization';

const AllArticles: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'category'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [enableVirtualization, setEnableVirtualization] = useState(true);

  // Performance optimization hook
  const {
    createDebouncedSearch,
    filterArticles,
    sortArticles,
    startRenderMeasurement,
    endRenderMeasurement,
    metrics,
    cacheStats
  } = usePerformanceOptimization({
    enableCache: true,
    enableLazyLoading: true,
    enableMemoryManagement: true,
    enablePerformanceMonitoring: true
  });

  const { 
    articles, 
    categories, 
    loading, 
    error, 
    hasMore, 
    loadMore,
    refresh 
  } = useArticles();

  // Pull to refresh
  const pullToRefreshProps = usePullToRefresh({
    onRefresh: refresh,
    threshold: 100
  });

  // Infinite scroll
  const { loadMoreRef } = useInfiniteScroll({
    hasMore,
    isLoading: loading,
    onLoadMore: loadMore,
    threshold: 0.8
  });// Debounced search handler
  const debouncedSearch = useMemo(
    () => createDebouncedSearch((query: string) => {
      setSearchQuery(query);
      setSearchParams(prev => {
        if (query) {
          prev.set('search', query);
        } else {
          prev.delete('search');
        }
        return prev;
      });
    }),
    [createDebouncedSearch, setSearchParams]
  );

  // Filtered and sorted articles with performance optimization
  const processedArticles = useMemo(() => {
    startRenderMeasurement();
    
    let filtered = articles;
    
    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filterArticles(filtered as any, searchQuery) as any;
    }
    
    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(article => {
        if (typeof article.category === 'string') {
          return article.category === selectedCategory;
        }
        if (article.category && typeof article.category === 'object' && 'id' in article.category) {
          return article.category.id === selectedCategory;
        }
        return false;
      });
    }
    
    // Sort articles (cast to compatible type)
    const sorted = sortArticles(filtered as any, sortBy);
    
    endRenderMeasurement();
    return sorted;
  }, [articles, searchQuery, selectedCategory, sortBy, filterArticles, sortArticles, startRenderMeasurement, endRenderMeasurement]);

  // Handle search input
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  }, [debouncedSearch]);

  // Handle category filter
  const handleCategoryChange = useCallback((categoryId: string) => {
    const newCategory = categoryId === selectedCategory ? '' : categoryId;
    setSelectedCategory(newCategory);
    setSearchParams(prev => {
      if (newCategory) {
        prev.set('category', newCategory);
      } else {
        prev.delete('category');
      }
      return prev;
    });
  }, [selectedCategory, setSearchParams]);

  // Memoized utility functions
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }, []);

  const calculateReadTime = useCallback((content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    return Math.ceil(wordCount / wordsPerMinute);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-orbitron font-bold text-white mb-4">Erro ao carregar artigos</h2>
          <p className="text-futuristic-gray mb-6">{error}</p>
          <Button onClick={refresh} className="bg-lime-green hover:bg-lime-green/80 text-dark-bg">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg">
      <PullToRefreshIndicator {...pullToRefreshProps} isRefreshing={pullToRefreshProps.isRefreshing} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-white mb-4">
            Todos os <span className="text-lime-green">Artigos</span>
          </h1>
          <p className="text-xl text-futuristic-gray max-w-3xl mx-auto">
            Explore nossa coleção completa de artigos sobre inteligência artificial, tecnologia e inovação
          </p>
        </div>

        {/* Advanced Search and Filter Controls */}
        <div className="glass-effect p-6 rounded-xl mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-futuristic-gray w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar artigos..."
                defaultValue={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-3 bg-dark-surface/50 border border-neon-purple/30 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-lime-green focus:ring-1 focus:ring-lime-green transition-colors"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategoryChange('')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !selectedCategory
                    ? 'bg-lime-green text-dark-bg'
                    : 'bg-dark-surface/50 text-futuristic-gray hover:text-white border border-neon-purple/30'
                }`}
              >
                Todas
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-neon-purple text-white'
                      : 'bg-dark-surface/50 text-futuristic-gray hover:text-white border border-neon-purple/30'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              {/* Sort Options */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'category')}
                className="bg-dark-surface/50 border border-neon-purple/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lime-green"
              >
                <option value="date">Data</option>
                <option value="title">Título</option>
                <option value="category">Categoria</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-dark-surface/50 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-lime-green text-dark-bg' : 'text-futuristic-gray hover:text-white'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-lime-green text-dark-bg' : 'text-futuristic-gray hover:text-white'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Virtualization Toggle */}
              <label className="flex items-center gap-2 text-sm text-futuristic-gray">
                <input
                  type="checkbox"
                  checked={enableVirtualization}
                  onChange={(e) => setEnableVirtualization(e.target.checked)}
                  className="rounded"
                />
                Virtualização
              </label>
            </div>
          </div>

          {/* Performance Metrics (Development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-dark-surface/30 rounded-lg">
              <div className="flex items-center gap-4 text-xs text-futuristic-gray">
                <span>Performance: {metrics.grade}</span>
                <span>Render: {metrics.renderTime.toFixed(1)}ms</span>
                <span>Cache: {metrics.cacheHitRate.toFixed(1)}%</span>
                <span>Artigos: {processedArticles.length}</span>
                {cacheStats && (
                  <>
                    <span>Cache Size: {cacheStats.size}</span>
                    <span>Memory: {(cacheStats.memoryUsage / 1024).toFixed(1)}KB</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Results Count and Stats */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <p className="text-futuristic-gray">
              {processedArticles.length} {processedArticles.length === 1 ? 'artigo encontrado' : 'artigos encontrados'}
            </p>
            {enableVirtualization && processedArticles.length > 50 && (
              <span className="px-2 py-1 bg-lime-green/20 text-lime-green rounded text-xs font-medium">
                Virtualização Ativa
              </span>
            )}
          </div>
          
          {searchQuery && (
            <p className="text-sm text-lime-green">
              Resultados para: "{searchQuery}"
            </p>
          )}
        </div>

        {/* Articles */}
        {loading && processedArticles.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-green"></div>
          </div>
        ) : processedArticles.length === 0 ? (
          <div className="text-center py-12">
            <div className="glass-effect p-8 rounded-xl max-w-md mx-auto">
              <Search className="w-16 h-16 text-futuristic-gray mx-auto mb-4" />
              <h3 className="text-xl font-orbitron font-bold text-white mb-2">
                Nenhum artigo encontrado
              </h3>
              <p className="text-futuristic-gray">
                Tente ajustar os filtros ou termos de busca.
              </p>
            </div>
          </div>
        ) : enableVirtualization && processedArticles.length > 50 ? (
          // Use virtualization for large lists
          <VirtualizedArticleList
            articles={processedArticles}
            categories={categories}
            containerHeight={800}
          />
        ) : (
          // Regular grid/list for smaller lists
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
            : "space-y-6 mb-8"
          }>
            {processedArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                categories={categories}
                formatDate={formatDate}
                calculateReadTime={calculateReadTime}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}

        {/* Load More */}
         {hasMore && !enableVirtualization && (
           <div ref={loadMoreRef}>
             <InfiniteScrollLoader isLoading={loading} hasMore={hasMore} />
           </div>
         )}
      </div>
    </div>
  );
};

export default AllArticles;

// Componente de artigo otimizado com memo
const ArticleCard = memo<{
  article: any;
  categories: any[];
  formatDate: (date: string) => string;
  calculateReadTime: (content: string) => number;
  viewMode: 'grid' | 'list';
}>(({ article, categories, formatDate, calculateReadTime, viewMode }) => {
  if (viewMode === 'list') {
    return (
      <Card className="glass-effect hover-lift group">
        <div className="p-6 flex gap-6">
          {/* Imagem */}
          {article.image_url && (
            <Link 
              to={`/artigo/${article.slug}`} 
              className="block relative w-48 h-32 flex-shrink-0 overflow-hidden rounded-lg cursor-pointer"
            >
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
            </Link>
          )}

          {/* Conteúdo */}
          <div className="flex-1 space-y-3">
            {/* Categoria e tempo */}
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-neon-purple/20 text-neon-purple rounded-full text-xs font-medium">
                {(() => {
                  if (typeof article.category === 'string') {
                    return article.category;
                  }
                  if (article.category?.name) {
                    return article.category.name;
                  }
                  const category = categories.find(cat => cat.id === article.category_id);
                  return category?.name || 'Sem categoria';
                })()}
              </span>
              <div className="flex items-center text-futuristic-gray text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {calculateReadTime(article.content)} min
              </div>
            </div>

            <Link to={`/artigo/${article.slug}`} className="group">
              <h3 className="text-xl font-orbitron font-bold text-white group-hover:text-lime-green transition-colors duration-300 line-clamp-2">
                {article.title}
              </h3>
            </Link>

            {article.excerpt && (
              <p className="text-futuristic-gray text-sm line-clamp-2">
                {article.excerpt}
              </p>
            )}

            {/* Meta informações */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-futuristic-gray text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(article.created_at)}
              </div>
              
              <Link
                to={`/artigo/${article.slug}`}
                className="text-lime-green hover:text-white text-sm font-medium transition-colors duration-300"
              >
                Ler artigo →
              </Link>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-effect hover-lift group">
      <div className="p-6">
        {/* Categoria */}
        <div className="flex items-center justify-between mb-4">
          <span className="px-3 py-1 bg-neon-purple/20 text-neon-purple rounded-full text-xs font-medium">
            {(() => {
              if (typeof article.category === 'string') {
                return article.category;
              }
              if (article.category?.name) {
                return article.category.name;
              }
              const category = categories.find(cat => cat.id === article.category_id);
              return category?.name || 'Sem categoria';
            })()}
          </span>
          <div className="flex items-center text-futuristic-gray text-xs">
            <Clock className="w-3 h-3 mr-1" />
            {calculateReadTime(article.content)} min
          </div>
        </div>

        {/* Imagem */}
        {article.image_url && (
          <Link 
            to={`/artigo/${article.slug}`} 
            className="block relative mb-4 w-full aspect-[16/9] overflow-hidden rounded-lg cursor-pointer"
          >
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>
        )}

        {/* Conteúdo */}
        <div className="space-y-3">
          <Link to={`/artigo/${article.slug}`} className="group">
            <h3 className="text-xl font-orbitron font-bold text-white group-hover:text-lime-green transition-colors duration-300 line-clamp-2">
              {article.title}
            </h3>
          </Link>

          {article.excerpt && (
            <p className="text-futuristic-gray text-sm line-clamp-3">
              {article.excerpt}
            </p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {(() => {
              const tags = article.tags;
              let tagArray: string[] = [];
              
              if (typeof tags === 'string') {
                tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
              } else if (Array.isArray(tags)) {
                tagArray = tags;
              }
              
              return tagArray.slice(0, 3).map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-lime-green/10 text-lime-green rounded text-xs font-roboto">
                  #{tag}
                </span>
              ));
            })()}
            {(() => {
              const tags = article.tags;
              let tagCount = 0;
              
              if (typeof tags === 'string') {
                tagCount = tags.split(',').map(t => t.trim()).filter(t => t).length;
              } else if (Array.isArray(tags)) {
                tagCount = tags.length;
              }
                
              return tagCount > 3 && (
                <span className="px-2 py-1 bg-futuristic-gray/10 text-futuristic-gray rounded text-xs font-roboto">
                  +{tagCount - 3}
                </span>
              );
            })()}
          </div>

          {/* Meta informações */}
          <div className="flex items-center justify-between pt-4 border-t border-neon-purple/20">
            <div className="flex items-center text-futuristic-gray text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(article.created_at)}
            </div>
            
            <Link
              to={`/artigo/${article.slug}`}
              className="text-lime-green hover:text-white text-sm font-medium transition-colors duration-300"
            >
              Ler artigo →
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
});

ArticleCard.displayName = 'ArticleCard';