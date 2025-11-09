import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { ScheduledArticle } from '@/types';

// Hook otimizado para mobile - performance first
export const useNextScheduledArticle = () => {
  const [data, setData] = useState<ScheduledArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    let interval: NodeJS.Timeout;

    const fetchNextScheduledArticle = async () => {
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
              if (mounted) {
                setError(listError);
                setData(null);
              }
            } else {
              const first = Array.isArray(list) ? (list[0] || null) : null;
              if (mounted) {
                setData(first || null);
                setError(null);
              }
              console.log('✅ [useNextScheduledArticle] Fallback retornou:', first);
            }
          } catch (fallbackErr) {
            console.error('Exceção no fallback:', fallbackErr);
            if (mounted) {
              setError(fallbackErr as Error);
              setData(null);
            }
          }
        } else {
          if (mounted) {
            setData(result);
            setError(null);
          }
          console.log('✅ [useNextScheduledArticle] Resultado:', result);
        }
      } catch (err) {
        console.error('Erro na consulta:', err);
        if (mounted) {
          setError(err as Error);
          setData(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Busca inicial
    fetchNextScheduledArticle();

    // Atualização a cada 30 segundos (otimizado para mobile)
    interval = setInterval(fetchNextScheduledArticle, 30 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { data, isLoading, error };
};