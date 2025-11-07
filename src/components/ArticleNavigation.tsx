import React from 'react';
import { Link } from 'react-router-dom';
import { useArticleNavigation, NavigationArticle } from '../hooks/useArticleNavigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
// import LazyImage from './Performance/LazyImage';

interface ArticleNavigationProps {
  currentSlug: string;
  categoryId?: string;
  className?: string;
}

interface NavigationCardProps {
  article: NavigationArticle;
  direction: 'previous' | 'next';
}

const NavigationCard: React.FC<NavigationCardProps> = ({ article, direction }) => {
  const isPrevious = direction === 'previous';
  
  const handleClick = () => {
    // Scroll para o topo da página ao navegar
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  return (
    <Link
      to={`/artigo/${article.slug}`}
      onClick={handleClick}
      className={`
        group flex items-center gap-4 p-4 bg-gray-900/50 backdrop-blur-sm 
        border border-lime-400/20 rounded-lg hover:border-lime-400/40 
        transition-all duration-300 hover:bg-gray-900/70
        ${isPrevious ? 'flex-row' : 'flex-row-reverse text-right'}
      `}
    >
      {/* Arrow Icon */}
      <div className={`
        flex-shrink-0 w-10 h-10 rounded-full bg-lime-400/10 
        flex items-center justify-center group-hover:bg-lime-400/20 
        transition-colors duration-300
      `}>
        {isPrevious ? (
          <ChevronLeft className="w-5 h-5 text-lime-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-lime-400" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">
          {isPrevious ? 'Artigo Anterior' : 'Próximo Artigo'}
        </div>
        <h3 className="text-sm font-semibold text-white group-hover:text-lime-400 transition-colors duration-300 line-clamp-2">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
            {article.excerpt}
          </p>
        )}
      </div>

      {/* Image */}
      {article.image_url && (
        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-800">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            width={64}
            height={64}
            loading="lazy"
            crossOrigin={article.image_url?.includes('images.unsplash.com') ? 'anonymous' : undefined}
            referrerPolicy={article.image_url?.includes('images.unsplash.com') ? 'no-referrer' : undefined}
          />
        </div>
      )}
    </Link>
  );
};

export const ArticleNavigation: React.FC<ArticleNavigationProps> = ({ 
  currentSlug, 
  categoryId, 
  className = '' 
}) => {
  const { previousArticle, nextArticle } = useArticleNavigation(currentSlug, categoryId);

  if (!previousArticle && !nextArticle) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-0.5 bg-gradient-to-r from-lime-400 to-purple-500"></div>
        <h2 className="text-xl font-bold text-white">Continue Lendo</h2>
        <div className="flex-1 h-0.5 bg-gradient-to-r from-purple-500 to-transparent"></div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {previousArticle && (
          <NavigationCard article={previousArticle} direction="previous" />
        )}
        {nextArticle && (
          <NavigationCard article={nextArticle} direction="next" />
        )}
      </div>
    </div>
  );
};