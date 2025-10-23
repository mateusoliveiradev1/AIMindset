import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Brain, Zap } from 'lucide-react';
import Button from '../UI/Button';
import { useArticles } from '../../hooks/useArticles';

const Hero: React.FC = () => {
  const { articles, categories, loading, refreshArticles } = useArticles();

  // Carregar dados quando o componente montar
  React.useEffect(() => {
    refreshArticles();
  }, [refreshArticles]);

  // Calcular métricas reais baseadas nos dados do Supabase
  const publishedArticles = articles.filter(article => article.published);
  const totalArticles = publishedArticles.length;
  const totalCategories = categories.length;
  
  // Estimativa de leitores baseada nos artigos (pode ser substituída por analytics reais)
  const estimatedReaders = totalArticles > 0 ? Math.max(100, totalArticles * 50) : 100;

  return (
    <section 
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      role="banner"
      aria-label="Seção principal do AIMindset"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-dark-gradient" aria-hidden="true"></div>
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-purple/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-lime-green/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-neon-purple/20 rounded-full blur-2xl animate-pulse-neon"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8">
          <div className="inline-flex items-center space-x-2 bg-neon-purple/10 backdrop-blur-sm border border-neon-purple/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="h-4 w-4 text-lime-green" />
            <span className="text-futuristic-gray font-montserrat text-sm">
              Explorando o Futuro da IA
            </span>
          </div>
          
          <h1 
            className="font-orbitron font-bold text-4xl md:text-6xl lg:text-7xl mb-6 leading-tight"
            id="main-heading"
          >
            <span className="gradient-text">AIMindset</span>
            <br />
            <span className="text-white">O Futuro é</span>
            <br />
            <span className="text-lime-green">Inteligente</span>
          </h1>
          
          <p className="font-roboto text-lg md:text-xl text-futuristic-gray max-w-3xl mx-auto mb-8 leading-relaxed">
            Descubra insights exclusivos sobre inteligência artificial, tecnologia emergente e 
            produtividade. Conteúdo especializado para profissionais que moldam o amanhã.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12">
          <Link to="/categoria">
            <Button size="lg" className="w-full sm:w-auto">
              <Brain className="h-5 w-5 mr-2" />
              Explorar Artigos
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
          
          <Link to="/newsletter">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <Zap className="h-5 w-5 mr-2" />
              Newsletter Gratuita
            </Button>
          </Link>
        </div>
        
        {/* Stats - Agora usando dados reais do Supabase */}
        <div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          role="region"
          aria-labelledby="stats-heading"
        >
          <div className="sr-only" id="stats-heading">Estatísticas do AIMindset</div>
          
          <div className="text-center" role="group" aria-label="Estatística de artigos">
            <div 
              className="text-3xl md:text-4xl font-orbitron font-bold text-lime-green mb-2"
              aria-label={`${loading ? 'Carregando' : totalArticles} ${totalArticles === 1 ? 'artigo publicado' : 'artigos publicados'}`}
            >
              {loading ? '...' : totalArticles}
            </div>
            <div className="text-futuristic-gray font-montserrat">
              {totalArticles === 1 ? 'Artigo Publicado' : 'Artigos Publicados'}
            </div>
          </div>
          
          <div className="text-center" role="group" aria-label="Estatística de categorias">
            <div 
              className="text-3xl md:text-4xl font-orbitron font-bold text-neon-purple mb-2"
              aria-label={`${loading ? 'Carregando' : totalCategories} ${totalCategories === 1 ? 'categoria' : 'categorias'}`}
            >
              {loading ? '...' : totalCategories}
            </div>
            <div className="text-futuristic-gray font-montserrat">
              {totalCategories === 1 ? 'Categoria' : 'Categorias'}
            </div>
          </div>
          
          <div className="text-center" role="group" aria-label="Estatística de leitores">
            <div 
              className="text-3xl md:text-4xl font-orbitron font-bold text-lime-green mb-2"
              aria-label={`${loading ? 'Carregando' : `Mais de ${estimatedReaders}`} leitores`}
            >
              {loading ? '...' : `${estimatedReaders}+`}
            </div>
            <div className="text-futuristic-gray font-montserrat">
              Leitores
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-futuristic-gray rounded-full flex justify-center">
          <div className="w-1 h-3 bg-lime-green rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;