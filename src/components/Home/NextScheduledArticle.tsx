import React, { lazy, Suspense } from 'react';
import { useNextScheduledArticle } from '@/hooks/useNextScheduledArticle';

// Lazy load para bundle splitting e performance mobile
const ScheduledArticleCard = lazy(() => 
  import('./ScheduledArticleCard').then(module => ({ 
    default: module.ScheduledArticleCard 
  }))
);

// Componente de loading ultra-leve para mobile
const LoadingSkeleton: React.FC = () => (
  <div className="w-full h-64 bg-gradient-to-br from-purple-600/20 to-orange-400/20 rounded-2xl animate-pulse" />
);

// Componente inteligente que só renderiza quando há artigo agendado
export const NextScheduledArticle: React.FC = () => {
  const { data: article, isLoading, error } = useNextScheduledArticle();

  // Inteligência: só mostra loading se houver chance de ter artigo
  // Se não houver artigo, não renderiza nada (interface limpa)
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Se não houver artigo agendado, não renderiza nada
  if (!article) {
    return null;
  }

  // Se houver erro, falha silenciosamente sem quebrar a página
  if (error) {
    console.error('Erro ao carregar artigo agendado:', error);
    return null;
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ScheduledArticleCard 
        article={article} 
        className="mb-8 animate-fade-in-up"
      />
    </Suspense>
  );
};