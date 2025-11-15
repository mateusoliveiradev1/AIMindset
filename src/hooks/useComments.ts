import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

// Constante para desabilitar comentários se necessário
const COMMENTS_DISABLED = false;

export interface Comment {
  id: string;
  article_id: string;
  user_name: string;
  content: string;
  created_at: string;
  parent_id?: string | null;  // NOVO: ID do comentário pai para respostas
  likes: number;              // NOVO: Contador de curtidas
  replies?: Comment[];        // NOVO: Array de respostas (computed)
  user_id?: string | null;
}

export interface CommentFormData {
  user_name: string;
  content: string;
  parent_id?: string | null;  // NOVO: Para respostas
}

// Função para verificar se é um ID mock (não é UUID válido)
const isMockId = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return !uuidRegex.test(id);
};

type SortMode = 'recent' | 'likes'

export const useComments = (articleId: string, initialSort: SortMode = 'recent') => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortMode, setSortMode] = useState<SortMode>(initialSort);
  const [replyCounts, setReplyCounts] = useState<Record<string, number>>({});
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const COMMENTS_PER_PAGE = 10;

  // Função para carregar comentários
  const loadComments = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!articleId || COMMENTS_DISABLED) return;

    // Se for um ID mock, retornar dados mock
    if (isMockId(articleId)) {
      console.log('💬 [COMMENTS] Usando dados mock para ID:', articleId);
      setLoading(false);
      setError(null);
      setComments([
        {
          id: 'mock-1',
          article_id: articleId,
          user_name: 'João Silva',
          content: 'Excelente artigo! Muito esclarecedor sobre o futuro da IA.',
          created_at: '2024-01-20T10:30:00Z',
          parent_id: null,
          likes: 5,
          replies: [
            {
              id: 'mock-1-reply-1',
              article_id: articleId,
              user_name: 'Ana Costa',
              content: 'Concordo! Especialmente a parte sobre machine learning.',
              created_at: '2024-01-20T10:45:00Z',
              parent_id: 'mock-1',
              likes: 2
            }
          ]
        },
        {
          id: 'mock-2',
          article_id: articleId,
          user_name: 'Maria Santos',
          content: 'Concordo plenamente. A IA realmente vai transformar nossa sociedade.',
          created_at: '2024-01-20T11:15:00Z',
          parent_id: null,
          likes: 3,
          replies: []
        },
        {
          id: 'mock-3',
          article_id: articleId,
          user_name: 'Pedro Costa',
          content: 'Muito interessante a parte sobre ética em IA. Precisamos mesmo pensar nisso.',
          created_at: '2024-01-20T12:00:00Z',
          parent_id: null,
          likes: 8,
          replies: []
        }
      ]);
      setHasMore(false);
      return;
    }

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
        return;
      }

      const from = (pageNum - 1) * COMMENTS_PER_PAGE;
      const to = from + COMMENTS_PER_PAGE - 1;

      const { data, error: fetchError } = await supabase
        .from('comments')
        .select('*')
        .eq('article_id', articleId)
        .is('parent_id', null)
        .order(sortMode === 'recent' ? 'created_at' : 'likes', { ascending: false })
        .range(from, to);

      // Verificar novamente se foi cancelada após a requisição
      if (currentController.signal.aborted) {
        return;
      }

      if (fetchError) {
        throw fetchError;
      }

      const newComments = data || [];
      
      if (append) {
        setComments(prev => [...prev, ...newComments]);
      } else {
        setComments(newComments);
      }

      // Verificar se há mais comentários
      setHasMore(newComments.length === COMMENTS_PER_PAGE);
      
      // console.log(`✅ [DEBUG] Comentários carregados: ${newComments.length}, hasMore: ${newComments.length === COMMENTS_PER_PAGE}`);

      // Carregar contagem de respostas em lote para comentários desta página
      try {
        const parentIds = (newComments || []).map((c: any) => c.id);
        if (parentIds.length > 0 && !isMockId(articleId)) {
          const { data: repliesData } = await supabase
            .from('comments')
            .select('parent_id')
            .eq('article_id', articleId)
            .in('parent_id', parentIds);
          const counts: Record<string, number> = {};
          (repliesData || []).forEach((row: any) => {
            const pid = row.parent_id;
            if (!pid) return;
            counts[pid] = (counts[pid] || 0) + 1;
          });
          setReplyCounts(prev => ({ ...prev, ...counts }));
        } else if (isMockId(articleId)) {
          const counts: Record<string, number> = {};
          (newComments || []).forEach((c: any) => {
            counts[c.id] = Array.isArray(c.replies) ? c.replies.length : 0;
          });
          setReplyCounts(prev => ({ ...prev, ...counts }));
        }
      } catch {}

    } catch (err) {
      // Não mostrar erro se a requisição foi cancelada
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      const errorMessage = (() => {
        if (err && typeof err === 'object') {
          const m = (err as any).message || (err as any).error_description || (err as any).hint || (err as any).code;
          if (typeof m === 'string' && m.trim()) return m;
        }
        return 'Falha na conexão';
      })();
      console.error('❌ Erro ao carregar comentários:', err);
      setError(`Erro ao carregar comentários: ${errorMessage}`);
      if (typeof errorMessage === 'string' && !errorMessage.includes('Abort')) {
        toast.error('Erro ao carregar comentários');
      }
    } finally {
      setLoading(false);
    }
  }, [articleId, sortMode]);

  // Função para carregar mais comentários
  const loadMoreComments = useCallback(async () => {
    if (loading || !hasMore) return;
    
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await loadComments(nextPage, true);
  }, [currentPage, hasMore, loading, loadComments]);

  // Função para adicionar comentário
  const addComment = useCallback(async (commentData: CommentFormData) => {
    if (!articleId || COMMENTS_DISABLED) return false;

    // Se for um ID mock, simular adição
    if (isMockId(articleId)) {
      console.log('💬 [COMMENTS] Simulando adição de comentário para ID mock:', articleId);
      const newComment: Comment = {
        id: `mock-${Date.now()}`,
        article_id: articleId,
        user_name: commentData.user_name,
        content: commentData.content,
        created_at: new Date().toISOString(),
        parent_id: commentData.parent_id || null,
        likes: 0,
        replies: []
      };
      setComments(prev => [newComment, ...prev]);
      toast.success('Comentário adicionado com sucesso!');
      return true;
    }

    try {
      setSubmitting(true);
      setError(null);

      const { data: userResp } = await supabase.auth.getUser();
      const supaUser = userResp?.user || null;
      const meta = supaUser?.user_metadata || {};
      const resolvedName = (meta as any).name || (meta as any).full_name || supaUser?.email?.split('@')[0] || commentData.user_name.trim();

      try {
        const sinceIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data: recent, error: recentErr } = await supabase
          .from('comments')
          .select('id, content, user_id, user_name, created_at')
          .eq('article_id', articleId)
          .or(`user_id.eq.${supaUser ? supaUser.id : 'null'},user_name.eq.${resolvedName}`)
          .gte('created_at', sinceIso)
          .limit(10);
        if (!recentErr && Array.isArray(recent)) {
          const dup = recent.find(r => (r.content || '').trim() === commentData.content.trim());
          if (dup) {
            toast.error('Comentário duplicado detectado nas últimas 1h');
            return false;
          }
        }
      } catch {}

      try {
        const { data: validation, error: vErr } = await supabase.rpc('validate_comment_submission', {
          article_id: articleId,
          user_id: supaUser ? supaUser.id : null,
          content_len: commentData.content.trim().length
        });
        if (!vErr && validation && validation.allowed === false) {
          toast.error('Envio bloqueado. Tente novamente mais tarde.');
          return false;
        }
      } catch {}

      const { error: insertError } = await supabase
        .from('comments')
        .insert([
          {
            article_id: articleId,
            user_name: resolvedName,
            content: commentData.content.trim(),
            parent_id: commentData.parent_id || null,
            user_id: supaUser ? supaUser.id : null
          }
        ]);

      if (insertError) {
        throw insertError;
      }

      // Recarregar comentários após adicionar
      await loadComments(1, false);
      setCurrentPage(1);
      
      try {
        const mentions = Array.from(new Set((commentData.content.match(/\@[A-Za-zÀ-ÿ\s]{2,50}/g) || []).map(m => m.slice(1).trim())));
        if (mentions.length > 0) {
          await supabase.rpc('handle_comment_mentions', {
            article_id: articleId,
            mentions,
          });
        }
      } catch {}

      toast.success('Comentário adicionado com sucesso!');
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ Erro ao adicionar comentário:', err);
      setError(`Erro ao adicionar comentário: ${errorMessage}`);
      toast.error('Erro ao adicionar comentário');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [articleId, loadComments]);

  // Função para atualizar comentários
  const refreshComments = useCallback(async () => {
    setCurrentPage(1);
    await loadComments(1, false);
  }, [loadComments]);

  const setSorting = useCallback((mode: SortMode) => {
    if (sortMode === mode) return;
    setSortMode(mode);
  }, [sortMode]);

  const fetchReplies = useCallback(async (parentId: string, pageNum: number = 1, pageSize: number = 10) => {
    if (!articleId || !parentId) return { replies: [], hasMore: false };
    if (isMockId(articleId)) return { replies: [], hasMore: false };
    try {
      const from = (pageNum - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('article_id', articleId)
        .eq('parent_id', parentId)
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) return { replies: [], hasMore: false };
      const list = data || [];
      return { replies: list as Comment[], hasMore: list.length === pageSize };
    } catch {
      return { replies: [], hasMore: false };
    }
  }, [articleId]);

  const countReplies = useCallback(async (parentId: string) => {
    if (!articleId || !parentId) return 0;
    if (isMockId(articleId)) return (comments.find(c => c.id === parentId)?.replies || []).length;
    try {
      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', articleId)
        .eq('parent_id', parentId);
      if (error) return 0;
      return count || 0;
    } catch {
      return 0;
    }
  }, [articleId, comments]);

  // Carregar comentários iniciais
  useEffect(() => {
    if (articleId) {
      setCurrentPage(1);
      loadComments(1, false);
    }

    // Cleanup: cancelar requisições pendentes
    return () => {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        abortControllerRef.current.abort();
      }
    };
  }, [articleId, loadComments]);

  // Função para curtir comentário
  const likeComment = useCallback(async (commentId: string) => {
    if (!commentId || COMMENTS_DISABLED) return false;

    // Se for um ID mock, simular curtida
    if (isMockId(commentId)) {
      console.log('💬 [COMMENTS] Simulando curtida para ID mock:', commentId);
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return { ...comment, likes: comment.likes + 1 };
        }
        // Verificar nas respostas também
        if (comment.replies) {
          const updatedReplies = comment.replies.map(reply => 
            reply.id === commentId ? { ...reply, likes: reply.likes + 1 } : reply
          );
          return { ...comment, replies: updatedReplies };
        }
        return comment;
      }));
      toast.success('Curtida adicionada!');
      return true;
    }

    try {
      const { data: userResp } = await supabase.auth.getUser();
      const isAuthed = !!userResp?.user;
      if (!isAuthed) {
        const storageKey = `likedComments:${articleId}`;
        const likedComments = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (Array.isArray(likedComments) && likedComments.includes(commentId)) {
          toast.error('Você já curtiu este comentário');
          return false;
        }
        const { data, error } = await supabase.rpc('increment_comment_likes', {
          comment_id: commentId
        });
        if (error) throw error;
        const updated = Array.isArray(likedComments) ? likedComments.concat(commentId) : [commentId];
        localStorage.setItem(storageKey, JSON.stringify(updated));
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) return { ...comment, likes: data };
          if (comment.replies) {
            const updatedReplies = comment.replies.map(reply => 
              reply.id === commentId ? { ...reply, likes: data } : reply
            );
            return { ...comment, replies: updatedReplies };
          }
          return comment;
        }));
        toast.success('Curtida adicionada!');
        return true;
      } else {
        const { data, error } = await supabase.rpc('increment_comment_likes', {
          comment_id: commentId
        });
        if (error) throw error;
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) return { ...comment, likes: data };
          if (comment.replies) {
            const updatedReplies = comment.replies.map(reply => 
              reply.id === commentId ? { ...reply, likes: data } : reply
            );
            return { ...comment, replies: updatedReplies };
          }
          return comment;
        }));
        toast.success('Curtida adicionada!');
        return true;
      }
    } catch (err) {
      console.error('❌ Erro ao curtir comentário:', err);
      toast.error('Erro ao curtir comentário');
      return false;
    }
  }, [articleId]);

  const updateComment = useCallback(async (commentId: string, content: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ content: content.trim() })
        .eq('id', commentId);
      if (error) throw error;
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: content.trim() } : {
        ...c,
        replies: c.replies?.map(r => r.id === commentId ? { ...r, content: content.trim() } : r)
      }));
      toast.success('Comentário atualizado!');
      return true;
    } catch (err) {
      console.error('❌ Erro ao atualizar comentário:', err);
      toast.error('Erro ao atualizar comentário');
      return false;
    }
  }, []);

  const deleteComment = useCallback(async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
      if (error) throw error;
      setComments(prev => prev
        .filter(c => c.id !== commentId)
        .map(c => ({
          ...c,
          replies: c.replies?.filter(r => r.id !== commentId) || c.replies
        }))
      );
      toast.success('Comentário excluído!');
      return true;
    } catch (err) {
      console.error('❌ Erro ao excluir comentário:', err);
      toast.error('Erro ao excluir comentário');
      return false;
    }
  }, []);

  const isCommentLiked = useCallback((commentId: string) => {
    const storageKey = `likedComments:${articleId}`;
    const likedComments = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(likedComments) ? likedComments.includes(commentId) : false;
  }, [articleId]);

  return {
    comments,
    loading,
    submitting,
    error,
    hasMore,
    addComment,
    loadMoreComments,
    refreshComments,
    likeComment,
    sortMode,
    setSorting,
    fetchReplies,
    countReplies,
    replyCounts,
    isCommentLiked,
    updateComment,
    deleteComment
  };
};
