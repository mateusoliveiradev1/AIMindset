import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface FeedbackStats {
  totalFeedbacks: number;
  positiveFeedbacks: number;
  negativeFeedbacks: number;
  approvalRate: number;
}

interface UseFeedbackStatsReturn {
  stats: FeedbackStats;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}

// Função para verificar se é um ID mock (não é UUID válido)
const isMockId = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return !uuidRegex.test(id);
};

export const useArticleFeedbackStats = (articleId: string): UseFeedbackStatsReturn => {
  const [stats, setStats] = useState<FeedbackStats>({
    totalFeedbacks: 0,
    positiveFeedbacks: 0,
    negativeFeedbacks: 0,
    approvalRate: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const fetchingRef = useRef<boolean>(false);
  const debounceTimerRef = useRef<number | null>(null);

  const fetchStats = useCallback(async () => {
    if (!articleId) return;

    // Se for um ID mock, retornar dados mock
    if (isMockId(articleId)) {
      console.log('📊 [FEEDBACK-STATS] Usando dados mock para ID:', articleId);
      setLoading(false);
      setError(null);
      setStats({
        totalFeedbacks: 15,
        positiveFeedbacks: 12,
        negativeFeedbacks: 3,
        approvalRate: 80
      });
      return;
    }

    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      setLoading(true);
      setError(null);

      const normalizeError = (e: any) => {
        if (e && typeof e === 'object') {
          const m = (e as any).message || (e as any).error_description || (e as any).hint || (e as any).code;
          if (typeof m === 'string' && m.trim()) return m;
        }
        return 'Falha na conexão';
      };

      let feedbacks: any[] | null = null;
      let fetchError: any = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        const res = await supabase
          .from('feedbacks')
          .select('type')
          .eq('article_id', articleId);
        feedbacks = res.data as any[] | null;
        fetchError = res.error;
        if (!fetchError && feedbacks) break;
        const msg = normalizeError(fetchError);
        const transient = typeof msg === 'string' && (msg.includes('Failed to fetch') || msg.includes('ERR_INSUFFICIENT_RESOURCES'));
        if (transient && attempt === 0) {
          await new Promise(r => setTimeout(r, 300));
          continue;
        }
        break;
      }

      if (fetchError) {
        throw fetchError;
      }

      const totalFeedbacks = feedbacks?.length || 0;
      const positiveFeedbacks = feedbacks?.filter(f => f.type === 'positive').length || 0;
      const negativeFeedbacks = feedbacks?.filter(f => f.type === 'negative').length || 0;
      const approvalRate = totalFeedbacks > 0 ? Math.round((positiveFeedbacks / totalFeedbacks) * 100) : 0;

      setStats({ totalFeedbacks, positiveFeedbacks, negativeFeedbacks, approvalRate });
    } catch (err) {
      const errorMessage = (() => {
        if (err && typeof err === 'object') {
          const m = (err as any).message || (err as any).error_description || (err as any).hint || (err as any).code;
          if (typeof m === 'string' && m.trim()) return m;
        }
        return 'Falha na conexão';
      })();
      console.error('❌ [FEEDBACK-STATS] Erro ao buscar estatísticas:', err);
      setError(`Erro ao carregar estatísticas: ${errorMessage}`);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [articleId]);

  const setupRealtimeSubscription = useCallback(() => {
    if (!articleId || isMockId(articleId)) {
      console.log('📡 [FEEDBACK-STATS] Pulando subscription para ID mock:', articleId);
      return;
    }

    // Limpar subscription anterior
    if (subscriptionRef.current) {
      console.log('📡 [FEEDBACK-STATS] Removendo subscription anterior');
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    console.log('📡 [FEEDBACK-STATS] Configurando Real-Time subscription para artigo:', articleId);

    const channel = supabase
      .channel(`feedback-stats-${articleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feedbacks',
          filter: `article_id=eq.${articleId}`
        },
        (payload) => {
          if (debounceTimerRef.current) {
            window.clearTimeout(debounceTimerRef.current);
          }
          debounceTimerRef.current = window.setTimeout(() => {
            fetchStats();
          }, 300);
        }
      )
      .subscribe((status) => {
        console.log('📡 [FEEDBACK-STATS] Status da subscription:', status);
      });

    subscriptionRef.current = channel;
  }, [articleId, fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    setupRealtimeSubscription();

    return () => {
      if (subscriptionRef.current) {
        console.log('📡 [FEEDBACK-STATS] Limpando subscription no cleanup');
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [setupRealtimeSubscription]);

  const refreshStats = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refreshStats
  };
};
