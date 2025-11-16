import React, { useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import Hero from '../components/Home/Hero';
import { NextScheduledArticle } from '../components/Home/NextScheduledArticle';
import FeaturedArticles from '../components/Home/FeaturedArticles';
import Categories from '../components/Home/Categories';
import NewsletterCTA from '../components/Home/NewsletterCTA';
import SEOManager from '../components/SEO/SEOManager';
import { useSEO } from '../hooks/useSEO';
import { useArticles } from '../hooks/useArticles';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '../components/UI/PullToRefreshIndicator';
import { useHomeOptimization } from '../hooks/useHomeOptimization';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';

const Home: React.FC = () => {
  console.log('🏠 [Home] Componente Home renderizado!');
  
  const { categories } = useArticles();
  const { debouncedRefresh, observerRef, featuredArticles } = useHomeOptimization();
  const { getMetadata, preloadCategorySEO } = useSEO({ 
    pageType: 'home',
    fallbackTitle: 'AIMindset - Inteligência Artificial e Produtividade',
    fallbackDescription: 'Descubra como a inteligência artificial pode transformar sua produtividade. Artigos, dicas e insights sobre IA, automação e tecnologia.'
  });

  // Performance monitoring EXTREMO - 100% invisível
  const { trackComponentRender, getPerformanceData, getWebVitalsScore } = usePerformanceMonitor({
    enableWebVitals: true,
    enableResourceMonitoring: true,
    enableIntersectionObserver: true,
    enableIdleCallback: true,
    reportingThreshold: 1000
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

  // Track component mount - INVISÍVEL
  useEffect(() => {
    trackComponentRender('Home', true);
  }, [trackComponentRender]);

  // Pré-carregar metadados das categorias para navegação fluida
  useEffect(() => {
    if (categories.length > 0) {
      preloadCategorySEO(categories);
    }
  }, [categories, preloadCategorySEO]);

  // Memoizar metadados para evitar recálculos desnecessários
  const metadata = useMemo(() => getMetadata(), [getMetadata]);
  const preloadImages = useMemo(() => {
    return (featuredArticles || [])
      .filter(a => !!a?.image_url)
      .slice(0, 3)
      .map(a => a.image_url as string);
  }, [featuredArticles]);

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
      {/* Preload de imagens removido para evitar warnings e uso desnecessário */}
      <Hero />
      
      {/* Card inteligente do próximo artigo agendado - só aparece quando há artigo */}
      <section className="container mx-auto px-4 py-8">
        <NextScheduledArticle />
      </section>
      
      <FeaturedArticles />
      <Categories />
      <NewsletterCTA />
    </div>
  );
};

export default Home;