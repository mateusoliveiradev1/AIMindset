import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Calendar, Clock, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { useArticles } from '../hooks/useArticles';

export const Articles: React.FC = () => {
  const { articles, categories, loading, refreshArticles } = useArticles();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

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
  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);
  
  // Garantir que a página atual não exceda o total de páginas
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredArticles.length, totalPages, currentPage]);
  
  const startIndex = (currentPage - 1) * articlesPerPage;
  const paginatedArticles = filteredArticles.slice(startIndex, startIndex + articlesPerPage);

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
        {paginatedArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {paginatedArticles.map((article) => (
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
  );
};

export default Articles;