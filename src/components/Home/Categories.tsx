import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Zap, Rocket, ArrowRight } from 'lucide-react';
import { useArticles } from '../../hooks/useArticles';
import Card from '../UI/Card';

const Categories: React.FC = () => {
  const { categories, loading, refreshArticles } = useArticles();

  // Carregar categorias quando o componente montar
  React.useEffect(() => {
    refreshArticles();
  }, [refreshArticles]);
  
  // Categorias principais do Header
  const mainCategorySlugs = ['ia-tecnologia', 'produtividade', 'futuro'];
  
  // Filtrar apenas as categorias principais
  const mainCategories = categories.filter(category => 
    mainCategorySlugs.includes(category.slug)
  );
  
  const categoryIcons = {
    'ia-tecnologia': Brain,
    'produtividade': Zap,
    'futuro': Rocket,
  };

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-orbitron font-bold text-3xl md:text-4xl mb-4">
            <span className="gradient-text">Explore por Categoria</span>
          </h2>
          <p className="font-roboto text-lg text-futuristic-gray max-w-2xl mx-auto">
            Descubra conteúdos organizados por temas que moldam o futuro da tecnologia
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-green mx-auto mb-4"></div>
            <p className="text-futuristic-gray">Carregando categorias...</p>
          </div>
        ) : mainCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-futuristic-gray text-lg">Nenhuma categoria principal encontrada.</p>
            <p className="text-futuristic-gray text-sm mt-2">Verifique se as categorias IA & Tecnologia, Produtividade e Futuro existem!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {mainCategories.map((category) => {
            const IconComponent = categoryIcons[category?.slug as keyof typeof categoryIcons] || Brain;
            
            return (
              <Link key={category.id} to={`/categoria/${category?.slug || ''}`}>
                <Card variant="neon" className="p-8 text-center group">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 mx-auto bg-neon-gradient rounded-full flex items-center justify-center group-hover:animate-pulse-neon transition-all duration-300">
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute inset-0 bg-lime-green/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  <h3 className="font-montserrat font-semibold text-xl text-white mb-3 group-hover:text-lime-green transition-colors duration-300">
                    {category?.name || 'Categoria'}
                  </h3>

                  <p className="font-roboto text-futuristic-gray text-sm mb-6 leading-relaxed">
                    {category?.description || 'Descrição da categoria'}
                  </p>

                  <div className="flex items-center justify-center text-lime-green group-hover:text-lime-green/80 font-montserrat font-medium text-sm transition-colors duration-300">
                    Explorar categoria
                    <ArrowRight className="h-4 w-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </Card>
              </Link>
            );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default Categories;