import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useArticles } from './useArticles';

export interface ArticleMetrics {
  article_id: number;
  article_title: string;
  positive_feedback: number;
  negative_feedback: number;
  total_comments: number;
  approval_rate: number;
  last_updated: string;
}

export const useArticleMetrics = () => {
  const [metrics, setMetrics] = useState<ArticleMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { articles } = useArticles();

  const loadMetrics = useCallback(async () => {
    const publishedArticles = articles?.filter(article => article.published) || [];
    
    if (publishedArticles.length === 0) {
      setMetrics([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const articleIds = publishedArticles.map(article => article.id.toString());

      // Carregar feedbacks
      const { data: feedbacks, error: feedbackError } = await supabase
        .from('feedback')
        .select('article_id, useful')
        .in('article_id', articleIds);

      if (feedbackError) throw feedbackError;

      // Carregar comentários
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('article_id')
        .in('article_id', articleIds);

      if (commentsError) throw commentsError;

      // Processar métricas
      const processedMetrics = publishedArticles.map(article => {
        const articleFeedbacks = feedbacks?.filter(f => f.article_id === article.id.toString()) || [];
        const articleComments = comments?.filter(c => c.article_id === article.id.toString()) || [];

        const positiveFeedback = articleFeedbacks.filter(f => f.useful === true).length;
        const negativeFeedback = articleFeedbacks.filter(f => f.useful === false).length;
        const totalFeedback = positiveFeedback + negativeFeedback;
        const approvalRate = totalFeedback > 0 ? (positiveFeedback / totalFeedback) * 100 : 0;

        return {
          article_id: article.id,
          article_title: article.title,
          positive_feedback: positiveFeedback,
          negative_feedback: negativeFeedback,
          total_comments: articleComments.length,
          approval_rate: Math.round(approvalRate * 100) / 100,
          last_updated: new Date().toISOString()
        };
      });

      setMetrics(processedMetrics);
      console.log(`✅ [METRICS] ${processedMetrics.length} métricas carregadas`);

    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [articles]);

  const refreshMetrics = useCallback(() => {
    loadMetrics();
  }, [loadMetrics]);

  return {
    metrics,
    loading,
    error,
    loadMetrics,
    refreshMetrics
  };
};