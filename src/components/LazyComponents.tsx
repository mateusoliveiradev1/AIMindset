import React, { lazy, Suspense } from 'react';

// Loading component otimizado para componentes lazy
const ComponentLoader = ({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    default: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className={`animate-spin rounded-full border-b-2 border-lime-green ${sizeClasses[size]}`}></div>
    </div>
  );
};

// Lazy loading de componentes pesados
export const LazyTableOfContents = lazy(() => import('./TableOfContents').then(module => ({ default: module.TableOfContents })));
export const LazyFeedbackSection = lazy(() => import('./Feedback/FeedbackSection').then(module => ({ default: module.FeedbackSection })));
export const LazyCommentSection = lazy(() => import('./Comments/CommentSection').then(module => ({ default: module.CommentSection })));
export const LazyArticleDetailsModal = lazy(() => import('./Admin/ArticleDetailsModal').then(module => ({ default: module.ArticleDetailsModal })));
export const LazyReadingProgressBar = lazy(() => import('./ReadingProgressBar').then(module => ({ default: module.ReadingProgressBar })));
export const LazyArticleNavigation = lazy(() => import('./ArticleNavigation').then(module => ({ default: module.ArticleNavigation })));

// Wrapper components com Suspense
export const TableOfContentsLazy: React.FC<any> = (props) => (
  <Suspense fallback={<ComponentLoader size="small" />}>
    <LazyTableOfContents {...props} />
  </Suspense>
);

export const FeedbackSectionLazy: React.FC<any> = (props) => (
  <Suspense fallback={<ComponentLoader />}>
    <LazyFeedbackSection {...props} />
  </Suspense>
);

export const CommentSectionLazy: React.FC<any> = (props) => (
  <Suspense fallback={<ComponentLoader />}>
    <LazyCommentSection {...props} />
  </Suspense>
);

export const ArticleDetailsModalLazy: React.FC<any> = (props) => (
  <Suspense fallback={<ComponentLoader size="large" />}>
    <LazyArticleDetailsModal {...props} />
  </Suspense>
);

export const ReadingProgressBarLazy: React.FC<any> = (props) => (
  <Suspense fallback={null}>
    <LazyReadingProgressBar {...props} />
  </Suspense>
);

export const ArticleNavigationLazy: React.FC<any> = (props) => (
  <Suspense fallback={<ComponentLoader />}>
    <LazyArticleNavigation {...props} />
  </Suspense>
);

// Hook para lazy loading condicional
export const useLazyComponent = (shouldLoad: boolean) => {
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    if (shouldLoad && !isLoaded) {
      // Delay para evitar carregamento desnecessário
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [shouldLoad, isLoaded]);

  return isLoaded;
};

export default ComponentLoader;