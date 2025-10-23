import React, { useEffect } from 'react';
import Hero from '../components/Home/Hero';
import FeaturedArticles from '../components/Home/FeaturedArticles';
import Categories from '../components/Home/Categories';
import NewsletterCTA from '../components/Home/NewsletterCTA';
import SEOManager from '../components/SEO/SEOManager';
import { useSEO } from '../hooks/useSEO';
import { useArticles } from '../hooks/useArticles';
import { OptimizedImage } from '../components/PerformanceManager';

const Home: React.FC = () => {
  const { categories } = useArticles();
  const { getMetadata, preloadCategorySEO } = useSEO({ 
    pageType: 'home',
    fallbackTitle: 'AIMindset - Inteligência Artificial e Produtividade',
    fallbackDescription: 'Descubra como a inteligência artificial pode transformar sua produtividade. Artigos, dicas e insights sobre IA, automação e tecnologia.'
  });

  // Pré-carregar metadados das categorias para navegação fluida
  useEffect(() => {
    if (categories.length > 0) {
      preloadCategorySEO(categories);
    }
  }, [categories, preloadCategorySEO]);

  const metadata = getMetadata();

  return (
    <>
      <SEOManager metadata={metadata} />
      <Hero />
      <FeaturedArticles />
      <Categories />
      <NewsletterCTA />
    </>
  );
};

export default Home;