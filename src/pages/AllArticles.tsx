import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Calendar, Clock, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { useArticles } from '../hooks/useArticles';
import { useSEO } from '../hooks/useSEO';
import SEOManager from '../components/SEO/SEOManager';
// import LazyImage from '../components/Performance/LazyImage';

const AllArticles: React.FC = () => {
  const { articles, categories, loading, refreshArticles } = useArticles();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Hook para SEO
  const { getMetadata } = useSEO({
    pageType: 'all_articles',
    breadcrumbs: [
      { name: 'Home', url: '/', position: 1 },
      { name: 'Artigos', url: '/artigos', position: 2 }
    ]
  });

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

  // Filtrar artigos
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           article.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Corrigir filtro por categoria - usar category_id
      const matchesCategory = selectedCategory === 'all' || 
                             categories.find(cat => cat.slug === selectedCategory)?.id === article.category_id;
      
      return matchesSearch && matchesCategory && article.published;
    });
  }, [articles, searchTerm, selectedCategory, categories]);

  // Paginação - resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);
  const startIndex = (currentPage - 1) * articlesPerPage;
  const paginatedArticles = filteredArticles.slice(startIndex, startIndex + articlesPerPage);

  // Função para calcular tempo de leitura
  const calculateReadingTime = (content: string): number => {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  };

  // Função para formatar data
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-green mx-auto mb-4"></div>
          <p className="text-futuristic-gray">Carregando artigos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOManager metadata={getMetadata()} />
      <div className="min-h-screen bg-dark-surface">
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
                    className="w-full pl-10 pr-4 py-3 bg-darker-surface border border-neon-purple/20 rounded-lg text-white placeholder-futuristic-gray focus:outline-none focus:border-lime-green transition-colors"
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
                    className="pl-10 pr-8 py-3 bg-darker-surface border border-neon-purple/20 rounded-lg text-white focus:outline-none focus:border-lime-green transition-colors appearance-none cursor-pointer min-w-[200px]"
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
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-neon-purple/20">
                <span className="text-futuristic-gray text-sm">
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
        {paginatedArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {paginatedArticles.map((article) => (
              <Card key={article.id} className="glass-effect hover-lift group">
                <div className="p-6">
                  {/* Categoria */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-neon-purple/20 text-neon-purple rounded-full text-xs font-montserrat font-medium">
                      {(article.category as any)?.name || 
                       categories.find(cat => cat.id === article.category_id)?.name || 
                       'Sem categoria'}
                    </span>
                    <div className="flex items-center text-futuristic-gray text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {calculateReadingTime(article.content)} min
                    </div>
                  </div>

                  {/* Imagem */}
                  {article.image_url && (
                    <Link to={`/artigo/${article.slug}`} className="block relative mb-4 w-full aspect-[4/3] sm:aspect-[16/9] overflow-hidden rounded-lg cursor-pointer">
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        width={400}
                        height={225}
                        loading="lazy"
                      />
                    </Link>
                  )}

                  {/* Título */}
                  <h3 className="text-xl font-orbitron font-bold text-white mb-3 line-clamp-2 group-hover:text-lime-green transition-colors">
                    {article.title}
                  </h3>

                  {/* Resumo */}
                  <p className="text-futuristic-gray text-sm mb-4 line-clamp-3">
                    {article.excerpt || article.content.substring(0, 150) + '...'}
                  </p>

                  {/* Tags */}
                  {article.tags && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(Array.isArray(article.tags) ? article.tags : [article.tags])
                        .slice(0, 3)
                        .map((tag, index) => {
                          const colors = [
                            'bg-lime-green/20 text-lime-green border-lime-green/30',
                            'bg-neon-purple/20 text-neon-purple border-neon-purple/30',
                            'bg-blue-500/20 text-blue-400 border-blue-500/30',
                            'bg-orange-500/20 text-orange-400 border-orange-500/30',
                            'bg-pink-500/20 text-pink-400 border-pink-500/30'
                          ];
                          return (
                            <span
                              key={index}
                              className={`px-3 py-1 text-xs rounded-full border transition-all duration-200 hover:scale-105 ${colors[index % colors.length]}`}
                            >
                              {tag}
                            </span>
                          );
                        })}
                      {(Array.isArray(article.tags) ? article.tags : [article.tags]).length > 3 && (
                        <span className="px-3 py-1 bg-gray-500/20 text-gray-400 border border-gray-500/30 text-xs rounded-full">
                          +{(Array.isArray(article.tags) ? article.tags : [article.tags]).length - 3}
                        </span>
                      )}
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
                      className="text-lime-green hover:text-lime-green/80 text-sm font-medium transition-colors"
                    >
                      Ler artigo →
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-2xl font-orbitron font-bold text-white mb-4">
              Nenhum artigo encontrado
            </h3>
            <p className="text-futuristic-gray mb-6">
              Tente ajustar os filtros ou termos de busca.
            </p>
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </Button>

            <div className="flex items-center space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={currentPage === page ? "neon-glow" : ""}
                >
                  {page}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center space-x-2"
            >
              <span>Próximo</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default AllArticles;