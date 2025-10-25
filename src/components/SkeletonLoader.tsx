import React from 'react';

interface SkeletonLoaderProps {
  variant?: 'article' | 'card' | 'list' | 'text' | 'avatar' | 'button';
  count?: number;
  className?: string;
  animate?: boolean;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  variant = 'card', 
  count = 1, 
  className = '',
  animate = true 
}) => {
  const baseClasses = `bg-gray-700/30 rounded-lg ${animate ? 'animate-pulse' : ''}`;
  
  const renderSkeleton = () => {
    switch (variant) {
      case 'article':
        return (
          <div className={`space-y-4 ${className}`}>
            {/* Header */}
            <div className="space-y-3">
              <div className={`h-8 w-3/4 ${baseClasses}`}></div>
              <div className={`h-4 w-1/2 ${baseClasses}`}></div>
            </div>
            
            {/* Image */}
            <div className={`h-48 w-full ${baseClasses}`}></div>
            
            {/* Content */}
            <div className="space-y-2">
              <div className={`h-4 w-full ${baseClasses}`}></div>
              <div className={`h-4 w-5/6 ${baseClasses}`}></div>
              <div className={`h-4 w-4/6 ${baseClasses}`}></div>
            </div>
            
            {/* Tags */}
            <div className="flex space-x-2">
              <div className={`h-6 w-16 ${baseClasses}`}></div>
              <div className={`h-6 w-20 ${baseClasses}`}></div>
              <div className={`h-6 w-14 ${baseClasses}`}></div>
            </div>
          </div>
        );
        
      case 'card':
        return (
          <div className={`p-6 border border-gray-700/30 rounded-lg space-y-4 ${className}`}>
            {/* Image */}
            <div className={`h-40 w-full ${baseClasses}`}></div>
            
            {/* Title */}
            <div className={`h-6 w-4/5 ${baseClasses}`}></div>
            
            {/* Description */}
            <div className="space-y-2">
              <div className={`h-4 w-full ${baseClasses}`}></div>
              <div className={`h-4 w-3/4 ${baseClasses}`}></div>
            </div>
            
            {/* Footer */}
            <div className="flex justify-between items-center">
              <div className={`h-4 w-24 ${baseClasses}`}></div>
              <div className={`h-8 w-20 ${baseClasses}`}></div>
            </div>
          </div>
        );
        
      case 'list':
        return (
          <div className={`flex items-center space-x-4 p-4 ${className}`}>
            <div className={`h-12 w-12 rounded-full ${baseClasses}`}></div>
            <div className="flex-1 space-y-2">
              <div className={`h-4 w-3/4 ${baseClasses}`}></div>
              <div className={`h-3 w-1/2 ${baseClasses}`}></div>
            </div>
          </div>
        );
        
      case 'text':
        return (
          <div className={`space-y-2 ${className}`}>
            <div className={`h-4 w-full ${baseClasses}`}></div>
            <div className={`h-4 w-5/6 ${baseClasses}`}></div>
            <div className={`h-4 w-4/6 ${baseClasses}`}></div>
          </div>
        );
        
      case 'avatar':
        return (
          <div className={`h-10 w-10 rounded-full ${baseClasses} ${className}`}></div>
        );
        
      case 'button':
        return (
          <div className={`h-10 w-24 rounded-md ${baseClasses} ${className}`}></div>
        );
        
      default:
        return (
          <div className={`h-20 w-full ${baseClasses} ${className}`}></div>
        );
    }
  };

  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
};

// Componentes específicos para diferentes casos de uso
export const ArticleCardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    <SkeletonLoader variant="card" count={count} />
  </div>
);

export const ArticleListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-4">
    <SkeletonLoader variant="list" count={count} />
  </div>
);

export const ArticleContentSkeleton: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-8">
    <SkeletonLoader variant="article" />
  </div>
);

export const FeaturedArticlesSkeleton: React.FC = () => (
  <section className="py-20 bg-darker-surface">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Skeleton */}
      <div className="text-center mb-16">
        <div className="h-10 w-80 bg-gray-700/30 rounded-lg animate-pulse mx-auto mb-4"></div>
        <div className="h-6 w-96 bg-gray-700/30 rounded-lg animate-pulse mx-auto"></div>
      </div>
      
      {/* Cards Skeleton */}
      <ArticleCardSkeleton count={3} />
      
      {/* Button Skeleton */}
      <div className="text-center mt-12">
        <div className="h-12 w-48 bg-gray-700/30 rounded-lg animate-pulse mx-auto"></div>
      </div>
    </div>
  </section>
);

export default SkeletonLoader;