import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { hybridCache } from '../utils/hybridCache';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hook para sincronização automática 100% de feedbacks
 * Detecta mudanças em tempo real e invalida cache automaticamente
 */
export const useAutoFeedbackSync = () => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isActiveRef = useRef(false);

  // Função para invalidar cache inteligentemente
  const invalidateSmartCache = useCallback(async (articleId?: string) => {
    console.log('🔄 [AUTO-SYNC] Invalidando cache inteligente...', { articleId });
    
    try {
      // Invalidar cache de artigos
      hybridCache.invalidatePattern('articles');
      hybridCache.invalidatePattern('metrics');
      
      // Se temos um artigo específico, invalidar cache específico
      if (articleId) {
        hybridCache.invalidatePattern(`article_${articleId}`);
        hybridCache.invalidatePattern(`metrics_${articleId}`);
      }
      
      // Invalidar cache de categorias (pode afetar ordenação)
      hybridCache.invalidatePattern('categories');
      
      console.log('✅ [AUTO-SYNC] Cache invalidado com sucesso');
    } catch (error) {
      console.error('❌ [AUTO-SYNC] Erro ao invalidar cache:', error);
    }
  }, []);

  // Configurar Real-Time Subscription para feedback
  const setupFeedbackSync = useCallback(() => {
    if (channelRef.current || isActiveRef.current) {
      console.log('📡 [AUTO-SYNC] Subscription já ativa, pulando...');
      return;
    }

    console.log('📡 [AUTO-SYNC] Configurando Real-Time Sync para feedbacks...');
    isActiveRef.current = true;

    const channel = supabase
      .channel('auto_feedback_sync')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'feedback'
        },
        async (payload) => {
          console.log('🔄 [AUTO-SYNC] Mudança de feedback detectada:', payload);
          
          const articleId = (payload.new as any)?.article_id || (payload.old as any)?.article_id;
          
          // Invalidar cache automaticamente
          await invalidateSmartCache(articleId);
          
          // Disparar evento customizado para componentes reagirem
          window.dispatchEvent(new CustomEvent('feedbackChanged', {
            detail: { articleId, payload }
          }));
          
          console.log('✅ [AUTO-SYNC] Sistema atualizado automaticamente');
        }
      )
      .subscribe((status) => {
        console.log('📡 [AUTO-SYNC] Status da subscription:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('🎯 [AUTO-SYNC] Sistema 100% automático ativado!');
        }
      });

    channelRef.current = channel;
  }, [invalidateSmartCache]);

  // Cleanup da subscription
  const cleanupSync = useCallback(() => {
    if (channelRef.current) {
      console.log('🧹 [AUTO-SYNC] Limpando Real-Time Sync...');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isActiveRef.current = false;
    }
  }, []);

  // Inicializar sync automaticamente
  useEffect(() => {
    setupFeedbackSync();
    
    return () => {
      cleanupSync();
    };
  }, [setupFeedbackSync, cleanupSync]);

  // Função manual para forçar sincronização (se necessário)
  const forceSyncNow = useCallback(async () => {
    console.log('🔄 [AUTO-SYNC] Forçando sincronização manual...');
    await invalidateSmartCache();
    
    // Disparar evento para componentes reagirem
    window.dispatchEvent(new CustomEvent('forceFeedbackSync'));
  }, [invalidateSmartCache]);

  return {
    forceSyncNow,
    isActive: isActiveRef.current
  };
};