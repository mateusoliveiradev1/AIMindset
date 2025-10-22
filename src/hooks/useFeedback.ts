import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { validateFeedback, hasAlreadySubmittedFeedback, markFeedbackAsSubmitted } from '../utils/feedbackValidation';
import { toast } from 'sonner';

export interface Feedback {
  id: string;
  article_id: number;
  useful: boolean;
  created_at: string;
}

interface UseFeedbackReturn {
  submitting: boolean;
  hasSubmitted: boolean;
  error: string | null;
  submitFeedback: (useful: boolean) => Promise<boolean>;
  checkSubmissionStatus: () => boolean;
}

export const useFeedback = (articleId: number): UseFeedbackReturn => {
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(() => hasAlreadySubmittedFeedback(articleId.toString()));
  const [error, setError] = useState<string | null>(null);

  // Verificar status de submissão
  const checkSubmissionStatus = useCallback(() => {
    const status = hasAlreadySubmittedFeedback(articleId.toString());
    setHasSubmitted(status);
    return status;
  }, [articleId]);

  // Submeter feedback
  const submitFeedback = useCallback(async (useful: boolean): Promise<boolean> => {
    try {
      setSubmitting(true);
      setError(null);

      // Verificar se já foi enviado
      if (hasAlreadySubmittedFeedback(articleId.toString())) {
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
      const { error: insertError } = await supabase
        .from('feedback')
        .insert({
          article_id: articleId,
          useful: useful
        });

      if (insertError) {
        throw insertError;
      }

      // Marcar como enviado no localStorage
      markFeedbackAsSubmitted(articleId.toString());
      setHasSubmitted(true);
      
      // Mostrar mensagem de sucesso
      const message = useful 
        ? 'Obrigado! Seu feedback nos ajuda a melhorar.' 
        : 'Obrigado pelo feedback! Vamos trabalhar para melhorar.';
      toast.success(message);
      
      return true;
      
    } catch (err) {
      console.error('Erro ao enviar feedback:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar feedback';
      setError(errorMessage);
      toast.error('Erro ao enviar feedback. Tente novamente.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [articleId]);

  return {
    submitting,
    hasSubmitted,
    error,
    submitFeedback,
    checkSubmissionStatus
  };
};