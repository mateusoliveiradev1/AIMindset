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

export const useArticleFeedbackStats = (articleId: string): UseFeedbackStatsReturn => {
  const [stats, setStats] = useState<FeedbackStats>({
    totalFeedbacks: 0,
    positiveFeedbacks: 0,
    negativeFeedbacks: 0,
    approvalRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);

  // Função para buscar estatísticas
  const fetchStats = useCallback(async () => {
    if (!articleId || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      console.log('📊 [FEEDBACK-STATS] Buscando estatísticas para artigo:', articleId);

      const { data: feedbacks, error: fetchError } = await supabase
        .from('feedback')
        .select('useful')
        .eq('article_id', articleId);

      if (fetchError) {
        throw fetchError;
      }

      if (!mountedRef.current) return;

      const totalFeedbacks = feedbacks?.length || 0;
      const positiveFeedbacks = feedbacks?.filter(f => f.useful === true).length || 0;
      const negativeFeedbacks = feedbacks?.filter(f => f.useful === false).length || 0;
      const approvalRate = totalFeedbacks > 0 ? (positiveFeedbacks / totalFeedbacks) * 100 : 0;

      const newStats = {
        totalFeedbacks,
        positiveFeedbacks,
        negativeFeedbacks,
        approvalRate: Math.round(approvalRate * 100) / 100
      };

      setStats(newStats);
      console.log('✅ [FEEDBACK-STATS] Estatísticas carregadas:', newStats);

    } catch (err) {
      console.error('❌ [FEEDBACK-STATS] Erro ao buscar estatísticas:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [articleId]);

  // Configurar Real-Time Subscription
  const setupRealtimeSubscription = useCallback(() => {
    if (!articleId) return;

    // Limpar canal existente
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    console.log('📡 [FEEDBACK-STATS] Configurando Real-Time subscription para artigo:', articleId);

    // Criar novo canal
    const channel = supabase
      .channel(`feedback_stats_${articleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feedback',
          filter: `article_id=eq.${articleId}`
        },
        (payload) => {
          console.log('🔄 [FEEDBACK-STATS] Feedback atualizado em tempo real:', payload);
          fetchStats();
        }
      )
      .subscribe((status) => {
        console.log('📡 [FEEDBACK-STATS] Status da subscription:', status);
      });

    channelRef.current = channel;
  }, [articleId, fetchStats]);

  // Effect principal
  useEffect(() => {
    mountedRef.current = true;
    
    if (!articleId) {
      setStats({
        totalFeedbacks: 0,
        positiveFeedbacks: 0,
        negativeFeedbacks: 0,
        approvalRate: 0
      });
      setLoading(false);
      return;
    }

    // Carregar estatísticas iniciais
    fetchStats();

    // Configurar Real-Time subscription
    setupRealtimeSubscription();

    // Cleanup
    return () => {
      mountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [articleId, fetchStats, setupRealtimeSubscription]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Função para refresh manual
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