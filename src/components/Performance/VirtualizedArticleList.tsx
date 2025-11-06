import React, { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Tag } from 'lucide-react';
import Card from '../UI/Card';
import { computeReadingTime } from '../../hooks/useReadingTime';
import { useArticleVirtualScroll } from '../../hooks/useVirtualScroll';
import { Article } from '../../types';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface VirtualizedArticleListProps {
  articles: Article[];
  categories: Category[];
  containerHeight?: number;
  onArticleClick?: (article: Article) => void;
}

// Componente de artigo individual otimizado com memo
const ArticleCard = memo<{
  article: Article;
  categories: Category[];
  style: React.CSSProperties;
}>(({ article, categories, style }) => {
  // Calcular tempo de leitura
  const calculateReadTime = useMemo(() => {
    return computeReadingTime(article.content || '');
  }, [article.content]);

  // Formatar data
  const formatDate = useMemo(() => {
    return new Date(article.created_at).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }, [article.created_at]);

  // Encontrar categoria
  const categoryName = useMemo(() => {
    if (typeof article.category === 'string') return article.category;
    if (article.category?.name) return article.category.name;
    const category = categories.find(cat => cat.id === article.category_id);
    return category?.name || 'Sem categoria';
  }, [article.category, article.category_id, categories]);

  return (
    <div style={style} className="px-4 pb-6">
      <Card className="glass-effect hover-lift group h-full">
        <div className="p-6 h-full flex flex-col">
          {/* Categoria e tempo de leitura */}
          <div className="flex items-center justify-between mb-4">
            <span className="px-3 py-1 bg-neon-purple/20 text-neon-purple rounded-full text-xs font-montserrat font-medium">
              {categoryName}
            </span>
            <div className="flex items-center text-futuristic-gray text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {calculateReadTime} min
            </div>
          </div>

          {/* Imagem */}
          {article.image_url && (
            <Link 
              to={`/artigo/${article.slug}`} 
              className="block relative mb-4 w-full aspect-[16/9] overflow-hidden rounded-lg cursor-pointer"
            >
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          )}

          {/* Conteúdo */}
          <div className="flex-1 flex flex-col">
            <Link to={`/artigo/${article.slug}`} className="group">
              <h3 className="text-xl font-orbitron font-bold text-white mb-3 group-hover:text-lime-green transition-colors duration-300 line-clamp-2">
                {article.title}
              </h3>
            </Link>

            {article.excerpt && (
              <p className="text-futuristic-gray text-sm mb-4 line-clamp-3 flex-1">
                {article.excerpt}
              </p>
            )}

            {/* Meta informações */}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-neon-purple/20">
              <div className="flex items-center text-futuristic-gray text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate}
              </div>
              
              <Link
                to={`/artigo/${article.slug}`}
                className="text-lime-green hover:text-white text-sm font-medium transition-colors duration-300"
              >
                Ler artigo →
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
});

ArticleCard.displayName = 'ArticleCard';

// Componente principal virtualizado
export const VirtualizedArticleList: React.FC<VirtualizedArticleListProps> = memo(({
  articles,
  categories,
  containerHeight = 600,
  onArticleClick
}) => {
  const { virtualItems, totalHeight, scrollElementProps, containerProps } = useArticleVirtualScroll(
    articles,
    containerHeight
  );

  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-futuristic-gray text-lg">Nenhum artigo encontrado.</p>
      </div>
    );
  }

  return (
    <div {...scrollElementProps} className="virtual-scroll-container">
      <div {...containerProps}>
        {virtualItems.map(({ index, start, item: article }) => (
          <ArticleCard
            key={`${article.id}-${index}`}
            article={article}
            categories={categories}
            style={{
              position: 'absolute',
              top: start,
              left: 0,
              right: 0,
              height: 280
            }}
          />
        ))}
      </div>
    </div>
  );
});

VirtualizedArticleList.displayName = 'VirtualizedArticleList';