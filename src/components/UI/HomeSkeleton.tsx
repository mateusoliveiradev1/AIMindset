import React from 'react';

// Skeleton invisível para Hero
const HeroSkeleton: React.FC = () => (
  <div className="relative min-h-screen flex items-center justify-center overflow-hidden animate-pulse">
    <div className="absolute inset-0 bg-dark-gradient" aria-hidden="true"></div>
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div className="mb-8">
        <div className="inline-flex items-center space-x-2 bg-neon-purple/10 backdrop-blur-sm border border-neon-purple/20 rounded-full px-4 py-2 mb-6">
          <div className="h-4 w-4 bg-lime-green/20 rounded"></div>
          <div className="h-4 w-24 bg-futuristic-gray/20 rounded"></div>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="h-12 md:h-16 lg:h-20 bg-gradient-to-r from-neon-purple/20 to-lime-green/20 rounded mx-auto max-w-4xl"></div>
          <div className="h-12 md:h-16 lg:h-20 bg-white/10 rounded mx-auto max-w-3xl"></div>
          <div className="h-12 md:h-16 lg:h-20 bg-lime-green/20 rounded mx-auto max-w-2xl"></div>
        </div>
        
        <div className="h-6 bg-futuristic-gray/20 rounded mx-auto max-w-3xl mb-8"></div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12">
        <div className="h-12 w-48 bg-neon-purple/20 rounded-lg"></div>
        <div className="h-12 w-48 bg-futuristic-gray/20 rounded-lg"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="text-center">
            <div className="h-12 w-16 bg-lime-green/20 rounded mx-auto mb-2"></div>
            <div className="h-4 w-24 bg-futuristic-gray/20 rounded mx-auto"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Skeleton invisível para FeaturedArticles
const FeaturedArticlesSkeleton: React.FC = () => (
  <section className="py-20 bg-dark-secondary">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <div className="h-8 w-64 bg-gradient-to-r from-neon-purple/20 to-lime-green/20 rounded mx-auto mb-4"></div>
        <div className="h-6 w-96 bg-futuristic-gray/20 rounded mx-auto"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-dark-card border border-futuristic-gray/20 rounded-xl p-6 animate-pulse">
            <div className="h-48 bg-futuristic-gray/10 rounded-lg mb-4"></div>
            <div className="space-y-3">
              <div className="h-6 bg-futuristic-gray/20 rounded"></div>
              <div className="h-4 bg-futuristic-gray/10 rounded w-3/4"></div>
              <div className="h-4 bg-futuristic-gray/10 rounded w-1/2"></div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-futuristic-gray/10">
              <div className="h-4 w-20 bg-futuristic-gray/20 rounded"></div>
              <div className="h-4 w-16 bg-futuristic-gray/20 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Skeleton invisível para Categories
const CategoriesSkeleton: React.FC = () => (
  <section className="py-20 bg-dark-primary">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <div className="h-8 w-48 bg-gradient-to-r from-neon-purple/20 to-lime-green/20 rounded mx-auto mb-4"></div>
        <div className="h-6 w-80 bg-futuristic-gray/20 rounded mx-auto"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-dark-card border border-futuristic-gray/20 rounded-xl p-6 animate-pulse">
            <div className="h-12 w-12 bg-neon-purple/20 rounded-lg mb-4"></div>
            <div className="space-y-2">
              <div className="h-6 bg-futuristic-gray/20 rounded"></div>
              <div className="h-4 bg-futuristic-gray/10 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Componente principal que combina todos os skeletons
const HomeSkeleton: React.FC = () => (
  <div className="min-h-screen">
    <HeroSkeleton />
    <FeaturedArticlesSkeleton />
    <CategoriesSkeleton />
  </div>
);

export default HomeSkeleton;
export { HeroSkeleton, FeaturedArticlesSkeleton, CategoriesSkeleton };