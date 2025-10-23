import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

// ✅ COMENTÁRIOS REATIVADOS - Sistema funcionando normalmente
const COMMENTS_DISABLED = false;

export interface Comment {
  id: string;
  article_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export interface CommentFormData {
  user_name: string;
  content: string;
}

export const useComments = (articleId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const COMMENTS_PER_PAGE = 10;

  // Se comentários estão desabilitados, retornar estado vazio
  if (COMMENTS_DISABLED) {
    // console.log('🚫 [INFO] Sistema de comentários desabilitado - articleId:', articleId);
    return {
      comments: [],
      loading: false,
      submitting: false,
      hasMore: false,
      error: null,
      loadMore: () => {
        // console.log('🚫 [INFO] loadMore desabilitado');
      },
      submitComment: async () => {
        // console.log('🚫 [INFO] submitComment desabilitado');
        toast.info('Sistema de comentários temporariamente desabilitado');
        return false;
      },
      refreshComments: () => {
        // console.log('🚫 [INFO] refreshComments desabilitado');
      },
      loadMoreComments: () => {
        // console.log('🚫 [INFO] loadMoreComments desabilitado');
      }
    };
  }

  // console.log('✅ [INFO] Sistema de comentários ativo - articleId:', articleId);

  // Carregar comentários
  const loadComments = useCallback(async (pageNum: number = 0, append: boolean = false) => {
    if (!articleId) return;

    try {
      // Cancelar requisição anterior apenas se ainda estiver ativa
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        abortControllerRef.current.abort();
      }

      // Criar novo AbortController para esta requisição
      const currentController = new AbortController();
      abortControllerRef.current = currentController;
      
      setError(null);
      if (!append) {
        setLoading(true);
      }

      // console.log(`💬 [DEBUG] Carregando comentários - página ${pageNum}, append: ${append}`);
      // Verificar se a requisição foi cancelada antes de fazer a query
      if (currentController.signal.aborted) {
        // console.log('💬 [DEBUG] Requisição cancelada antes da query');
        return;
      }

      const { data, error: fetchError, count } = await supabase
        .from('comments')
        .select('*', { count: 'exact' })
        .eq('article_id', articleId)
        .order('created_at', { ascending: false })
        .range(pageNum * COMMENTS_PER_PAGE, (pageNum + 1) * COMMENTS_PER_PAGE - 1)
        .abortSignal(currentController.signal);

      // Verificar se a requisição foi cancelada após a query
      if (currentController.signal.aborted) {
        // console.log('💬 [DEBUG] Requisição cancelada após a query');
        return;
      }

      if (fetchError) {
        throw fetchError;
      }

      const newComments = data || [];
      // console.log(`💬 [DEBUG] Comentários carregados: ${newComments.length}, total: ${count}`);

      if (append) {
        setComments(prev => [...prev, ...newComments]);
      } else {
        setComments(newComments);
      }

      // Verificar se há mais comentários
      const totalLoaded = append ? comments.length + newComments.length : newComments.length;
      setHasMore((count || 0) > totalLoaded);
      setPage(pageNum);

    } catch (err: any) {
      // Só mostrar erro se não for AbortError
      if (err.name !== 'AbortError') {
        console.error('❌ Erro ao carregar comentários:', err);
        setError(`Erro ao carregar comentários: ${err.message}`);
        toast.error('Erro ao carregar comentários');
      } else {
        // console.log('💬 [DEBUG] Requisição cancelada (AbortError) - normal');
      }
    } finally {
      // Só atualizar loading se a requisição não foi cancelada
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, [articleId, comments.length]);

  // Carregar mais comentários
  const loadMoreComments = useCallback(() => {
    if (!loading && hasMore) {
      loadComments(page + 1, true);
    }
  }, [loading, hasMore, page, loadComments]);

  // Atualizar comentários
  const refreshComments = useCallback(() => {
    setPage(0);
    loadComments(0, false);
  }, [loadComments]);

  // Submeter novo comentário
  const submitComment = useCallback(async (formData: CommentFormData): Promise<boolean> => {
    if (!articleId) return false;

    try {
      setSubmitting(true);
      setError(null);

      // console.log('💬 [DEBUG] Submetendo comentário:', formData);

      const { error: insertError } = await supabase
        .from('comments')
        .insert({
          article_id: articleId,
          user_name: formData.user_name.trim(),
          content: formData.content.trim()
        });

      if (insertError) {
        throw insertError;
      }

      // console.log('✅ [DEBUG] Comentário submetido com sucesso');
      toast.success('Comentário enviado com sucesso!');
      
      // Recarregar comentários
      refreshComments();
      
      return true;
    } catch (err: any) {
      console.error('❌ Erro ao submeter comentário:', err);
      const errorMessage = `Erro ao enviar comentário: ${err.message}`;
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [articleId, refreshComments]);

  // Carregar comentários iniciais
  useEffect(() => {
    if (articleId) {
      loadComments(0, false);
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [articleId, loadComments]);

  return {
    comments,
    loading,
    submitting,
    hasMore,
    error,
    loadMore: loadMoreComments,
    submitComment,
    refreshComments,
    loadMoreComments
  };
};