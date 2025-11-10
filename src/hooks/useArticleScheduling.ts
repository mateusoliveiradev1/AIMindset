import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { rpcWithAuth } from '@/lib/supabaseRpc';
import { useToast } from './useToast';
import { useAuth } from '@/contexts/AuthContext';
import { logEvent, logSystem } from '@/lib/logging';

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

  // ✅ Garante que o token/sessão esteja persistido antes das RPCs
  const ensureTokenPersisted = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.warn('⚠️ Erro ao obter sessão antes da RPC:', error.message);
      }
      let effectiveSession = session || null;

      // Tentar refresh se sessão não veio
      if (!effectiveSession) {
        try {
          const refreshRes = await supabase.auth.refreshSession();
          effectiveSession = refreshRes.data?.session || null;
          if (!effectiveSession && refreshRes.error) {
            console.warn('⚠️ Falha no refreshSession:', refreshRes.error.message);
          }
        } catch (e: any) {
          console.warn('⚠️ Exceção em refreshSession:', e?.message || e);
        }
      }

      if (effectiveSession?.access_token) {
        const payload = JSON.stringify({ access_token: effectiveSession.access_token, session: effectiveSession });
        try {
          localStorage.setItem('aimindset.auth.token', payload);
          // Persistir também aimindset_session para alinhamento com RPC
          localStorage.setItem('aimindset_session', JSON.stringify(effectiveSession));
        } catch (e) {
          try {
            sessionStorage.setItem('aimindset.auth.token', payload);
            sessionStorage.setItem('aimindset_session', JSON.stringify(effectiveSession));
          } catch (e2) {
            console.error('💥 Falha ao persistir sessão/token em qualquer storage:', e2);
          }
        }
      }
    } catch {}
  }, []);

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

      // Confia no estado do AuthContext; sessão será gerenciada pelo SDK

      // Validar ID do artigo
      if (!isValidUUID(articleId)) {
        throw new Error('ID do artigo inválido. Salve o artigo para gerar um ID antes de agendar.');
      }

      // Validações no frontend
      const scheduledDate = new Date(schedulingData.scheduled_for);
      const now = new Date();
      const minDate = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutos no futuro
      const maxDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 ano no futuro

      // Horário já passou
      if (scheduledDate.getTime() <= now.getTime()) {
        throw new Error('O horário selecionado já passou');
      }

      if (scheduledDate < minDate) {
        throw new Error('A data de agendamento deve ser pelo menos 5 minutos no futuro');
      }

      if (scheduledDate > maxDate) {
        throw new Error('A data de agendamento não pode ser mais de 1 ano no futuro');
      }

      // Verificar se artigo já está publicado
      const { data: article, error: articleError } = await supabase
        .from('articles')
        .select('id, published, scheduling_status')
        .eq('id', articleId)
        .single();

      if (articleError) {
        throw new Error('Falha ao verificar status do artigo');
      }

      if (article?.published) {
        throw new Error('Este artigo já está publicado e não pode ser agendado');
      }

      // Verificar conflitos de horário
      const hasConflict = await checkSchedulingConflicts(schedulingData.scheduled_for, articleId);
      if (hasConflict) {
        throw new Error('Já existe um artigo agendado para este horário');
      }

      // Chamar função RPC
      await ensureTokenPersisted();
      // Obter token diretamente da sessão atual para evitar dependência de storage
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const data = await rpcWithAuth<SchedulingResult>('schedule_article', {
        article_id: articleId,
        scheduled_date: schedulingData.scheduled_for,
        reason: schedulingData.reason || 'Agendamento via interface',
        metadata: schedulingData.metadata || {}
      }, accessToken || undefined);

      if (!data.success) {
        throw new Error(data.error || 'Erro ao agendar artigo');
      }

      // Determinar mensagem amigável conforme origem (criação vs edição)
      const previousStatus = schedulingData.metadata?.previousStatus as string | undefined;
      const successMessage = previousStatus === 'scheduled' ? 'Agendamento atualizado com sucesso!' : 'Artigo agendado com sucesso!';
      showToast('success', successMessage);
      // Logs de aplicação e sistema
      await logEvent('info', 'useArticleScheduling', previousStatus === 'scheduled' ? 'scheduling_updated' : 'scheduling_created', {
        article_id: articleId,
        scheduled_for: schedulingData.scheduled_for,
        previous_status: previousStatus,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
      });
      await logSystem('general', previousStatus === 'scheduled' ? 'Agendamento atualizado' : 'Agendamento criado', {
        component: 'useArticleScheduling',
        function_name: 'scheduleArticle'
      });
      return {
        success: true,
        article_id: data.article_id,
        message: data.message
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao agendar artigo';
      showToast('error', errorMessage);
      // Logar erro
      try {
        await logEvent('error', 'useArticleScheduling', 'scheduling_error', {
          article_id: articleId,
          scheduled_for: schedulingData?.scheduled_for,
          error_stack: error instanceof Error ? error.stack : undefined
        });
        await logSystem('general', 'Falha de publicação: motivo X', {
          component: 'useArticleScheduling',
          function_name: 'scheduleArticle',
          error_code: 'SCHEDULING_VALIDATION_OR_RPC_ERROR',
          stack_trace: error instanceof Error ? error.stack : undefined
        });
      } catch {}
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [showToast, isAuthenticated]);

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

      // Confia no estado do AuthContext; sessão será gerenciada pelo SDK

      // Validar ID do artigo
      if (!isValidUUID(articleId)) {
        throw new Error('ID do artigo inválido. Não é possível cancelar agendamento sem um ID válido.');
      }
      await ensureTokenPersisted();
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const data = await rpcWithAuth<SchedulingResult>('cancel_scheduled_article', {
        article_id: articleId,
        reason: reason || 'Cancelamento via interface'
      }, accessToken || undefined);

      if (!data.success) {
        throw new Error(data.error || 'Erro ao cancelar agendamento');
      }

      showToast('success', 'Agendamento cancelado com sucesso!');
      await logEvent('info', 'useArticleScheduling', 'scheduling_cancelled', {
        article_id: articleId,
        reason
      });
      await logSystem('general', 'Agendamento cancelado', {
        component: 'useArticleScheduling',
        function_name: 'cancelScheduling'
      });
      return {
        success: true,
        article_id: data.article_id,
        message: data.message
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao cancelar agendamento';
      showToast('error', errorMessage);
      try {
        await logEvent('error', 'useArticleScheduling', 'scheduling_cancel_error', {
          article_id: articleId,
          error_stack: error instanceof Error ? error.stack : undefined
        });
      } catch {}
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [showToast, isAuthenticated]);

  // Função para buscar artigos agendados
  const fetchScheduledArticles = useCallback(async (
    filterStatus: string = 'scheduled',
    limit: number = 50,
    offset: number = 0
  ): Promise<ScheduledArticle[]> => {
    try {
      setLoading(true);
      // Manutenção automática: limpar cancelados antigos sem afetar UI
      await cleanupOldCancelled();

      // Garantir que usuário esteja autenticado
      if (!isAuthenticated) {
        throw new Error('Você precisa estar autenticado para listar agendamentos');
      }
      await ensureTokenPersisted();
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const data = await rpcWithAuth<ScheduledArticle[]>('get_scheduled_articles', {
        filter_status: filterStatus,
        limit_count: limit,
        offset_count: offset
      }, accessToken || undefined);
      // Detectar transições de scheduled -> published para logar publicação automática
      try {
        const previousById = new Map<string, string>();
        for (const item of scheduledArticles) {
          previousById.set(item.id, item.scheduling_status);
        }
        for (const item of (data || [])) {
          const prevStatus = previousById.get(item.id);
          if (prevStatus === 'scheduled' && item.scheduling_status === 'published') {
            await logEvent('info', 'useArticleScheduling', 'auto_publish_performed', {
              article_id: item.id,
              scheduled_for: item.scheduled_for
            });
            await logSystem('general', 'Publicação automática realizada', {
              component: 'useArticleScheduling',
              function_name: 'fetchScheduledArticles',
              article_id: item.id
            });
          }
        }
      } catch {}

      const sorted = (data || []).slice().sort((a, b) => {
        const at = new Date(a.scheduled_for).getTime();
        const bt = new Date(b.scheduled_for).getTime();
        return at - bt;
      });
      setScheduledArticles(sorted);
      return sorted;

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

  // Indicador de tempo restante (para consumo em tooltips/titles)
  const getRemainingTimeLabel = useCallback((dateString: string): string => {
    const target = new Date(dateString).getTime();
    const now = Date.now();
    const diffMs = target - now;
    if (diffMs <= 0) return 'horário já passou';
    const minutes = Math.floor(diffMs / (60 * 1000));
    if (minutes < 60) return `publica em ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `publica em ${hours} h`;
    const days = Math.floor(hours / 24);
    return `publica em ${days} dia(s)`;
  }, []);

  // Manutenção automática: limpar agendamentos cancelados há > 30 dias (executa no cliente, sem alterar UI)
  const cleanupOldCancelled = useCallback(async (): Promise<void> => {
    try {
      const lastRunRaw = localStorage.getItem('aimindset_cleanup_cancelled_last_run');
      const lastRun = lastRunRaw ? parseInt(lastRunRaw, 10) : 0;
      const nowTs = Date.now();
      // executar no máximo 1 vez por dia
      if (nowTs - lastRun < 24 * 60 * 60 * 1000) {
        return;
      }
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('scheduling_status', 'cancelled')
        .lt('updated_at', cutoff);
      if (error) {
        console.warn('Falha ao limpar cancelados antigos:', error.message);
        return;
      }
      localStorage.setItem('aimindset_cleanup_cancelled_last_run', String(nowTs));
      await logSystem('general', 'Manutenção: cancelados antigos limpos', {
        component: 'useArticleScheduling',
        function_name: 'cleanupOldCancelled'
      });
    } catch (err) {
      console.warn('Erro na manutenção automática de cancelados:', err instanceof Error ? err.message : err);
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

    if (scheduledDate.getTime() <= now.getTime()) {
      return { valid: false, error: 'O horário selecionado já passou' };
    }

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
    validateSchedulingDate,
    getRemainingTimeLabel,
    cleanupOldCancelled
  };
};