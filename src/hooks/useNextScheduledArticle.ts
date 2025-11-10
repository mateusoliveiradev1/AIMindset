import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { ScheduledArticle } from '@/types';

// Hook otimizado para mobile - performance first
export const useNextScheduledArticle = () => {
  const [data, setData] = useState<ScheduledArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef<boolean>(false);

  const fetchNextScheduledArticle = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🔎 [useNextScheduledArticle] Buscando próximo artigo agendado...');
      const { data: result, error: supabaseError } = await supabase
        .rpc('get_next_scheduled_article')
        .single();

      if (supabaseError) {
        console.error('Erro ao buscar artigo agendado:', supabaseError);
        // Fallback: tentar sem .single() e pegar o primeiro item
        try {
          const { data: list, error: listError } = await supabase
            .rpc('get_next_scheduled_article');
          if (listError) {
            console.error('Erro no fallback da RPC:', listError);
            if (mountedRef.current) {
              setError(listError);
              setData(null);
            }
          } else {
            const first = Array.isArray(list) ? (list[0] || null) : null;
            if (mountedRef.current) {
              setData(first || null);
              setError(null);
            }
            console.log('✅ [useNextScheduledArticle] Fallback retornou:', first);
          }
        } catch (fallbackErr) {
          console.error('Exceção no fallback:', fallbackErr);
          if (mountedRef.current) {
            setError(fallbackErr as Error);
            setData(null);
          }
        }
      } else {
        if (mountedRef.current) {
          setData(result);
          setError(null);
        }
        console.log('✅ [useNextScheduledArticle] Resultado:', result);
      }
    } catch (err) {
      console.error('Erro na consulta:', err);
      if (mountedRef.current) {
        setError(err as Error);
        setData(null);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Setup: inicial, polling, realtime e cleanup
  useEffect(() => {
    mountedRef.current = true;

    // Busca inicial
    fetchNextScheduledArticle();

    // Polling inteligente a cada 30s
    intervalRef.current = setInterval(fetchNextScheduledArticle, 30 * 1000);

    // Assinar mudanças no Supabase para atualizar instantaneamente
    try {
      channelRef.current = supabase
        .channel('next-scheduled-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'articles' }, async (payload: any) => {
          const eventType = payload?.eventType || payload?.type || null;
          const row = payload?.new ?? payload?.record ?? null;
          const oldRow = payload?.old ?? null;

          const idMatches = row?.id && data?.id ? row.id === data.id : true;
          const statusChanged = !!oldRow && (oldRow.scheduling_status !== row?.scheduling_status);
          const publishedNow = row?.published === true || row?.scheduling_status === 'published';

          if (eventType === 'UPDATE' || eventType === 'INSERT') {
            if ((idMatches && statusChanged) || publishedNow) {
              console.log('🔁 [useNextScheduledArticle] Realtime trigger: atualizando próximo agendado');
              // Atualizar imediatamente
              fetchNextScheduledArticle();
              // Disparar invalidação global para Home/Featured
              try {
                window.dispatchEvent(new CustomEvent('realtime-cache-invalidate', {
                  detail: { source: 'useNextScheduledArticle', articleId: row?.id, reason: 'realtime' }
                }));
              } catch {}
            }
          }
        })
        .subscribe((status) => {
          console.log('🔌 [useNextScheduledArticle] Status da assinatura:', status);
        });
    } catch (err) {
      console.warn('⚠️ [useNextScheduledArticle] Falha ao assinar Realtime:', err);
    }

    // Ouvir evento global de invalidação (por outros módulos)
    const invalidateHandler = () => {
      fetchNextScheduledArticle();
    };
    window.addEventListener('realtime-cache-invalidate', invalidateHandler as EventListener);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      try {
        if (channelRef.current) supabase.removeChannel(channelRef.current);
      } catch {}
      window.removeEventListener('realtime-cache-invalidate', invalidateHandler as EventListener);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchNextScheduledArticle]);

  // Agendar atualização exatamente no horário de publicação do artigo agendado atual
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const scheduledFor = data?.scheduled_for ? new Date(data.scheduled_for).getTime() : null;
    if (!scheduledFor) return;

    const now = Date.now();
    const ms = scheduledFor - now;

    if (ms <= 0) {
      // Se já passou, atualizar imediatamente
      fetchNextScheduledArticle();
      return;
    }

    // Limitar timeout a 24h por segurança
    const maxTimeout = 24 * 60 * 60 * 1000;
    const delay = Math.min(ms + 750, maxTimeout); // pequeno offset para garantir que publicado já foi processado

    timeoutRef.current = setTimeout(() => {
      console.log('⏱️ [useNextScheduledArticle] Hora de publicação atingida, atualizando...');
      fetchNextScheduledArticle();
      try {
        window.dispatchEvent(new CustomEvent('realtime-cache-invalidate', {
          detail: { source: 'useNextScheduledArticle', articleId: data?.id, reason: 'scheduled_publish_reached' }
        }));
      } catch {}
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [data?.scheduled_for, data?.id, fetchNextScheduledArticle]);

  return { data, isLoading, error };
};