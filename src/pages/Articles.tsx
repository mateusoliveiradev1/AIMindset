import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Calendar, Clock, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { useArticles } from '../hooks/useArticles';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '../components/UI/PullToRefreshIndicator';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { InfiniteScrollLoader } from '../components/UI/InfiniteScrollLoader';

export const Articles: React.FC = () => {
  const { articles, categories, loading, refreshArticles } = useArticles();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [displayedArticles, setDisplayedArticles] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Load articles when component mounts
  useEffect(() => {
    refreshArticles();
  }, [refreshArticles]);

  // Aplicar parâmetros de busca da URL
  useEffect(() => {
    const urlSearchTerm = searchParams.get('search');
    if (urlSearchTerm) {
      setSearchTerm(urlSearchTerm);
    }
  }, [searchParams]);

  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 9;

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    // Simular atualização dos dados
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Aqui você poderia recarregar os dados da API
    console.log('Artigos atualizados!');
  };

  const {
    isRefreshing,
    pullDistance,
    isPulling,
    containerProps,
    indicatorStyle
  } = usePullToRefresh({ onRefresh: handleRefresh });

  // Filtrar artigos
  const filteredArticles = useMemo(() => {
    let filtered = articles;

    // Filtrar por categoria
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => {
        if (typeof article.category === 'object' && article.category?.slug) {
          return article.category.slug === selectedCategory;
        }
        const category = categories.find(cat => cat.id === article.category_id);
        return category?.slug === selectedCategory;
      });
    }

    // Filtrar por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(term) ||
        article.content.toLowerCase().includes(term) ||
        (article.excerpt && article.excerpt.toLowerCase().includes(term)) ||
        (article.tags && 
          (typeof article.tags === 'string' 
            ? article.tags.toLowerCase().includes(term)
            : article.tags.some((tag: string) => tag.toLowerCase().includes(term))
          )
        )
      );
    }

    return filtered.filter(article => article.published);
  }, [articles, searchTerm, selectedCategory, categories]);

  // Infinite scroll logic
  const hasMore = displayedArticles.length < filteredArticles.length;
  
  const loadMoreArticles = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    
    // Simular delay de carregamento para UX realista
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const nextBatch = filteredArticles.slice(
      displayedArticles.length,
      displayedArticles.length + articlesPerPage
    );
    
    setDisplayedArticles(prev => [...prev, ...nextBatch]);
    setIsLoadingMore(false);
  }, [filteredArticles, displayedArticles.length, articlesPerPage, isLoadingMore, hasMore]);

  // Resetar artigos exibidos quando filtros mudarem
  useEffect(() => {
    const initialArticles = filteredArticles.slice(0, articlesPerPage);
    setDisplayedArticles(initialArticles);
    setCurrentPage(1);
  }, [filteredArticles, articlesPerPage]);

  // Infinite scroll hook
  const { loadingRef } = useInfiniteScroll({
    hasMore,
    isLoading: isLoadingMore,
    onLoadMore: loadMoreArticles,
    threshold: 0.1,
    rootMargin: '100px'
  });

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Calcular tempo de leitura
  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  return (
    <div className="min-h-screen bg-dark-surface" {...containerProps}>
      <PullToRefreshIndicator 
        isRefreshing={isRefreshing}
        isPulling={isPulling}
        pullDistance={pullDistance}
        style={indicatorStyle}
      />
      {/* Header */}
      <div className="bg-darker-surface border-b border-neon-purple/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-white mb-4">
              Todos os <span className="gradient-text">Artigos</span>
            </h1>
            <p className="text-xl text-futuristic-gray font-roboto max-w-3xl mx-auto">
              Explore nossa coleção completa de artigos sobre inteligência artificial, 
              tecnologia e o futuro digital.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filtros */}
        <div className="mb-8">
          <Card className="glass-effect">
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Busca */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-futuristic-gray w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar artigos..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-3 bg-darker-surface border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/20"
                  />
                </div>

                {/* Filtro por categoria */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-futuristic-gray w-5 h-5" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10 pr-8 py-3 bg-darker-surface border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-neon-purple focus:ring-2 focus:ring-neon-purple/20 appearance-none cursor-pointer"
                  >
                    <option value="all">Todas as categorias</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Resultados */}
              <div className="mt-4 flex items-center justify-between text-sm text-futuristic-gray">
                <span>
                  {filteredArticles.length} artigo{filteredArticles.length !== 1 ? 's' : ''} encontrado{filteredArticles.length !== 1 ? 's' : ''}
                </span>
                {(searchTerm || selectedCategory !== 'all') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                      setCurrentPage(1);
                    }}
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Lista de artigos */}
        {displayedArticles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
              {displayedArticles.map((article) => (
              <Card key={article.id} className="glass-effect hover-lift group">
                <div className="p-6">
                  {/* Categoria */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-neon-purple/20 text-neon-purple rounded-full text-xs font-montserrat font-medium">
                      {(typeof article.category === 'object' && article.category?.name) || 
                       categories.find(cat => cat.id === article.category_id)?.name || 
                       'Sem categoria'}
                    </span>
                    <div className="flex items-center text-futuristic-gray text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {article.reading_time || calculateReadTime(article.content)} min
                    </div>
                  </div>

                  {/* Título */}
                  <h3 className="text-xl font-montserrat font-bold text-white mb-3 group-hover:text-lime-green transition-colors duration-300">
                    {article.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-futuristic-gray font-roboto text-sm mb-4 line-clamp-3">
                    {article.excerpt || article.content.substring(0, 150) + '...'}
                  </p>

                  {/* Tags */}
                  {article.tags && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(() => {
                        const tags = article.tags;
                        if (!tags) return null;
                        
                        // Se for string, dividir por vírgula
                        if (typeof tags === 'string' && tags.length > 0) {
                          const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
                          return tagArray.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-lime-green/10 text-lime-green rounded text-xs font-roboto"
                            >
                              {tag}
                            </span>
                          ));
                        }
                        
                        // Se for array
                        if (Array.isArray(tags) && tags.length > 0) {
                          return tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-lime-green/10 text-lime-green rounded text-xs font-roboto"
                            >
                              {String(tag)}
                            </span>
                          ));
                        }
                        
                        return null;
                      })()}
                      {(() => {
                        const tags = article.tags;
                        if (!tags) return null;
                        
                        let tagCount = 0;
                        if (typeof tags === 'string' && tags.length > 0) {
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
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-neon-purple/20">
                    <div className="flex items-center text-futuristic-gray text-xs">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(article.created_at)}
                    </div>
                    <Link
                      to={`/artigo/${article.slug}`}
                      className="text-lime-green hover:text-lime-green/80 font-montserrat font-medium text-sm transition-colors duration-300"
                    >
                      Ler artigo →
                    </Link>
                  </div>
                </div>
              </Card>
              ))}
            </div>
            
            {/* Infinite scroll loader */}
            <InfiniteScrollLoader
              isLoading={isLoadingMore}
              hasMore={hasMore}
              loadingRef={loadingRef}
            />
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-montserrat font-bold text-white mb-2">
              Nenhum artigo encontrado
            </h3>
            <p className="text-futuristic-gray font-roboto">
              Tente ajustar os filtros ou termos de busca.
            </p>
          </div>
        )}


      </div>
    </div>
  );
};

export default Articles;