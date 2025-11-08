import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from './useToast';
import { useAuth } from '@/contexts/AuthContext';

export interface SchedulingData {
  scheduled_for: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface ScheduledArticle {
  id: string;
  title: string;
  slug: string;
  scheduled_for: string;
  scheduled_by: string;
  scheduling_reason: string;
  scheduling_status: string;
  author_name: string;
  author_email: string;
  created_at: string;
}

export interface SchedulingResult {
  success: boolean;
  article_id?: string;
  message?: string;
  error?: string;
}

export const useArticleScheduling = () => {
  const [loading, setLoading] = useState(false);
  const [scheduledArticles, setScheduledArticles] = useState<ScheduledArticle[]>([]);
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();

  // Validação simples de UUID v4 (formato 8-4-4-4-12 hex)
  const isValidUUID = (value: string): boolean => {
    if (!value || typeof value !== 'string') return false;
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value);
  };

  // Função para agendar artigo
  const scheduleArticle = useCallback(async (
    articleId: string,
    schedulingData: SchedulingData
  ): Promise<SchedulingResult> => {
    try {
      setLoading(true);

      // Garantir que usuário esteja autenticado
      if (!isAuthenticated) {
        throw new Error('Você precisa estar autenticado para agendar artigos');
      }

      // Validar sessão ativa
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Sessão expirada ou inválida. Faça login novamente.');
      }

      // Validar ID do artigo
      if (!isValidUUID(articleId)) {
        throw new Error('ID do artigo inválido. Salve o artigo para gerar um ID antes de agendar.');
      }

      // Validações no frontend
      const scheduledDate = new Date(schedulingData.scheduled_for);
      const now = new Date();
      const minDate = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutos no futuro
      const maxDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 ano no futuro

      if (scheduledDate < minDate) {
        throw new Error('A data de agendamento deve ser pelo menos 5 minutos no futuro');
      }

      if (scheduledDate > maxDate) {
        throw new Error('A data de agendamento não pode ser mais de 1 ano no futuro');
      }

      // Chamar função RPC
      const { data, error } = await supabase
        .rpc('schedule_article', {
          article_id: articleId,
          scheduled_date: schedulingData.scheduled_for,
          reason: schedulingData.reason || 'Agendamento via interface',
          metadata: schedulingData.metadata || {}
        });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao agendar artigo');
      }

      showToast('success', 'Artigo agendado com sucesso!');
      return {
        success: true,
        article_id: data.article_id,
        message: data.message
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao agendar artigo';
      showToast('error', errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Função para cancelar agendamento
  const cancelScheduling = useCallback(async (
    articleId: string,
    reason?: string
  ): Promise<SchedulingResult> => {
    try {
      setLoading(true);

      // Garantir que usuário esteja autenticado
      if (!isAuthenticated) {
        throw new Error('Você precisa estar autenticado para cancelar agendamentos');
      }

      // Validar sessão ativa
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Sessão expirada ou inválida. Faça login novamente.');
      }

      // Validar ID do artigo
      if (!isValidUUID(articleId)) {
        throw new Error('ID do artigo inválido. Não é possível cancelar agendamento sem um ID válido.');
      }

      const { data, error } = await supabase
        .rpc('cancel_scheduled_article', {
          article_id: articleId,
          reason: reason || 'Cancelamento via interface'
        });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao cancelar agendamento');
      }

      showToast('success', 'Agendamento cancelado com sucesso!');
      return {
        success: true,
        article_id: data.article_id,
        message: data.message
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao cancelar agendamento';
      showToast('error', errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Função para buscar artigos agendados
  const fetchScheduledArticles = useCallback(async (
    filterStatus: string = 'scheduled',
    limit: number = 50,
    offset: number = 0
  ): Promise<ScheduledArticle[]> => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .rpc('get_scheduled_articles', {
          filter_status: filterStatus,
          limit_count: limit,
          offset_count: offset
        });

      if (error) {
        throw new Error(error.message);
      }

      setScheduledArticles(data || []);
      return data || [];

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar artigos agendados';
      showToast('error', errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Função para verificar conflitos de agendamento
  const checkSchedulingConflicts = useCallback(async (
    scheduledDate: string,
    excludeArticleId?: string
  ): Promise<boolean> => {
    try {
      let query = supabase
        .from('articles')
        .select('id, title, scheduled_for')
        .eq('scheduling_status', 'scheduled')
        .eq('scheduled_for', scheduledDate);

      if (excludeArticleId) {
        query = query.neq('id', excludeArticleId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return (data?.length || 0) > 0;

    } catch (error) {
      console.error('Erro ao verificar conflitos:', error);
      return false;
    }
  }, []);

  // Função auxiliar para formatar data de agendamento
  const formatSchedulingDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Função auxiliar para validar data de agendamento
  const validateSchedulingDate = useCallback((dateString: string): { valid: boolean; error?: string } => {
    const scheduledDate = new Date(dateString);
    const now = new Date();
    const minDate = new Date(now.getTime() + 5 * 60 * 1000);
    const maxDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    if (scheduledDate < minDate) {
      return { valid: false, error: 'A data deve ser pelo menos 5 minutos no futuro' };
    }

    if (scheduledDate > maxDate) {
      return { valid: false, error: 'A data não pode ser mais de 1 ano no futuro' };
    }

    return { valid: true };
  }, []);

  return {
    loading,
    scheduledArticles,
    scheduleArticle,
    cancelScheduling,
    fetchScheduledArticles,
    checkSchedulingConflicts,
    formatSchedulingDate,
    validateSchedulingDate
  };
};