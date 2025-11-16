import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useUserComments = (userId?: string, userName?: string) => {
  const [commentCount, setCommentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommentCount = async () => {
      if (!userId && !userName) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('comments')
          .select('id', { count: 'exact', head: true });

        // Priorizar busca por user_id se disponível
        if (userId) {
          query = query.eq('user_id', userId);
        } else if (userName) {
          // Fallback para user_name se não tiver user_id
          query = query.eq('user_name', userName);
        }

        const { count, error: supabaseError } = await query;

        if (supabaseError) {
          throw supabaseError;
        }

        setCommentCount(count || 0);
      } catch (err: any) {
        console.error('Erro ao buscar contador de comentários:', err);
        setError(err.message || 'Erro ao carregar comentários');
        setCommentCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCommentCount();
  }, [userId, userName]);

  return { commentCount, loading, error };
};