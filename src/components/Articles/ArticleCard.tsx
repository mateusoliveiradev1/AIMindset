import React, { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Eye, Heart, Tag, ArrowRight } from 'lucide-react';
import { Card } from '../UI/Card';
import { computeReadingTime } from '../../hooks/useReadingTime';
import { Article } from '../../types';

interface ArticleCardProps {
  article: Article;
  viewMode?: 'grid' | 'list';
  showImage?: boolean;
  showStats?: boolean;
  className?: string;
}

export const ArticleCard = memo<ArticleCardProps>(({ 
  article, 
  viewMode = 'grid',
  showImage = true,
  showStats = true,
  className = ''
}) => {
  // Calcular tempo de leitura
  const readTime = useMemo(() => {
    return computeReadingTime(article.content || '');
  }, [article.content]);

  // Formatar data
  const formatDate = useMemo(() => {
    return new Date(article.publishedAt).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }, [article.publishedAt]);

  // Processar tags
  const tags = useMemo(() => {
    if (!article.tags) return [];
    if (typeof article.tags === 'string') {
      return article.tags.split(',').map(t => t.trim()).filter(t => t);
    }
    if (Array.isArray(article.tags)) {
      return article.tags;
    }
    return [];
  }, [article.tags]);

  const cardClass = viewMode === 'list' 
    ? `glass-effect hover-lift group flex flex-col md:flex-row ${className}`
    : `glass-effect hover-lift group ${className}`;

  const imageClass = viewMode === 'list'
    ? "w-full md:w-48 h-48 md:h-auto object-cover"
    : "w-full h-48 object-cover";

  return (
    <Card className={cardClass}>
      {showImage && article.imageUrl && (
        <div className={viewMode === 'list' ? "md:flex-shrink-0" : ""}>
          <img
            src={article.imageUrl}
            alt={article.title}
            className={imageClass}
            loading="lazy"
            decoding="async"
          />
        </div>
      )}
      
      <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
        {/* Categoria */}
        <div className="flex items-center justify-between mb-4">
          <span className="px-3 py-1 bg-neon-purple/20 text-neon-purple rounded-full text-xs font-montserrat font-medium">
            {typeof article.category === 'string' ? article.category : article.category?.name}
          </span>
          {article.featured && (
            <span className="px-2 py-1 bg-lime-green/20 text-lime-green rounded text-xs font-roboto">
              Destaque
            </span>
          )}
        </div>

        {/* Título */}
        <h3 className="font-orbitron font-bold text-xl text-white mb-3 group-hover:text-lime-green transition-colors duration-300 line-clamp-2">
          <Link to={`/artigo/${article.slug}`}>
            {article.title}
          </Link>
        </h3>

        {/* Excerpt */}
        <p className="text-futuristic-gray text-sm mb-4 line-clamp-3">
          {article.excerpt}
        </p>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-futuristic-gray/10 text-futuristic-gray rounded text-xs font-roboto"
              >
                #{tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="px-2 py-1 bg-futuristic-gray/10 text-futuristic-gray rounded text-xs font-roboto">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        {showStats && (
          <div className="flex items-center gap-4 mb-4 text-futuristic-gray text-xs">
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {readTime} min
            </div>
            {article.views && (
              <div className="flex items-center">
                <Eye className="w-3 h-3 mr-1" />
                {article.views.toLocaleString()}
              </div>
            )}
            {article.likes && (
              <div className="flex items-center">
                <Heart className="w-3 h-3 mr-1" />
                {article.likes.toLocaleString()}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-neon-purple/20">
          <div className="flex items-center text-futuristic-gray text-xs">
            <Calendar className="w-3 h-3 mr-1" />
            {formatDate}
          </div>
          
          <Link
            to={`/artigo/${article.slug}`}
            className="text-lime-green hover:text-white text-sm font-medium transition-colors duration-300 flex items-center"
          >
            Ler artigo
            <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </div>
      </div>
    </Card>
  );
});

ArticleCard.displayName = 'ArticleCard';