import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Clock, Tag, ArrowRight, Grid } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useArticles } from '../hooks/useArticles';
import { useSEO } from '../hooks/useSEO';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import SEOManager from '../components/SEO/SEOManager';

const Category: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { articles, categories, loading, refreshArticles } = useArticles();
  
  useEffect(() => {
    refreshArticles();
  }, [refreshArticles]);
  
  const category = categories.find(cat => cat.slug === slug);
  const categoryArticles = articles.filter(article => 
    article.published && 
    article.category_id === category?.id
  );

  // SEO específico para a categoria
  const seoHook = useSEO({
    pageType: 'category',
    pageSlug: slug,
    fallbackTitle: category ? `${category.name} | AIMindset` : 'Categoria | AIMindset',
    fallbackDescription: category 
      ? `Explore artigos sobre ${category.name}. Descubra conteúdos relacionados a ${category.name} no AIMindset.`
      : 'Explore artigos por categoria no AIMindset.',
    fallbackKeywords: category 
      ? [category.name, 'categoria', 'artigos', 'inteligência artificial', 'IA', 'produtividade']
      : ['categoria', 'artigos', 'inteligência artificial']
  });

  const metadata = seoHook.getMetadata();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-green mx-auto mb-4"></div>
          <p className="text-futuristic-gray">Carregando categoria...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-orbitron font-bold text-2xl text-white mb-4">Categoria não encontrada</h1>
          <Link to="/">
            <Button>Voltar ao início</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <>
      <SEOManager metadata={metadata} />
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Category Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-neon-purple/10 backdrop-blur-sm border border-neon-purple/20 rounded-full px-4 py-2 mb-6">
            <Tag className="h-4 w-4 text-lime-green" />
            <span className="text-futuristic-gray font-montserrat text-sm">
              Categoria
            </span>
          </div>
          
          <h1 className="font-orbitron font-bold text-4xl md:text-5xl mb-4">
            <span className="gradient-text">{category?.name || 'Categoria'}</span>
          </h1>
          
          <p className="font-roboto text-lg text-futuristic-gray max-w-3xl mx-auto mb-8">
            {category?.description || 'Descrição da categoria'}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <div className="text-sm text-futuristic-gray">
              {categoryArticles.length} artigo{categoryArticles.length !== 1 ? 's' : ''} encontrado{categoryArticles.length !== 1 ? 's' : ''}
            </div>
            
            <Link to="/categoria">
              <Button variant="secondary" className="inline-flex items-center space-x-2">
                <Grid className="h-4 w-4" />
                <span>Ver todas as categorias</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Articles Grid */}
        {categoryArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categoryArticles.map((article) => (
              <Card key={article.id} variant="glass" className="overflow-hidden group">
                <Link to={`/artigo/${article.slug}`} className="block relative w-full aspect-[4/3] sm:aspect-[16/9] overflow-hidden cursor-pointer">
                  {(article.image_url || article.featured_image) ? (
                    <img
                      src={article.image_url || article.featured_image}
                      alt={article.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-neon-purple/20 to-lime-green/20 flex items-center justify-center">
                      <div className="text-center">
                        <Tag className="w-12 h-12 text-futuristic-gray mx-auto mb-2" />
                        <p className="text-futuristic-gray text-sm">Sem imagem</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/80 to-transparent"></div>
                </Link>

                <div className="p-6">
                  <div className="flex items-center space-x-4 text-sm text-futuristic-gray mb-3">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(article.created_at)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {Math.ceil((article.content || '').split(' ').length / 200)} min
                    </div>
                  </div>

                  <h3 className="font-montserrat font-semibold text-xl text-white mb-3 line-clamp-2 group-hover:text-lime-green transition-colors duration-300">
                    {article.title}
                  </h3>

                  <p className="font-roboto text-futuristic-gray text-sm mb-4 line-clamp-3">
                    {article.excerpt}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {(() => {
                      const tags = article.tags;
                      if (!tags) return null;
                      
                      // Se for string, dividir por vírgula
                      if (typeof tags === 'string' && tags.length > 0) {
                        return tags.split(',').map(t => t.trim()).filter(t => t).slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs font-roboto bg-lime-green/10 text-lime-green rounded-md"
                          >
                            {tag}
                          </span>
                        ));
                      }
                      
                      // Se for array de strings
                      if (Array.isArray(tags) && tags.length > 0) {
                        return tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs font-roboto bg-lime-green/10 text-lime-green rounded-md"
                          >
                            {typeof tag === 'string' ? tag : String(tag)}
                          </span>
                        ));
                      }
                      
                      return null;
                    })()}
                  </div>

                  <Link
                    to={`/artigo/${article.slug}`}
                    className="inline-flex items-center text-lime-green hover:text-lime-green/80 font-montserrat font-medium text-sm transition-colors duration-300"
                  >
                    Ler artigo completo
                    <ArrowRight className="h-4 w-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="glass-effect rounded-lg p-8 max-w-md mx-auto">
              <h3 className="font-montserrat font-semibold text-xl text-white mb-4">
                Nenhum artigo encontrado
              </h3>
              <p className="text-futuristic-gray mb-6">
                Esta categoria ainda não possui artigos publicados.
              </p>
              <Link to="/">
                <Button>Explorar outras categorias</Button>
              </Link>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default Category;