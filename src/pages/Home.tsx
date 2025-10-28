import React, { useEffect, useMemo, useCallback } from 'react';
import Hero from '../components/Home/Hero';
import FeaturedArticles from '../components/Home/FeaturedArticles';
import Categories from '../components/Home/Categories';
import NewsletterCTA from '../components/Home/NewsletterCTA';
import SEOManager from '../components/SEO/SEOManager';
import { useSEO } from '../hooks/useSEO';
import { useArticles } from '../hooks/useArticles';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '../components/UI/PullToRefreshIndicator';
import { useHomeOptimization } from '../hooks/useHomeOptimization';

const Home: React.FC = () => {
  const { categories } = useArticles();
  const { debouncedRefresh, observerRef } = useHomeOptimization();
  const { getMetadata, preloadCategorySEO } = useSEO({ 
    pageType: 'home',
    fallbackTitle: 'AIMindset - Inteligência Artificial e Produtividade',
    fallbackDescription: 'Descubra como a inteligência artificial pode transformar sua produtividade. Artigos, dicas e insights sobre IA, automação e tecnologia.'
  });

  // Pull-to-refresh otimizado com debounce para mobile/tablet
  const handleRefresh = useCallback(async () => {
    await debouncedRefresh();
    console.log('Home atualizada com otimização!');
  }, [debouncedRefresh]);

  const {
    containerRef,
    isRefreshing,
    pullDistance,
    isPulling,
    pullToRefreshStyle,
    refreshIndicatorStyle,
    isThresholdReached
  } = usePullToRefresh({ onRefresh: handleRefresh });

  // Criar uma ref mutável para o container
  const mutableContainerRef = React.useRef<HTMLDivElement | null>(null);

  // Pré-carregar metadados das categorias para navegação fluida
  useEffect(() => {
    if (categories.length > 0) {
      preloadCategorySEO(categories);
    }
  }, [categories, preloadCategorySEO]);

  // Memoizar metadados para evitar recálculos desnecessários
  const metadata = useMemo(() => getMetadata(), [getMetadata]);

  return (
    <div 
      ref={(node) => {
        mutableContainerRef.current = node;
        observerRef(node);
      }} 
      style={pullToRefreshStyle}
    >
      <PullToRefreshIndicator 
        isRefreshing={isRefreshing}
        isPulling={isPulling}
        isThresholdReached={isThresholdReached}
        style={refreshIndicatorStyle}
      />
      <SEOManager metadata={metadata} />
      <Hero />
      <FeaturedArticles />
      <Categories />
      <NewsletterCTA />
    </div>
  );
};

export default Home;