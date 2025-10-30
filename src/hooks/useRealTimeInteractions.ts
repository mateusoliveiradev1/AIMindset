import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useRealTimeSync } from './useRealTimeSync';
import { toast } from 'sonner';

// Tipos para as interações em tempo real
export interface RealTimeInteraction {
  type: 'feedback' | 'comment' | 'like';
  action: 'insert' | 'update' | 'delete';
  data: any;
  articleId: string;
  timestamp: Date;
}

export interface RealTimeStats {
  totalFeedbacks: number;
  positiveFeedbacks: number;
  negativeFeedbacks: number;
  totalComments: number;
  totalLikes: number;
  lastUpdate: Date;
}

interface UseRealTimeInteractionsOptions {
  articleIds?: string[];
  enableNotifications?: boolean;
  debounceMs?: number;
}

export const useRealTimeInteractions = (options: UseRealTimeInteractionsOptions = {}) => {
  const { articleIds = [], enableNotifications = false, debounceMs = 500 } = options;
  
  // Estados
  const [interactions, setInteractions] = useState<RealTimeInteraction[]>([]);
  const [stats, setStats] = useState<Record<string, RealTimeStats>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs para gerenciar subscriptions
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const statsUpdateQueueRef = useRef<Set<string>>(new Set());

  // Hook de sincronização em tempo real com invalidação automática de cache
  const { invalidateAllCaches } = useRealTimeSync({
    onFeedbackChange: () => {
      console.log('🔄 [REALTIME-INTERACTIONS] Feedback change detected - reloading stats');
      loadInitialStats();
    },
    onCommentChange: () => {
      console.log('🔄 [REALTIME-INTERACTIONS] Comment change detected - reloading stats');
      loadInitialStats();
    },
    enableGlobalSync: true
  });

  // Função para processar atualizações de stats com debounce
  const processStatsUpdates = useCallback(async () => {
    const articlesToUpdate = Array.from(statsUpdateQueueRef.current);
    if (articlesToUpdate.length === 0) return;

    try {
      // Buscar stats atualizadas para todos os artigos na queue
      const { data: feedbackData } = await supabase
        .from('feedbacks')
        .select('article_id, type')
        .in('article_id', articlesToUpdate);

      const { data: commentData } = await supabase
        .from('comments')
        .select('article_id, likes')
        .in('article_id', articlesToUpdate);

      // Calcular stats por artigo
      const newStats: Record<string, RealTimeStats> = {};
      
      articlesToUpdate.forEach(articleId => {
        const articleFeedbacks = feedbackData?.filter(f => f.article_id === articleId) || [];
        const articleComments = commentData?.filter(c => c.article_id === articleId) || [];
        
        const positiveFeedbacks = articleFeedbacks.filter(f => f.type === 'positive').length;
        const negativeFeedbacks = articleFeedbacks.filter(f => f.type === 'negative').length;
        const totalComments = articleComments.length;
        const totalLikes = articleComments.reduce((sum, c) => sum + (c.likes || 0), 0);

        newStats[articleId] = {
          totalFeedbacks: positiveFeedbacks + negativeFeedbacks,
          positiveFeedbacks,
          negativeFeedbacks,
          totalComments,
          totalLikes,
          lastUpdate: new Date()
        };
      });

      // Atualizar estado
      setStats(prev => ({ ...prev, ...newStats }));
      
      // Limpar queue
      statsUpdateQueueRef.current.clear();
      
    } catch (err) {
      console.error('❌ Erro ao atualizar stats:', err);
      setError('Erro ao atualizar estatísticas');
    }
  }, []);

  // Função para agendar atualização de stats com debounce
  const scheduleStatsUpdate = useCallback((articleId: string) => {
    statsUpdateQueueRef.current.add(articleId);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(processStatsUpdates, debounceMs);
  }, [processStatsUpdates, debounceMs]);

  // Função para processar eventos de feedback
  const handleFeedbackChange = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    const articleId = newRecord?.article_id || oldRecord?.article_id;
    
    if (!articleId) return;

    const interaction: RealTimeInteraction = {
      type: 'feedback',
      action: eventType as 'insert' | 'update' | 'delete',
      data: newRecord || oldRecord,
      articleId,
      timestamp: new Date()
    };

    // Adicionar à lista de interações
    setInteractions(prev => [interaction, ...prev.slice(0, 99)]); // Manter apenas 100 mais recentes

    // Agendar atualização de stats
    scheduleStatsUpdate(articleId);

    // Notificação se habilitada
    if (enableNotifications && eventType === 'INSERT') {
      const feedbackType = newRecord.type === 'positive' ? 'útil' : 'não útil';
      toast.success(`Novo feedback: ${feedbackType}`, {
        description: `Artigo recebeu avaliação ${feedbackType}`,
        duration: 3000,
      });
    }
  }, [scheduleStatsUpdate, enableNotifications]);

  // Função para processar eventos de comentários
  const handleCommentChange = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    const articleId = newRecord?.article_id || oldRecord?.article_id;
    
    if (!articleId) return;

    const interaction: RealTimeInteraction = {
      type: 'comment',
      action: eventType as 'insert' | 'update' | 'delete',
      data: newRecord || oldRecord,
      articleId,
      timestamp: new Date()
    };

    // Adicionar à lista de interações
    setInteractions(prev => [interaction, ...prev.slice(0, 99)]);

    // Agendar atualização de stats
    scheduleStatsUpdate(articleId);

    // Notificação se habilitada
    if (enableNotifications && eventType === 'INSERT') {
      toast.success('Novo comentário!', {
        description: `${newRecord.user_name} comentou no artigo`,
        duration: 3000,
      });
    }
  }, [scheduleStatsUpdate, enableNotifications]);

  // Função para processar atualizações de likes em comentários
  const handleLikeChange = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    const record = newRecord || oldRecord;
    
    if (!record?.article_id) return;

    // Verificar se houve mudança nos likes
    const oldLikes = oldRecord?.likes || 0;
    const newLikes = newRecord?.likes || 0;
    
    if (oldLikes !== newLikes) {
      const interaction: RealTimeInteraction = {
        type: 'like',
        action: 'update',
        data: { 
          comment_id: record.id,
          old_likes: oldLikes,
          new_likes: newLikes,
          difference: newLikes - oldLikes
        },
        articleId: record.article_id,
        timestamp: new Date()
      };

      // Adicionar à lista de interações
      setInteractions(prev => [interaction, ...prev.slice(0, 99)]);

      // Agendar atualização de stats
      scheduleStatsUpdate(record.article_id);

      // Notificação se habilitada
      if (enableNotifications && newLikes > oldLikes) {
        toast.success('👍 Novo like!', {
          description: 'Um comentário recebeu uma curtida',
          duration: 2000,
        });
      }
    }
  }, [scheduleStatsUpdate, enableNotifications]);

  // Função para configurar subscriptions
  const setupSubscriptions = useCallback(() => {
    // Limpar subscriptions existentes
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];

    try {
      // Subscription para feedbacks
      const feedbackChannel = supabase
        .channel('realtime_feedbacks')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'feedbacks',
            filter: articleIds.length > 0 ? `article_id=in.(${articleIds.join(',')})` : undefined
          },
          handleFeedbackChange
        );

      // Subscription para comentários
      const commentChannel = supabase
        .channel('realtime_comments')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'comments',
            filter: articleIds.length > 0 ? `article_id=in.(${articleIds.join(',')})` : undefined
          },
          (payload) => {
            handleCommentChange(payload);
            handleLikeChange(payload); // Também processar mudanças de likes
          }
        );

      // Adicionar aos refs
      channelsRef.current = [feedbackChannel, commentChannel];

      // Subscrever aos canais
      feedbackChannel.subscribe((status) => {
        console.log('📡 Feedback channel status:', status);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
        }
      });

      commentChannel.subscribe((status) => {
        console.log('📡 Comment channel status:', status);
      });

    } catch (err) {
      console.error('❌ Erro ao configurar subscriptions:', err);
      setError('Erro ao conectar com tempo real');
      setIsConnected(false);
    }
  }, [articleIds, handleFeedbackChange, handleCommentChange, handleLikeChange]);

  // Função para carregar stats iniciais
  const loadInitialStats = useCallback(async () => {
    if (articleIds.length === 0) return;

    try {
      const { data: feedbackData } = await supabase
        .from('feedbacks')
        .select('article_id, type')
        .in('article_id', articleIds);

      const { data: commentData } = await supabase
        .from('comments')
        .select('article_id, likes')
        .in('article_id', articleIds);

      const initialStats: Record<string, RealTimeStats> = {};
      
      articleIds.forEach(articleId => {
        const articleFeedbacks = feedbackData?.filter(f => f.article_id === articleId) || [];
        const articleComments = commentData?.filter(c => c.article_id === articleId) || [];
        
        const positiveFeedbacks = articleFeedbacks.filter(f => f.type === 'positive').length;
        const negativeFeedbacks = articleFeedbacks.filter(f => f.type === 'negative').length;
        const totalComments = articleComments.length;
        const totalLikes = articleComments.reduce((sum, c) => sum + (c.likes || 0), 0);

        initialStats[articleId] = {
          totalFeedbacks: positiveFeedbacks + negativeFeedbacks,
          positiveFeedbacks,
          negativeFeedbacks,
          totalComments,
          totalLikes,
          lastUpdate: new Date()
        };
      });

      setStats(initialStats);
    } catch (err) {
      console.error('❌ Erro ao carregar stats iniciais:', err);
      setError('Erro ao carregar estatísticas iniciais');
    }
  }, [articleIds]);

  // Função para limpar recursos
  const cleanup = useCallback(() => {
    // Limpar timer de debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Remover subscriptions
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];

    // Resetar estados
    setIsConnected(false);
    setError(null);
  }, []);

  // Effect para configurar subscriptions quando articleIds mudam
  useEffect(() => {
    if (articleIds.length > 0) {
      loadInitialStats();
      setupSubscriptions();
    } else {
      cleanup();
    }

    // Listener para invalidação global de cache
    const handleCacheInvalidation = () => {
      console.log('🔄 [REALTIME-INTERACTIONS] Global cache invalidation triggered');
      loadInitialStats();
    };

    window.addEventListener('realtime-cache-invalidate', handleCacheInvalidation);

    return () => {
      cleanup();
      window.removeEventListener('realtime-cache-invalidate', handleCacheInvalidation);
    };
  }, [articleIds, loadInitialStats, setupSubscriptions, cleanup]);

  // Função para obter stats de um artigo específico
  const getStatsForArticle = useCallback((articleId: string): RealTimeStats | null => {
    return stats[articleId] || null;
  }, [stats]);

  // Função para forçar atualização de stats
  const forceStatsUpdate = useCallback((articleId?: string) => {
    if (articleId) {
      scheduleStatsUpdate(articleId);
    } else {
      // Atualizar todos os artigos
      articleIds.forEach(id => scheduleStatsUpdate(id));
    }
  }, [articleIds, scheduleStatsUpdate]);

  // Calcular total de interações baseado nas estatísticas reais
  const totalInteractions = useMemo(() => {
    const total = Object.values(stats).reduce((total, articleStats) => {
      return total + articleStats.totalFeedbacks + articleStats.totalComments;
    }, 0);
    return total;
  }, [stats]);

  return {
    // Estados
    interactions,
    stats,
    isConnected,
    error,
    
    // Funções
    getStatsForArticle,
    forceStatsUpdate,
    cleanup,
    
    // Métricas agregadas
    totalInteractions,
    lastInteraction: interactions[0] || null,
  };
};