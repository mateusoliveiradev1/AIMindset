import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export interface ArticleMetrics {
  article_id: number;
  article_title: string;
  positive_feedback: number;
  negative_feedback: number;
  total_comments: number;
  approval_rate: number;
  last_updated: string;
}

interface UseArticleMetricsReturn {
  metrics: ArticleMetrics[];
  loading: boolean;
  error: string | null;
  refreshMetrics: () => Promise<void>;
  getMetricsForArticle: (articleId: string) => ArticleMetrics | undefined;
}

export const useArticleMetrics = (): UseArticleMetricsReturn => {
  const [metrics, setMetrics] = useState<ArticleMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar métricas
  const loadMetrics = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .rpc('get_article_metrics');

      if (fetchError) {
        throw fetchError;
      }

      setMetrics(data || []);
      
    } catch (err) {
      console.error('Erro ao carregar métricas:', err);
      setError('Erro ao carregar métricas dos artigos');
      toast.error('Erro ao carregar métricas dos artigos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar métricas
  const refreshMetrics = useCallback(async () => {
    await loadMetrics();
  }, [loadMetrics]);

  // Obter métricas de um artigo específico
  const getMetricsForArticle = useCallback((articleId: string): ArticleMetrics | undefined => {
    return metrics.find(metric => metric.article_id.toString() === articleId);
  }, [metrics]);

  // Configurar listeners para atualizações em tempo real
  useEffect(() => {
    // Listener para novos comentários
    const commentsChannel = supabase
      .channel('comments_metrics')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments'
        },
        () => {
          // Atualizar métricas quando houver mudanças nos comentários
          refreshMetrics();
        }
      )
      .subscribe();

    // Listener para novo feedback
    const feedbackChannel = supabase
      .channel('feedback_metrics')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feedback'
        },
        () => {
          // Atualizar métricas quando houver mudanças no feedback
          refreshMetrics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(feedbackChannel);
    };
  }, [refreshMetrics]);

  // Carregar métricas iniciais
  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return {
    metrics,
    loading,
    error,
    refreshMetrics,
    getMetricsForArticle
  };
};