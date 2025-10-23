import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Zap, Rocket, TrendingUp, BookOpen, Users, ArrowRight } from 'lucide-react';
import { useArticles } from '../hooks/useArticles';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import SEOManager from '../components/SEO/SEOManager';
import PreloadManager from '../components/Performance/PreloadManager';
import { useSEO } from '../hooks/useSEO';

const Categories: React.FC = () => {
  const { categories, articles, loading, refreshArticles } = useArticles();

  // SEO para página de categorias
  const seoHook = useSEO({
    pageType: 'category',
    fallbackTitle: 'Categorias | AIMindset',
    fallbackDescription: 'Explore todas as categorias de artigos sobre inteligência artificial, produtividade e tecnologia.'
  });

  const metadata = seoHook.getMetadata();

  useEffect(() => {
    refreshArticles();
  }, [refreshArticles]);

  // Ícones para cada categoria
  const categoryIcons = {
    'ia-tecnologia': Brain,
    'produtividade': Zap,
    'futuro': Rocket,
    'inovacao': TrendingUp,
    'negocios': Users,
    'educacao': BookOpen,
  };

  // Contar artigos por categoria
  const getArticleCount = (categoryId: string) => {
    return articles.filter(article => article.category_id === categoryId && article.published).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-surface flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-green mx-auto mb-4"></div>
          <p className="text-futuristic-gray">Carregando categorias...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOManager metadata={metadata} />
      <PreloadManager 
        criticalResources={[
          { href: '/fonts/orbitron.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
          { href: '/fonts/roboto.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' }
        ]}
        prefetchResources={[
          { href: '/artigos', as: 'document' },
          { href: '/', as: 'document' }
        ]}
      />
      <div className="min-h-screen bg-dark-surface">
        {/* Header */}
        <div className="bg-darker-surface border-b border-neon-purple/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-white mb-4">
                Todas as <span className="gradient-text">Categorias</span>
              </h1>
              <p className="text-xl text-futuristic-gray font-roboto max-w-3xl mx-auto">
                Explore nossos tópicos organizados por área de interesse. 
                Descubra conteúdos sobre IA, tecnologia, produtividade e muito mais.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" role="list" aria-label="Lista de categorias">
              {categories.map((category) => {
                const IconComponent = categoryIcons[category.slug as keyof typeof categoryIcons] || Brain;
                const articleCount = getArticleCount(category.id);
                
                return (
                  <Card key={category.id} className="glass-effect hover-lift group">
                    <div className="p-8">
                      {/* Ícone da categoria */}
                      <div className="flex items-center justify-center w-16 h-16 bg-neon-gradient rounded-full mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="w-8 h-8 text-white" aria-hidden="true" />
                      </div>

                      {/* Nome da categoria */}
                      <h2 className="text-2xl font-orbitron font-bold text-white text-center mb-4 group-hover:text-lime-green transition-colors duration-300">
                        {category.name}
                      </h2>

                      {/* Descrição */}
                      <p className="text-futuristic-gray text-center mb-6 leading-relaxed">
                        {category.description || 'Explore artigos desta categoria'}
                      </p>

                      {/* Estatísticas */}
                      <div className="flex items-center justify-center space-x-4 mb-6" aria-label={`${articleCount} ${articleCount === 1 ? 'artigo' : 'artigos'} nesta categoria`}>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-lime-green">
                            {articleCount}
                          </div>
                          <div className="text-xs text-futuristic-gray">
                            {articleCount === 1 ? 'Artigo' : 'Artigos'}
                          </div>
                        </div>
                      </div>

                      {/* Botão para ver categoria */}
                      <div className="text-center">
                        <Link to={`/categoria/${category.slug}`}>
                          <Button 
                            className="w-full bg-transparent border border-neon-purple/30 text-white hover:bg-neon-gradient hover:border-transparent transition-all duration-300 group-hover:neon-glow"
                            aria-label={`Explorar categoria ${category.name}`}
                          >
                            <span className="flex items-center justify-center">
                              Explorar categoria
                              <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                            </span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="glass-effect rounded-lg p-8 max-w-md mx-auto">
                <Brain className="w-16 h-16 text-futuristic-gray mx-auto mb-4" aria-hidden="true" />
                <h2 className="font-montserrat font-semibold text-xl text-white mb-4">
                  Nenhuma categoria encontrada
                </h2>
                <p className="text-futuristic-gray mb-6">
                  Ainda não há categorias cadastradas no sistema.
                </p>
                <Link to="/">
                  <Button aria-label="Voltar à página inicial">Voltar ao início</Button>
                </Link>
              </div>
            </div>
          )}

          {/* Seção de navegação adicional */}
          <div className="mt-16 text-center">
            <Card className="glass-effect">
              <div className="p-8">
                <h2 className="text-2xl font-orbitron font-bold text-white mb-4">
                  Não encontrou o que procura?
                </h2>
                <p className="text-futuristic-gray mb-6">
                  Explore todos os nossos artigos ou use a busca para encontrar conteúdo específico.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/artigos">
                    <Button className="bg-neon-gradient hover:bg-neon-gradient/80" aria-label="Ver todos os artigos publicados">
                      Ver todos os artigos
                    </Button>
                  </Link>
                  <Link to="/">
                    <Button variant="outline" aria-label="Voltar à página inicial">
                      Voltar ao início
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Categories;