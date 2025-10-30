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
        .subscribe();

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
        .subscribe();

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
    return cleanup;
  }, [setupGlobalSubscriptions, cleanup]);

  return {
    invalidateAllCaches,
    cleanup,
    isConnected: channelsRef.current.length > 0
  };
};