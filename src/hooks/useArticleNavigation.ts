import { useState, useEffect } from 'react';
import { useArticles } from './useArticles';

export interface NavigationArticle {
  id: number;
  title: string;
  slug: string;
  image_url?: string;
  excerpt?: string;
}

export const useArticleNavigation = (currentSlug: string, categoryId?: string) => {
  const { articles } = useArticles();
  const [previousArticle, setPreviousArticle] = useState<NavigationArticle | null>(null);
  const [nextArticle, setNextArticle] = useState<NavigationArticle | null>(null);

  useEffect(() => {
    if (!articles.length || !currentSlug) {
      return;
    }

    // Filter articles by category if provided, otherwise use all articles
    const filteredArticles = categoryId 
      ? articles.filter(article => article.category_id === categoryId)
      : articles;

    // Sort by created_at descending (newest first)
    const sortedArticles = [...filteredArticles].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const currentIndex = sortedArticles.findIndex(article => article.slug === currentSlug);
    
    if (currentIndex === -1) {
      return;
    }

    // Previous article (newer)
    const prevArticle = currentIndex > 0 ? sortedArticles[currentIndex - 1] : null;
    
    if (prevArticle) {
      setPreviousArticle({
        id: prevArticle.id,
        title: prevArticle.title,
        slug: prevArticle.slug,
        image_url: prevArticle.image_url,
        excerpt: prevArticle.excerpt
      });
    } else {
      setPreviousArticle(null);
    }

    // Next article (older)
    const nextArt = currentIndex < sortedArticles.length - 1 ? sortedArticles[currentIndex + 1] : null;
    
    if (nextArt) {
      setNextArticle({
        id: nextArt.id,
        title: nextArt.title,
        slug: nextArt.slug,
        image_url: nextArt.image_url,
        excerpt: nextArt.excerpt
      });
    } else {
      setNextArticle(null);
    }
  }, [articles, currentSlug, categoryId]);

  return {
    previousArticle,
    nextArticle
  };
};