import { useState, useEffect } from 'react';
import { useArticles } from './useArticles';

export interface NavigationArticle {
  id: string;
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
    console.log('🔍 useArticleNavigation - Iniciando:', { currentSlug, categoryId, articlesLength: articles.length });
    
    if (!articles.length || !currentSlug) {
      console.warn('❌ Dados insuficientes:', { articles: articles.length, currentSlug });
      return;
    }

    // Filter articles by category if provided, otherwise use all articles
    const filteredArticles = categoryId 
      ? articles.filter(article => article.category_id === categoryId)
      : articles;

    console.log('📋 Artigos filtrados:', filteredArticles.length, filteredArticles.map(a => ({ title: a.title, slug: a.slug })));

    // Sort by created_at descending (newest first)
    const sortedArticles = [...filteredArticles].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const currentIndex = sortedArticles.findIndex(article => article.slug === currentSlug);
    console.log('📍 Índice do artigo atual:', currentIndex, 'de', sortedArticles.length);
    
    if (currentIndex === -1) {
      console.warn('❌ Artigo atual não encontrado na lista');
      return;
    }

    // Previous article (newer)
    const prevArticle = currentIndex > 0 ? sortedArticles[currentIndex - 1] : null;
    console.log('⬅️ Artigo anterior:', prevArticle ? prevArticle.title : 'Nenhum');
    
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
    console.log('➡️ Próximo artigo:', nextArt ? nextArt.title : 'Nenhum');
    
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