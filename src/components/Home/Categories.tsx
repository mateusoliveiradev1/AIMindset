import React, { useMemo, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Zap, Rocket, Lightbulb, Target, Cpu, ArrowRight } from 'lucide-react';
import { useArticles } from '../../hooks/useArticles';
import { useHomeOptimization } from '../../hooks/useHomeOptimization';
import { Card, CardContent } from '../UI/Card';
import { CategoriesSkeleton } from '../UI/HomeSkeleton';

const Categories: React.FC = () => {
  const { categories, loading } = useArticles();
  const { mainCategories } = useHomeOptimization();

  // Adicionar logs para debug
  React.useEffect(() => {
    console.log('🔍 [Categories] Estado atual:', {
      loading,
      totalCategories: categories?.length || 0,
      categories: categories?.map(cat => ({ id: cat.id, name: cat.name, slug: cat.slug })),
      mainCategories: mainCategories?.map(cat => ({ id: cat.id, name: cat.name, slug: cat.slug }))
    });
  }, [categories, loading, mainCategories]);
  
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

        {loading && mainCategories.length === 0 ? (
          <CategoriesSkeleton />
        ) : mainCategories.length === 0 ? (
          <div className="text-center text-gray-600">
            <p>Nenhuma categoria principal encontrada.</p>
            <p className="text-sm mt-2">
              Debug: Total categorias: {categories.length} | 
              Slugs encontrados: {categories.map(c => c.slug).join(', ')}
            </p>
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