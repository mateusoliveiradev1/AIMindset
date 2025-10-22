import { z } from 'zod';

// Schema de validação para feedback
export const FeedbackSchema = z.object({
  useful: z.boolean()
});

export type FeedbackFormData = z.infer<typeof FeedbackSchema>;

// Função para validar dados de feedback
export const validateFeedback = (data: unknown) => {
  return FeedbackSchema.safeParse(data);
};

// Função para verificar se já foi enviado feedback (localStorage)
export const hasAlreadySubmittedFeedback = (articleId: string): boolean => {
  try {
    const submittedFeedbacks = JSON.parse(localStorage.getItem('submittedFeedbacks') || '[]');
    return submittedFeedbacks.includes(articleId);
  } catch {
    return false;
  }
};

// Função para marcar feedback como enviado
export const markFeedbackAsSubmitted = (articleId: string): void => {
  try {
    const submittedFeedbacks = JSON.parse(localStorage.getItem('submittedFeedbacks') || '[]');
    if (!submittedFeedbacks.includes(articleId)) {
      submittedFeedbacks.push(articleId);
      localStorage.setItem('submittedFeedbacks', JSON.stringify(submittedFeedbacks));
    }
  } catch (error) {
    console.error('Erro ao salvar feedback no localStorage:', error);
  }
};

// Função para limpar feedbacks antigos (opcional)
export const clearOldFeedbacks = (): void => {
  try {
    localStorage.removeItem('submittedFeedbacks');
  } catch (error) {
    console.error('Erro ao limpar feedbacks do localStorage:', error);
  }
};