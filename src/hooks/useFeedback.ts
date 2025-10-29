import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { validateFeedback, hasAlreadySubmittedFeedback, markFeedbackAsSubmitted } from '../utils/feedbackValidation';
import { toast } from 'sonner';
import { invalidateFeedbackMetrics } from '../utils/forceCacheCleanup';

export interface Feedback {
  id: string;
  article_id: string;
  type: 'positive' | 'negative';
  created_at: string;
}

interface UseFeedbackReturn {
  submitting: boolean;
  hasSubmitted: boolean;
  error: string | null;
  submitFeedback: (useful: boolean) => Promise<boolean>;
  checkSubmissionStatus: () => boolean;
  getEngagementMetrics: () => Promise<EngagementMetrics>;
}

interface EngagementMetrics {
  total_likes: number;
  total_replies: number;
  engagement_rate: number;
  active_comments: number;
}

export const useFeedback = (articleId: string): UseFeedbackReturn => {
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(() => hasAlreadySubmittedFeedback(articleId));
  const [error, setError] = useState<string | null>(null);

  // Verificar status de submissão
  const checkSubmissionStatus = useCallback(() => {
    const status = hasAlreadySubmittedFeedback(articleId);
    setHasSubmitted(status);
    return status;
  }, [articleId]);

  // Submeter feedback
  const submitFeedback = useCallback(async (useful: boolean): Promise<boolean> => {
    try {
      setSubmitting(true);
      setError(null);

      // Verificar se já foi enviado
      if (hasAlreadySubmittedFeedback(articleId)) {
        setError('Você já avaliou este artigo');
        toast.error('Você já avaliou este artigo');
        setHasSubmitted(true);
        return false;
      }

      // Validar dados
      const validation = validateFeedback({ useful });
      if (!validation.success) {
        const errorMessage = validation.error.issues[0]?.message || 'Dados inválidos';
        setError(errorMessage);
        toast.error(errorMessage);
        return false;
      }

      // Inserir no banco
      // console.log('📝 [FEEDBACK] Enviando feedback:', { articleId, useful });
      const { error: insertError } = await supabase
        .from('feedbacks')
        .insert({
          article_id: articleId,
          type: useful ? 'positive' : 'negative',
          user_id: null // Usuário anônimo por enquanto
        });
      
      console.log('📝 [DEBUG] Resultado da inserção:', { insertError });

      if (insertError) {
        throw insertError;
      }

      // IMPORTANTE: Invalidar cache após inserir feedback
      try {
        await invalidateFeedbackMetrics();
        console.log('✅ [FEEDBACK] Cache de métricas invalidado após feedback');
      } catch (cacheError) {
        console.warn('⚠️ [FEEDBACK] Erro ao invalidar cache:', cacheError);
        // Não falhar a operação por causa do cache
      }

      // Marcar como enviado no localStorage
      markFeedbackAsSubmitted(articleId);
      setHasSubmitted(true);
      
      // Mostrar mensagem de sucesso
      const message = useful 
        ? 'Obrigado! Seu feedback nos ajuda a melhorar.' 
        : 'Obrigado pelo feedback! Vamos trabalhar para melhorar.';
      toast.success(message);
      
      return true;
      
    } catch (err) {
      console.error('❌ [FEEDBACK] Erro ao enviar feedback:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar feedback';
      setError(errorMessage);
      toast.error('Erro ao enviar feedback. Tente novamente.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [articleId]);

  // Função para buscar métricas de engajamento globais
  const getEngagementMetrics = useCallback(async (): Promise<EngagementMetrics> => {
    try {
      console.log('📊 [FEEDBACK] Buscando métricas de engajamento globais');
      
      // Buscar todos os comentários com likes e parent_id
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('id, likes, parent_id');

      if (commentsError) {
        console.error('❌ [FEEDBACK] Erro ao buscar comentários:', commentsError);
        throw commentsError;
      }

      // Calcular métricas
      const totalLikes = commentsData?.reduce((sum, comment) => sum + (Number(comment.likes) || 0), 0) || 0;
      const totalReplies = commentsData?.filter(comment => comment.parent_id !== null).length || 0;
      const activeComments = commentsData?.filter(comment => 
        (Number(comment.likes) || 0) > 0 || comment.parent_id !== null
      ).length || 0;
      
      const engagementRate = commentsData && commentsData.length > 0 
        ? (activeComments / commentsData.length) * 100 
        : 0;

      const metrics: EngagementMetrics = {
        total_likes: totalLikes,
        total_replies: totalReplies,
        engagement_rate: Math.round(engagementRate * 100) / 100,
        active_comments: activeComments
      };

      console.log('✅ [FEEDBACK] Métricas de engajamento calculadas:', metrics);
      return metrics;

    } catch (error) {
      console.error('❌ [FEEDBACK] Erro ao calcular métricas de engajamento:', error);
      // Retornar métricas zeradas em caso de erro
      return {
        total_likes: 0,
        total_replies: 0,
        engagement_rate: 0,
        active_comments: 0
      };
    }
  }, []);

  return {
    submitting,
    hasSubmitted,
    error,
    submitFeedback,
    checkSubmissionStatus,
    getEngagementMetrics
  };
};