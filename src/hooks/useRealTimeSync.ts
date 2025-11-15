import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealTimeSyncOptions {
  onFeedbackChange?: () => void;
  onCommentChange?: () => void;
  onLikeChange?: () => void;
  enableGlobalSync?: boolean;
}

/**
 * Hook centralizado para sincronização em tempo real
 * Coordena invalidação automática de cache e atualizações instantâneas
 */
export const useRealTimeSync = (options: UseRealTimeSyncOptions = {}) => {
  const {
    onFeedbackChange,
    onCommentChange,
    onLikeChange,
    enableGlobalSync = true
  } = options;

  const channelsRef = useRef<RealtimeChannel[]>([]);
  const callbacksRef = useRef(options);
  const feedbackSubscribedRef = useRef(false);
  const commentsSubscribedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Atualizar callbacks sem recriar subscriptions
  useEffect(() => {
    callbacksRef.current = options;
  }, [options]);

  // Função para invalidar todos os caches automaticamente
  const invalidateAllCaches = useCallback(() => {
    // Disparar evento customizado para invalidação global de cache
    window.dispatchEvent(new CustomEvent('realtime-cache-invalidate', {
      detail: { timestamp: Date.now() }
    }));
  }, []);

  // Configurar subscriptions globais
  const setupGlobalSubscriptions = useCallback(() => {
    if (!enableGlobalSync) return;

    // Limpar subscriptions existentes
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];
    feedbackSubscribedRef.current = false;
    commentsSubscribedRef.current = false;

    try {
      // Subscription para feedbacks (global - todos os artigos)
      const feedbackChannel = supabase
        .channel('global-feedbacks')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'feedbacks'
        }, (payload) => {
          console.log('🔄 [RealTimeSync] Feedback change detected:', payload.eventType);
          
          // Invalidar cache automaticamente
          invalidateAllCaches();
          
          // Chamar callback específico
          if (callbacksRef.current.onFeedbackChange) {
            callbacksRef.current.onFeedbackChange();
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            feedbackSubscribedRef.current = true;
            reconnectAttemptsRef.current = 0;
            if (reconnectTimerRef.current) {
              clearTimeout(reconnectTimerRef.current);
              reconnectTimerRef.current = null;
            }
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            feedbackSubscribedRef.current = false;
            if (!reconnectTimerRef.current) {
              const attempt = reconnectAttemptsRef.current + 1;
              reconnectAttemptsRef.current = attempt;
              const delay = Math.min(30000, 1000 * Math.pow(2, attempt - 1));
              reconnectTimerRef.current = setTimeout(() => {
                reconnectTimerRef.current = null;
                setupGlobalSubscriptions();
              }, delay);
            }
          }
        });

      // Subscription para comentários (global - todos os artigos)
      const commentChannel = supabase
        .channel('global-comments')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'comments'
        }, (payload) => {
          console.log('🔄 [RealTimeSync] Comment change detected:', payload.eventType);
          
          // Invalidar cache automaticamente
          invalidateAllCaches();
          
          // Chamar callback específico
          if (callbacksRef.current.onCommentChange) {
            callbacksRef.current.onCommentChange();
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            commentsSubscribedRef.current = true;
            reconnectAttemptsRef.current = 0;
            if (reconnectTimerRef.current) {
              clearTimeout(reconnectTimerRef.current);
              reconnectTimerRef.current = null;
            }
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            commentsSubscribedRef.current = false;
            if (!reconnectTimerRef.current) {
              const attempt = reconnectAttemptsRef.current + 1;
              reconnectAttemptsRef.current = attempt;
              const delay = Math.min(30000, 1000 * Math.pow(2, attempt - 1));
              reconnectTimerRef.current = setTimeout(() => {
                reconnectTimerRef.current = null;
                setupGlobalSubscriptions();
              }, delay);
            }
          }
        });

      channelsRef.current = [feedbackChannel, commentChannel];

      console.log('✅ [RealTimeSync] Global subscriptions configured');

    } catch (error) {
      console.error('❌ [RealTimeSync] Error setting up subscriptions:', error);
    }
  }, [enableGlobalSync, invalidateAllCaches]);

  // Função de limpeza
  const cleanup = useCallback(() => {
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];
  }, []);

  // Configurar subscriptions na inicialização
  useEffect(() => {
    setupGlobalSubscriptions();
    const handleOnline = () => {
      if (!feedbackSubscribedRef.current || !commentsSubscribedRef.current) {
        setupGlobalSubscriptions();
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && (!feedbackSubscribedRef.current || !commentsSubscribedRef.current)) {
        setupGlobalSubscriptions();
      }
    };
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      cleanup();
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [setupGlobalSubscriptions, cleanup]);

  return {
    invalidateAllCaches,
    cleanup,
    isConnected: feedbackSubscribedRef.current || commentsSubscribedRef.current
  };
};